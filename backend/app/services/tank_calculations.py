from typing import List, Dict, Any

from app.models.common import PropertyValue


def get_effective_volume(movement: Dict[str, Any]) -> float:
    """Get actual volume if available, otherwise expected volume."""
    actual = movement.get("actualVolume")
    return actual if actual is not None else movement["expectedVolume"]


def calculate_blended_properties(
    tank_volume: float,
    tank_properties: List[PropertyValue],
    added_volume: float,
    added_properties: List[PropertyValue],
) -> List[PropertyValue]:
    """Calculate volume-weighted average properties when blending oils."""
    total_volume = tank_volume + added_volume

    if total_volume == 0:
        return added_properties if added_properties else tank_properties

    # Create maps for quick lookup
    tank_props_map: Dict[str, float | None] = {
        p.propertyId: p.value for p in tank_properties
    }
    added_props_map: Dict[str, float | None] = {
        p.propertyId: p.value for p in added_properties
    }

    # Get all unique property IDs
    all_property_ids = set(tank_props_map.keys()) | set(added_props_map.keys())

    blended_properties: List[PropertyValue] = []

    for prop_id in all_property_ids:
        tank_value = tank_props_map.get(prop_id)
        added_value = added_props_map.get(prop_id)

        blended_value: float | None = None

        if tank_value is not None and added_value is not None:
            # Both have values - weighted average
            blended_value = (
                tank_volume * tank_value + added_volume * added_value
            ) / total_volume
        elif tank_value is not None and tank_volume > 0:
            # Only tank has value
            blended_value = (tank_volume * tank_value) / total_volume
        elif added_value is not None and added_volume > 0:
            # Only added has value
            blended_value = (added_volume * added_value) / total_volume

        blended_properties.append(
            PropertyValue(
                propertyId=prop_id,
                value=round(blended_value, 3) if blended_value is not None else None,
            )
        )

    return blended_properties


def calculate_projected_state(
    tank: Dict[str, Any], scheduled_movements: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Calculate projected tank state based on scheduled movements."""
    projected_volume = tank["currentVolume"]
    projected_properties = [PropertyValue(**p) for p in tank["properties"]]

    # Sort movements by scheduled date
    sorted_movements = sorted(scheduled_movements, key=lambda m: m["scheduledDate"])

    for movement in sorted_movements:
        volume = get_effective_volume(movement)
        movement_type = movement["type"]
        movement_props = [PropertyValue(**p) for p in movement.get("properties", [])]

        if movement_type == "receive" and movement.get("destinationTankId") == tank["id"]:
            projected_properties = calculate_blended_properties(
                projected_volume, projected_properties, volume, movement_props
            )
            projected_volume += volume

        elif movement_type == "ship" and movement.get("sourceTankId") == tank["id"]:
            projected_volume = max(0, projected_volume - volume)

        elif movement_type == "transfer":
            if movement.get("sourceTankId") == tank["id"]:
                projected_volume = max(0, projected_volume - volume)
            elif movement.get("destinationTankId") == tank["id"]:
                projected_properties = calculate_blended_properties(
                    projected_volume, projected_properties, volume, movement_props
                )
                projected_volume += volume

    return {
        "volume": round(projected_volume, 3),
        "properties": projected_properties,
    }


def get_volume_change(movement: Dict[str, Any], tank_id: str) -> float:
    """Get signed volume change for a tank from a movement."""
    volume = get_effective_volume(movement)
    movement_type = movement["type"]

    if movement_type == "receive":
        return volume if movement.get("destinationTankId") == tank_id else 0
    elif movement_type == "ship":
        return -volume if movement.get("sourceTankId") == tank_id else 0
    elif movement_type == "transfer":
        if movement.get("sourceTankId") == tank_id:
            return -volume
        if movement.get("destinationTankId") == tank_id:
            return volume
    return 0
