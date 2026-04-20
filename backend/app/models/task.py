"""
UserTask Model - Personal calendar tasks for all roles (Admin, Faculty, Student)
"""
from datetime import datetime, date
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Date, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class TaskStatus(str, PyEnum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class UserTask(Base):
    __tablename__ = "user_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    date = Column(Date, nullable=False, index=True)
    status = Column(Enum(TaskStatus), nullable=False, default=TaskStatus.TODO)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship back to user
    user = relationship("User", back_populates="tasks")

    def __repr__(self):
        return f"<UserTask {self.id} user={self.user_id} '{self.title}' {self.date}>"
