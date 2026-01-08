from enum import Enum
from typing import Optional
from pydantic import BaseModel


class MovementType(str, Enum):
    receive = "receive"
    transfer = "transfer"
    ship = "ship"


class AuditAction(str, Enum):
    create = "create"
    update = "update"
    delete = "delete"
    reset = "reset"


class AuditEntityType(str, Enum):
    tank = "tank"
    movement = "movement"
    property = "property"


class PropertyValue(BaseModel):
    propertyId: str
    value: Optional[float] = None


DEFAULT_PRODUCT = "Carbon Black Oil"
