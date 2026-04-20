"""
Course Rubric Template Models
Reusable rubric templates that faculty can attach to assignments.
Each criterion has per-score-level comment descriptors (Excel-style).
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class CourseRubricTemplate(Base):
    __tablename__ = "course_rubric_templates"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    course = relationship("Course", back_populates="rubric_templates")
    items = relationship(
        "CourseRubricTemplateItem",
        back_populates="template",
        cascade="all, delete-orphan",
        order_by="CourseRubricTemplateItem.sort_order",
    )

    def __repr__(self):
        return f"<CourseRubricTemplate {self.title}>"


class CourseRubricTemplateItem(Base):
    __tablename__ = "course_rubric_template_items"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("course_rubric_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Grading scale for this criterion (e.g. 0–5)
    min_scale = Column(Float, default=0.0, nullable=False)
    max_scale = Column(Float, default=5.0, nullable=False)

    # Weight (0–100 %) and total assignment points for this criterion
    weight = Column(Float, default=0.0, nullable=False)
    points = Column(Float, default=0.0, nullable=False)

    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    template = relationship("CourseRubricTemplate", back_populates="items")
    levels = relationship(
        "CourseRubricTemplateLevelDescriptor",
        back_populates="item",
        cascade="all, delete-orphan",
        order_by="CourseRubricTemplateLevelDescriptor.score",
    )

    def __repr__(self):
        return f"<CourseRubricTemplateItem {self.name}>"


class CourseRubricTemplateLevelDescriptor(Base):
    """Pre-written comment for a specific score value on a rubric criterion."""
    __tablename__ = "course_rubric_template_level_descriptors"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("course_rubric_template_items.id", ondelete="CASCADE"), nullable=False, index=True)

    # The numeric score this descriptor applies to (e.g. 0, 1, 2, 3, 4, 5)
    score = Column(Float, nullable=False)
    comment = Column(Text, nullable=False, default="")

    # Relationships
    item = relationship("CourseRubricTemplateItem", back_populates="levels")

    def __repr__(self):
        return f"<LevelDescriptor score={self.score}>"
