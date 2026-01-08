import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Query

from app.models.movement import Movement, MovementCreate, MovementUpdate
from app.models.common import MovementType, AuditAction, AuditEntityType, PropertyValue
from app.services.file_storage import movements_storage, tanks_storage
from app.services.tank_calculations import calculate_blended_properties, get_effective_volume
from app.services.audit_service import log_audit

router = APIRouter(prefix="/movements", tags=["movements"])


def get_utc_now() -> str:
    """Get current UTC time in ISO format."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def is_completed(movement: Dict[str, Any]) -> bool:
    """Check if movement is completed (has a date set)."""
    return movement.get("date") is not None


def validate_movement(
    body: MovementCreate, tanks: List[Dict[str, Any]]
) -> List[Dict[str, str]]:
    """Validate movement creation - returns list of validation errors."""
    errors: List[Dict[str, str]] = []

    effective_volume = (
        body.actualVolume if body.actualVolume else body.expectedVolume
    )

    def check_source_capacity() -> None:
        # Only check capacity if movement is completed (date is set)
        if body.date and body.sourceTankId:
            source_tank = next(
                (t for t in tanks if t["id"] == body.sourceTankId), None
            )
            if source_tank and effective_volume > source_tank["currentVolume"]:
                errors.append(
                    {
                        "field": "expectedVolume",
                        "message": f"Insufficient volume. Tank has {source_tank['currentVolume']:.1f} KB, requested {effective_volume:.1f} KB",
                    }
                )

    # Type-specific validation
    if body.type == MovementType.receive:
        if not body.destinationTankId:
            errors.append(
                {
                    "field": "destinationTankId",
                    "message": "Destination tank is required for receives",
                }
            )

    elif body.type == MovementType.ship:
        if not body.sourceTankId:
            errors.append(
                {
                    "field": "sourceTankId",
                    "message": "Source tank is required for shipments",
                }
            )
        check_source_capacity()

    elif body.type == MovementType.transfer:
        if not body.sourceTankId:
            errors.append(
                {
                    "field": "sourceTankId",
                    "message": "Source tank is required for transfers",
                }
            )
        if not body.destinationTankId:
            errors.append(
                {
                    "field": "destinationTankId",
                    "message": "Destination tank is required for transfers",
                }
            )
        if body.sourceTankId and body.sourceTankId == body.destinationTankId:
            errors.append(
                {
                    "field": "destinationTankId",
                    "message": "Source and destination tanks must be different",
                }
            )
        check_source_capacity()

    return errors


async def apply_movement_to_tanks(movement_data: Dict[str, Any]) -> None:
    """Apply completed movement effects to tank volumes/properties."""
    tanks = await tanks_storage.read()
    volume = get_effective_volume(movement_data)
    movement_type = movement_data["type"]
    now = get_utc_now()

    def to_property_values(props: List[Dict[str, Any]]) -> List[PropertyValue]:
        return [PropertyValue(**p) for p in props]

    if movement_type == "receive":
        dest_idx = next(
            (
                i
                for i, t in enumerate(tanks)
                if t["id"] == movement_data["destinationTankId"]
            ),
            None,
        )
        if dest_idx is not None:
            dest_tank = tanks[dest_idx]
            blended = calculate_blended_properties(
                dest_tank["currentVolume"],
                to_property_values(dest_tank["properties"]),
                volume,
                to_property_values(movement_data.get("properties", [])),
            )
            tanks[dest_idx]["properties"] = [p.model_dump() for p in blended]
            tanks[dest_idx]["currentVolume"] += volume
            tanks[dest_idx]["updatedAt"] = now

    elif movement_type == "ship":
        src_idx = next(
            (
                i
                for i, t in enumerate(tanks)
                if t["id"] == movement_data["sourceTankId"]
            ),
            None,
        )
        if src_idx is not None:
            tanks[src_idx]["currentVolume"] = max(
                0, tanks[src_idx]["currentVolume"] - volume
            )
            tanks[src_idx]["updatedAt"] = now

    elif movement_type == "transfer":
        src_idx = next(
            (
                i
                for i, t in enumerate(tanks)
                if t["id"] == movement_data["sourceTankId"]
            ),
            None,
        )
        dest_idx = next(
            (
                i
                for i, t in enumerate(tanks)
                if t["id"] == movement_data["destinationTankId"]
            ),
            None,
        )

        if src_idx is not None:
            src_tank = tanks[src_idx]
            tanks[src_idx]["currentVolume"] = max(
                0, src_tank["currentVolume"] - volume
            )
            tanks[src_idx]["updatedAt"] = now

            if dest_idx is not None:
                dest_tank = tanks[dest_idx]
                transfer_props = (
                    movement_data["properties"]
                    if movement_data.get("properties")
                    else src_tank["properties"]
                )
                blended = calculate_blended_properties(
                    dest_tank["currentVolume"],
                    to_property_values(dest_tank["properties"]),
                    volume,
                    to_property_values(transfer_props),
                )
                tanks[dest_idx]["properties"] = [p.model_dump() for p in blended]
                tanks[dest_idx]["currentVolume"] += volume
                tanks[dest_idx]["updatedAt"] = now

    await tanks_storage.write(tanks)


@router.get("", response_model=List[Movement])
async def list_movements(tankId: Optional[str] = Query(None)):
    """Get all movements, optionally filtered by tank ID."""
    movements = await movements_storage.read()

    if tankId:
        movements = [
            m
            for m in movements
            if m.get("sourceTankId") == tankId
            or m.get("destinationTankId") == tankId
        ]

    # Sort by scheduledDate descending
    movements.sort(key=lambda m: m["scheduledDate"], reverse=True)
    return movements


@router.post("", response_model=Movement, status_code=201)
async def create_movement(body: MovementCreate):
    """Create a new movement."""
    tanks = await tanks_storage.read()

    validation_errors = validate_movement(body, tanks)
    if validation_errors:
        raise HTTPException(
            status_code=400,
            detail={"error": "Validation failed", "details": validation_errors},
        )

    movements = await movements_storage.read()
    now = get_utc_now()

    new_movement = {
        "id": f"mov-{uuid.uuid4()}",
        "type": body.type.value,
        "date": body.date,  # If set, movement is completed
        "scheduledDate": body.scheduledDate or now,
        "expectedVolume": body.expectedVolume,
        "actualVolume": body.actualVolume,
        "sourceTankId": body.sourceTankId,
        "destinationTankId": body.destinationTankId,
        "properties": [p.model_dump() for p in body.properties],
        "carrier": body.carrier,
        "ticketNumber": body.ticketNumber,
        "notes": body.notes,
        "pdfPath": body.pdfPath,
        "createdAt": now,
        "createdBy": body.createdBy or "system",
    }

    movements.append(new_movement)
    await movements_storage.write(movements)

    # Apply to tanks if completed (date is set)
    if is_completed(new_movement):
        await apply_movement_to_tanks(new_movement)

    await log_audit(
        AuditAction.create,
        AuditEntityType.movement,
        new_movement["id"],
        new_movement["createdBy"],
        {},
        new_movement,
    )

    return new_movement


@router.get("/{movement_id}", response_model=Movement)
async def get_movement(movement_id: str):
    """Get a movement by ID."""
    movements = await movements_storage.read()
    movement = next((m for m in movements if m["id"] == movement_id), None)

    if not movement:
        raise HTTPException(status_code=404, detail="Movement not found")

    return movement


@router.patch("/{movement_id}", response_model=Movement)
async def update_movement(movement_id: str, body: MovementUpdate):
    """Update a movement."""
    movements = await movements_storage.read()
    index = next(
        (i for i, m in enumerate(movements) if m["id"] == movement_id), None
    )

    if index is None:
        raise HTTPException(status_code=404, detail="Movement not found")

    current = movements[index]
    was_completed = is_completed(current)
    old_movement = dict(current)

    # Apply updates
    updates = body.model_dump(exclude_unset=True, exclude={"userId"})
    for key, value in updates.items():
        if key not in ("id", "createdAt", "createdBy"):
            if key == "properties" and value is not None:
                movements[index][key] = [p.model_dump() if hasattr(p, "model_dump") else p for p in value]
            else:
                movements[index][key] = value

    await movements_storage.write(movements)

    # Apply to tanks if movement is now completed (date was just set)
    if not was_completed and is_completed(movements[index]):
        await apply_movement_to_tanks(movements[index])

    await log_audit(
        AuditAction.update,
        AuditEntityType.movement,
        movement_id,
        body.userId or "system",
        old_movement,
        movements[index],
    )

    return movements[index]


@router.delete("/{movement_id}")
async def delete_movement(movement_id: str):
    """Delete a movement."""
    movements = await movements_storage.read()
    index = next(
        (i for i, m in enumerate(movements) if m["id"] == movement_id), None
    )

    if index is None:
        raise HTTPException(status_code=404, detail="Movement not found")

    deleted = movements.pop(index)
    await movements_storage.write(movements)

    await log_audit(
        AuditAction.delete,
        AuditEntityType.movement,
        movement_id,
        "system",
        deleted,
        {},
    )

    return {"success": True}
