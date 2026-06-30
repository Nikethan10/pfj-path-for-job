import json
from google.cloud import firestore

def log_activity(db, uid: str, action_type: str, meta_data: dict = None):
    try:
        doc_ref = db.collection("users").document(uid).collection("activity").document()
        activity_data = {
            "action_type": action_type,
            "meta_data": meta_data,
            "timestamp": firestore.SERVER_TIMESTAMP
        }
        doc_ref.set(activity_data)
        return {"id": doc_ref.id, **activity_data}
    except Exception as e:
        # Non-blocking log, we don't want to fail the main request if logging fails
        print(f"Error logging activity: {e}")
        return None
