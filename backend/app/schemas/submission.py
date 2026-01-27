from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class SubmissionCreate(BaseModel):
    assignment_id: int
    group_id: Optional[int] = None


class SubmissionUpdate(BaseModel):
    feedback: Optional[str] = None
    rubric_scores: Optional[Dict[str, Any]] = None
    override_score: Optional[float] = None
    override_reason: Optional[str] = None


class Submission(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    group_id: Optional[int] = None
    attempt_number: int
    status: str
    score: Optional[float] = None
    final_score: Optional[float] = None
    submitted_at: datetime
    is_late: bool
    late_penalty: float
    public_test_passed: int
    public_test_total: int
    feedback: Optional[str] = None
    
    class Config:
        from_attributes = True


class SubmissionDetail(Submission):
    test_results: Optional[Dict[str, Any]] = None
    rubric_scores: Optional[Dict[str, Any]] = None
    plagiarism_score: Optional[float] = None
    suspected_ai_generated: bool = False
