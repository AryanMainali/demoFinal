"""Reminder-related Celery tasks."""
from datetime import datetime, timedelta

from celery import Task
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.core.logging import logger
from app.models import AdminSettings, Assignment, Enrollment, EnrollmentStatus, Notification, NotificationType, User
from app.services.email import send_email
from app.services.notifications import create_notification


class DatabaseTask(Task):
    _db = None

    @property
    def db(self) -> Session:
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, *args, **kwargs):
        if self._db is not None:
            self._db.close()
            self._db = None


def _get_admin_settings(db: Session) -> AdminSettings | None:
    try:
        return db.query(AdminSettings).order_by(AdminSettings.id.asc()).first()
    except Exception as exc:
        logger.warning(f"Could not load admin reminder settings: {exc}")
        return None


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.reminders.send_due_reminder_emails_task",
)
def send_due_reminder_emails_task(self):
    """Send due-date reminder emails for assignments that are due soon."""
    db = self.db
    settings_row = _get_admin_settings(db)
    if settings_row and not settings_row.email_on_due_reminder:
        logger.info("Due reminder emails are disabled in admin settings.")
        return {"sent": 0, "skipped": 0}

    reminder_days = settings_row.reminder_days if settings_row and settings_row.reminder_days else 2
    target_date = (datetime.utcnow() + timedelta(days=reminder_days)).date()
    start_of_day = datetime.combine(target_date, datetime.min.time())
    end_of_day = start_of_day + timedelta(days=1)

    assignments = (
        db.query(Assignment)
        .join(Enrollment, Enrollment.course_id == Assignment.course_id)
        .filter(
            Enrollment.status == EnrollmentStatus.ACTIVE,
            Assignment.is_published == True,
            Assignment.due_date >= start_of_day,
            Assignment.due_date < end_of_day,
        )
        .distinct()
        .all()
    )

    sent = 0
    skipped = 0

    for assignment in assignments:
        recipients = (
            db.query(User.id, User.email)
            .join(Enrollment, Enrollment.student_id == User.id)
            .filter(
                Enrollment.course_id == assignment.course_id,
                Enrollment.status == EnrollmentStatus.ACTIVE,
            )
            .all()
        )

        for student_id, recipient_email in recipients:
            existing_reminder = (
                db.query(Notification.id)
                .filter(
                    Notification.user_id == student_id,
                    Notification.type == NotificationType.HOMEWORK_DUE,
                    Notification.assignment_id == assignment.id,
                    Notification.created_at >= start_of_day,
                )
                .first()
            )
            if existing_reminder:
                skipped += 1
                continue

            create_notification(
                db=db,
                user_id=student_id,
                notification_type=NotificationType.HOMEWORK_DUE,
                title=f"Assignment due soon: {assignment.title}",
                message=f"{assignment.title} is due on {assignment.due_date:%Y-%m-%d %H:%M UTC}.",
                course_id=assignment.course_id,
                assignment_id=assignment.id,
            )

            subject = f"[Kriterion] Assignment Due Soon: {assignment.title}"
            body_text = (
                f"{assignment.title} is due on {assignment.due_date:%Y-%m-%d %H:%M UTC}.\n\n"
                "Open your course page to review the assignment and submit before the deadline."
            )
            body_html = (
                f"<p>{assignment.title} is due on {assignment.due_date:%Y-%m-%d %H:%M UTC}.</p>"
                f"<p>Open your course page to review the assignment and submit before the deadline.</p>"
            )
            if send_email(recipient_email, subject, body_html, body_text):
                sent += 1
            else:
                skipped += 1

    db.commit()
    logger.info(f"Due reminder task completed: {sent} sent, {skipped} skipped")
    return {"sent": sent, "skipped": skipped}