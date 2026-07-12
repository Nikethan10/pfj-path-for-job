import json
import os
import random
from services.ai_service import run_ai_prompt, clean_json_response
from utils.roles import resolve_canonical_role

# Cache for dynamically generated challenges
DYNAMIC_CHALLENGES = {}

def load_challenges():
    file_path = os.path.join(os.path.dirname(__file__), 'challenges_repository.json')
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f).get('challenges', [])
    return []

def get_challenges_for_role(role: str):
    """Returns a curated list of challenges based on the user's role.

    Free-form roles (e.g. "Cloud Architect") are first mapped onto the closest
    canonical role, so every user gets a relevant, non-empty catalog. Previously
    unmapped roles matched nothing and the fallback compared 'General' against
    lowercased strings — users saw an empty challenges tab.
    """
    all_challenges = load_challenges()
    role = resolve_canonical_role((role or "").strip())

    # A challenge is included if its roles list contains the resolved role
    # (case-insensitive) or if the roles list is missing/empty (general challenge).
    filtered = []
    for c in all_challenges:
        challenge_roles = [r.lower() for r in c.get('roles', [])]
        if not challenge_roles or role.lower() in challenge_roles or 'general' in challenge_roles:
            filtered.append(c)

    # Safety net: never return an empty catalog.
    if not filtered:
        filtered = all_challenges

    # Sort by difficulty: Easy -> Medium -> Hard
    diff_map = {"Easy": 0, "Medium": 1, "Hard": 2}
    filtered.sort(key=lambda x: diff_map.get(x.get("difficulty", "Easy"), 0))

    return filtered

def get_challenge_by_id(challenge_id: str):
    # Check dynamic challenges first
    if challenge_id in DYNAMIC_CHALLENGES:
        return DYNAMIC_CHALLENGES[challenge_id]
        
    all_challenges = load_challenges()
    for c in all_challenges:
        if c["id"] == challenge_id:
            return c
    return None

def _is_valid_challenge(c) -> bool:
    """Ensure an AI-generated challenge has every field the test runner needs."""
    if not isinstance(c, dict):
        return False
    if not all(c.get(k) for k in ("title", "difficulty", "category", "description")):
        return False
    code = c.get("initial_code")
    if not isinstance(code, dict) or not code.get("python") or not code.get("javascript"):
        return False
    tests = c.get("test_cases")
    if not isinstance(tests, list) or not tests:
        return False
    return all(isinstance(t, dict) and "input" in t and "expected" in t for t in tests)


# Rotating topics so repeated "Generate" clicks explore different problem types
# instead of the model settling on the same kind of question.
_CHALLENGE_FOCUS = [
    "array manipulation", "two-pointer techniques", "hash maps / frequency counting",
    "sliding window", "string parsing", "stacks or queues", "recursion / backtracking",
    "dynamic programming", "greedy algorithms", "binary search", "sorting with a twist",
    "matrix traversal", "bit manipulation", "math and number theory", "intervals",
    "graph traversal (BFS/DFS)", "prefix sums", "simulation",
]


def _static_dynamic_challenge(role: str, avoid=None) -> dict:
    """Pick a static problem and present it as a fresh challenge (always runnable).

    Skips base problems the user was recently served (matched by title) when possible.
    """
    all_static = load_challenges()
    if not all_static:
        return {}
    role = resolve_canonical_role(role)
    avoid_norm = {(a or "").strip().lower().replace("[ai] ", "") for a in (avoid or [])}
    role_challenges = [
        c for c in all_static
        if not c.get("roles") or role.lower() in [r.lower() for r in c.get("roles", [])]
    ]
    pool = role_challenges if role_challenges else all_static
    fresh = [c for c in pool if c.get("title", "").strip().lower() not in avoid_norm]
    base = random.choice(fresh if fresh else pool)
    new_id = f"ai-{base['id']}-{random.randint(100, 999)}"
    dynamic_copy = {**base, "id": new_id, "title": f"[AI] {base['title']}"}
    DYNAMIC_CHALLENGES[new_id] = dynamic_copy
    return dynamic_copy


def generate_dynamic_challenge(role: str, avoid=None) -> dict:
    """Generate a fresh coding challenge via the configured AI provider (Groq/Gemini).

    `avoid` is a list of challenge titles the user was recently served; the model is told
    not to reproduce them, so repeated "Generate" clicks don't hand back the same problem.
    Falls back to a static problem (guaranteed runnable) when AI is unavailable,
    not configured, or returns a malformed challenge.
    """
    avoid = [a for a in (avoid or []) if a]
    seed = random.randint(1000, 9999)
    focus = random.choice(_CHALLENGE_FOCUS)

    avoid_block = ""
    if avoid:
        recent = "\n".join(f"- {a}" for a in avoid[-15:])
        avoid_block = f"\nDo NOT reproduce or lightly reword any of these recently-generated challenges:\n{recent}\n"

    prompt = f"""Generate ONE original coding challenge for a candidate targeting the role: {role}.
Center it on this topic: {focus}.
{avoid_block}
Return ONLY a valid JSON object (no markdown) with EXACTLY this structure:
{{
  "title": "Short title",
  "difficulty": "Easy",
  "category": "e.g. Arrays, Strings, SQL, ML Foundations",
  "description": "Clear problem statement. Use \\n for line breaks.",
  "initial_code": {{
    "python": "def solution(args):\\n    # Write your code here\\n    pass",
    "javascript": "function solution(args) {{\\n    // Write your code here\\n}}"
  }},
  "test_cases": [
    {{"input": "comma-separated args as passed to the function", "expected": "expected return value"}}
  ]
}}
Uniqueness token (ignore in output, only forces variety): {seed}
Keep it self-contained and solvable in one function. Provide 2-3 correct, consistent test cases."""
    system_instruction = "You are a coding-interview problem setter. Return ONLY valid JSON."

    try:
        # High temperature so repeated generations differ.
        ai_output = run_ai_prompt(prompt, system_instruction, temperature=0.9)
        if ai_output:
            challenge = json.loads(clean_json_response(ai_output))
            if _is_valid_challenge(challenge):
                challenge["id"] = f"ai-gen-{random.randint(10000, 99999)}"
                challenge.setdefault("roles", [role])
                DYNAMIC_CHALLENGES[challenge["id"]] = challenge
                return challenge
    except Exception as e:
        print(f"[AI] Dynamic challenge generation failed: {e}. Falling back to a static problem.")

    return _static_dynamic_challenge(role, avoid=avoid)
