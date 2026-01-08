from typing import List, Optional
from pydantic import BaseModel, field_validator

from .common import MovementType, PropertyValue


class MovementCreate(BaseModel):
    type: MovementType
    date: Optional[str] = None  # If set, movement is completed; if null, it's scheduled
    scheduledDate: Optional[str] = None
    expectedVolume: float
    actualVolume: Optional[float] = None
    sourceTankId: Optional[str] = None
    destinationTankId: Optional[str] = None
    properties: List[PropertyValue] = []
    carrier: Optional[str] = None
    ticketNumber: Optional[str] = None
    notes: Optional[str] = None
    pdfPath: Optional[str] = None
    createdBy: Optional[str] = None

    @field_validator("expectedVolume")
    @classmethod
    def validate_expected_volume(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Expected volume must be greater than 0")
        return v

    @field_validator("actualVolume")
    @classmethod
    def validate_actual_volume(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("Actual volume must be greater than 0")
        return v


class MovementUpdate(BaseModel):
    date: Optional[str] = None
    scheduledDate: Optional[str] = None
    expectedVolume: Optional[float] = None
    actualVolume: Optional[float] = None
    sourceTankId: Optional[str] = None
    destinationTankId: Optional[str] = None
    properties: Optional[List[PropertyValue]] = None
    carrier: Optional[str] = None
    ticketNumber: Optional[str] = None
    notes: Optional[str] = None
    pdfPath: Optional[str] = None
    userId: Optional[str] = None

    @field_validator("expectedVolume")
    @classmethod
    def validate_expected_volume(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("Expected volume must be greater than 0")
        return v

    @field_validator("actualVolume")
    @classmethod
    def validate_actual_volume(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("Actual volume must be greater than 0")
        return v


class Movement(BaseModel):
    id: str
    type: MovementType
    date: Optional[str]  # If set, movement is completed; if null, it's scheduled
    scheduledDate: str
    expectedVolume: float
    actualVolume: Optional[float] = None
    sourceTankId: Optional[str]
    destinationTankId: Optional[str]
    properties: List[PropertyValue]
    carrier: Optional[str] = None
    ticketNumber: Optional[str] = None
    notes: Optional[str] = None
    pdfPath: Optional[str] = None
    createdAt: str
    createdBy: str

    model_config = {"from_attributes": True}


def get_effective_volume(movement: Movement) -> float:
    """Get actual volume if available, otherwise expected volume."""
    return movement.actualVolume if movement.actualVolume is not None else movement.expectedVolume
