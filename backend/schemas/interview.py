from pydantic import BaseModel
from typing import List

class QuestionRequest(BaseModel):
    previous_questions: List[str] = []
    interview_type: str = "technical"

class EvaluationRequest(BaseModel):
    question: str
    user_answer: str
    expected_keywords: List[str]
