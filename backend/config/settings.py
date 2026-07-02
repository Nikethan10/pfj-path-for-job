from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Environment ──
    ENV: str = "development"

    # ── AI providers (optional; features fall back to built-in content) ──
    GEMINI_API_KEY: str = ""
    GEMINI_API_KEY_2: str = ""
    GROQ_API_KEY: str = ""
    GROQ_API_KEY_2: str = ""
    GITHUB_TOKEN: str = ""

    # ── Firebase (required for auth + Firestore) ──
    FIREBASE_CREDENTIALS_PATH: str = "config/firebase-service-account.json"
    # On managed hosts (no secret files), paste the whole service-account JSON here instead.
    FIREBASE_SERVICE_ACCOUNT: str = ""
    FIREBASE_DATABASE_URL: str = ""
    FIREBASE_DATABASE_SECRET: str = ""

    # ── Security ──
    # Comma-separated list of allowed CORS origins (the frontend URL[s]).
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Comma-separated emails that are always treated as Super Admins (bootstrap).
    # Any other admins are managed in the Firestore `admins` collection.
    SUPER_ADMIN_EMAILS: str = ""

    # Ignore any legacy keys still present in a local .env (e.g. DATABASE_URL).
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENV.strip().lower() == "production"

    @property
    def super_admin_emails(self) -> list[str]:
        return [e.strip().lower() for e in self.SUPER_ADMIN_EMAILS.split(",") if e.strip()]


@lru_cache()
def get_settings() -> "Settings":
    return Settings()
