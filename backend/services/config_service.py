"""
Site configuration service — the heart of the no-code CMS.

The public site reads `site_config/main` from Firestore at runtime; admins edit it through the
admin API. Stored values are deep-merged over `DEFAULT_CONFIG`, so a fresh project works out of the
box and admins only override what they change.
"""
import copy
from datetime import datetime, timezone

ALLOWED_SECTIONS = {"content", "theme", "features", "nav", "seo", "site", "branding", "announcement"}

DEFAULT_CONFIG = {
    "site": {
        "name": "PFJ — Path For Job",
        "tagline": "AI-driven career intelligence for placement readiness.",
        "contactEmail": "support@pathforjob.example",
        "copyright": "© PFJ — Path For Job",
    },
    "branding": {
        "logoUrl": "",
        "heroImageUrl": "",
    },
    "announcement": {
        "enabled": False,
        "text": "",
        "type": "info",
    },
    "content": {
        "hero": {
            "title": "Land your dream role, faster.",
            "subtitle": "PFJ turns career uncertainty into a clear, measurable plan — skills, roadmap, resume, interviews, and jobs in one place.",
            "primaryCta": "Get started",
            "secondaryCta": "How it works",
        },
        "footer": {
            "tagline": "AI-driven career intelligence that helps students become placement-ready.",
        },
    },
    "theme": {
        "primary": "#166534",
        "accent": "#d97706",
        "secondary": "#be123c",
        "radius": "0.75rem",
        "font": "Inter",
    },
    # Feature flags — keys match dashboard routes. Disabled features are hidden from the app.
    "features": {
        "skills": True,
        "roadmap": True,
        "certifications": True,
        "projects": True,
        "analytics": True,
        "resume": True,
        "compare": True,
        "badges": True,
        "interview": True,
        "challenges": True,
        "jobs": True,
    },
    "nav": [
        {"key": "dashboard", "label": "Dashboard", "path": "/dashboard", "enabled": True, "order": 0},
        {"key": "skills", "label": "Skills", "path": "/skills", "enabled": True, "order": 1},
        {"key": "roadmap", "label": "Roadmap", "path": "/roadmap", "enabled": True, "order": 2},
        {"key": "certifications", "label": "Certifications", "path": "/certifications", "enabled": True, "order": 3},
        {"key": "projects", "label": "Projects", "path": "/projects", "enabled": True, "order": 4},
        {"key": "analytics", "label": "Analytics", "path": "/analytics", "enabled": True, "order": 5},
        {"key": "resume", "label": "Resume", "path": "/resume", "enabled": True, "order": 6},
        {"key": "compare", "label": "Compare", "path": "/compare", "enabled": True, "order": 7},
        {"key": "badges", "label": "Badges", "path": "/badges", "enabled": True, "order": 8},
        {"key": "jobs", "label": "Jobs", "path": "/jobs", "enabled": True, "order": 9},
        {"key": "interview", "label": "Interview", "path": "/interview", "enabled": True, "order": 10},
        {"key": "challenges", "label": "Challenges", "path": "/challenges", "enabled": True, "order": 11},
        {"key": "settings", "label": "Settings", "path": "/settings", "enabled": True, "order": 12},
    ],
    "seo": {
        "title": "PFJ — Path For Job | AI Career Intelligence",
        "description": "AI-driven career intelligence platform for placement readiness.",
    },
}


def _doc(db):
    return db.collection("site_config").document("main")


def _deep_merge(base: dict, override: dict) -> dict:
    out = copy.deepcopy(base)
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = _deep_merge(out[key], value)
        else:
            out[key] = value
    return out


def get_site_config(db) -> dict:
    """Full effective config = stored values deep-merged over defaults."""
    snap = _doc(db).get()
    stored = (snap.to_dict() if snap.exists else {}) or {}
    return _deep_merge(DEFAULT_CONFIG, stored)


def update_config_section(db, section: str, values) -> dict:
    """Merge `values` into one config section (lists like `nav` are replaced wholesale)."""
    if section not in ALLOWED_SECTIONS:
        raise ValueError(f"Invalid config section: {section}")

    current = get_site_config(db)
    if isinstance(values, dict) and isinstance(current.get(section), dict):
        merged = _deep_merge(current.get(section, {}), values)
    else:
        merged = values

    _doc(db).set({section: merged}, merge=True)
    return get_site_config(db)


def log_audit(db, admin: dict, action: str, detail: dict | None = None) -> None:
    db.collection("audit_logs").document().set({
        "actor_uid": admin.get("uid"),
        "actor_email": admin.get("email"),
        "actor_role": admin.get("role"),
        "action": action,
        "detail": detail or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


def get_audit_logs(db, limit: int = 50) -> list:
    docs = (
        db.collection("audit_logs")
        .order_by("timestamp", direction="DESCENDING")
        .limit(limit)
        .get()
    )
    return [{**(d.to_dict() or {}), "id": d.id} for d in docs]
