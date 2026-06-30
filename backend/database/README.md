# database/

| File | Purpose |
|------|---------|
| `firebase_db.py` | Initializes Firebase Admin from the service-account credentials and exposes `get_firestore()` (Firestore client), `get_rtdb()` (Realtime DB, used for quiz caching), and `verify_token(id_token)` (Firebase ID-token verification). |

Firestore is the system of record; the Realtime DB is used only as a cache. There is no SQL database
(the old SQLite layer was removed).
