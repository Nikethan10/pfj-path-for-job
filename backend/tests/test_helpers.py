"""Unit tests for pure helpers (no Firebase or network access required)."""
import math
from datetime import datetime, timezone

from utils.slugs import skill_doc_id
from services.activity_service import activity_type, timestamp_to_date


def test_skill_doc_id_passthrough_for_plain_names():
    # Names without special characters must map to themselves so documents
    # created by older builds (keyed by the raw name) stay reachable.
    assert skill_doc_id("Python") == "Python"
    assert skill_doc_id("Data Structures") == "Data Structures"


def test_skill_doc_id_sanitizes_firestore_unsafe_names():
    assert "/" not in skill_doc_id("CI/CD")
    assert skill_doc_id("CI/CD") == "CI-CD"
    assert skill_doc_id("") != ""
    assert skill_doc_id("..") not in (".", "..")


def test_activity_type_reads_both_field_names():
    assert activity_type({"type": "add_skill"}) == "add_skill"
    assert activity_type({"action_type": "add_skill"}) == "add_skill"
    assert activity_type({"type": "new", "action_type": "old"}) == "new"
    assert activity_type({}) == ""


def test_timestamp_to_date_handles_iso_strings():
    assert timestamp_to_date("2026-07-07T12:00:00+00:00") == "2026-07-07"


def test_timestamp_to_date_handles_datetimes():
    # Older documents hold Firestore server timestamps (datetime objects);
    # this used to crash with AttributeError: 'datetime' has no 'split'.
    dt = datetime(2026, 7, 7, 12, 0, tzinfo=timezone.utc)
    assert timestamp_to_date(dt) == "2026-07-07"


def test_timestamp_to_date_handles_garbage():
    assert timestamp_to_date(None) == ""
    assert timestamp_to_date(12345) == ""


def test_quiz_pass_threshold_scales_with_question_count():
    # Mirrors routes/roadmap.py: pass at ~two-thirds, minimum one correct.
    threshold = lambda total: max(1, math.ceil(total * 2 / 3))
    assert threshold(3) == 2   # classic 2-of-3
    assert threshold(1) == 1   # single-question AI fallback is passable
    assert threshold(5) == 4


def test_resolve_canonical_role():
    from utils.roles import resolve_canonical_role, CANONICAL_ROLES

    # canonical names pass through untouched
    for role in CANONICAL_ROLES:
        assert resolve_canonical_role(role) == role

    # free-form roles map to the closest canonical one
    assert resolve_canonical_role("Cloud Architect") == "Full Stack Developer"
    assert resolve_canonical_role("Frontend Developer") == "Full Stack Developer"
    assert resolve_canonical_role("AI Engineer") == "ML Engineer"
    assert resolve_canonical_role("Penetration Tester") == "Cyber Security Specialist"
    assert resolve_canonical_role("Firmware Engineer") == "Embedded Systems Engineer"
    assert resolve_canonical_role("") == "Software Engineer"
    assert resolve_canonical_role("Astronaut") == "Software Engineer"


def test_challenge_repository_is_valid():
    """Every challenge must satisfy the dual-language runner's constraints."""
    import ast, json, os, re

    path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "challenges_repository.json")
    challenges = json.load(open(path, encoding="utf-8"))["challenges"]
    assert len(challenges) > 100

    ids = [c["id"] for c in challenges]
    assert len(ids) == len(set(ids)), "duplicate challenge ids"

    for c in challenges:
        ic = c.get("initial_code") or {}
        assert ic.get("python") and ic.get("javascript"), f"{c['id']}: missing starter code"
        assert c.get("test_cases"), f"{c['id']}: no test cases"
        assert c.get("difficulty") in ("Easy", "Medium", "Hard"), f"{c['id']}: bad difficulty"
        for tc in c["test_cases"]:
            # literals must parse in Python...
            ast.literal_eval("(" + tc["input"] + ",)")
            ast.literal_eval(tc["expected"])
            # ...and must not use language-specific booleans/null
            combined = tc["input"] + " " + tc["expected"]
            assert not re.search(r"\b(true|false|null|True|False|None)\b", combined), \
                f"{c['id']}: language-specific literal in tests"
