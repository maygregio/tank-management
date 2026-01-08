from typing import Optional
from pydantic import BaseModel


class PropertyDefinitionCreate(BaseModel):
    name: str
    unit: str = ""
    userId: Optional[str] = None


class PropertyDefinitionUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    userId: Optional[str] = None


class PropertyDefinition(BaseModel):
    id: str
    name: str
    unit: str
    createdAt: str

    model_config = {"from_attributes": True}
