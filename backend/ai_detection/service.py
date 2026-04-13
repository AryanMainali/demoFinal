"""
AI-Generated Code Detection Service
=====================================
Loads the trained XGBoost model and provides a single `detect_ai_code(code)`
function that returns a probability score and verdict for a code snippet.

Model artefacts are loaded once at startup (lazy singleton).
Artefacts live in ai_detection/model/ (produced by train.py).
"""

import json
import re
from dataclasses import dataclass
from pathlib import Path

# joblib and numpy are imported lazily inside _load() / feature functions
# so the module can be imported even when ML packages are not installed.

from app.core.logging import logger
from app.models.submission import Submission, SubmissionFile

# ── paths ─────────────────────────────────────────────────────────────────────
MODEL_DIR = Path(__file__).parent / "model"


# ── result dataclass ──────────────────────────────────────────────────────────
@dataclass
class AIDetectionResult:
    is_ai_generated: bool
    confidence: float     # 0.0–1.0  (probability the code is AI-generated)
    verdict: str          # "AI-Generated" | "Human-Written" | "Uncertain"
    details: dict


# ── feature extraction (must stay in sync with train.py) ──────────────────────

def _count_functions(code: str) -> int:
    return len(re.findall(
        r'^\s*def\s+\w+|^\s*function\s+\w+|^\s*public\s+\w+\s+\w+\s*\(',
        code, re.MULTILINE,
    ))


def _extract_structural(code: str) -> dict:
    import numpy as np
    lines = code.splitlines()
    total = len(lines)
    blank = sum(1 for ln in lines if ln.strip() == "")
    comment = sum(1 for ln in lines if ln.strip().startswith(("#", "//", "*", "/*", "*/")))
    code_lines = max(total - blank - comment, 0)
    funcs = _count_functions(code)
    avg_len = float(np.mean([len(ln) for ln in lines])) if lines else 0.0
    max_len = max((len(ln) for ln in lines), default=0)

    return {
        "lines": total,
        "code_lines": code_lines,
        "comments": comment,
        "functions": funcs,
        "blank_lines": blank,
        "comment_ratio": comment / max(total, 1),
        "blank_ratio": blank / max(total, 1),
        "code_ratio": code_lines / max(total, 1),
        "avg_line_len": avg_len,
        "max_line_len": max_len,
        "func_density": funcs / max(total, 1),
    }


_STRUCT_COLS = [
    "lines", "code_lines", "comments", "functions", "blank_lines",
    "comment_ratio", "blank_ratio", "code_ratio",
    "avg_line_len", "max_line_len", "func_density",
]


# ── lazy-loaded singleton ─────────────────────────────────────────────────────

class _AIDetector:
    """Holds loaded model artefacts; initialised once on first use."""

    def __init__(self):
        self._model = None
        self._scaler = None
        self._embedder = None
        self._metadata: dict = {}
        self._ready = False

    def _load(self):
        if self._ready:
            return
        if not (MODEL_DIR / "model.joblib").exists():
            raise FileNotFoundError(
                f"AI detection model not found at {MODEL_DIR}. "
                "Run `python ai_detection/train.py` first."
            )
        logger.info("Loading AI detection model…")
        import joblib
        self._model = joblib.load(MODEL_DIR / "model.joblib")
        self._scaler = joblib.load(MODEL_DIR / "scaler.joblib")
        with open(MODEL_DIR / "metadata.json") as f:
            self._metadata = json.load(f)

        from sentence_transformers import SentenceTransformer
        self._embedder = SentenceTransformer(self._metadata["embedding_model"])
        self._ready = True
        logger.info(
            "AI detection model ready (CV AUC %.4f)",
            self._metadata.get("cv_roc_auc_mean", 0),
        )

    def detect(self, code: str) -> AIDetectionResult:
        import numpy as np
        self._load()

        struct = _extract_structural(code)
        X_struct = np.array([[struct[c] for c in _STRUCT_COLS]], dtype=np.float32)
        X_struct_scaled = self._scaler.transform(X_struct)

        embedding = self._embedder.encode(
            [code[:2000]],
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

        X = np.hstack([X_struct_scaled, embedding])
        prob_ai = float(self._model.predict_proba(X)[0, 1])
        threshold = float(self._metadata.get("threshold", 0.5))

        if prob_ai >= threshold + 0.15:
            verdict, is_ai = "AI-Generated", True
        elif prob_ai <= threshold - 0.15:
            verdict, is_ai = "Human-Written", False
        else:
            verdict = "Uncertain"
            is_ai = prob_ai >= threshold

        return AIDetectionResult(
            is_ai_generated=is_ai,
            confidence=round(prob_ai, 4),
            verdict=verdict,
            details={
                "structural_features": struct,
                "threshold": threshold,
                "model_cv_auc": self._metadata.get("cv_roc_auc_mean"),
            },
        )

    @property
    def is_available(self) -> bool:
        return (MODEL_DIR / "model.joblib").exists()


_detector = _AIDetector()


# ── public API ────────────────────────────────────────────────────────────────

def detect_ai_code(code: str) -> AIDetectionResult:
    """Analyse a code snippet. Raises FileNotFoundError if model not trained."""
    return _detector.detect(code)


def model_available() -> bool:
    """Return True if the trained model artefacts exist on disk."""
    return _detector.is_available


def check_submission(db, submission_id: int, force: bool = False) -> dict:
    """
    Run AI detection on a submission and persist the result to the DB.

    Mirrors PlagiarismService.check_submission() so it can be called from
    the Celery task or an API endpoint in the same way.

    Returns a dict with keys:
        ai_checked, ai_score, ai_flagged, verdict, already_checked
    """
    submission: Submission = db.query(Submission).filter(
        Submission.id == submission_id
    ).first()

    if not submission:
        raise ValueError(f"Submission {submission_id} not found")

    if submission.ai_checked and not force:
        return {
            "already_checked": True,
            "ai_checked": True,
            "ai_score": submission.ai_score,
            "ai_flagged": submission.ai_flagged,
            "verdict": submission.ai_report.get("verdict") if submission.ai_report else None,
        }

    # Gather code from submission files (content col or S3/disk)
    files = db.query(SubmissionFile).filter(
        SubmissionFile.submission_id == submission_id
    ).all()
    code_parts: list[str] = []
    for f in files:
        # In-DB content column (older submissions)
        if getattr(f, "content", None):
            code_parts.append(f.content)
            continue
        # S3-stored file
        path = f.file_path or ""
        try:
            if path.startswith("http"):
                from app.services.s3_storage import s3_service
                import tempfile as _tf
                s3_key = path.split(".amazonaws.com/")[-1] if ".amazonaws.com/" in path else path
                with _tf.NamedTemporaryFile(delete=False, suffix=f.filename) as tmp:
                    s3_service.download_submission_file(s3_key, tmp.name)
                    import os as _os
                    with open(tmp.name, "r", encoding="utf-8", errors="replace") as fh:
                        text = fh.read()
                    _os.unlink(tmp.name)
                    if text.strip():
                        code_parts.append(text)
            elif path:
                from pathlib import Path as _Path
                fp = _Path(path)
                if fp.exists() and fp.is_file():
                    with open(fp, "r", encoding="utf-8", errors="replace") as fh:
                        text = fh.read()
                    if text.strip():
                        code_parts.append(text)
        except Exception as exc:
            logger.warning("AI detection: could not read file %s: %s", f.filename, exc)

    # Fall back to the denormalised code column if no file content
    if not code_parts and submission.code:
        code_parts = [submission.code]

    if not code_parts:
        logger.warning("AI detection: no code found for submission %d", submission_id)
        return {"ai_checked": False, "error": "No code content found"}

    combined_code = "\n\n".join(code_parts)

    try:
        result = _detector.detect(combined_code)
    except FileNotFoundError as exc:
        logger.warning("AI detection model not available: %s", exc)
        return {"ai_checked": False, "error": str(exc)}
    except Exception as exc:
        logger.exception("AI detection failed for submission %d: %s", submission_id, exc)
        return {"ai_checked": False, "error": str(exc)}

    # Persist to submission row
    submission.ai_checked = True
    submission.ai_score = round(result.confidence * 100, 1)  # store as 0-100
    submission.ai_flagged = result.is_ai_generated
    submission.ai_report = {
        "verdict": result.verdict,
        "confidence": result.confidence,
        "details": result.details,
    }
    db.commit()

    logger.info(
        "AI detection: submission=%d verdict=%s score=%.1f",
        submission_id, result.verdict, submission.ai_score,
    )

    return {
        "already_checked": False,
        "ai_checked": True,
        "ai_score": submission.ai_score,
        "ai_flagged": result.is_ai_generated,
        "verdict": result.verdict,
    }
