import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from app.models.common import AuditAction, AuditEntityType
from app.services.file_storage import audit_storage


async def log_audit(
    action: AuditAction,
    entity_type: AuditEntityType,
    entity_id: str,
    user_id: str,
    old_data: Any,
    new_data: Any,
    description: Optional[str] = None,
) -> None:
    """Log an audit entry - non-blocking, errors are logged but don't break operations."""
    try:
        audit_log = await audit_storage.read()

        entry = {
            "id": f"audit-{uuid.uuid4()}",
            "action": action.value,
            "entityType": entity_type.value,
            "entityId": entity_id,
            "userId": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "changes": {"old": old_data, "new": new_data},
            "description": description,
        }

        audit_log.append(entry)
        await audit_storage.write(audit_log)
    except Exception as e:
        # Log error but don't raise - audit should not break main operations
        print(f"Failed to write audit log: {e}")
