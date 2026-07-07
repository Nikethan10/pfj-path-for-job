from typing import List, Dict, Set


def jaccard_similarity(set_a: Set[str], set_b: Set[str]) -> float:
    """Jaccard Similarity = |A ∩ B| / |A ∪ B|"""
    if not set_a and not set_b:
        return 0.0
    intersection = set_a & set_b
    union = set_a | set_b
    return len(intersection) / len(union) if union else 0.0


def recommend_projects(
    user_skills: Set[str],
    projects: List[Dict],
    target_role_skills: Set[str] = None,
    target_role: str = None,
    top_k: int = 25,
) -> List[Dict]:
    """
    Content-based project recommendation.
    Factors in both user's current skills and their target career path's required skills.
    """
    user_lower = {s.lower().strip() for s in user_skills}
    target_lower = {s.lower().strip() for s in target_role_skills} if target_role_skills else set()

    scored = []
    for project in projects:
        proj_skills = {s.lower().strip() for s in project["skills"]}
        
        # 1. Similarity with current skills
        similarity = jaccard_similarity(user_lower, proj_skills)
        
        # 2. Alignment with target role skills
        role_overlap = proj_skills & target_lower
        role_alignment = len(role_overlap) / len(proj_skills) if proj_skills else 0.0
        
        # 3. Calculate match score (higher weight to target role alignment to ensure relevance)
        if target_lower:
            match_score = (similarity * 0.3) + (role_alignment * 0.7)
        else:
            match_score = similarity

        new_skills = proj_skills - user_lower
        matching = proj_skills & user_lower

        parts = []
        if target_role and role_overlap:
            # Find which original casing skills are target skills
            role_overlap_orig = [s for s in project["skills"] if s.lower().strip() in role_overlap]
            parts.append(f"[TARGET] Essential for {target_role} ({', '.join(role_overlap_orig)})")
        
        if matching:
            matching_orig = [s for s in project["skills"] if s.lower().strip() in matching]
            parts.append(f"[MATCH] Uses your skills: {', '.join(matching_orig)}")
            
        if new_skills:
            new_orig = [s for s in project["skills"] if s.lower().strip() in new_skills]
            parts.append(f"[LEARN] You will learn: {', '.join(new_orig)}")

        scored.append({
            **project,
            "match_score": round(match_score, 3),
            "new_skills": list(new_skills),
            "explanation": " · ".join(parts) if parts else "Great project to build your portfolio",
        })

    # Sort primarily by match score
    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored[:top_k]

