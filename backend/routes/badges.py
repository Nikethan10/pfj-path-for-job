from fastapi import APIRouter, Depends
from database.firebase_db import get_firestore
from utils.jwt_handler import verify_token
from services.badge_service import evaluate_badges

router = APIRouter(prefix="/api/badges", tags=["Achievements & Badges"])


@router.get("")
def get_badges(
    db=Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    """Return the badge catalog with the user's earned/locked state and progress.

    Achievements are re-evaluated from real activity on each call and any newly
    earned badge is persisted server-side (no client-side granting).
    """
    return evaluate_badges(db, uid)
