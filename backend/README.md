# PATH Backend (FastAPI)

Welcome to the backend service for **PATH (Placement And Talent Hub)**. This is a high-performance REST API built using FastAPI, serving AI-driven insights, user profiles, and placement metrics for the platform.

## Architecture

The backend follows a modular, route-based MVC pattern. It is designed to be easily extensible and completely stateless for horizontal scalability.

### Directory Structure

- **`config/`**: Configuration management. Loads and parses environment variables using Pydantic `BaseSettings`.
- **`data/`**: Static or seed data used for populating default skills, roles, and project templates.
- **`database/`**: Database connections. Primarily interfaces with Firebase Firestore via the `firebase-admin` SDK.
- **`middleware/`**: Custom HTTP middleware. Includes:
  - `auth.py`: JWT token verification and user context injection.
  - `security.py`: Rate limiting (using `slowapi`) and IP tracking.
- **`routes/`**: FastAPI route controllers. Each major feature (Auth, Profile, Skills, Roadmap, etc.) has its own dedicated `APIRouter`.
- **`schemas/`**: Pydantic models for request/response validation. Ensures strict typing of all incoming and outgoing data payloads.
- **`services/`**: Core business logic and integrations (e.g., AI logic, data processing).
- **`utils/`**: Shared helper functions (logging, formatting, etc.).

## Security Features

1. **Firebase Authentication:** All protected endpoints require a valid Firebase ID token. The `verify_token` dependency ensures that requests missing a valid token receive a `401 Unauthorized`.
2. **Rate Limiting:** Global rate limiting is implemented to prevent abuse and brute-force attacks.
3. **CORS Policies:** Configured in `main.py` via `CORSMiddleware`, restricting access strictly to defined production origins.
4. **Data Validation:** Pydantic guarantees that malformed requests are rejected with a `422 Unprocessable Entity` before hitting any business logic.

## Getting Started

1. **Environment Setup:** Ensure you have a `.env` file based on `.env.example`.
2. **Install Dependencies:** `pip install -r requirements.txt`
3. **Run Server:** `uvicorn main:app --reload`
