"""
Settings Models - User preferences, and notifications.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class NotificationSettings(Base):
    """
    NotificationSettings - User notification preferences.
    """
    __tablename__ = "notification_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Email notifications
    email_new_assignment = Column(Boolean, default=True)
    email_assignment_graded = Column(Boolean, default=True)
    email_due_date_reminder = Column(Boolean, default=True)
    
    # Reminder timing (hours before deadline)
    due_date_reminder_hours = Column(Integer, default=24)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="notification_settings")
    
    def __repr__(self):
        return f"<NotificationSettings user={self.user_id}>"


class UserPreferences(Base):
    """
    UserPreferences - User interface and editor preferences.
    """
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Theme
    theme = Column(String(20), default="light")  # light, dark, system
    
    # Editor settings
    editor_theme = Column(String(50), default="vs-dark")  # Monaco editor themes
    editor_font_size = Column(Integer, default=14)
    
    # Language
    language = Column(String(10), default="en")  # Interface language

    
    # Default programming language
    default_language_id = Column(Integer, ForeignKey("languages.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="preferences")
    
    def __repr__(self):
        return f"<UserPreferences user={self.user_id}>"


class AdminSettings(Base):
    """
    AdminSettings - System-wide admin settings.
    """
    __tablename__ = "admin_settings"

    id = Column(Integer, primary_key=True, index=True)

    # Security settings
    password_min_length = Column(Integer, default=8)
    password_require_uppercase = Column(Boolean, default=True)
    password_require_lowercase = Column(Boolean, default=True)
    password_require_number = Column(Boolean, default=True)
    password_require_special = Column(Boolean, default=True)
    session_timeout = Column(Integer, default=30)
    max_login_attempts = Column(Integer, default=5)
    lockout_duration = Column(Integer, default=15)

    # Email settings
    smtp_host = Column(String(255), default="smtp.gmail.com")
    smtp_port = Column(Integer, default=587)
    smtp_user = Column(String(255), default="")
    smtp_password = Column(String(255), default="")
    email_from = Column(String(255), default="noreply@kriterion.edu")
    email_from_name = Column(String(255), default="Kriterion System")

    # Notification settings
    email_on_submission = Column(Boolean, default=True)
    email_on_grading = Column(Boolean, default=True)
    email_on_new_assignment = Column(Boolean, default=True)
    email_on_due_reminder = Column(Boolean, default=True)
    reminder_days = Column(Integer, default=2)

    # Code execution settings
    default_timeout = Column(Integer, default=10)
    default_memory_limit = Column(Integer, default=256)
    max_concurrent_jobs = Column(Integer, default=10)
    sandbox_enabled = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<AdminSettings id={self.id}>"