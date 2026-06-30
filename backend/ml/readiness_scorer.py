from typing import Dict


def calculate_readiness(
    skill_coverage: float,
    project_completion: float,
    resume_score: float,
    consistency_score: float,
) -> Dict:
    """
    Placement Readiness Score (weighted composite):
        Score = w1*skill + w2*project + w3*resume + w4*consistency

    Weights updated (Projects removed from weightage):
    - Skills 55%: Core foundation tested in interviews
    - Projects 0%: Maintained for resource guidance, no score weight
    - Resume 25%: Gateway to getting interviews
    - Consistency 20%: Shows dedication and learning habits
    """
    W_SKILL = 0.55
    W_PROJECT = 0.00
    W_RESUME = 0.25
    W_CONSISTENCY = 0.20

    skill_s = min(skill_coverage * 100, 100)
    project_s = min(project_completion * 100, 100)
    resume_s = min(resume_score, 100)
    consistency_s = min(consistency_score * 100, 100)

    total = round(
        W_SKILL * skill_s
        + W_PROJECT * project_s
        + W_RESUME * resume_s
        + W_CONSISTENCY * consistency_s,
        1,
    )
    total = min(total, 100)

    if total >= 80:
        level = "Job Ready"
    elif total >= 60:
        level = "Almost Ready"
    elif total >= 35:
        level = "Getting There"
    else:
        level = "Not Ready"

    return {
        "total_score": total,
        "breakdown": {
            "skill_score": round(skill_s, 1),
            "project_score": round(project_s, 1),
            "resume_score": round(resume_s, 1),
            "consistency_score": round(consistency_s, 1),
        },
        "level": level,
    }
