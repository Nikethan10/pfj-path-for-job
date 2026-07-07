from fastapi import HTTPException
from ml.project_recommender import recommend_projects
from services.user_service import get_target_role

def get_recommended_projects(db, uid: str) -> list:
    # 1. Fetch user's profile to find their target role
    target_role = get_target_role(db, uid, default=None)
    
    # 2. Get target role skills
    target_role_skills = set()
    skills_docs = db.collection("skills").stream()
    all_skills = []
    for doc in skills_docs:
        skill_data = doc.to_dict()
        skill_data["id"] = doc.id
        all_skills.append(skill_data)
        
        roles = skill_data.get("roles", [])
        career_skills = skill_data.get("career_skills", {})
        if target_role:
            if target_role in roles or target_role in career_skills:
                target_role_skills.add(skill_data.get("skill_name"))
            elif skill_data.get("role") == target_role:
                target_role_skills.add(skill_data.get("skill_name"))

    # 3. Get user's current skills
    user_skills_docs = db.collection("users").document(uid).collection("skills").stream()
    user_skill_names = set()
    for doc in user_skills_docs:
        us_data = doc.to_dict()
        skill_name = us_data.get("skill_name")
        if not skill_name:
            skill_id = us_data.get("skill_id")
            s = next((sk for sk in all_skills if sk["id"] == skill_id), None)
            if s:
                skill_name = s.get("skill_name")
        if skill_name:
            user_skill_names.add(skill_name)

    # 4. Fetch all projects from database
    projects_docs = db.collection("projects").stream()
    projects = []
    for doc in projects_docs:
        p_data = doc.to_dict()
        projects.append({
            "id": doc.id,
            "project_name": p_data.get("project_name", ""),
            "domain": p_data.get("domain", ""),
            "difficulty": p_data.get("difficulty", ""),
            "description": p_data.get("description", ""),
            "skills": p_data.get("skills", []),
        })

    # 5. Call recommend_projects
    recommended = recommend_projects(
        user_skills=user_skill_names,
        projects=projects,
        target_role_skills=target_role_skills,
        target_role=target_role,
        top_k=30,
    )

    # 6. Fetch user's student projects to add status
    user_projects_docs = db.collection("users").document(uid).collection("projects").stream()
    user_proj_status = {}
    for doc in user_projects_docs:
        pdata = doc.to_dict()
        actual_pid = pdata.get("project_id", doc.id)
        user_proj_status[actual_pid] = pdata.get("status", "Not Started")

    for rec in recommended:
        rec["status"] = user_proj_status.get(rec["id"], "Not Started")
        rec.pop("new_skills", None)

    return recommended


def update_project_status(db, uid: str, project_id: str, new_status: str) -> dict:
    project_ref = db.collection("projects").document(project_id)
    project_doc = project_ref.get()
    if not project_doc.exists:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project_data = project_doc.to_dict()
    
    user_project_ref = db.collection("users").document(uid).collection("projects").document(project_id)
    user_project_ref.set({
        "project_id": project_id,
        "status": new_status,
        "project_name": project_data.get("project_name", "")
    }, merge=True)
    
    return {"project_id": project_id, "project_name": project_data.get("project_name", ""), "status": new_status}
