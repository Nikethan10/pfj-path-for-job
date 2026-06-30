from fastapi import APIRouter, Depends
from database.firebase_db import get_firestore
from utils.jwt_handler import verify_token
from ml.job_matcher import calculate_job_matches

router = APIRouter(prefix="/api/jobs", tags=["Job Matcher"])

@router.get("")
def get_jobs(
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    # Fetch user's current skills from Firestore
    skills_ref = db.collection("users").document(uid).collection("skills")
    docs = skills_ref.stream()
    
    user_skills_dict = {}
    user_skills = []
    
    for doc in docs:
        data = doc.to_dict()
        skill_name = data.get("skill_name", doc.id)
        user_skills.append(skill_name)
        user_skills_dict[skill_name] = {
            "level": data.get("level"),
            "progress": data.get("progress_percent")
        }
    
    # Calculate matches against the simulated job database
    matched_jobs = calculate_job_matches(user_skills_dict)
    
    return {"jobs": matched_jobs, "user_skills": user_skills}
