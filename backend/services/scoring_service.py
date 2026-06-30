from datetime import datetime, timedelta
from ml.readiness_scorer import calculate_readiness

def get_readiness_score(db, uid: str) -> dict:
    profile_doc = db.collection("users").document(uid).get()
    profile = profile_doc.to_dict() if profile_doc.exists else {}
    target_role = profile.get("target_role", "Software Engineer")

    required_docs = db.collection("career_skills").where("role", "==", target_role).stream()
    required_ids = {doc.to_dict().get("skill_id") for doc in required_docs if doc.to_dict().get("skill_id")}

    user_skills_docs = db.collection("users").document(uid).collection("skills").stream()
    user_ids = {doc.to_dict().get("skill_id") or doc.id for doc in user_skills_docs}
    skill_coverage = len(required_ids & user_ids) / len(required_ids) if required_ids else 0

    student_projects_docs = list(db.collection("users").document(uid).collection("projects").stream())
    completed = sum(1 for p in student_projects_docs if p.to_dict().get("status") == "Completed")
    project_completion = completed / max(len(student_projects_docs), 1)

    latest_resume = None
    resumes = db.collection("users").document(uid).collection("resumes").order_by("created_at", direction="DESCENDING").limit(1).stream()
    for doc in resumes:
        latest_resume = doc.to_dict()
        break
    
    resume_score = latest_resume.get("resume_score", 0) if latest_resume else 0

    thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
    recent_activities = db.collection("users").document(uid).collection("activities").where("created_at", ">=", thirty_days_ago).stream()

    active_days = set()
    for act in recent_activities:
        act_data = act.to_dict()
        created_at = act_data.get("created_at")
        if created_at:
            active_days.add(created_at[:10])

    consistency = min(len(active_days) / 15.0, 1.0)

    return calculate_readiness(skill_coverage, project_completion, resume_score, consistency)


def get_skill_progress(db, uid: str) -> list:
    user_skills_docs = db.collection("users").document(uid).collection("skills").stream()
    progress = []
    for doc in user_skills_docs:
        us = doc.to_dict()
        skill_id = us.get("skill_id") or doc.id
        if not skill_id:
            continue
        skill_doc = db.collection("skills").document(skill_id).get()
        if skill_doc.exists:
            skill = skill_doc.to_dict()
            progress.append({
                "skill_name": skill.get("skill_name"),
                "progress": us.get("progress_percent", 0),
                "category": skill.get("category"),
                "level": us.get("level")
            })
    return progress

def get_analytics_summary(db, uid: str) -> dict:
    readiness = get_readiness_score(db, uid)
    skill_progress = get_skill_progress(db, uid)
    
    student_projects_docs = list(db.collection("users").document(uid).collection("projects").stream())
    completed = sum(1 for sp in student_projects_docs if sp.to_dict().get("status") == "Completed")
    
    return {
        "readiness": readiness, "skill_progress": skill_progress,
        "total_skills": len(skill_progress),
        "completed_projects": completed, "total_projects": len(student_projects_docs),
    }

def compare_careers(db, uid: str, role1: str, role2: str) -> dict:
    cs1_docs = list(db.collection("career_skills").where("role", "==", role1).stream())
    cs2_docs = list(db.collection("career_skills").where("role", "==", role2).stream())

    def get_names(cs_docs):
        names = []
        for doc in cs_docs:
            skill_id = doc.to_dict().get("skill_id")
            if skill_id:
                skill_doc = db.collection("skills").document(skill_id).get()
                if skill_doc.exists:
                    names.append(skill_doc.to_dict().get("skill_name"))
        return names

    r1_skills = get_names(cs1_docs)
    r2_skills = get_names(cs2_docs)
    r1_set = set(r1_skills)
    r2_set = set(r2_skills)
    common = r1_set & r2_set
    union = r1_set | r2_set
    overlap = round(len(common) / len(union) * 100, 1) if union else 0

    user_skills_docs = db.collection("users").document(uid).collection("skills").stream()
    user_ids = {doc.to_dict().get("skill_id") or doc.id for doc in user_skills_docs}
    r1_ids = {doc.to_dict().get("skill_id") for doc in cs1_docs if doc.to_dict().get("skill_id")}
    r2_ids = {doc.to_dict().get("skill_id") for doc in cs2_docs if doc.to_dict().get("skill_id")}
    
    r1_missing = len(r1_ids - user_ids)
    r2_missing = len(r2_ids - user_ids)

    return {
        "role1": role1, "role2": role2,
        "role1_skills": r1_skills, "role2_skills": r2_skills,
        "common_skills": list(common), "overlap_percent": overlap,
        "role1_readiness_weeks": round(r1_missing * 3.0, 1),
        "role2_readiness_weeks": round(r2_missing * 3.0, 1),
    }

def get_activity_heatmap(db, uid: str) -> dict:
    now = datetime.utcnow()
    ninety_days_ago = now - timedelta(days=90)
    
    recent_activities = db.collection("users").document(uid).collection("activities").where(
        "created_at", ">=", ninety_days_ago.isoformat()
    ).stream()

    heatmap_data = {}
    for doc in recent_activities:
        act = doc.to_dict()
        created_at = act.get("created_at")
        if created_at:
            date_str = created_at[:10]
            heatmap_data[date_str] = heatmap_data.get(date_str, 0) + 1

    return {
        "heatmap": heatmap_data,
        "start_date": ninety_days_ago.date().isoformat(),
        "end_date": now.date().isoformat()
    }
