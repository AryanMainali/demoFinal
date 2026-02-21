"""
Plagiarism Detection Service — compares submissions using token-based n-gram
fingerprinting (Winnowing / Jaccard) plus structural similarity.
"""

import re
import hashlib
from typing import List, Dict, Tuple, Optional
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_

from app.models.submission import (
    Submission, SubmissionFile, PlagiarismMatch, SubmissionStatus
)
from app.models.assignment import Assignment
from app.models.language import Language
from app.core.logging import logger


# ---------------------------------------------------------------------------
# Tokeniser helpers
# ---------------------------------------------------------------------------

COMMENT_PATTERNS = {
    "python": [r'#.*$', r'"""[\s\S]*?"""', r"'''[\s\S]*?'''"],
    "java": [r'//.*$', r'/\*[\s\S]*?\*/'],
    "c": [r'//.*$', r'/\*[\s\S]*?\*/'],
    "cpp": [r'//.*$', r'/\*[\s\S]*?\*/'],
    "javascript": [r'//.*$', r'/\*[\s\S]*?\*/'],
    "typescript": [r'//.*$', r'/\*[\s\S]*?\*/'],
    "csharp": [r'//.*$', r'/\*[\s\S]*?\*/'],
}

STRING_PATTERN = re.compile(r'"(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\'')
WHITESPACE_PATTERN = re.compile(r'\s+')
IDENTIFIER_PATTERN = re.compile(r'\b[a-zA-Z_]\w*\b')


def _strip_comments(code: str, language: str) -> str:
    patterns = COMMENT_PATTERNS.get(language, COMMENT_PATTERNS["java"])
    for pat in patterns:
        code = re.sub(pat, '', code, flags=re.MULTILINE)
    return code


def _normalise(code: str, language: str = "python") -> str:
    """Normalise code: strip comments, strings, whitespace, lowercase identifiers."""
    code = _strip_comments(code, language)
    code = STRING_PATTERN.sub('"S"', code)
    code = WHITESPACE_PATTERN.sub(' ', code)
    return code.strip().lower()


def _ngrams(tokens: List[str], n: int = 5) -> List[Tuple[str, ...]]:
    if len(tokens) < n:
        return [tuple(tokens)]
    return [tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)]


def _fingerprint(code: str, language: str = "python", ngram_size: int = 5) -> set:
    """Generate a set of hashed n-gram fingerprints from normalised code."""
    normalised = _normalise(code, language)
    tokens = normalised.split()
    grams = _ngrams(tokens, ngram_size)
    return {hashlib.md5('|'.join(g).encode()).hexdigest() for g in grams}


# ---------------------------------------------------------------------------
# Similarity functions
# ---------------------------------------------------------------------------

def jaccard_similarity(set_a: set, set_b: set) -> float:
    if not set_a and not set_b:
        return 0.0
    intersection = set_a & set_b
    union = set_a | set_b
    return (len(intersection) / len(union)) * 100 if union else 0.0


def _find_matching_snippets(
    code_a: str, code_b: str, language: str, window: int = 4
) -> List[Dict]:
    """Find matching code regions between two sources."""
    lines_a = code_a.splitlines()
    lines_b = code_b.splitlines()
    matches = []

    norm_a = [_normalise(l, language) for l in lines_a]
    norm_b = [_normalise(l, language) for l in lines_b]

    i = 0
    while i < len(norm_a):
        best_j = -1
        best_len = 0
        for j in range(len(norm_b)):
            match_len = 0
            while (i + match_len < len(norm_a)
                   and j + match_len < len(norm_b)
                   and norm_a[i + match_len] == norm_b[j + match_len]
                   and norm_a[i + match_len].strip()):
                match_len += 1
            if match_len >= window and match_len > best_len:
                best_j = j
                best_len = match_len

        if best_len >= window:
            matches.append({
                "source_line_start": i + 1,
                "source_line_end": i + best_len,
                "matched_line_start": best_j + 1,
                "matched_line_end": best_j + best_len,
                "source_code_snippet": '\n'.join(lines_a[i:i + best_len]),
                "matched_code_snippet": '\n'.join(lines_b[best_j:best_j + best_len]),
            })
            i += best_len
        else:
            i += 1

    return matches


# ---------------------------------------------------------------------------
# Service class
# ---------------------------------------------------------------------------

class PlagiarismService:
    def __init__(self, db: Session):
        self.db = db

    def _read_submission_code(self, submission: Submission) -> str:
        """Concatenate all file contents for a submission."""
        parts = []
        if submission.code:
            parts.append(submission.code)

        for f in submission.files:
            path = f.file_path or ""
            try:
                if path.startswith("http"):
                    from app.services.s3_storage import s3_service
                    import tempfile as _tmp
                    import os as _os
                    s3_key = path.split(".amazonaws.com/")[-1] if ".amazonaws.com/" in path else path
                    with _tmp.NamedTemporaryFile(delete=False, suffix=f.filename) as tmp:
                        s3_service.download_submission_file(s3_key, tmp.name)
                        with open(tmp.name, 'r', encoding='utf-8', errors='replace') as fh:
                            content = fh.read()
                            if content.strip():
                                parts.append(content)
                        _os.unlink(tmp.name)
                elif path:
                    from pathlib import Path as _Path
                    fp = _Path(path)
                    if fp.exists() and fp.is_file():
                        with open(fp, 'r', encoding='utf-8', errors='replace') as fh:
                            content = fh.read()
                            if content.strip():
                                parts.append(content)
                    else:
                        logger.warning(f"File not found at path: {path}")
            except Exception as e:
                logger.warning(f"Could not read file {f.filename}: {e}")

        if not parts:
            logger.info(f"No code content found for submission {submission.id}")
        return '\n'.join(parts)

    def check_submission(
        self, submission_id: int, *, force: bool = False
    ) -> Dict:
        """Run plagiarism check on a single submission against all others
        for the same assignment. Returns summary dict."""

        submission = (
            self.db.query(Submission)
            .options(
                joinedload(Submission.files),
                joinedload(Submission.assignment).joinedload(Assignment.language),
            )
            .filter(Submission.id == submission_id)
            .first()
        )
        if not submission:
            raise ValueError(f"Submission {submission_id} not found")

        if submission.plagiarism_checked and not force:
            return {
                "already_checked": True,
                "plagiarism_score": submission.plagiarism_score,
                "plagiarism_flagged": submission.plagiarism_flagged,
            }

        assignment = submission.assignment
        language = "python"
        try:
            if assignment.language and assignment.language.name:
                language = assignment.language.name.lower()
        except Exception:
            pass

        source_code = self._read_submission_code(submission)
        if not source_code.strip():
            submission.plagiarism_checked = True
            submission.plagiarism_score = 0.0
            submission.plagiarism_flagged = False
            submission.plagiarism_report = {"error": "No code found"}
            self.db.commit()
            return {"plagiarism_score": 0.0, "plagiarism_flagged": False, "matches": []}

        source_fp = _fingerprint(source_code, language)

        other_submissions = (
            self.db.query(Submission)
            .options(joinedload(Submission.files), joinedload(Submission.student))
            .filter(
                and_(
                    Submission.assignment_id == assignment.id,
                    Submission.id != submission_id,
                )
            )
            .all()
        )

        max_similarity = 0.0
        all_matches: List[Dict] = []

        # Per-student: only compare against latest submission
        student_latest: Dict[int, Submission] = {}
        for s in other_submissions:
            existing = student_latest.get(s.student_id)
            if not existing or s.attempt_number > existing.attempt_number:
                student_latest[s.student_id] = s

        for other in student_latest.values():
            other_code = self._read_submission_code(other)
            if not other_code.strip():
                continue

            other_fp = _fingerprint(other_code, language)
            similarity = jaccard_similarity(source_fp, other_fp)

            if similarity < 15:
                continue

            snippets = _find_matching_snippets(source_code, other_code, language)

            student_name = other.student.full_name if other.student else f"Student #{other.student_id}"
            match_info = {
                "matched_submission_id": other.id,
                "student_name": student_name,
                "student_id": other.student_id,
                "similarity_percentage": round(similarity, 1),
                "snippet_count": len(snippets),
            }
            all_matches.append(match_info)

            if similarity > max_similarity:
                max_similarity = similarity

            # Store PlagiarismMatch records for high-similarity pairs
            if similarity >= 20:
                # Remove old matches for this pair
                self.db.query(PlagiarismMatch).filter(
                    and_(
                        PlagiarismMatch.submission_id == submission_id,
                        PlagiarismMatch.matched_submission_id == other.id,
                    )
                ).delete()

                for snip in snippets[:10]:  # cap at 10 snippets per pair
                    pm = PlagiarismMatch(
                        submission_id=submission_id,
                        matched_submission_id=other.id,
                        similarity_percentage=round(similarity, 1),
                        matched_source=student_name,
                        source_code_snippet=snip["source_code_snippet"][:2000],
                        matched_code_snippet=snip["matched_code_snippet"][:2000],
                        source_line_start=snip["source_line_start"],
                        source_line_end=snip["source_line_end"],
                        matched_line_start=snip["matched_line_start"],
                        matched_line_end=snip["matched_line_end"],
                        detected_at=datetime.utcnow(),
                    )
                    self.db.add(pm)

        threshold = assignment.plagiarism_threshold if assignment.enable_plagiarism_check else 100
        flagged = max_similarity >= threshold

        submission.plagiarism_checked = True
        submission.plagiarism_score = round(max_similarity, 1)
        submission.plagiarism_flagged = flagged
        submission.plagiarism_report = {
            "max_similarity": round(max_similarity, 1),
            "comparisons": len(student_latest),
            "matches": all_matches,
            "checked_at": datetime.utcnow().isoformat(),
        }

        if flagged and submission.status not in (SubmissionStatus.FLAGGED,):
            submission.status = SubmissionStatus.FLAGGED

        self.db.commit()
        self.db.refresh(submission)

        return {
            "plagiarism_score": round(max_similarity, 1),
            "plagiarism_flagged": flagged,
            "comparisons": len(student_latest),
            "matches": all_matches,
        }

    def check_all_for_assignment(self, assignment_id: int) -> Dict:
        """Batch plagiarism check for every submission of an assignment."""
        submissions = (
            self.db.query(Submission)
            .filter(Submission.assignment_id == assignment_id)
            .all()
        )

        results = []
        for sub in submissions:
            try:
                r = self.check_submission(sub.id, force=True)
                results.append({"submission_id": sub.id, **r})
            except Exception as e:
                logger.error(f"Plagiarism check failed for submission {sub.id}: {e}")
                results.append({"submission_id": sub.id, "error": str(e)})

        return {
            "assignment_id": assignment_id,
            "total_checked": len(results),
            "results": results,
        }

    def get_matches(self, submission_id: int) -> List[PlagiarismMatch]:
        return (
            self.db.query(PlagiarismMatch)
            .filter(PlagiarismMatch.submission_id == submission_id)
            .order_by(PlagiarismMatch.similarity_percentage.desc())
            .all()
        )

    def review_match(
        self, match_id: int, is_confirmed: bool, reviewer_notes: str, reviewer_id: int
    ) -> PlagiarismMatch:
        match = self.db.query(PlagiarismMatch).filter(PlagiarismMatch.id == match_id).first()
        if not match:
            raise ValueError(f"PlagiarismMatch {match_id} not found")

        match.is_reviewed = True
        match.is_confirmed = is_confirmed
        match.reviewer_notes = reviewer_notes
        match.reviewed_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(match)
        return match
