from typing import Any, Dict, List, Optional
from pydantic import BaseModel

from .common import AuditAction, AuditEntityType


class AuditLogEntry(BaseModel):
    id: str
    action: AuditAction
    entityType: AuditEntityType
    entityId: str
    userId: str
    timestamp: str
    changes: Dict[str, Any]
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class PaginationInfo(BaseModel):
    page: int
    limit: int
    total: int
    totalPages: int
    hasNextPage: bool
    hasPrevPage: bool


class AuditLogResponse(BaseModel):
    data: List[AuditLogEntry]
    pagination: PaginationInfo
