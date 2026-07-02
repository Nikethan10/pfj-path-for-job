from fastapi import APIRouter, Depends, HTTPException
from database.firebase_db import get_firestore
from utils.jwt_handler import verify_token
from schemas.skill import SkillAdd, SkillUpdate, SkillBulkAdd

router = APIRouter(prefix="/api/skills", tags=["Skills"])


@router.get("/available")
def get_all_skills(
    role: str = None,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    skills_ref = db.collection("skills")
    if role:
        docs = skills_ref.where("roles", "array_contains", role).stream()
    else:
        docs = skills_ref.stream()
        
    result = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        result.append(data)
    return result


@router.get("")
def get_student_skills(
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    skills_ref = db.collection("users").document(uid).collection("skills")
    docs = skills_ref.stream()
    result = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        result.append(data)
    return result


@router.post("")
def add_skill(
    data: SkillAdd,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    skills_ref = db.collection("skills").where("skill_name", "==", data.skill_name).limit(1).stream()
    skill_doc_data = None
    skill_id = None
    for s in skills_ref:
        skill_doc_data = s.to_dict()
        skill_id = s.id
        
    if not skill_doc_data:
        # Instead of failing, just add it as a custom skill
        skill_doc_data = {
            "skill_name": data.skill_name,
            "category": "Custom"
        }
        skill_id = data.skill_name.lower().replace(" ", "-")

    user_skill_ref = db.collection("users").document(uid).collection("skills").document(data.skill_name)
    if user_skill_ref.get().exists:
        raise HTTPException(status_code=400, detail="Skill already added")

    skill_data = {
        "skill_id": skill_id,
        "skill_name": skill_doc_data.get("skill_name", data.skill_name),
        "category": skill_doc_data.get("category", ""),
        "level": data.level,
        "progress_percent": data.progress_percent,
    }
    user_skill_ref.set(skill_data)

    from services.activity_service import log_activity
    log_activity(db, uid, "add_skill", {"skill_id": data.skill_name, "skill_name": data.skill_name})

    skill_data["id"] = data.skill_name
    return skill_data


@router.post("/bulk")
def add_skills_bulk(
    data: SkillBulkAdd,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    added_skills = []
    skipped_skills = []
    
    user_skills_ref = db.collection("users").document(uid).collection("skills")
    
    for item in data.skills:
        skills_ref = db.collection("skills").where("skill_name", "==", item.skill_name).limit(1).stream()
        skill_doc_data = None
        skill_id = None
        for s in skills_ref:
            skill_doc_data = s.to_dict()
            skill_id = s.id
        
        if not skill_doc_data:
            skill_doc_data = {
                "skill_name": item.skill_name,
                "category": "Custom"
            }
            skill_id = item.skill_name.lower().replace(" ", "-")
            
        user_skill_doc = user_skills_ref.document(item.skill_name)
        if user_skill_doc.get().exists:
            skipped_skills.append({"skill_name": item.skill_name, "reason": "Already added"})
            continue
            
        skill_data = {
            "skill_id": skill_id,
            "skill_name": skill_doc_data.get("skill_name", item.skill_name),
            "category": skill_doc_data.get("category", ""),
            "level": item.level,
            "progress_percent": item.progress_percent
        }
        user_skill_doc.set(skill_data)
        
        skill_data["id"] = item.skill_name
        added_skills.append(skill_data)
        
    if added_skills:
        from services.activity_service import log_activity
        log_activity(db, uid, "bulk_add_skills", {"count": len(added_skills)})
        
    return {
        "message": f"Successfully added {len(added_skills)} skills.",
        "added": added_skills,
        "skipped": skipped_skills
    }


@router.put("/{skill_name}")
def update_skill(
    skill_name: str, data: SkillUpdate,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    user_skill_ref = db.collection("users").document(uid).collection("skills").document(skill_name)
    doc = user_skill_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Skill not found in your profile")
        
    updates = {}
    if data.level is not None:
        updates["level"] = data.level
    if data.progress_percent is not None:
        updates["progress_percent"] = data.progress_percent
        
    if updates:
        user_skill_ref.update(updates)
        
    updated_doc = user_skill_ref.get()
    result = updated_doc.to_dict()
    result["id"] = updated_doc.id
    return result


@router.delete("/{skill_name}")
def remove_skill(
    skill_name: str,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    user_skill_ref = db.collection("users").document(uid).collection("skills").document(skill_name)
    if not user_skill_ref.get().exists:
        raise HTTPException(status_code=404, detail="Skill not found in your profile")
        
    user_skill_ref.delete()
    
    from services.activity_service import log_activity
    log_activity(db, uid, "delete_skill", {"skill_id": skill_name})
    
    return {"message": "Skill removed successfully"}


@router.get("/roles")
def get_available_roles(
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    skills_ref = db.collection("skills").stream()
    roles = set()
    for s in skills_ref:
        data = s.to_dict()
        if "roles" in data:
            for r in data["roles"]:
                roles.add(r)
    return list(roles)
