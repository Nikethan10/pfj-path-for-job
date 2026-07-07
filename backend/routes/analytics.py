from fastapi import APIRouter, Depends
from database.firebase_db import get_firestore
from utils.jwt_handler import verify_token
from schemas.analytics import CareerCompareRequest
from datetime import datetime

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

def calculate_readiness(db, uid: str):
    skills = db.collection("users").document(uid).collection("skills").get()
    projects = db.collection("users").document(uid).collection("projects").get()
    resumes = db.collection("users").document(uid).collection("resumes").get()

    skill_score = min(len(skills) / 10.0, 1.0)
    project_score = min(len(projects) / 3.0, 1.0)
    resume_score = 1.0 if len(resumes) > 0 else 0.0

    total_score = int((skill_score * 40) + (project_score * 40) + (resume_score * 20))
    level = "Beginner"
    if total_score > 80:
        level = "Advanced"
    elif total_score > 50:
        level = "Intermediate"

    return {
        "total_score": total_score,
        "level": level,
        "skill_score": skill_score,
        "project_score": project_score,
        "resume_score": resume_score
    }

@router.get("/readiness")
def readiness(
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    return calculate_readiness(db, uid)

@router.get("/summary")
def summary(
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    skills = db.collection("users").document(uid).collection("skills").get()
    projects = db.collection("users").document(uid).collection("projects").get()
    return {
        "total_skills": len(skills),
        "total_projects": len(projects),
        "readiness": calculate_readiness(db, uid)
    }

@router.post("/compare")
def compare(
    data: CareerCompareRequest,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    """Compare two career roles by the skills each requires (from the skills catalog).

    Overlap is the Jaccard similarity of the two roles' required-skill sets, and we
    report how much of each role the user already covers.
    """
    def skills_for_role(role: str) -> set:
        docs = db.collection("skills").where("roles", "array_contains", role).stream()
        return {d.to_dict().get("skill_name") for d in docs if d.to_dict().get("skill_name")}

    role1_skills = skills_for_role(data.role1)
    role2_skills = skills_for_role(data.role2)

    shared = sorted(role1_skills & role2_skills)
    union = role1_skills | role2_skills
    overlap_percentage = round((len(shared) / len(union)) * 100, 1) if union else 0.0

    user_skills = {
        d.to_dict().get("skill_name")
        for d in db.collection("users").document(uid).collection("skills").get()
        if d.to_dict().get("skill_name")
    }

    def coverage(role_skills: set) -> float:
        return round((len(user_skills & role_skills) / len(role_skills)) * 100, 1) if role_skills else 0.0

    return {
        "role1": data.role1,
        "role2": data.role2,
        "overlap_percentage": overlap_percentage,
        "shared_skills": shared,
        "role1_only": sorted(role1_skills - role2_skills),
        "role2_only": sorted(role2_skills - role1_skills),
        "user_skills_present": sorted(user_skills),
        "role1_user_coverage": coverage(role1_skills),
        "role2_user_coverage": coverage(role2_skills),
    }

@router.get("/activity")
def get_activity(
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    from services.activity_service import timestamp_to_date

    activities = db.collection("users").document(uid).collection("activity").order_by(
        "timestamp", direction="DESCENDING"
    ).limit(200).get()

    heatmap = {}
    for act in activities:
        date_str = timestamp_to_date(act.to_dict().get("timestamp"))
        if date_str:
            heatmap[date_str] = heatmap.get(date_str, 0) + 1

    return heatmap
