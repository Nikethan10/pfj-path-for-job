"""
Smoke tests that do NOT require Firebase credentials or network access.

They exercise the public health route, the security-headers middleware, and confirm
that protected routes reject unauthenticated requests (the OAuth2 scheme rejects a
missing token before Firebase is ever called).

Run with:  pytest   (after `pip install -r requirements-dev.txt`)
"""
from fastapi.testclient import TestClient

import main

client = TestClient(main.app)


def test_health_ok():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}


def test_security_headers_present():
    res = client.get("/api/health")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert "frame-ancestors 'none'" in res.headers.get("Content-Security-Policy", "")


def test_protected_route_requires_auth():
    # No Authorization header -> 401 from the OAuth2 scheme.
    assert client.get("/api/profile").status_code == 401
    assert client.get("/api/skills").status_code == 401
    assert client.get("/api/badges").status_code == 401


def test_quiz_generate_requires_auth():
    # Previously this endpoint was unauthenticated and leaked answer tokens.
    res = client.post("/api/roadmap/quiz/generate", json={"skill_name": "Python"})
    assert res.status_code == 401
