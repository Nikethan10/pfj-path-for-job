from fastapi import HTTPException
from ml.skill_gap import analyze_skill_gap
from ml.roadmap_generator import generate_roadmap
from services.user_service import get_user_profile

def generate_user_roadmap(db, uid: str, target_role: str = None) -> dict:
    profile = get_user_profile(db, uid)

    role = target_role or profile.get("target_role")
    if not role:
        raise HTTPException(
            status_code=400,
            detail="Set a target role in your profile (or pass one) before generating a roadmap.",
        )
    weekly_hours = profile.get("weekly_hours", 10)

    # Get user's current skills
    user_skills_docs = db.collection("users").document(uid).collection("skills").stream()
    user_skill_names = set()
    for doc in user_skills_docs:
        s_data = doc.to_dict()
        if "skill_name" in s_data:
            user_skill_names.add(s_data["skill_name"])

    # Get all skills and career skills
    skills_docs = db.collection("skills").stream()
    all_skills = {}
    career_skills = []
    
    for doc in skills_docs:
        s_data = doc.to_dict()
        s_name = s_data.get("skill_name")
        if not s_name:
            continue
        all_skills[s_name] = s_data
        
        career_skills_map = s_data.get("career_skills", {})
        roles_list = s_data.get("roles", [])
        
        # importance_score is a 0-1 fraction ("required in N% of job listings").
        importance = None
        if role in career_skills_map:
            importance = career_skills_map[role].get("importance_score", 0.5)
        elif role in roles_list:
            importance = 0.5
        elif s_data.get("role") == role:
            importance = 0.5
            
        if importance is not None:
            career_skills.append({
                "role": role,
                "skill_name": s_name,
                "importance_score": importance,
                "category": s_data.get("category", "General"),
            })

    if not career_skills:
        raise HTTPException(status_code=404, detail=f"No career data for role: {role}")

    missing = analyze_skill_gap(role, user_skill_names, career_skills)

    # difficulty_weight is a multiplier around 1.0 (0.5 easy … 2.0 hard).
    skill_metadata = {}
    for s_name, s_data in all_skills.items():
        skill_metadata[s_name] = s_data.get("difficulty_weight", 1.0)

    roadmap_items = generate_roadmap(missing, weekly_hours, skill_metadata)

    # Clear old roadmap
    roadmaps_ref = db.collection("users").document(uid).collection("roadmaps")
    old_roadmaps = roadmaps_ref.stream()
    batch = db.batch()
    for doc in old_roadmaps:
        batch.delete(doc.reference)
    batch.commit()

    # Save new roadmap
    saved = []
    batch = db.batch()
    for item in roadmap_items:
        doc_ref = roadmaps_ref.document()
        rm_data = {
            "skill_name": item["skill_name"],
            "category": item.get("category", "General"),
            "priority_order": item["priority_order"],
            "estimated_weeks": item["estimated_weeks"],
            "status": "Pending",
            "explanation": item["explanation"],
        }
        batch.set(doc_ref, rm_data)
        rm_data["id"] = doc_ref.id
        saved.append(rm_data)
    
    batch.commit()
    
    total_weeks = sum(i["estimated_weeks"] for i in saved)
    return {"target_role": role, "total_weeks": round(total_weeks, 1), "items": saved}


def get_user_roadmap(db, uid: str) -> dict:
    profile = get_user_profile(db, uid)
    target_role = profile.get("target_role", "Not set")

    roadmaps_ref = db.collection("users").document(uid).collection("roadmaps")
    items_docs = roadmaps_ref.order_by("priority_order").stream()
    
    items = []
    for doc in items_docs:
        data = doc.to_dict()
        data["id"] = doc.id
        items.append(data)

    total_weeks = sum(i.get("estimated_weeks", 0) for i in items)
    return {
        "target_role": target_role,
        "total_weeks": round(total_weeks, 1),
        "items": items,
    }


def update_roadmap_status(db, uid: str, roadmap_id: str, new_status: str) -> dict:
    doc_ref = db.collection("users").document(uid).collection("roadmaps").document(roadmap_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Roadmap item not found")
        
    doc_ref.update({"status": new_status})
    
    data = doc.to_dict()
    return {
        "id": roadmap_id,
        "skill_name": data.get("skill_name", "Unknown"),
        "status": new_status
    }
