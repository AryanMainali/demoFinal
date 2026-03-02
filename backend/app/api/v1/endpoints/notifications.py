from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models import Notification, NotificationType, User

router = APIRouter()


class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    link: Optional[str] = None
    course_id: Optional[int] = None
    assignment_id: Optional[int] = None
    submission_id: Optional[int] = None
    is_read: bool
    created_at: datetime


@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)

    if unread_only:
        query = query.filter(Notification.is_read == False)

    notifications = query.order_by(desc(Notification.created_at)).limit(limit).all()

    return [
        NotificationResponse(
            id=n.id,
            type=n.type.value if isinstance(n.type, NotificationType) else str(n.type),
            title=n.title,
            message=n.message,
            link=n.link,
            course_id=n.course_id,
            assignment_id=n.assignment_id,
            submission_id=n.submission_id,
            is_read=n.is_read,
            created_at=n.created_at,
        )
        for n in notifications
    ]


@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()

    return {"message": "Notification marked as read"}


@router.put("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update(
        {
            "is_read": True,
            "read_at": datetime.utcnow(),
        }
    )
    db.commit()

    return {"message": "All notifications marked as read"}
