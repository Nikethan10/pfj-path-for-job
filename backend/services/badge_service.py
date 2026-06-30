"""
Achievements & Badges service.

Badges are awarded purely from REAL user activity stored in Firestore — there is no
client-side granting. `evaluate_badges` recomputes the user's metrics, returns the full
catalog annotated with earned/locked state + progress, and persists any newly earned
badge under `users/{uid}/badges/{badge_id}`.
"""
import json
import os
from datetime import datetime, timezone

_BADGES_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "badges.json")


def load_badge_catalog() -> list:
    try:
        with open(_BADGES_PATH, "r", encoding="utf-8") as f:
            return json.load(f).get("badges", [])
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def compute_metrics(db, uid: str) -> dict:
    """Derive achievement metrics from the user's real Firestore data."""
    user_ref = db.collection("users").document(uid)

    skills = [d.to_dict() for d in user_ref.collection("skills").get()]
    projects = list(user_ref.collection("projects").get())
    resumes = list(user_ref.collection("resumes").get())
    interviews = list(user_ref.collection("interviews").get())
    challenges = [d.to_dict() for d in user_ref.collection("challenges").get()]
    activities = [d.to_dict() for d in user_ref.collection("activity").get()]

    active_days = set()
    resume_analyses = 0
    roadmap_completed = 0
    interview_answers = 0
    challenge_activity = 0
    for a in activities:
        ts = a.get("timestamp", "")
        if ts:
            active_days.add(ts.split("T")[0])
        atype = a.get("type")
        if atype == "resume_analysis":
            resume_analyses += 1
        elif atype == "complete_roadmap_item":
            roadmap_completed += 1
        elif atype == "mock_interview_answer":
            interview_answers += 1
        elif atype == "coding_challenge":
            challenge_activity += 1

    skills_advanced = sum(1 for s in skills if str(s.get("level", "")).lower() == "advanced")
    challenges_completed = max(
        sum(1 for c in challenges if c.get("status") == "completed"),
        challenge_activity,
    )

    # Readiness score — same formula as routes/analytics.calculate_readiness.
    skill_score = min(len(skills) / 10.0, 1.0)
    project_score = min(len(projects) / 3.0, 1.0)
    resume_score = 1.0 if len(resumes) > 0 else 0.0
    readiness_score = int((skill_score * 40) + (project_score * 40) + (resume_score * 20))

    return {
        "skills_count": len(skills),
        "skills_advanced": skills_advanced,
        "projects_count": len(projects),
        "resume_analyses": max(resume_analyses, len(resumes)),
        "interviews_taken": max(len(interviews), interview_answers),
        "challenges_completed": challenges_completed,
        "roadmap_completed": roadmap_completed,
        "active_days": len(active_days),
        "readiness_score": readiness_score,
    }


def evaluate_badges(db, uid: str) -> dict:
    """Return the badge catalog annotated with the user's progress; persist new unlocks."""
    catalog = load_badge_catalog()
    metrics = compute_metrics(db, uid)

    earned_ref = db.collection("users").document(uid).collection("badges")
    already = {d.id: (d.to_dict() or {}) for d in earned_ref.get()}

    results = []
    newly_earned = []
    for badge in catalog:
        target = badge.get("target", 1) or 1
        current = metrics.get(badge.get("metric"), 0)
        is_earned = current >= target

        record = {
            **badge,
            "current": current,
            "earned": is_earned,
            "progress": min(100, int((current / target) * 100)),
        }

        if is_earned and badge["id"] not in already:
            earned_at = datetime.now(timezone.utc).isoformat()
            earned_ref.document(badge["id"]).set({"earned_at": earned_at})
            record["earned_at"] = earned_at
            newly_earned.append(badge["id"])
        elif badge["id"] in already:
            record["earned_at"] = already[badge["id"]].get("earned_at")

        results.append(record)

    return {
        "badges": results,
        "earned_count": sum(1 for r in results if r["earned"]),
        "total_count": len(results),
        "newly_earned": newly_earned,
        "metrics": metrics,
    }
