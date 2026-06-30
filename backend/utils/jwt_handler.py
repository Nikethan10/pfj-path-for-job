from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from database.firebase_db import verify_token as verify_firebase_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_token(token: str = Depends(oauth2_scheme)) -> str:
    """
    Verifies a Firebase ID token.
    Returns the user's Firebase UID (string).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired Firebase token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    decoded_token = verify_firebase_token(token)
    if not decoded_token:
        raise credentials_exception
        
    uid = decoded_token.get("uid")
    if not uid:
        raise credentials_exception
        
    return uid
