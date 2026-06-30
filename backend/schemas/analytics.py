from pydantic import BaseModel
from typing import List, Optional


class ReadinessBreakdown(BaseModel):
    skill_score: float
    project_score: float
    resume_score: float
    consistency_score: float


class ReadinessResponse(BaseModel):
    total_score: float
    breakdown: ReadinessBreakdown
    level: str


class SkillProgressItem(BaseModel):
    skill_name: str
    progress: int
    category: str
    level: str = "Beginner"


class AnalyticsSummary(BaseModel):
    readiness: ReadinessResponse
    skill_progress: List[SkillProgressItem]
    total_skills: int
    completed_projects: int
    total_projects: int


class CareerCompareRequest(BaseModel):
    role1: str
    role2: str


class CareerCompareResponse(BaseModel):
    role1: str
    role2: str
    role1_skills: List[str]
    role2_skills: List[str]
    common_skills: List[str]
    overlap_percent: float
    role1_readiness_weeks: float
    role2_readiness_weeks: float


class FeedbackCreate(BaseModel):
    recommendation_type: str
    reference_id: int
    feedback: str


class FeedbackResponse(BaseModel):
    id: int
    recommendation_type: str
    reference_id: int
    feedback: str
    created_at: str

    class Config:
        from_attributes = True
