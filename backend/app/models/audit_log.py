"""
Audit Log Model - System-wide activity tracking and security logging
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class AuditLog(Base):
    """
    AuditLog - Tracks all important system activities for security and compliance.
    """
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for system events
    
    # Event classification
    event_type = Column(String(50), nullable=False, index=True)
    # login, logout, submission, grade, course_create, user_create, etc.
    
    action = Column(String(50), nullable=False)
    # create, read, update, delete, login, logout, submit, grade, etc.
    
    # Resource affected
    resource_type = Column(String(50), nullable=True)  # user, course, assignment, submission
    resource_id = Column(Integer, nullable=True)
    
    # Description
    description = Column(Text, nullable=True)
    
    # Request context
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(String(500), nullable=True)
    request_method = Column(String(10), nullable=True)  # GET, POST, PUT, DELETE
    request_path = Column(String(255), nullable=True)
    request_id = Column(String(36), nullable=True, index=True)  # UUID for request tracking
    
    # Status
    status = Column(String(20), default="success")  # success, failure, warning
    error_message = Column(Text, nullable=True)
    
    # Additional data
    old_value = Column(JSON, nullable=True)  # Previous state for updates
    new_value = Column(JSON, nullable=True)  # New state for updates
    extra_data = Column(JSON, nullable=True)  # Any additional context
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog {self.event_type} by user {self.user_id} at {self.created_at}>"


class LoginAttempt(Base):
    """
    LoginAttempt - Tracks login attempts for security monitoring.
    """
    __tablename__ = "login_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    
    email = Column(String(255), nullable=False, index=True)
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(String(500), nullable=True)
    
    # Result
    success = Column(Integer, default=0)  # 1 = success, 0 = failure
    failure_reason = Column(String(100), nullable=True)
    # invalid_password, user_not_found, account_locked, account_inactive, etc.
    
    # Timestamps
    attempted_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<LoginAttempt {self.email} {'success' if self.success else 'failed'}>"


class SecurityEvent(Base):
    """
    SecurityEvent - Tracks security-related events.
    """
    __tablename__ = "security_events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Event type
    event_type = Column(String(50), nullable=False, index=True)
    # password_change, password_reset, 2fa_enabled, 2fa_disabled, 
    # account_locked, account_unlocked, suspicious_activity, etc.
    
    # Severity
    severity = Column(String(20), default="info")  # info, warning, critical
    
    # Details
    description = Column(Text, nullable=True)
    
    # Context
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    # Extra data
    extra_data = Column(JSON, nullable=True)
    
    # Resolution
    is_resolved = Column(Integer, default=0)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<SecurityEvent {self.event_type} severity={self.severity}>"
