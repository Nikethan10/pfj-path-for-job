"""
Shared user-data accessors.

The user's editable profile (degree, branch, year, target_role, weekly_hours) lives at
`users/{uid}/profile/main` — NOT on the top-level `users/{uid}` document, which only holds
identity fields (uid, name, email, created_at, last_login, banned). Every service that
needs profile data must go through these helpers so the path is defined in one place.
"""

DEFAULT_TARGET_ROLE = "Software Engineer"


def get_user_profile(db, uid: str) -> dict:
    """Return the user's profile document, or {} if they haven't completed setup."""
    doc = (
        db.collection("users").document(uid)
        .collection("profile").document("main").get()
    )
    return (doc.to_dict() or {}) if doc.exists else {}


def get_target_role(db, uid: str, default: str = DEFAULT_TARGET_ROLE) -> str:
    """Return the user's target role, falling back to a sensible default."""
    return get_user_profile(db, uid).get("target_role") or default
