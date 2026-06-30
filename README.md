# PFJ — Path For Job

**AI-driven career intelligence platform for placement readiness.**

PFJ helps students go from "I don't know what to learn" to placement-ready: it tracks skills, generates
adaptive learning roadmaps, analyzes resumes against jobs (ATS-style), runs mock interviews and coding
challenges, surfaces matching jobs, and rewards real progress with achievement badges.

---

## ⚠️ Security notice — rotate the previously committed keys

Earlier versions of this project committed live secrets to the source tree. **Before deploying, you must
rotate every one of these in their respective consoles** (the old values must be considered compromised):

- **Firebase service account** — regenerate the private key (Google Cloud Console → IAM → Service Accounts).
- **Gemini API key** — regenerate (Google AI Studio).
- **Groq API key** — regenerate (Groq console).
- **Firebase Realtime DB secret** — rotate (Firebase console → Project settings → Service accounts → DB secrets).

All secrets are now loaded from environment variables / ignored files and are excluded by `.gitignore`.
Never commit `.env`, `*.local`, `*-service-account.json`, or `*.db`.

---

## Features

| Area | What it does |
|------|--------------|
| **Dashboard** | Readiness score, activity, and personalized next actions. |
| **Skills** | Track skills against a catalog; bulk-add for a target role. |
| **Roadmap** | Adaptive, node-based learning roadmap with skill quizzes (graded server-side). |
| **Resume Lab** | Upload PDF/DOCX, ATS analysis, job-description matching, bullet rewriting, GitHub/LinkedIn audit. |
| **Interview** | AI mock interviews (technical / aptitude / verbal) with scored feedback. |
| **Challenges** | Coding challenges in a Monaco editor with a test runner. |
| **Jobs** | Skill-matched job listings with match scores. |
| **Career Compare** | Compare two roles by required-skill overlap and your coverage. |
| **Certifications** | Curated certifications by role. |
| **Achievements** | Tiered badges earned from real activity. |
| **AI Assistant** | In-app copilot for navigation and career guidance. |

## Architecture

```
┌─────────────────┐        HTTPS / JSON         ┌──────────────────────┐
│  React + Vite   │  ───────────────────────▶   │   FastAPI backend    │
│  (TypeScript)   │   Bearer Firebase ID token  │   (Python)           │
│  Vercel         │  ◀───────────────────────   │   Render (Docker)    │
└────────┬────────┘                             └──────────┬───────────┘
         │ Firebase Auth (client SDK)                       │ Firebase Admin SDK
         ▼                                                  ▼
   ┌───────────────────────── Firebase ─────────────────────────┐
   │  Authentication  •  Firestore (data)  •  Realtime DB (cache) │
   └─────────────────────────────────────────────────────────────┘
                         │ AI calls (Groq → Gemini)
                         ▼
                  Groq / Google Gemini APIs
```

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS; Firebase client auth; axios; framer-motion;
  recharts; reactflow; Monaco editor.
- **Backend:** FastAPI; Firebase Admin (Firestore + Realtime DB); Groq/Gemini for AI features with built-in
  fallbacks; slowapi rate limiting.
- **Auth:** Firebase ID tokens, verified on every protected request.

## Project structure

```
pfj/
├── backend/      FastAPI app (see backend/README.md)
│   ├── config/         settings (env-driven)
│   ├── database/       Firebase init + accessors
│   ├── middleware/     rate limiting
│   ├── ml/             heuristics + AI-backed generators (challenges, interview, scoring)
│   ├── routes/         API endpoints
│   ├── schemas/        Pydantic request/response models
│   ├── services/       business logic (AI, resume, badges, github, ...)
│   ├── utils/          token verification
│   ├── data/           static catalogs (badges)
│   └── tests/          smoke tests
└── frontend/     React + Vite SPA (see frontend/README.md)
    └── src/
        ├── components/  shared UI (Logo, Sidebar, Footer, BotAssistant, ...)
        ├── context/     auth context
        ├── layouts/     dashboard layout
        ├── pages/       one component per route
        ├── services/    typed API client + per-domain calls
        ├── data/        static front-end data
        └── types/       shared TypeScript types
```

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- A **Firebase** project (Authentication + Firestore enabled)
- *(Optional)* **Groq** and/or **Gemini** API keys — AI features fall back to built-in content without them.

## Local setup

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate   |   macOS/Linux: source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env            # then fill in real values
# place your Firebase service account at config/firebase-service-account.json

uvicorn main:app --reload       # http://localhost:8000  (docs at /docs)
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local       # fill in your Firebase web config + VITE_API_BASE_URL
npm run dev                       # http://localhost:5173
```

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full, documented list. Backend needs Firebase
credentials (required) and optional AI keys; the frontend needs the Firebase web config and the API base URL.

## Testing & build

```bash
# Backend smoke tests (no Firebase creds required)
cd backend && pip install -r requirements-dev.txt && pytest

# Frontend production build (type-checks then bundles)
cd frontend && npm run build
```

## Deployment

- **Frontend → Vercel:** set the project root to `frontend/`, add the `VITE_*` env vars (with
  `VITE_API_BASE_URL` = your backend URL). `frontend/vercel.json` handles SPA routing.
- **Backend → Render:** use `backend/render.yaml` (Docker). Set `ALLOWED_ORIGINS` to your Vercel URL, add the
  AI keys, and upload the Firebase service account as a **Secret File** mounted at
  `/etc/secrets/firebase-service-account.json`. `ENV=production` enables HSTS/HTTPS redirect and hides API docs.
- **Firebase:** keep Authentication + Firestore enabled; lock Firestore rules so each user can only access
  `users/{uid}/**` (see `backend/README.md`).

## License

See `LICENSE`. Legal pages (Terms, Privacy) in the app are templates — have them reviewed before public launch.
