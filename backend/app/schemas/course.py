from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class CourseBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    section: Optional[str] = None
    semester: str
    year: int


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    section: Optional[str] = None
    is_active: Optional[bool] = None


class Course(CourseBase):
    id: int
    instructor_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class EnrollmentCreate(BaseModel):
    user_id: int
    course_id: int


class Enrollment(BaseModel):
    id: int
    user_id: int
    course_id: int
    enrolled_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


class GroupCreate(BaseModel):
    course_id: int
    name: str
    member_ids: List[int]


class Group(BaseModel):
    id: int
    course_id: int
    name: str
    created_at: datetime
    
    class Config:
        from_attributes = True
