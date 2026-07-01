"""
Admin CMS API. Every endpoint is authorized server-side via `get_admin` / `require_super_admin`.
Destructive or privilege actions require super admin. All mutations are written to the audit log.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Union
from firebase_admin import auth as fb_auth

from database.firebase_db import get_firestore
from config.settings import get_settings
from utils.admin_auth import get_admin, require_super_admin
from services.config_service import (
    get_site_config,
    update_config_section,
    log_audit,
    get_audit_logs,
    ALLOWED_SECTIONS,
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class ConfigUpdate(BaseModel):
    values: Union[dict, list]


class AdminCreate(BaseModel):
    email: Optional[str] = None
    uid: Optional[str] = None
    role: str = "admin"


# ── Identity ──
@router.get("/me")
def admin_me(admin=Depends(get_admin)):
    return admin


# ── Site configuration ──
@router.get("/config")
def admin_get_config(admin=Depends(get_admin), db=Depends(get_firestore)):
    return get_site_config(db)


@router.put("/config/{section}")
def admin_update_config(section: str, body: ConfigUpdate, admin=Depends(get_admin), db=Depends(get_firestore)):
    if section not in ALLOWED_SECTIONS:
        raise HTTPException(status_code=400, detail="Invalid config section")
    try:
        updated = update_config_section(db, section, body.values)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    log_audit(db, admin, f"update_config:{section}")
    return updated


# ── Dashboard stats ──
@router.get("/stats")
def admin_stats(admin=Depends(get_admin), db=Depends(get_firestore)):
    users = list(db.collection("users").get())
    return {
        "total_users": len(users),
        "banned_users": sum(1 for u in users if (u.to_dict() or {}).get("banned")),
        "total_admins": len(list(db.collection("admins").get())) + len(get_settings().super_admin_emails),
    }


# ── User management ──
@router.get("/users")
def list_users(q: Optional[str] = None, admin=Depends(get_admin), db=Depends(get_firestore)):
    users = []
    for d in db.collection("users").limit(1000).get():
        data = d.to_dict() or {}
        users.append({
            "uid": d.id,
            "name": data.get("name"),
            "email": data.get("email"),
            "banned": data.get("banned", False),
            "created_at": data.get("created_at"),
            "last_login": data.get("last_login"),
        })
    if q:
        ql = q.lower()
        users = [u for u in users if ql in (u.get("email") or "").lower() or ql in (u.get("name") or "").lower()]
    return users


@router.post("/users/{uid}/ban")
def ban_user(uid: str, admin=Depends(get_admin), db=Depends(get_firestore)):
    db.collection("users").document(uid).set({"banned": True}, merge=True)
    try:
        fb_auth.update_user(uid, disabled=True)  # blocks future logins
    except Exception:
        pass
    log_audit(db, admin, "ban_user", {"uid": uid})
    return {"ok": True}


@router.post("/users/{uid}/unban")
def unban_user(uid: str, admin=Depends(get_admin), db=Depends(get_firestore)):
    db.collection("users").document(uid).set({"banned": False}, merge=True)
    try:
        fb_auth.update_user(uid, disabled=False)
    except Exception:
        pass
    log_audit(db, admin, "unban_user", {"uid": uid})
    return {"ok": True}


@router.delete("/users/{uid}")
def delete_user(uid: str, admin=Depends(require_super_admin), db=Depends(get_firestore)):
    try:
        fb_auth.delete_user(uid)
    except Exception:
        pass
    db.collection("users").document(uid).delete()
    log_audit(db, admin, "delete_user", {"uid": uid})
    return {"ok": True}


# ── Admin management (super admin only) ──
@router.get("/admins")
def list_admins(admin=Depends(require_super_admin), db=Depends(get_firestore)):
    result = [{"uid": d.id, **(d.to_dict() or {}), "source": "firestore"} for d in db.collection("admins").get()]
    for email in get_settings().super_admin_emails:
        result.append({"uid": None, "email": email, "role": "super_admin", "source": "env"})
    return result


@router.post("/admins")
def add_admin(body: AdminCreate, admin=Depends(require_super_admin), db=Depends(get_firestore)):
    uid = body.uid
    if not uid and body.email:
        try:
            uid = fb_auth.get_user_by_email(body.email).uid
        except Exception:
            raise HTTPException(status_code=404, detail="No user found with that email")
    if not uid:
        raise HTTPException(status_code=400, detail="Provide a uid or an email of an existing user")
    role = body.role if body.role in ("admin", "super_admin") else "admin"
    db.collection("admins").document(uid).set({"role": role, "email": body.email})
    log_audit(db, admin, "add_admin", {"uid": uid, "role": role})
    return {"ok": True, "uid": uid, "role": role}


@router.delete("/admins/{uid}")
def remove_admin(uid: str, admin=Depends(require_super_admin), db=Depends(get_firestore)):
    db.collection("admins").document(uid).delete()
    log_audit(db, admin, "remove_admin", {"uid": uid})
    return {"ok": True}


# ── Audit log ──
@router.get("/audit")
def audit(admin=Depends(get_admin), db=Depends(get_firestore)):
    return get_audit_logs(db, 100)
