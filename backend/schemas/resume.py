from pydantic import BaseModel
from typing import List, Optional


class ResumeAnalysisResponse(BaseModel):
    id: int
    resume_score: float
    ats_score: float
    missing_skills: List[str]
    keyword_matches: List[str]
    suggestions: List[str]
    created_at: str

    class Config:
        from_attributes = True
