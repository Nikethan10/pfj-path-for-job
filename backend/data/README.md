# data/

Static, version-controlled catalogs used by the backend.

| File | Purpose |
|------|---------|
| `badges.json` | The achievement catalog: each badge's id, name, description, tier (bronze/silver/gold), category, icon key, and the `metric`/`target` used by `services/badge_service` to award it from real activity. |

Edit `badges.json` to add or tune achievements — no code change needed as long as the `metric` is one that
`badge_service.compute_metrics` produces.
