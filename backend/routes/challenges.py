from fastapi import APIRouter, Depends, HTTPException, Request
from database.firebase_db import get_firestore
from utils.jwt_handler import verify_token
from middleware.security import limiter
from ml.coding_challenges import get_challenges_for_role, get_challenge_by_id, generate_dynamic_challenge
from google.cloud import firestore

router = APIRouter(prefix="/api/challenges", tags=["Coding Challenges"])

@router.get("")
def get_challenges(
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    profile_doc = db.collection("users").document(uid).get()
    role = "Software Engineer"
    if profile_doc.exists:
        role = profile_doc.to_dict().get("target_role", "Software Engineer")
    
    # We strip out the test cases and initial code so we just return the catalog
    challenges = get_challenges_for_role(role)
    catalog = [
        {
            "id": c["id"],
            "title": c["title"],
            "difficulty": c["difficulty"],
            "category": c["category"],
            "description": c["description"],
            "recommended_for": role
        } for c in challenges
    ]
    return catalog

@router.post("/generate")
@limiter.limit("10/minute")
def generate_challenge(
    request: Request,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    profile_doc = db.collection("users").document(uid).get()
    role = "Software Engineer"
    if profile_doc.exists:
        role = profile_doc.to_dict().get("target_role", "Software Engineer")
    
    challenge = generate_dynamic_challenge(role)
    if not challenge:
        raise HTTPException(status_code=500, detail="Failed to generate dynamic challenge")
        
    db.collection("users").document(uid).collection("challenges").add({
        "challenge": challenge,
        "generated_at": firestore.SERVER_TIMESTAMP,
        "status": "pending"
    })
    
    return challenge


@router.get("/{challenge_id}")
def get_challenge_details(
    challenge_id: str,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    challenge = get_challenge_by_id(challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    return challenge

@router.post("/{challenge_id}/complete")
def complete_challenge(
    challenge_id: str,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    # Log the activity
    from services.activity_service import log_activity
    log_activity(db, uid, "coding_challenge", {"challenge_id": challenge_id})
    
    # Store the completed status
    db.collection("users").document(uid).collection("challenges").document(challenge_id).set({
        "status": "completed",
        "completed_at": firestore.SERVER_TIMESTAMP
    }, merge=True)
    
    return {"message": "Challenge marked as complete"}
