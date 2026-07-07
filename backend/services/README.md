# services/

Business logic, kept out of the route handlers.

| File | Purpose |
|------|---------|
| `ai_service.py` | Single entry point for LLM calls: `run_ai_prompt` (Groq → Gemini fallback), quiz generation (cached in Realtime DB), project/resume/LinkedIn analysis. All callers degrade gracefully when no key is set. |
| `resume_service.py` | PDF/DOCX text extraction and resume analysis pipeline; saves analyses/job-matches. |
| `github_service.py` | GitHub profile/repo analysis (token-based; returns None when unreachable). |
| `recommendation_service.py` | Project/skill recommendations. |
| `roadmap_service.py` | Roadmap generation + progress tracking. |
| `activity_service.py` | Append activity-log entries used by the dashboard heatmap and badges. |
| `badge_service.py` | Computes achievement metrics from real activity and awards badges (server-side only). |
| `user_service.py` | Shared accessors for the user profile document (`users/{uid}/profile/main`). |
