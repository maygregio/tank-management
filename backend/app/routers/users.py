from typing import List

from fastapi import APIRouter

from app.models.user import User
from app.services.file_storage import users_storage

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[User])
async def list_users():
    """Get all users."""
    return await users_storage.read()
