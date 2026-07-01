from fastapi import APIRouter, Depends, Request

from database.firebase_db import get_firestore
from middleware.security import limiter
from services.config_service import get_site_config

router = APIRouter(prefix="/api", tags=["Site Config"])


@router.get("/config")
@limiter.limit("60/minute")
def public_config(request: Request, db=Depends(get_firestore)):
    """Public runtime site configuration: content, theme, feature flags, nav, and SEO.

    The frontend loads this on startup so admins can change the site without code changes.
    """
    return get_site_config(db)
