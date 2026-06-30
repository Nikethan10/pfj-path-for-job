from typing import List, Dict


def generate_roadmap(
    missing_skills: List[Dict],
    weekly_hours: int,
    skill_metadata: Dict[str, float],
) -> List[Dict]:
    """
    Generate a prioritized learning roadmap.

    Formula:
        estimated_weeks = (BASE_WEEKS * difficulty_weight) / weekly_hours_factor
        weekly_hours_factor = weekly_hours / 10.0  (normalized around 10 hrs/week)

    Skills are already sorted by importance from skill_gap module.
    """
    BASE_WEEKS = 3.0
    weekly_factor = max(weekly_hours / 10.0, 0.5)

    roadmap = []
    for i, skill in enumerate(missing_skills):
        difficulty = skill_metadata.get(skill["skill_name"], 1.0)
        estimated_weeks = round((BASE_WEEKS * difficulty) / weekly_factor, 1)

        roadmap.append({
            "skill_name": skill["skill_name"],
            "category": skill["category"],
            "priority_order": i + 1,
            "estimated_weeks": estimated_weeks,
            "importance": skill["importance"],
            "explanation": (
                f"Priority #{i + 1}: {skill['explanation']}. "
                f"Estimated {estimated_weeks} weeks at {weekly_hours} hrs/week."
            ),
        })

    return roadmap
