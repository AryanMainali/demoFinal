"""
Task schemas - Input/output models for personal task endpoints
"""
from datetime import date, datetime
from enum import Enum as PyEnum
from typing import Optional
from pydantic import BaseModel, field_validator


class TaskStatus(str, PyEnum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class TaskCreate(BaseModel):
    title: str
    date: date
    status: TaskStatus = TaskStatus.TODO

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty")
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[date] = None
    status: Optional[TaskStatus] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Title cannot be empty")
        return v


class TaskResponse(BaseModel):
    id: int
    user_id: int
    title: str
    date: date
    status: TaskStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
