from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class RubricItemCreate(BaseModel):
    name: str
    max_points: float
    weight: float = 0.0
    description: Optional[str] = None
    order: int = 0

class RubricCategoryCreate(BaseModel):
    name: str
    weight: float = 0.0
    order: int = 0
    items: List[RubricItemCreate] = []

class AssignmentBase(BaseModel):
    title: str
    description: str
    language: str
    due_date: datetime
    late_penalty_per_day: float = 10.0
    max_attempts: int = 0
    allow_groups: bool = False
    max_group_size: int = 3
    required_files: Optional[List[str]] = None
    test_command_template: Optional[str] = None


class AssignmentCreate(AssignmentBase):
    course_id: int
    rubric: Optional[Dict[str, Any]] = None
    test_suites: Optional[List[Dict[str, Any]]] = None


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    late_penalty_per_day: Optional[float] = None
    max_attempts: Optional[int] = None
    allow_groups: Optional[bool] = None
    max_group_size: Optional[int] = None
    required_files: Optional[List[str]] = None
    is_published: Optional[bool] = None


class Assignment(AssignmentBase):
    id: int
    course_id: int
    is_published: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AssignmentDetail(Assignment):
    rubric: Optional[Dict[str, Any]] = None
    test_suites: List[Dict[str, Any]] = []
    course: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class RubricCreate(BaseModel):
    total_points: float = 100.0
    is_weighted: bool = False
    categories: List[RubricCategoryCreate] = []


class RubricUpdate(BaseModel):
    rubric_data: Optional[Dict[str, Any]] = None
    total_points: Optional[float] = None


class Rubric(BaseModel):
    id: int
    assignment_id: int
    rubric_data: Dict[str, Any]
    total_points: float
    created_at: datetime
    
    class Config:
        from_attributes = True
