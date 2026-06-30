from fastapi import APIRouter, Depends
from database.firebase_db import get_firestore
from utils.jwt_handler import verify_token
from schemas.analytics import FeedbackCreate
from datetime import datetime

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])

@router.post("")
def submit_feedback(
    data: FeedbackCreate,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    feedback_data = {
        "recommendation_type": data.recommendation_type,
        "reference_id": data.reference_id,
        "feedback": data.feedback,
        "created_at": datetime.utcnow().isoformat()
    }
    
    activity_ref = db.collection("users").document(uid).collection("activity").document()
    activity_ref.set({
        "type": "feedback",
        **feedback_data
    })
    
    return {"id": activity_ref.id, "message": "Feedback submitted successfully"}

@router.get("")
def get_feedback(
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    activities = db.collection("users").document(uid).collection("activity").where(
        "type", "==", "feedback"
    ).get()
    
    feedbacks = [doc.to_dict() | {"id": doc.id} for doc in activities]
    feedbacks.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return [
        {
            "id": f.get("id"),
            "recommendation_type": f.get("recommendation_type"),
            "reference_id": f.get("reference_id"),
            "feedback": f.get("feedback"),
            "created_at": f.get("created_at"),
        }
        for f in feedbacks
    ]
