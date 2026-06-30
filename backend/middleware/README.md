# middleware/

| File | Purpose |
|------|---------|
| `security.py` | Configures the slowapi rate limiter (`limiter`, keyed by client IP) and wires its exception handler via `setup_rate_limiting(app)`. |

Apply per-route limits with `@limiter.limit("N/minute")` (the endpoint must accept `request: Request`).
Security **headers** and **CORS** are configured in `main.py`.
