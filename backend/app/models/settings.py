"""
Settings Models - User preferences, notifications, and system settings
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
    email_course_announcement = Column(Boolean, default=True)
    email_weekly_summary = Column(Boolean, default=True)
    
    # Push notifications
    push_new_assignment = Column(Boolean, default=True)
    push_assignment_graded = Column(Boolean, default=True)
    push_due_date_reminder = Column(Boolean, default=True)
    push_streak_reminder = Column(Boolean, default=True)
    
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
    editor_font_family = Column(String(100), default="'Fira Code', monospace")
    editor_tab_size = Column(Integer, default=4)
    editor_word_wrap = Column(Boolean, default=True)
    editor_minimap = Column(Boolean, default=True)
    editor_line_numbers = Column(Boolean, default=True)
    
    # Language
    language = Column(String(10), default="en")  # Interface language
    
    # Accessibility
    reduce_animations = Column(Boolean, default=False)
    high_contrast = Column(Boolean, default=False)
    
    # Default programming language
    default_language_id = Column(Integer, ForeignKey("languages.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="preferences")
    
    def __repr__(self):
        return f"<UserPreferences user={self.user_id}>"


class SystemSettings(Base):
    """
    SystemSettings - Global system configuration (Admin only).
    """
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=True)
    value_type = Column(String(20), default="string")  # string, int, float, bool, json
    
    # Categorization
    category = Column(String(50), nullable=False)  # general, security, grading, email, etc.
    
    # Description
    display_name = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    
    # Validation
    is_required = Column(Boolean, default=False)
    default_value = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<SystemSettings {self.key}>"


# Default system settings to seed
DEFAULT_SYSTEM_SETTINGS = [
    # General
    {"key": "site_name", "value": "Kriterion", "value_type": "string", "category": "general", 
     "display_name": "Site Name", "description": "Name of the application"},
    {"key": "site_description", "value": "Automated Grading System", "value_type": "string", 
     "category": "general", "display_name": "Site Description"},
    {"key": "maintenance_mode", "value": "false", "value_type": "bool", "category": "general",
     "display_name": "Maintenance Mode", "description": "Enable to show maintenance page"},
    
    # Security
    {"key": "session_timeout_minutes", "value": "60", "value_type": "int", "category": "security",
     "display_name": "Session Timeout", "description": "Session timeout in minutes"},
    {"key": "max_login_attempts", "value": "5", "value_type": "int", "category": "security",
     "display_name": "Max Login Attempts", "description": "Maximum failed login attempts before lockout"},
    {"key": "lockout_duration_minutes", "value": "30", "value_type": "int", "category": "security",
     "display_name": "Lockout Duration", "description": "Account lockout duration in minutes"},
    {"key": "password_min_length", "value": "8", "value_type": "int", "category": "security",
     "display_name": "Minimum Password Length"},
    {"key": "require_2fa_faculty", "value": "false", "value_type": "bool", "category": "security",
     "display_name": "Require 2FA for Faculty"},
    
    # Grading
    {"key": "default_late_penalty", "value": "10", "value_type": "float", "category": "grading",
     "display_name": "Default Late Penalty (%)", "description": "Percentage deducted per day"},
    {"key": "max_late_days", "value": "7", "value_type": "int", "category": "grading",
     "display_name": "Maximum Late Days"},
    {"key": "auto_grade_enabled", "value": "true", "value_type": "bool", "category": "grading",
     "display_name": "Auto-grading Enabled"},
    
    # Plagiarism
    {"key": "plagiarism_check_enabled", "value": "true", "value_type": "bool", "category": "plagiarism",
     "display_name": "Plagiarism Check Enabled"},
    {"key": "plagiarism_threshold", "value": "30", "value_type": "float", "category": "plagiarism",
     "display_name": "Plagiarism Threshold (%)", "description": "Similarity percentage to flag"},
    
    # AI Detection
    {"key": "ai_detection_enabled", "value": "true", "value_type": "bool", "category": "ai_detection",
     "display_name": "AI Detection Enabled"},
    {"key": "ai_detection_threshold", "value": "50", "value_type": "float", "category": "ai_detection",
     "display_name": "AI Detection Threshold (%)", "description": "AI probability to flag"},
    
    # Code Execution
    {"key": "default_timeout_seconds", "value": "30", "value_type": "int", "category": "execution",
     "display_name": "Default Timeout (seconds)"},
    {"key": "default_memory_mb", "value": "256", "value_type": "int", "category": "execution",
     "display_name": "Default Memory Limit (MB)"},
    {"key": "max_timeout_seconds", "value": "120", "value_type": "int", "category": "execution",
     "display_name": "Maximum Timeout (seconds)"},
    {"key": "max_memory_mb", "value": "1024", "value_type": "int", "category": "execution",
     "display_name": "Maximum Memory (MB)"},
    
    # File Upload
    {"key": "max_file_size_mb", "value": "10", "value_type": "int", "category": "uploads",
     "display_name": "Max File Size (MB)"},
    {"key": "max_files_per_submission", "value": "10", "value_type": "int", "category": "uploads",
     "display_name": "Max Files per Submission"},
    {"key": "allowed_extensions", "value": '".py,.java,.cpp,.c,.js,.ts,.h,.hpp"', "value_type": "string",
     "category": "uploads", "display_name": "Allowed File Extensions"},
    
    # Email
    {"key": "email_from_address", "value": "noreply@kriterion.edu", "value_type": "string", 
     "category": "email", "display_name": "From Email Address"},
    {"key": "email_from_name", "value": "Kriterion", "value_type": "string", "category": "email",
     "display_name": "From Name"},
]
