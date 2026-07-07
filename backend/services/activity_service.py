"""
Single writer for the `users/{uid}/activity` collection.

Every activity document has:
- `type`        — the action name (canonical field)
- `action_type` — same value, kept so documents written by older builds stay queryable
- `meta_data`   — optional dict of extra detail
- `timestamp`   — ISO-8601 UTC string (older documents may hold a Firestore server
                  timestamp instead; readers must go through `timestamp_to_date`)
"""
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def log_activity(db, uid: str, action_type: str, meta_data: dict = None):
    try:
        doc_ref = db.collection("users").document(uid).collection("activity").document()
        activity_data = {
            "type": action_type,
            "action_type": action_type,
            "meta_data": meta_data or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        doc_ref.set(activity_data)
        return {"id": doc_ref.id, **activity_data}
    except Exception as e:
        # Non-blocking log, we don't want to fail the main request if logging fails
        logger.warning("Error logging activity for %s: %s", uid, e)
        return None


def activity_type(activity: dict) -> str:
    """Read the action name from a document written by any version of the app."""
    return activity.get("type") or activity.get("action_type") or ""


def timestamp_to_date(ts) -> str:
    """Return the YYYY-MM-DD part of an activity timestamp, or "" if unreadable.

    Handles both ISO strings (current format) and datetime objects (documents written
    with firestore.SERVER_TIMESTAMP by older builds).
    """
    if ts is None:
        return ""
    if isinstance(ts, str):
        return ts.split("T")[0]
    if isinstance(ts, datetime):
        return ts.date().isoformat()
    # Firestore DatetimeWithNanoseconds subclasses datetime, but stay defensive.
    try:
        return ts.date().isoformat()
    except Exception:
        return ""
