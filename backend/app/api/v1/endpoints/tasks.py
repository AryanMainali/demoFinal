"""
Tasks endpoints - Personal calendar tasks for all roles (Admin, Faculty, Student)
"""
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models import User
from app.models.task import UserTask
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter()


@router.get("", response_model=List[TaskResponse])
def list_tasks(
    from_date: Optional[date] = Query(None, description="Filter tasks from this date (inclusive)"),
    to_date: Optional[date] = Query(None, description="Filter tasks up to this date (inclusive)"),
    status: Optional[str] = Query(None, description="Filter by status: todo, in_progress, done"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all personal tasks for the current user, optionally filtered by date range or status."""
    q = db.query(UserTask).filter(UserTask.user_id == current_user.id)
    if from_date:
        q = q.filter(UserTask.date >= from_date)
    if to_date:
        q = q.filter(UserTask.date <= to_date)
    if status:
        q = q.filter(UserTask.status == status)
    return q.order_by(UserTask.date, UserTask.created_at).all()


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new personal task for the current user."""
    task = UserTask(
        user_id=current_user.id,
        title=task_in.title,
        date=task_in.date,
        status=task_in.status,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update title, date, or status of an existing task."""
    task = db.query(UserTask).filter(
        UserTask.id == task_id,
        UserTask.user_id == current_user.id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a personal task."""
    task = db.query(UserTask).filter(
        UserTask.id == task_id,
        UserTask.user_id == current_user.id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
