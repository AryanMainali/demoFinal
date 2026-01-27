"""
Settings & Profile Endpoints - User preferences, notifications, profile management
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models import (
    User, UserRole, NotificationSettings, UserPreferences
)
from app.core.security import verify_password, get_password_hash
from app.core.logging import logger
from pydantic import BaseModel, EmailStr, Field

router = APIRouter()


# ============== Schemas ==============

class ProfileResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    student_id: Optional[str]
    phone: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    github_url: Optional[str]
    linkedin_url: Optional[str]
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class NotificationSettingsUpdate(BaseModel):
    email_submissions: Optional[bool] = None
    email_grades: Optional[bool] = None
    email_announcements: Optional[bool] = None
    email_deadlines: Optional[bool] = None
    push_submissions: Optional[bool] = None
    push_grades: Optional[bool] = None
    push_announcements: Optional[bool] = None
    push_deadlines: Optional[bool] = None

class UserPreferencesUpdate(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    editor_theme: Optional[str] = None
    editor_font_size: Optional[int] = None
    editor_tab_size: Optional[int] = None
    editor_auto_save: Optional[bool] = None
    editor_vim_mode: Optional[bool] = None


# ============== Profile ==============

@router.get("/profile", response_model=ProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's profile"""
    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        student_id=current_user.student_id,
        phone=current_user.phone,
        bio=current_user.bio,
        avatar_url=current_user.avatar_url,
        github_url=current_user.github_url,
        linkedin_url=current_user.linkedin_url,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )


@router.put("/profile", response_model=ProfileResponse)
def update_profile(
    profile_update: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile"""
    for field, value in profile_update.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    logger.info(f"User {current_user.id} updated profile")
    
    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        student_id=current_user.student_id,
        phone=current_user.phone,
        bio=current_user.bio,
        avatar_url=current_user.avatar_url,
        github_url=current_user.github_url,
        linkedin_url=current_user.linkedin_url,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )


@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload profile avatar"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Allowed: JPEG, PNG, GIF, WebP"
        )
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB")
    
    # In production, upload to cloud storage (S3, etc.)
    # For now, save to local directory or store as base64
    import base64
    avatar_data = f"data:{file.content_type};base64,{base64.b64encode(contents).decode()}"
    
    current_user.avatar_url = avatar_data
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Avatar uploaded successfully", "avatar_url": avatar_data[:100] + "..."}


@router.put("/profile/password")
def change_password(
    password_change: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Change user password"""
    # Verify current password
    if not verify_password(password_change.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_change.new_password)
    current_user.password_changed_at = datetime.utcnow()
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    logger.info(f"User {current_user.id} changed password")
    
    return {"message": "Password changed successfully"}


# ============== Notification Settings ==============

@router.get("/notifications/settings")
def get_notification_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get notification settings"""
    settings = db.query(NotificationSettings).filter(
        NotificationSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create default settings
        settings = NotificationSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return {
        "email_submissions": settings.email_submissions,
        "email_grades": settings.email_grades,
        "email_announcements": settings.email_announcements,
        "email_deadlines": settings.email_deadlines,
        "push_submissions": settings.push_submissions,
        "push_grades": settings.push_grades,
        "push_announcements": settings.push_announcements,
        "push_deadlines": settings.push_deadlines
    }


@router.put("/notifications/settings")
def update_notification_settings(
    settings_update: NotificationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update notification settings"""
    settings = db.query(NotificationSettings).filter(
        NotificationSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        settings = NotificationSettings(user_id=current_user.id)
        db.add(settings)
    
    for field, value in settings_update.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    
    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    
    return {"message": "Notification settings updated"}


# ============== User Preferences ==============

@router.get("/preferences")
def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user preferences"""
    prefs = db.query(UserPreferences).filter(
        UserPreferences.user_id == current_user.id
    ).first()
    
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    
    return {
        "theme": prefs.theme,
        "language": prefs.language,
        "timezone": prefs.timezone,
        "editor_theme": prefs.editor_theme,
        "editor_font_size": prefs.editor_font_size,
        "editor_tab_size": prefs.editor_tab_size,
        "editor_auto_save": prefs.editor_auto_save,
        "editor_vim_mode": prefs.editor_vim_mode
    }


@router.put("/preferences")
def update_preferences(
    prefs_update: UserPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user preferences"""
    prefs = db.query(UserPreferences).filter(
        UserPreferences.user_id == current_user.id
    ).first()
    
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)
    
    for field, value in prefs_update.model_dump(exclude_unset=True).items():
        setattr(prefs, field, value)
    
    prefs.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(prefs)
    
    return {"message": "Preferences updated"}
