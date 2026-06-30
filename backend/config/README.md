# config/

| File | Purpose |
|------|---------|
| `settings.py` | `Settings` (pydantic-settings) loaded from environment / `.env`. Exposes AI keys, Firebase config, `ALLOWED_ORIGINS`, and `ENV`, plus helpers `allowed_origins_list` and `is_production`. Use `get_settings()` (cached). |
| `firebase-service-account.json` | **Not committed.** Your Firebase Admin credentials; path set by `FIREBASE_CREDENTIALS_PATH`. In production, mount it as a secret file. |

Unknown legacy keys in a local `.env` are ignored (`extra="ignore"`).
