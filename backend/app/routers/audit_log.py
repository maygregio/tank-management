from typing import Optional

from fastapi import APIRouter, Query

from app.services.file_storage import audit_storage

router = APIRouter(prefix="/audit-log", tags=["audit"])

DEFAULT_PAGE_SIZE = 50
MAX_PAGE_SIZE = 100


@router.get("")
async def get_audit_log(
    entityType: Optional[str] = Query(None),
    entityId: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
):
    """Get paginated audit log entries."""
    audit_log = await audit_storage.read()

    # Filter
    if entityType:
        audit_log = [e for e in audit_log if e.get("entityType") == entityType]
    if entityId:
        audit_log = [e for e in audit_log if e.get("entityId") == entityId]

    # Sort by timestamp descending
    audit_log.sort(key=lambda e: e.get("timestamp", ""), reverse=True)

    # Paginate
    total = len(audit_log)
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    offset = (page - 1) * limit
    paginated = audit_log[offset : offset + limit]

    return {
        "data": paginated,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": total_pages,
            "hasNextPage": page < total_pages,
            "hasPrevPage": page > 1,
        },
    }
