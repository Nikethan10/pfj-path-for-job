from fastapi import APIRouter, Depends, HTTPException
from database.firebase_db import get_firestore
from utils.jwt_handler import verify_token
from schemas.profile import ProfileCreate, ProfileUpdate

router = APIRouter(prefix="/api/profile", tags=["Profile"])

@router.post("")
def create_profile(
    data: ProfileCreate,
    uid: str = Depends(verify_token),
):
    db = get_firestore()
    profile_ref = db.collection("users").document(uid).collection("profile").document("main")
    
    existing = profile_ref.get()
    if existing.exists:
        raise HTTPException(status_code=400, detail="Profile already exists")

    profile_data = data.model_dump()
    profile_ref.set(profile_data)

    # Return profile with generated pseudo ID and user ID
    profile_data["id"] = "main"
    profile_data["user_id"] = uid
    return profile_data


@router.get("")
def get_profile(
    uid: str = Depends(verify_token),
):
    db = get_firestore()
    
    # Get Profile Document
    profile_ref = db.collection("users").document(uid).collection("profile").document("main")
    profile_doc = profile_ref.get()
    
    if not profile_doc.exists:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    profile = profile_doc.to_dict()
    
    # Get User Document for Name and Email
    user_doc = db.collection("users").document(uid).get()
    user_data = user_doc.to_dict() if user_doc.exists else {}
    
    return {
        "id": "main",
        "user_id": uid,
        "name": user_data.get("name", ""),
        "email": user_data.get("email", ""),
        "degree": profile.get("degree"),
        "branch": profile.get("branch"),
        "year": profile.get("year"),
        "target_role": profile.get("target_role"),
        "weekly_hours": profile.get("weekly_hours", 10),
    }


@router.put("")
def update_profile(
    data: ProfileUpdate,
    uid: str = Depends(verify_token),
):
    db = get_firestore()
    profile_ref = db.collection("users").document(uid).collection("profile").document("main")
    
    existing = profile_ref.get()
    if not existing.exists:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = data.model_dump(exclude_unset=True)
    profile_ref.update(update_data)
    
    # Return updated profile
    updated_doc = profile_ref.get()
    updated_profile = updated_doc.to_dict()
    updated_profile["id"] = "main"
    updated_profile["user_id"] = uid
    return updated_profile
