# ml/

Domain logic for the "intelligent" features. These are transparent heuristics plus AI-backed generators —
not trained models — chosen for explainability and zero-infra reliability.

| File | Purpose |
|------|---------|
| `coding_challenges.py` | Loads the static challenge bank; `generate_dynamic_challenge` asks the AI for a fresh problem and **falls back to a static one** (always runnable) if AI is unavailable or returns an invalid shape. |
| `challenges_repository.json` | The curated static challenge bank (problems + starter code + test cases). |
| `interview_simulator.py` | AI question generation + answer evaluation, with a large static question bank and a deterministic rule-based scorer as fallbacks. |
| `job_matcher.py` | Matches user skills against a job catalog (weighted similarity). |
| `project_recommender.py` | Recommends projects by skill/role alignment. |
| `readiness_scorer.py` | Weighted placement-readiness score. |
| `consistency.py` | Activity streak / consistency metrics. |
| `skill_gap.py` | Missing-skill analysis vs a target role, ranked by importance. |
| `roadmap_generator.py` | Builds the roadmap structure. |

> The previous local Qwen "model service" (port 8001) was removed — AI now runs via `services/ai_service`.
