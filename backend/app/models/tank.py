from typing import List, Optional
from pydantic import BaseModel

from .common import PropertyValue, DEFAULT_PRODUCT


class TankBase(BaseModel):
    name: str
    product: str = DEFAULT_PRODUCT
    location: str = ""


class TankCreate(TankBase):
    currentVolume: float = 0.0
    properties: List[PropertyValue] = []
    userId: Optional[str] = None


class TankUpdate(BaseModel):
    name: Optional[str] = None
    product: Optional[str] = None
    location: Optional[str] = None
    currentVolume: Optional[float] = None
    properties: Optional[List[PropertyValue]] = None
    userId: Optional[str] = None


class TankReset(BaseModel):
    volume: float
    properties: List[PropertyValue]
    userId: Optional[str] = None


class Tank(TankBase):
    id: str
    currentVolume: float
    properties: List[PropertyValue]
    createdAt: str
    updatedAt: str

    model_config = {"from_attributes": True}
