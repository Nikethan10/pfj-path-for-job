# PFJ Backend (FastAPI)

The API and AI engine for PFJ. Firebase/Firestore is the live data store; Groq/Gemini power AI features
with built-in fallbacks so everything works even with no AI keys configured.

## Run locally

```bash
python -m venv venv
# Windows: venv\Scripts\activate   |   macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                 # fill in values
# place Firebase service account at config/firebase-service-account.json
uvicorn main:app --reload
```

- API root: `http://localhost:8000`  •  Interactive docs: `/docs` (hidden when `ENV=production`)
- Health check: `GET /api/health`

## Tests

```bash
pip install -r requirements-dev.txt
pytest                 # smoke tests (no Firebase creds needed)
```

## Folder map

| Folder | Purpose |
|--------|---------|
| `config/` | Env-driven settings (`get_settings`). |
| `database/` | Firebase Admin init; `get_firestore`, `get_rtdb`, `verify_token`. |
| `middleware/` | slowapi rate limiter setup. |
| `ml/` | Heuristics + AI-backed generators (challenges, interview, scoring, skill gap). |
| `routes/` | API endpoints (one router per domain). |
| `schemas/` | Pydantic request/response models. |
| `services/` | Business logic (AI, resume, badges, github, recommendations, scoring, activity). |
| `utils/` | `verify_token` dependency (Firebase ID-token verification). |
| `data/` | Static catalogs (e.g. `badges.json`). |
| `tests/` | Pytest smoke tests. |

## Security model

- **Auth:** every protected route depends on `verify_token` (Firebase ID token → uid). Data is namespaced
  under `users/{uid}/**`, so users only ever read/write their own documents.
- **CORS:** restricted to `ALLOWED_ORIGINS` (no wildcard).
- **Headers:** `X-Content-Type-Options`, `X-Frame-Options: DENY`, CSP `frame-ancestors 'none'`,
  `Referrer-Policy`, plus HSTS + HTTPS redirect when `ENV=production`.
- **Rate limiting:** applied to auth and all AI/upload endpoints.
- **Quiz integrity:** correct answers are stored server-side per session and never sent to the client.
- **Uploads:** resume uploads are capped at 5 MB and validated by extension **and** magic bytes (PDF/DOCX).

### Recommended Firestore security rules (defense in depth)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /skills/{doc} { allow read: if request.auth != null; }
  }
}
```

## Notes

- The previous local Qwen "model service" (port 8001) and the abandoned SQLite layer were removed; AI now
  runs through `services/ai_service` (Groq → Gemini) with static fallbacks.
- Never commit `.env` or `config/firebase-service-account.json` (both are gitignored).
