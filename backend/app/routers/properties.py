import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException

from app.models.property import PropertyDefinition, PropertyDefinitionCreate, PropertyDefinitionUpdate
from app.models.common import AuditAction, AuditEntityType
from app.services.file_storage import properties_storage
from app.services.audit_service import log_audit

router = APIRouter(prefix="/properties", tags=["properties"])


def get_utc_now() -> str:
    """Get current UTC time in ISO format."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@router.get("", response_model=List[PropertyDefinition])
async def list_properties():
    """Get all property definitions."""
    return await properties_storage.read()


@router.post("", response_model=PropertyDefinition, status_code=201)
async def create_property(body: PropertyDefinitionCreate):
    """Create a new property definition."""
    if not body.name or not body.name.strip():
        raise HTTPException(status_code=400, detail="Property name is required")

    properties = await properties_storage.read()

    # Check duplicate names (case-insensitive)
    if any(p["name"].lower() == body.name.strip().lower() for p in properties):
        raise HTTPException(
            status_code=400, detail="A property with this name already exists"
        )

    new_property = {
        "id": f"prop-{uuid.uuid4()}",
        "name": body.name.strip(),
        "unit": body.unit.strip() if body.unit else "",
        "createdAt": get_utc_now(),
    }

    properties.append(new_property)
    await properties_storage.write(properties)

    await log_audit(
        AuditAction.create,
        AuditEntityType.property,
        new_property["id"],
        body.userId or "system",
        {},
        new_property,
    )

    return new_property


@router.patch("/{property_id}", response_model=PropertyDefinition)
async def update_property(property_id: str, body: PropertyDefinitionUpdate):
    """Update a property definition."""
    properties = await properties_storage.read()
    index = next(
        (i for i, p in enumerate(properties) if p["id"] == property_id), None
    )

    if index is None:
        raise HTTPException(status_code=404, detail="Property not found")

    # Check duplicate name if changing
    if body.name:
        duplicate = next(
            (
                p
                for p in properties
                if p["id"] != property_id
                and p["name"].lower() == body.name.strip().lower()
            ),
            None,
        )
        if duplicate:
            raise HTTPException(
                status_code=400, detail="A property with this name already exists"
            )

    old_property = dict(properties[index])

    if body.name:
        properties[index]["name"] = body.name.strip()
    if body.unit is not None:
        properties[index]["unit"] = body.unit.strip()

    await properties_storage.write(properties)
    await log_audit(
        AuditAction.update,
        AuditEntityType.property,
        property_id,
        body.userId or "system",
        old_property,
        properties[index],
    )

    return properties[index]


@router.delete("/{property_id}")
async def delete_property(property_id: str):
    """Delete a property definition."""
    properties = await properties_storage.read()
    index = next(
        (i for i, p in enumerate(properties) if p["id"] == property_id), None
    )

    if index is None:
        raise HTTPException(status_code=404, detail="Property not found")

    deleted = properties.pop(index)
    await properties_storage.write(properties)

    await log_audit(
        AuditAction.delete,
        AuditEntityType.property,
        property_id,
        "system",
        deleted,
        {},
    )

    return {"success": True}
