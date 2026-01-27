from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class AuditLog(BaseModel):
    id: int
    user_id: int
    event_type: str
    resource_type: str
    resource_id: int
    action: str
    description: str
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

class AuditLogCreate(BaseModel):
    user_id: int
    event_type: str
    resource_type: str
    resource_id: int
    action: str
    description: str
    metadata: Optional[Dict[str, Any]] = None