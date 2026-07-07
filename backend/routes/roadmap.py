from fastapi import APIRouter, Depends, HTTPException
from database.firebase_db import get_firestore
from utils.jwt_handler import verify_token
from schemas.roadmap import RoadmapGenerate, RoadmapStatusUpdate
from services.roadmap_service import generate_user_roadmap, get_user_roadmap, update_roadmap_status
from pydantic import BaseModel
import math
import secrets
from datetime import datetime, timezone

router = APIRouter(prefix="/api/roadmap", tags=["Roadmap"])

class QuizGenerateRequest(BaseModel):
    skill_name: str

class QuizSubmitRequest(BaseModel):
    roadmap_item_id: str
    session_id: str
    user_answers: list[int]


@router.post("/generate")
def generate_roadmap(
    data: RoadmapGenerate,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    return generate_user_roadmap(db, uid, data.target_role)


@router.get("")
def get_roadmap(
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    return get_user_roadmap(db, uid)


@router.put("/{roadmap_id}")
def update_status(
    roadmap_id: str,
    data: RoadmapStatusUpdate,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    from services.activity_service import log_activity
    if data.status == "Completed":
        log_activity(db, uid, "complete_roadmap_item", {"roadmap_id": roadmap_id})
    return update_roadmap_status(db, uid, roadmap_id, data.status)


@router.post("/quiz/generate")
def get_quiz(
    data: QuizGenerateRequest,
    db=Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    """Generate a quiz. The answer key is stored server-side and never sent to the client."""
    from services.ai_service import generate_skill_quiz
    quiz = generate_skill_quiz(data.skill_name)

    correct_indices = [q["correct_idx"] for q in quiz["questions"]]
    session_id = secrets.token_urlsafe(24)

    # Persist the answer key server-side, scoped to this user. Consumed on submit.
    db.collection("users").document(uid).collection("quiz_sessions").document(session_id).set({
        "skill_name": data.skill_name,
        "correct_indices": correct_indices,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    client_questions = [
        {"id": idx, "question": q["question"], "options": q["options"]}
        for idx, q in enumerate(quiz["questions"])
    ]
    return {"questions": client_questions, "session_id": session_id}


@router.post("/quiz/submit")
def submit_quiz(
    data: QuizSubmitRequest,
    db=Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    session_ref = (
        db.collection("users").document(uid)
        .collection("quiz_sessions").document(data.session_id)
    )
    session = session_ref.get()
    if not session.exists:
        raise HTTPException(status_code=400, detail="Invalid or expired quiz session")

    correct_indices = (session.to_dict() or {}).get("correct_indices", [])
    if not correct_indices or len(correct_indices) != len(data.user_answers):
        session_ref.delete()
        raise HTTPException(status_code=400, detail="Invalid quiz submission")

    score = sum(1 for u, c in zip(data.user_answers, correct_indices) if u == c)
    # Pass at ~two-thirds correct, scaled to however many questions were served
    # (the AI fallback can return fewer than 3).
    passed = score >= max(1, math.ceil(len(correct_indices) * 2 / 3))

    # One-time use: consume the session regardless of outcome.
    session_ref.delete()

    if passed:
        update_roadmap_status(db, uid, data.roadmap_item_id, "Completed")

    return {"score": score, "total": len(correct_indices), "passed": passed}
