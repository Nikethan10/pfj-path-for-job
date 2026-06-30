# routes/

FastAPI routers — one file per domain, each mounted in `main.py`. Every protected endpoint depends on
`verify_token` (from `utils/jwt_handler`) and scopes data to the authenticated `users/{uid}`.

| File | Prefix | Highlights |
|------|--------|-----------|
| `auth.py` | `/api/auth` | Verify Firebase ID token; create/update the user record. Rate-limited. |
| `profile.py` | `/api/profile` | CRUD on the user profile. |
| `skills.py` | `/api/skills` | Skill catalog + the user's skills (add/update/remove/bulk). Auth required. |
| `roadmap.py` | `/api/roadmap` | Generate/track roadmap; quizzes graded **server-side** (answers never sent to client). |
| `projects.py` | `/api/projects` | Recommended projects + status updates. |
| `resume.py` | `/api/resume` | Resume analyze/match/rewrite/social. Upload capped (5 MB) + type-validated; rate-limited. |
| `analytics.py` | `/api/analytics` | Readiness, summary, real role **compare** (skill overlap), activity heatmap. |
| `feedback.py` | `/api/feedback` | Submit/retrieve feedback. |
| `interview.py` | `/api/interview` | AI question generation + answer evaluation (rate-limited; static fallback). |
| `challenges.py` | `/api/challenges` | Coding-challenge catalog + AI generation (rate-limited; static fallback). |
| `jobs.py` | `/api/jobs` | Skill-matched job listings. |
| `assistant.py` | `/api/assistant` | AI chat copilot (rate-limited; rules-based fallback). |
| `badges.py` | `/api/badges` | Achievement catalog + the user's earned/locked state (server-side awarding). |
