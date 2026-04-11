"""Email service for sending notifications."""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.database import SessionLocal
from app.core.config import settings
from app.models import AdminSettings
from app.core.logging import logger


def _resolve_email_settings() -> dict[str, str | int]:
    db = SessionLocal()
    try:
        admin_settings = db.query(AdminSettings).order_by(AdminSettings.id.asc()).first()
        if not admin_settings:
            return {
                "smtp_host": settings.SMTP_HOST,
                "smtp_port": settings.SMTP_PORT,
                "smtp_user": settings.SMTP_USER,
                "smtp_password": settings.SMTP_PASSWORD,
                "email_from": settings.EMAIL_FROM,
                "email_from_name": "Kriterion System",
            }

        return {
            "smtp_host": admin_settings.smtp_host or settings.SMTP_HOST,
            "smtp_port": admin_settings.smtp_port or settings.SMTP_PORT,
            "smtp_user": admin_settings.smtp_user or settings.SMTP_USER,
            "smtp_password": admin_settings.smtp_password or settings.SMTP_PASSWORD,
            "email_from": admin_settings.email_from or settings.EMAIL_FROM,
            "email_from_name": admin_settings.email_from_name or "Kriterion System",
        }
    except Exception as exc:
        logger.warning(f"Falling back to environment email settings: {exc}")
        return {
            "smtp_host": settings.SMTP_HOST,
            "smtp_port": settings.SMTP_PORT,
            "smtp_user": settings.SMTP_USER,
            "smtp_password": settings.SMTP_PASSWORD,
            "email_from": settings.EMAIL_FROM,
            "email_from_name": "Kriterion System",
        }
    finally:
        db.close()


def send_email(to: str, subject: str, body_html: str, body_text: str | None = None) -> bool:
    """Send an email. Returns True if sent, False otherwise."""
    email_settings = _resolve_email_settings()

    if not email_settings["smtp_user"] or not email_settings["smtp_password"]:
        logger.warning("SMTP not configured. Email not sent.")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f'{email_settings["email_from_name"]} <{email_settings["email_from"]}>'
        msg["To"] = to
        if body_text:
            msg.attach(MIMEText(body_text, "plain"))
        msg.attach(MIMEText(body_html, "html"))
        with smtplib.SMTP(str(email_settings["smtp_host"]), int(email_settings["smtp_port"])) as server:
            server.starttls()
            server.login(str(email_settings["smtp_user"]), str(email_settings["smtp_password"]))
            server.sendmail(str(email_settings["email_from"]), to, msg.as_string())
        logger.info(f"Email sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False


def send_student_add_request_to_admin(
    student_email: str,
    course_code: str,
    course_name: str,
    faculty_name: str,
    faculty_email: str,
) -> bool:
    """Notify admin that a faculty requested to add a student who is not in the system."""
    subject = f"[Kriterion] Student Add Request: {student_email}"
    body_text = (
        f"A faculty member has requested to enroll a student who is not yet in the system.\n\n"
        f"Student email: {student_email}\n"
        f"Course: {course_code} - {course_name}\n"
        f"Requested by: {faculty_name} ({faculty_email})\n\n"
        f"Please add this student to the system so they can be enrolled."
    )
    body_html = f"""
    <p>A faculty member has requested to enroll a student who is not yet in the system.</p>
    <ul>
        <li><strong>Student email:</strong> {student_email}</li>
        <li><strong>Course:</strong> {course_code} - {course_name}</li>
        <li><strong>Requested by:</strong> {faculty_name} ({faculty_email})</li>
    </ul>
    <p>Please add this student to the system so they can be enrolled in the course.</p>
    """
    return send_email(settings.INITIAL_ADMIN_EMAIL, subject, body_html, body_text)


def send_bulk_student_add_request_to_admin(
    not_found_emails: list[str],
    course_code: str,
    course_name: str,
    faculty_name: str,
    faculty_email: str,
) -> bool:
    """Notify admin about multiple students not in system after bulk enroll attempt."""
    if not not_found_emails:
        return True
    emails_list = "\n".join(f"  - {e}" for e in not_found_emails[:50])
    if len(not_found_emails) > 50:
        emails_list += f"\n  ... and {len(not_found_emails) - 50} more"
    subject = f"[Kriterion] Bulk Enroll: {len(not_found_emails)} students not in system"
    body_text = (
        f"Faculty attempted bulk enroll. These students are not in the system:\n\n{emails_list}\n\n"
        f"Course: {course_code} - {course_name}\n"
        f"Requested by: {faculty_name} ({faculty_email})\n\n"
        f"Please add these students to the system."
    )
    body_html = f"""
    <p>Faculty attempted bulk enroll. These students are not in the system:</p>
    <pre>{emails_list}</pre>
    <p><strong>Course:</strong> {course_code} - {course_name}</p>
    <p><strong>Requested by:</strong> {faculty_name} ({faculty_email})</p>
    <p>Please add these students to the system so they can be enrolled.</p>
    """
    return send_email(settings.INITIAL_ADMIN_EMAIL, subject, body_html, body_text)
