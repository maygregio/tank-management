import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException

from app.models.tank import Tank, TankCreate, TankUpdate, TankReset
from app.models.common import DEFAULT_PRODUCT, AuditAction, AuditEntityType
from app.services.file_storage import tanks_storage
from app.services.audit_service import log_audit

router = APIRouter(prefix="/tanks", tags=["tanks"])


def get_utc_now() -> str:
    """Get current UTC time in ISO format."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@router.get("", response_model=List[Tank])
async def list_tanks():
    """Get all tanks."""
    return await tanks_storage.read()


@router.post("", response_model=Tank, status_code=201)
async def create_tank(body: TankCreate):
    """Create a new tank."""
    if not body.name or not body.name.strip():
        raise HTTPException(status_code=400, detail="Tank name is required")

    tanks = await tanks_storage.read()

    # Check duplicate names (case-insensitive)
    if any(t["name"].lower() == body.name.strip().lower() for t in tanks):
        raise HTTPException(
            status_code=400, detail="A tank with this name already exists"
        )

    now = get_utc_now()
    new_tank = {
        "id": f"tank-{uuid.uuid4()}",
        "name": body.name.strip(),
        "product": body.product.strip() if body.product else DEFAULT_PRODUCT,
        "location": body.location.strip() if body.location else "",
        "currentVolume": body.currentVolume or 0,
        "properties": [p.model_dump() for p in body.properties],
        "createdAt": now,
        "updatedAt": now,
    }

    tanks.append(new_tank)
    await tanks_storage.write(tanks)

    await log_audit(
        AuditAction.create,
        AuditEntityType.tank,
        new_tank["id"],
        body.userId or "system",
        {},
        new_tank,
    )

    return new_tank


@router.get("/{tank_id}", response_model=Tank)
async def get_tank(tank_id: str):
    """Get a tank by ID."""
    tanks = await tanks_storage.read()
    tank = next((t for t in tanks if t["id"] == tank_id), None)

    if not tank:
        raise HTTPException(status_code=404, detail="Tank not found")

    return tank


@router.patch("/{tank_id}", response_model=Tank)
async def update_tank(tank_id: str, body: TankUpdate):
    """Update a tank."""
    tanks = await tanks_storage.read()
    index = next((i for i, t in enumerate(tanks) if t["id"] == tank_id), None)

    if index is None:
        raise HTTPException(status_code=404, detail="Tank not found")

    old_tank = dict(tanks[index])

    # Apply updates (excluding id, createdAt)
    updates = body.model_dump(exclude_unset=True, exclude={"userId"})
    for key, value in updates.items():
        if key not in ("id", "createdAt"):
            if key == "properties" and value is not None:
                tanks[index][key] = [p.model_dump() if hasattr(p, "model_dump") else p for p in value]
            else:
                tanks[index][key] = value

    tanks[index]["updatedAt"] = get_utc_now()

    await tanks_storage.write(tanks)
    await log_audit(
        AuditAction.update,
        AuditEntityType.tank,
        tank_id,
        body.userId or "system",
        old_tank,
        tanks[index],
    )

    return tanks[index]


@router.post("/{tank_id}/reset", response_model=Tank)
async def reset_tank(tank_id: str, body: TankReset):
    """Reset tank values from PDF measurement."""
    if body.volume < 0:
        raise HTTPException(status_code=400, detail="Valid volume is required")

    tanks = await tanks_storage.read()
    index = next((i for i, t in enumerate(tanks) if t["id"] == tank_id), None)

    if index is None:
        raise HTTPException(status_code=404, detail="Tank not found")

    old_tank = dict(tanks[index])

    tanks[index]["currentVolume"] = body.volume
    tanks[index]["properties"] = [p.model_dump() for p in body.properties]
    tanks[index]["updatedAt"] = get_utc_now()

    await tanks_storage.write(tanks)
    await log_audit(
        AuditAction.reset,
        AuditEntityType.tank,
        tank_id,
        body.userId or "system",
        old_tank,
        tanks[index],
        "Tank values reset from PDF measurement",
    )

    return tanks[index]
