from pydantic import BaseModel
from typing import Optional, List


class SkillAdd(BaseModel):
    skill_name: str
    level: str = "Beginner"
    progress_percent: int = 0


class SkillUpdate(BaseModel):
    level: Optional[str] = None
    progress_percent: Optional[int] = None


class SkillBulkAdd(BaseModel):
    skills: List[SkillAdd]


class StudentSkillResponse(BaseModel):
    id: int
    skill_id: int
    skill_name: str
    category: str
    level: str
    progress_percent: int

    class Config:
        from_attributes = True


class SkillResponse(BaseModel):
    id: int
    skill_name: str
    category: str
    difficulty_weight: float

    class Config:
        from_attributes = True


class SkillGapResponse(BaseModel):
    skill_name: str
    importance: float
    category: str
    explanation: str
