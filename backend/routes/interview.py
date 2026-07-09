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
    from services.question_history import get_recent, record

    target_role = get_target_role(db, uid)
    context = f"interview:{data.interview_type}:{target_role}"

    # Avoid both this session's questions (from the client) and the user's recently-served
    # questions from PAST sessions (server memory), so nothing repeats across attempts.
    avoid = list(dict.fromkeys([*(data.previous_questions or []), *get_recent(db, uid, context)]))

    result = generate_interview_question(target_role, avoid, data.interview_type)

    # Remember what we served so it won't come back in the next few attempts.
    if result.get("question"):
        record(db, uid, context, result["question"])

    return result


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
