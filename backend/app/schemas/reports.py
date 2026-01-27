from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class DashboardStats(BaseModel):
    # Student stats
    enrolled_courses: Optional[int] = None
    total_submissions: Optional[int] = None
    graded_submissions: Optional[int] = None
    average_score: Optional[float] = None
    upcoming_assignments: Optional[int] = None
    recent_submissions: Optional[List[Dict[str, Any]]] = None
    
    # Faculty stats
    total_courses: Optional[int] = None
    total_students: Optional[int] = None
    total_assignments: Optional[int] = None
    pending_grading: Optional[int] = None
    
    # Admin stats
    total_users: Optional[int] = None

class StudentInfo(BaseModel):
    id: int
    name: str
    email: str
    student_id: Optional[str] = None

class StudentReportSchema(BaseModel):
    student: StudentInfo
    total_submissions: int
    graded_submissions: int
    average_score: float
    submissions: List[Dict[str, Any]]

class AssignmentInfo(BaseModel):
    id: int
    title: str
    due_date: str
    total_points: float

class AssignmentReportSchema(BaseModel):
    assignment: AssignmentInfo
    total_submissions: int
    graded_submissions: int
    average_score: float
    min_score: float
    max_score: float
    score_distribution: Dict[str, int]
    late_submissions: int
    submissions: List[Dict[str, Any]]

class CourseInfo(BaseModel):
    id: int
    code: str
    name: str
    semester: str
    year: int

class CourseReportSchema(BaseModel):
    course: CourseInfo
    total_students: int
    total_assignments: int
    total_submissions: int
    students: List[Dict[str, Any]]
    assignments: List[Dict[str, Any]]