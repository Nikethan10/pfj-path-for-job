from fastapi import APIRouter, Depends, HTTPException, Request
from database.firebase_db import get_firestore
from utils.jwt_handler import verify_token
from middleware.security import limiter
from schemas.interview import EvaluationRequest, QuestionRequest
from ml.interview_simulator import generate_interview_question, evaluate_interview_answer
from services.user_service import get_target_role
from google.cloud import firestore

router = APIRouter(prefix="/api/interview", tags=["Interview Simulator"])


@router.post("/question")
@limiter.limit("20/minute")
def get_question(
    request: Request,
    data: QuestionRequest,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    target_role = get_target_role(db, uid)

    # Pass previous_questions and interview_type to generate custom questions
    return generate_interview_question(target_role, data.previous_questions, data.interview_type)


@router.post("/evaluate")
@limiter.limit("20/minute")
def evaluate_answer(
    request: Request,
    data: EvaluationRequest,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    result = evaluate_interview_answer(data.question, data.user_answer, data.expected_keywords)
    
    # Store the interview
    db.collection("users").document(uid).collection("interviews").add({
        "question": data.question,
        "user_answer": data.user_answer,
        "expected_keywords": data.expected_keywords,
        "result": result,
        "created_at": firestore.SERVER_TIMESTAMP
    })
    
    # Log the activity
    from services.activity_service import log_activity
    log_activity(db, uid, "mock_interview_answer", {"score": result.get("score", 0)})
    
    return result
