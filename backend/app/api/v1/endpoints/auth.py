"""
Authentication endpoints for user login, registration, token refresh, and logout.

This module handles:
1. User registration (admin only)
2. User login - validates email/password and returns JWT tokens
3. Token refresh - generates new access token from refresh token
4. User logout - records logout event in audit log
5. Get current user info - returns authenticated user's profile
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.api.deps import get_db, get_current_user, require_role
from app.core.database import SessionLocal
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.models import User, AuditLog, UserRole
from app.schemas.token import Token, RefreshTokenRequest
from app.schemas.user import UserCreate, User as UserSchema
from app.core.config import settings

router = APIRouter()


# ============== Schemas ==============

class LoginRequest(BaseModel):
    """Request body for login endpoint"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User information returned after login"""
    id: int
    email: str
    full_name: str
    role: str
    student_id: str | None = None
    is_active: bool
    is_verified: bool
    last_login: datetime | None = None
    
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Response returned after successful login"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============== Helpers ==============

def _get_client_ip(request: Request) -> Optional[str]:
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


def _write_audit_log(
    *,
    user_id: Optional[int],
    event_type: str,
    description: Optional[str] = None,
    ip_address: Optional[str] = None,
    status: str = "success",
    error_message: Optional[str] = None,
) -> None:
    db = SessionLocal()
    try:
        db.add(AuditLog(
            user_id=user_id,
            event_type=event_type,
            description=description,
            ip_address=ip_address,
            status=status,
            error_message=error_message,
        ))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _role_for_email(email: str) -> Optional[UserRole]:
    """Infer allowed role from ULM email domain. Returns None for non-ULM emails."""
    email_lower = email.lower()
    if email_lower.endswith("@warhawks.ulm.edu"):
        return UserRole.STUDENT
    if email_lower.endswith("@ulm.edu"):
        return None  # could be FACULTY or ADMIN
    return None


def _validate_email_role(email: str, requested_role: UserRole):
    """Enforce ULM email-domain ↔ role rules."""
    email_lower = email.lower()
    if email_lower.endswith("@warhawks.ulm.edu"):
        if requested_role != UserRole.STUDENT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="@warhawks.ulm.edu emails must be registered as STUDENT."
            )
    elif email_lower.endswith("@ulm.edu"):
        if requested_role == UserRole.STUDENT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="@ulm.edu emails cannot be registered as STUDENT. Use @warhawks.ulm.edu for students."
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only @ulm.edu and @warhawks.ulm.edu email addresses are allowed."
        )


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Register a new user (admin only)"""
    _validate_email_role(user_in.email, user_in.role)

    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    if user_in.student_id:
        existing_student = db.query(User).filter(User.student_id == user_in.student_id).first()
        if existing_student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student ID already registered"
            )
    
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        student_id=user_in.student_id
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    audit = AuditLog(
        user_id=user.id,
        event_type="user_registration",
        description=f"User {user.email} registered as {user.role.value}"
    )
    db.add(audit)
    db.commit()
    
    return user


@router.post("/login", response_model=LoginResponse)
def login(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return tokens with user information.
    
    **Request Body:**
    - `email`: User's email address
    - `password`: User's password
    
    **Returns:**
    - `access_token`: JWT access token for API authentication
    - `refresh_token`: JWT refresh token for obtaining new access tokens
    - `token_type`: Always "bearer"
    - `user`: User information (id, email, full_name, role, etc.)
    
    **Errors:**
    - 401: Invalid email or password
    - 403: User account is inactive
    """
    
    # Step 1: Find user by email
    user = db.query(User).filter(User.email == login_data.email).first()
    client_ip = _get_client_ip(request)
    
    # Step 2: Verify user exists and password is correct
    if not user:
        _write_audit_log(
            user_id=None,
            event_type='user_login_failed',
            description=f'Failed login attempt for {login_data.email}',
            ip_address=client_ip,
            status='failure',
            error_message='Incorrect email or password',
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(login_data.password, user.hashed_password):
        _write_audit_log(
            user_id=user.id,
            event_type='user_login_failed',
            description=f'Failed login attempt for {login_data.email}',
            ip_address=client_ip,
            status='failure',
            error_message='Incorrect email or password',
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Step 3: Check if user account is active
    if not user.is_active:
        _write_audit_log(
            user_id=user.id,
            event_type='user_login_failed',
            description=f'Blocked login attempt for inactive account {user.email}',
            ip_address=client_ip,
            status='failure',
            error_message='User account is inactive',
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive. Please contact an administrator."
        )
    
    # Step 4: Update last login timestamp
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Step 5: Create JWT tokens
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "role": user.role.value})
    
    # Step 6: Log the login event for auditing
    _write_audit_log(
        user_id=user.id,
        event_type='user_login',
        description=f'User {user.email} logged in successfully',
        ip_address=client_ip,
        status='success',
    )
    
    # Step 7: Return tokens and user information
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role.value,  # Convert enum to string
            student_id=user.student_id,
            is_active=user.is_active,
            is_verified=user.is_verified,
            last_login=user.last_login
        )
    )


@router.post("/logout")
def logout(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Logout endpoint for audit logging."""
    _write_audit_log(
        user_id=current_user.id,
        event_type="user_logout",
        description=f"User {current_user.email} logged out",
        ip_address=_get_client_ip(request),
        status="success",
    )
    return {"message": "Logged out"}


@router.post("/refresh", response_model=Token)
def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token"""
    payload = decode_token(refresh_data.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id_raw = payload.get("sub")
    if user_id_raw is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    try:
        user_id = int(user_id_raw)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id), "role": user.role.value})
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user's information.
    
    **Returns:**
    - User information (id, email, full_name, role, etc.)
    
    **Errors:**
    - 401: Not authenticated or invalid token
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        student_id=current_user.student_id,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        last_login=current_user.last_login
    )
