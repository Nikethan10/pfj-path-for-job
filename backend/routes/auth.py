from fastapi import APIRouter, HTTPException, Depends, Request
from schemas.auth import FirebaseTokenRequest, UserResponse
from database.firebase_db import verify_token, get_firestore
from middleware.security import limiter
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/verify", response_model=UserResponse)
@limiter.limit("30/minute")
def verify_firebase_token(request: Request, data: FirebaseTokenRequest):
    """
    Verifies a Firebase ID token sent from the frontend.
    If valid, logs the user in and ensures they exist in Firestore.
    """
    decoded_token = verify_token(data.id_token)
    if not decoded_token:
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase token")
        
    uid = decoded_token.get("uid")
    email = decoded_token.get("email") or data.email
    name = decoded_token.get("name") or data.name or "User"
    
    if not uid:
        raise HTTPException(status_code=400, detail="Token does not contain a valid UID")
        
    db = get_firestore()
    user_ref = db.collection("users").document(uid)
    
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        # Create new user in Firestore
        user_ref.set({
            "uid": uid,
            "email": email,
            "name": name,
            "created_at": datetime.utcnow().isoformat(),
            "last_login": datetime.utcnow().isoformat()
        })
    else:
        # Update last login
        user_ref.update({
            "last_login": datetime.utcnow().isoformat()
        })
        
    return UserResponse(
        uid=uid,
        name=name,
        email=email,
        message="Authenticated successfully via Firebase"
    )
