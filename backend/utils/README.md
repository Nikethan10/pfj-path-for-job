# utils/

| File | Purpose |
|------|---------|
| `jwt_handler.py` | The `verify_token` FastAPI dependency: extracts the bearer token (OAuth2 scheme), verifies it with Firebase Admin, and returns the user's `uid`. Add it to any route that must be authenticated. |
