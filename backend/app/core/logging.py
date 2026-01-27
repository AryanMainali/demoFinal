import logging
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime
from typing import Any, Dict

from app.core.config import settings

# Context variable for request ID
request_id_var: ContextVar[str] = ContextVar("request_id", default="")


class RequestIdFilter(logging.Filter):
    """Add request ID to log records"""
    
    def filter(self, record):
        record.request_id = request_id_var.get()
        return True


class StructuredFormatter(logging.Formatter):
    """Format logs as structured JSON"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", ""),
        }
        
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        if hasattr(record, "extra"):
            log_data.update(record.extra)
        
        # Simple JSON representation
        return str(log_data)


def setup_logging():
    """Configure application logging"""
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL))
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, settings.LOG_LEVEL))
    
    # Add request ID filter
    console_handler.addFilter(RequestIdFilter())
    
    # Use structured formatter
    formatter = StructuredFormatter()
    console_handler.setFormatter(formatter)
    
    root_logger.addHandler(console_handler)
    
    return root_logger


def get_request_id() -> str:
    """Get current request ID"""
    return request_id_var.get()


def set_request_id(request_id: str = None):
    """Set request ID for current context"""
    if request_id is None:
        request_id = str(uuid.uuid4())
    request_id_var.set(request_id)
    return request_id


# Initialize logging
logger = setup_logging()
