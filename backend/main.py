"""
PFJ (Path For Job) — AI-Driven Career Intelligence Platform
Main FastAPI application entry point.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse

from config.settings import get_settings
from middleware.security import setup_rate_limiting, limiter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("pfj")

# Routers
from routes.auth import router as auth_router
from routes.profile import router as profile_router
from routes.skills import router as skills_router
from routes.roadmap import router as roadmap_router
from routes.projects import router as projects_router
from routes.resume import router as resume_router
from routes.analytics import router as analytics_router
from routes.feedback import router as feedback_router
from routes.interview import router as interview_router
from routes.challenges import router as challenges_router
from routes.jobs import router as jobs_router
from routes.assistant import router as assistant_router
from routes.badges import router as badges_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Firebase Admin is initialized when database.firebase_db is imported.
    logger.info("PFJ backend starting (env=%s)", settings.ENV)
    yield
    logger.info("PFJ backend shutting down")


app = FastAPI(
    title="PFJ — Path For Job",
    description="AI-driven career intelligence platform for placement readiness",
    version="1.0.0",
    lifespan=lifespan,
    # Hide interactive API docs in production.
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
)

# ── CORS: explicit origins only (no wildcard) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=3600,
)


# ── Security headers (+ HTTPS enforcement in production) ──
@app.middleware("http")
async def security_headers(request: Request, call_next):
    if settings.is_production:
        proto = request.headers.get("x-forwarded-proto", request.url.scheme)
        if proto == "http":
            return RedirectResponse(str(request.url.replace(scheme="https")), status_code=307)

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "frame-ancestors 'none'"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# ── Rate limiting ──
setup_rate_limiting(app)

# ── Register routers ──
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(skills_router)
app.include_router(roadmap_router)
app.include_router(projects_router)
app.include_router(resume_router)
app.include_router(analytics_router)
app.include_router(feedback_router)
app.include_router(interview_router)
app.include_router(challenges_router)
app.include_router(jobs_router)
app.include_router(assistant_router)
app.include_router(badges_router)


@app.get("/")
@limiter.limit("10/minute")
def root(request: Request):
    return {
        "name": "PFJ — Path For Job",
        "version": "1.0.0",
        "status": "running",
        "docs": None if settings.is_production else "/docs",
    }


@app.get("/api/health")
@limiter.limit("20/minute")
def health(request: Request):
    return {"status": "healthy"}
