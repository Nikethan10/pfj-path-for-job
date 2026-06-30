from pydantic import BaseModel
from typing import List, Optional


class RoadmapGenerate(BaseModel):
    target_role: Optional[str] = None


class RoadmapItemResponse(BaseModel):
    id: int = 0
    skill_name: str
    category: str
    priority_order: int
    estimated_weeks: float
    status: str
    explanation: Optional[str] = None

    class Config:
        from_attributes = True


class RoadmapStatusUpdate(BaseModel):
    status: str


class RoadmapResponse(BaseModel):
    target_role: str
    total_weeks: float
    items: List[RoadmapItemResponse]
