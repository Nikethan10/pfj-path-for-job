from pydantic import BaseModel
from typing import Optional

class FirebaseTokenRequest(BaseModel):
    id_token: str
    name: Optional[str] = None
    email: Optional[str] = None

class UserResponse(BaseModel):
    uid: str
    name: str
    email: str
    message: str = "Authenticated successfully"
