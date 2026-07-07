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
