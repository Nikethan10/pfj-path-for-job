# schemas/

Pydantic models for request validation and response shaping. Routes type their bodies with these so invalid
input is rejected before any business logic runs.

| File | Models for |
|------|-----------|
| `auth.py` | Firebase token request, user response. |
| `profile.py` | Profile create/update/response. |
| `skill.py` | Skill add/update/bulk-add. |
| `roadmap.py` | Roadmap generate / status update. |
| `project.py` | Project recommendation / status. |
| `resume.py` | Resume-related requests. |
| `interview.py` | Question request / evaluation request. |
| `analytics.py` | Career-compare request. |

Add field constraints here (lengths, enums, ranges) rather than validating ad hoc in routes.
