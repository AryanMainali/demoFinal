"""
Auth module - exports the auth router for API routing.
"""
from app.api.v1.endpoints.auth.login import router

__all__ = ["router"]
