# services/

The API layer. Pages call these functions; they never talk to the network directly.

| File | Purpose |
|------|---------|
| `api.ts` | The shared axios instance. Base URL = `VITE_API_BASE_URL` (default `http://localhost:8000`). Attaches the Firebase ID token to every request and, on a 401, **silently refreshes** the token once before signing out. |
| `authService.js` | Verify the Firebase token with the backend. |
| `profileService.js` | Profile CRUD. |
| `skillService.js` | Skills + catalog. |
| `roadmapService.js` | Roadmap + quizzes (uses the server `session_id`, not answer tokens). |
| `analyticsService.js` | Readiness, summary, compare, activity, feedback. |
| `resumeService.js` | Resume analyze/match/rewrite/social (multipart). |
| `jobService.js` | Job listings. |
| `projectService.js` | Projects. |
| `challengeService.js` | Coding challenges. |
| `interviewService.js` | Interview Q&A. |
| `badgeService.ts` | Achievements (`GET /badges`). |

Most service files are still `.js`; convert to `.ts` (typed with `src/types`) as you touch them.
