from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Environment ──
    ENV: str = "development"

    # ── AI providers (optional; features fall back to built-in content) ──
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GITHUB_TOKEN: str = ""

    # ── Firebase (required for auth + Firestore) ──
    FIREBASE_CREDENTIALS_PATH: str = "config/firebase-service-account.json"
    FIREBASE_DATABASE_URL: str = ""
    FIREBASE_DATABASE_SECRET: str = ""

    # ── Security ──
    # Comma-separated list of allowed CORS origins (the frontend URL[s]).
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Ignore any legacy keys still present in a local .env (e.g. DATABASE_URL).
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENV.strip().lower() == "production"


@lru_cache()
def get_settings() -> "Settings":
    return Settings()
