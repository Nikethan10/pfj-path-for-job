from pydantic import BaseModel
from typing import Optional


class ProfileCreate(BaseModel):
    degree: str
    branch: str
    year: int
    target_role: str
    weekly_hours: int = 10


class ProfileUpdate(BaseModel):
    degree: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[int] = None
    target_role: Optional[str] = None
    weekly_hours: Optional[int] = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    degree: str
    branch: str
    year: int
    target_role: str
    weekly_hours: int

    class Config:
        from_attributes = True
