"""Firestore-safe document IDs derived from user-facing names."""
import re


def skill_doc_id(skill_name: str) -> str:
    """Turn a skill name into a valid Firestore document ID.

    Firestore document IDs cannot contain "/" and cannot be "." or "..", but skill
    names like "CI/CD" are legitimate. Names without such characters map to themselves,
    so documents created by older builds (keyed by the raw name) remain reachable.
    """
    name = (skill_name or "").strip()
    safe = name.replace("/", "-")
    safe = re.sub(r"\.{2,}", "-", safe)
    if safe in ("", ".", ".."):
        safe = "skill"
    return safe
