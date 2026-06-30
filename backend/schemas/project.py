from pydantic import BaseModel
from typing import List, Optional


class ProjectResponse(BaseModel):
    id: int
    project_name: str
    domain: str
    difficulty: str
    description: str
    skills: List[str]
    match_score: Optional[float] = None
    explanation: Optional[str] = None
    status: str = "Not Started"

    class Config:
        from_attributes = True


class ProjectStatusUpdate(BaseModel):
    status: str


class StudentProjectResponse(BaseModel):
    project_id: int
    project_name: str
    domain: str
    difficulty: str
    status: str

    class Config:
        from_attributes = True
