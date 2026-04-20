from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, field_validator


class LevelDescriptorCreate(BaseModel):
    score: float
    comment: str = ""


class LevelDescriptorResponse(BaseModel):
    id: int
    score: float
    comment: str

    class Config:
        from_attributes = True


class TemplateItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    min_scale: float = 0.0
    max_scale: float = 5.0
    weight: float = 0.0
    points: float = 0.0
    sort_order: int = 0
    levels: List[LevelDescriptorCreate] = []

    @field_validator("max_scale")
    @classmethod
    def max_must_exceed_min(cls, v: float, info) -> float:
        min_scale = info.data.get("min_scale", 0.0)
        if v <= min_scale:
            raise ValueError("max_scale must be greater than min_scale")
        return v


class TemplateItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    min_scale: float
    max_scale: float
    weight: float
    points: float
    sort_order: int
    levels: List[LevelDescriptorResponse] = []

    class Config:
        from_attributes = True


class TemplateCreate(BaseModel):
    title: str
    description: Optional[str] = None
    items: List[TemplateItemCreate] = []


class TemplateUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    items: Optional[List[TemplateItemCreate]] = None


class TemplateResponse(BaseModel):
    id: int
    course_id: int
    title: str
    description: Optional[str] = None
    items: List[TemplateItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TemplateSummary(BaseModel):
    """Lightweight version for listing templates (no items detail)."""
    id: int
    course_id: int
    title: str
    description: Optional[str] = None
    item_count: int = 0
    total_points: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True
