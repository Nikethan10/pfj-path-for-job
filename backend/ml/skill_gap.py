from typing import List, Dict, Set


def analyze_skill_gap(
    target_role: str,
    user_skill_names: Set[str],
    career_skills: List[Dict],
) -> List[Dict]:
    """
    Compare user skills against required skills for target role.
    Returns missing skills sorted by importance score (descending).

    Algorithm:
    1. Filter career_skills for target_role
    2. Find set difference: required - user_known
    3. Sort by importance_score (highest first)
    4. Generate explainability text for each
    """
    required = [
        cs for cs in career_skills
        if cs["role"].lower() == target_role.lower()
    ]

    user_lower = {s.lower() for s in user_skill_names}

    missing_skills = []
    for req in required:
        if req["skill_name"].lower() not in user_lower:
            pct = int(req["importance_score"] * 100)
            missing_skills.append({
                "skill_name": req["skill_name"],
                "importance": req["importance_score"],
                "category": req.get("category", "General"),
                "explanation": (
                    f"{req['skill_name']} is required in {pct}% of "
                    f"{target_role} job listings"
                ),
            })

    missing_skills.sort(key=lambda x: x["importance"], reverse=True)
    return missing_skills
