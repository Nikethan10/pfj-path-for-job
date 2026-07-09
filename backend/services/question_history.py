"""
Per-user "recently served questions" memory, shared by every question-serving tab
(interview simulator, roadmap skill quiz, ...).

Why: interview questions and quiz questions are generated fresh by the AI on each call —
there is no fixed question bank being sampled — so nothing inherently stops the model from
occasionally producing a question it produced a few attempts ago. This service records the
questions a user has recently been served (per context) and lets each generator steer away
from them, guaranteeing no exact repeat within a sliding window that comfortably covers the
last several attempts.

Storage: users/{uid}/question_history/{context} → { recent: [question_text, ...] } with the
most-recent question last, trimmed to KEEP entries.
"""
import re
import logging

logger = logging.getLogger(__name__)

# How many recent questions to remember per context. An interview serves ~1 question per
# call and a quiz serves 3, so 40 spans far more than the "3-4 attempts" no-repeat window.
KEEP = 40


def _norm(text: str) -> str:
    """Normalize for duplicate comparison: lowercase, trim, collapse whitespace."""
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def _doc(db, uid: str, context: str):
    return db.collection("users").document(uid).collection("question_history").document(context)


def get_recent(db, uid: str, context: str) -> list:
    """Return the user's recently-served question texts for this context (originals)."""
    try:
        snap = _doc(db, uid, context).get()
        if snap.exists:
            return (snap.to_dict() or {}).get("recent", []) or []
    except Exception as e:
        logger.warning("Could not read question history (%s): %s", context, e)
    return []


def record(db, uid: str, context: str, questions) -> None:
    """Append newly-served questions, de-duplicate, and keep only the last KEEP."""
    if isinstance(questions, str):
        questions = [questions]
    questions = [q for q in (questions or []) if q]
    if not questions:
        return
    try:
        existing = get_recent(db, uid, context)
        combined = existing + questions
        # De-duplicate by normalized text, keeping the most recent occurrence, order preserved.
        seen, deduped = set(), []
        for q in reversed(combined):
            key = _norm(q)
            if key in seen:
                continue
            seen.add(key)
            deduped.append(q)
        deduped.reverse()
        _doc(db, uid, context).set({"recent": deduped[-KEEP:]})
    except Exception as e:
        # History is best-effort; never fail the request over it.
        logger.warning("Could not record question history (%s): %s", context, e)
