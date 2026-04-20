"""
Notification Service - Creates notifications when events occur
Decoupled from other services for modularity
"""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType
from app.models import AdminSettings, Enrollment, EnrollmentStatus, User
from app.core.logging import logger
from app.services.email import send_email


def _get_admin_settings(db: Session) -> Optional[AdminSettings]:
    try:
        return db.query(AdminSettings).order_by(AdminSettings.id.asc()).first()
    except Exception as exc:
        logger.warning(f"Could not load admin email settings: {exc}")
        return None


def _email_enabled(db: Session, field_name: str) -> bool:
    settings_row = _get_admin_settings(db)
    if not settings_row:
        return True
    return bool(getattr(settings_row, field_name, True))


def _send_email_to_user(db: Session, user_id: int, subject: str, body_html: str, body_text: str) -> bool:
    recipient_email = db.query(User.email).filter(User.id == user_id).scalar()
    if not recipient_email:
        return False
    return send_email(recipient_email, subject, body_html, body_text)


def create_notification(
    db: Session,
    user_id: int,
    notification_type: NotificationType,
    title: str,
    message: str,
    link: Optional[str] = None,
    course_id: Optional[int] = None,
    assignment_id: Optional[int] = None,
    submission_id: Optional[int] = None,
) -> Notification:
    """Create a single notification"""
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        link=link,
        course_id=course_id,
        assignment_id=assignment_id,
        submission_id=submission_id,
        is_read=False,
    )
    db.add(notification)
    return notification


def notify_course_students_assignment_posted(
    db: Session,
    course_id: int,
    assignment_id: int,
    assignment_title: str,
    course_code: str,
) -> int:
    """Create assignment posted notifications for all students in course"""
    try:
        enrollments = (
            db.query(Enrollment)
            .filter(
                Enrollment.course_id == course_id,
                Enrollment.status == EnrollmentStatus.ACTIVE,
            )
            .all()
        )

        count = 0
        for enrollment in enrollments:
            create_notification(
                db=db,
                user_id=enrollment.student_id,
                notification_type=NotificationType.ASSIGNMENT_NEW,
                title="Assignment Posted",
                message=f"{assignment_title} has been posted for {course_code}.",
                link=f"/student/assignments/{assignment_id}",
                course_id=course_id,
                assignment_id=assignment_id,
            )
            count += 1

            if _email_enabled(db, "email_on_new_assignment"):
                recipient_email = db.query(User.email).filter(User.id == enrollment.student_id).scalar()
                if recipient_email:
                    subject = f"[Kriterion] Assignment Posted: {assignment_title}"
                    body_text = f"{assignment_title} has been posted for {course_code}.\n\nOpen your course page to review the assignment."
                    body_html = (
                        f"<p>{assignment_title} has been posted for {course_code}.</p>"
                        f"<p>Open your course page to review the assignment.</p>"
                    )
                    send_email(recipient_email, subject, body_html, body_text)

        db.flush()  # Flush to prepare for commit
        logger.info(f"Created {count} assignment posted notifications for course {course_id}")
        return count

    except Exception as e:
        logger.error(f"Failed to create assignment notifications: {str(e)}")
        raise


def notify_faculty_submission_received(
    db: Session,
    course_id: int,
    assignment_id: int,
    student_name: str,
    course_code: str,
    faculty_id: int,
) -> Optional[Notification]:
    """Create submission received notification for faculty"""
    try:
        notification = create_notification(
            db=db,
            user_id=faculty_id,
            notification_type=NotificationType.NEW_SUBMISSION_RECEIVED,
            title="New Submission",
            message=f"{student_name} submitted to an assignment in {course_code}.",
            link=f"/faculty/courses/{course_id}",
            course_id=course_id,
            assignment_id=assignment_id,
        )
        logger.info(f"Created submission notification for faculty {faculty_id}")

        if _email_enabled(db, "email_on_submission"):
            subject = f"[Kriterion] New Submission: {course_code}"
            body_text = f"{student_name} submitted to an assignment in {course_code}.\n\nOpen the course page to review the submission."
            body_html = (
                f"<p>{student_name} submitted to an assignment in {course_code}.</p>"
                f"<p>Open the course page to review the submission.</p>"
            )
            _send_email_to_user(db, faculty_id, subject, body_html, body_text)
        return notification

    except Exception as e:
        logger.error(f"Failed to create submission notification: {str(e)}")
        return None


def notify_faculty_course_assigned(
    db: Session,
    faculty_id: int,
    course_id: int,
    course_code: str,
    course_name: str,
) -> Optional[Notification]:
    """Notify faculty when admin assigns them to a course as instructor."""
    try:
        notification = create_notification(
            db=db,
            user_id=faculty_id,
            notification_type=NotificationType.COURSE_ASSIGNED,
            title="Course Assigned",
            message=f"You have been assigned as instructor for {course_code} - {course_name}.",
            link=f"/faculty/courses/{course_id}",
            course_id=course_id,
        )
        logger.info(f"Created course-assigned notification for faculty {faculty_id}")
        return notification
    except Exception as e:
        logger.error(f"Failed to create course-assigned notification: {str(e)}")
        return None


def notify_student_grade_posted(
    db: Session,
    student_id: int,
    course_code: str,
    assignment_title: str,
    score: float,
    max_score: float,
    course_id: int,
    assignment_id: int,
) -> Optional[Notification]:
    """Create grade posted notification for student"""
    try:
        notification = create_notification(
            db=db,
            user_id=student_id,
            notification_type=NotificationType.GRADE_POSTED,
            title="Assignment Graded",
            message=f"{assignment_title} in {course_code} has been graded.",
            link=f"/student/grades",
            course_id=course_id,
            assignment_id=assignment_id,
        )
        logger.info(f"Created grade notification for student {student_id}")

        if _email_enabled(db, "email_on_grading"):
            subject = f"[Kriterion] Grade Posted: {assignment_title}"
            body_text = (
                f"Your grade for {assignment_title} in {course_code} has been posted: "
                f"{score}/{max_score} ({percentage:.1f}%)."
            )
            body_html = (
                f"<p>Your grade for {assignment_title} in {course_code} has been posted.</p>"
                f"<p><strong>Score:</strong> {score}/{max_score} ({percentage:.1f}%)</p>"
            )
            _send_email_to_user(db, student_id, subject, body_html, body_text)
        return notification

    except Exception as e:
        logger.error(f"Failed to create grade notification: {str(e)}")
        return None
