"""
Admin authorization.

Roles:
- **super_admin** — full control, including managing other admins. Bootstrapped via the
  `SUPER_ADMIN_EMAILS` env var, so at least one super admin always exists.
- **admin** — everything except managing admins; stored in the Firestore `admins/{uid}` collection.

Every admin API depends on `get_admin` (or `require_super_admin`), so authorization is enforced
server-side on each request — hiding the `/admin` URL is convenience, not the security boundary.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from config.settings import get_settings
from database.firebase_db import verify_token as verify_firebase_token, get_firestore

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def _resolve_role(decoded: dict, db) -> str | None:
    settings = get_settings()
    email = (decoded.get("email") or "").lower()
    uid = decoded.get("uid")

    if email and email in settings.super_admin_emails:
        return "super_admin"

    if uid:
        doc = db.collection("admins").document(uid).get()
        if doc.exists:
            return (doc.to_dict() or {}).get("role", "admin")

    return None


def get_admin(token: str = Depends(oauth2_scheme)) -> dict:
    """Verify the caller is an admin and return their identity + role."""
    decoded = verify_firebase_token(token)
    if not decoded or not decoded.get("uid"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    db = get_firestore()
    role = _resolve_role(decoded, db)
    if not role:
        # Do not reveal whether the portal exists; a plain 403 is enough.
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    return {
        "uid": decoded["uid"],
        "email": decoded.get("email"),
        "name": decoded.get("name"),
        "role": role,
    }


def require_super_admin(admin: dict = Depends(get_admin)) -> dict:
    if admin["role"] != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required")
    return admin
