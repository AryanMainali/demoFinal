"""
AI-Generated Code Detection Endpoints
=======================================
POST /ai-detection/analyze          - analyse a raw code snippet
POST /ai-detection/submission/{id}  - analyse an existing submission's code
GET  /ai-detection/status           - check whether the model is loaded
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_role
from app.models import User, UserRole, Submission
from ai_detection.service import detect_ai_code, check_submission, model_available
from app.core.logging import logger

router = APIRouter()


# ── schemas ───────────────────────────────────────────────────────────────────

class CodeAnalysisRequest(BaseModel):
    code: str = Field(..., min_length=1, description="Source code to analyse")


class AIDetectionResponse(BaseModel):
    is_ai_generated: bool
    confidence: float = Field(..., description="Probability (0–1) that the code is AI-generated")
    verdict: str = Field(..., description="'AI-Generated' | 'Human-Written' | 'Uncertain'")
    details: dict


class ModelStatusResponse(BaseModel):
    available: bool
    message: str


# ── helpers ───────────────────────────────────────────────────────────────────

def _require_model():
    if not model_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "AI detection model is not available. "
                "Ask an administrator to run `python ai_detection/train.py`."
            ),
        )


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.get("/status", response_model=ModelStatusResponse)
def model_status():
    """Check whether the AI detection model is trained and ready."""
    available = model_available()
    return ModelStatusResponse(
        available=available,
        message="Model is ready." if available else "Model not found. Training required.",
    )


@router.post("/analyze", response_model=AIDetectionResponse)
def analyze_code(
    request: CodeAnalysisRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Analyse a raw code snippet for AI generation.
    Accessible to all authenticated users.
    """
    _require_model()
    try:
        result = detect_ai_code(request.code)
    except Exception as exc:
        logger.exception("AI detection failed: %s", exc)
        raise HTTPException(status_code=500, detail="AI detection failed. See server logs.")

    return AIDetectionResponse(
        is_ai_generated=result.is_ai_generated,
        confidence=result.confidence,
        verdict=result.verdict,
        details=result.details,
    )


@router.post("/submission/{submission_id}", response_model=AIDetectionResponse)
def analyze_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Analyse an existing submission's code for AI generation and persist results.
    Faculty / Admin only.
    """
    if current_user.role not in (UserRole.FACULTY, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Only faculty or admins can run AI detection on submissions.")

    _require_model()

    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")

    try:
        result = check_submission(db, submission_id, force=True)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("AI detection failed for submission %d: %s", submission_id, exc)
        raise HTTPException(status_code=500, detail="AI detection failed. See server logs.")

    if result.get("error"):
        raise HTTPException(status_code=422, detail=result["error"])

    # Re-fetch to build the response from persisted values
    db.refresh(submission)
    report = submission.ai_report or {}

    return AIDetectionResponse(
        is_ai_generated=bool(submission.ai_flagged),
        confidence=round((submission.ai_score or 0) / 100, 4),
        verdict=report.get("verdict", "Unknown"),
        details=report.get("details", {}),
    )
