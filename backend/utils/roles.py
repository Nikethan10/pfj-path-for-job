"""Map free-form target roles onto the platform's ten canonical roles.

Users can type any target role (e.g. "Cloud Architect", "Frontend Developer",
"SDE-1"), but challenges, interview banks, and seed data are tagged with ten
canonical role names. This resolver keeps that mapping in one place.
"""

CANONICAL_ROLES = [
    "Software Engineer",
    "Full Stack Developer",
    "Data Scientist",
    "ML Engineer",
    "Data Analyst",
    "Cyber Security Specialist",
    "Embedded Systems Engineer",
    "VLSI Design Engineer",
    "Robotics Engineer",
    "Mechanical Engineer",
]

_KEYWORD_MAP = [
    (("ml", "machine learning", "ai engineer", "deep learning", "llm"), "ML Engineer"),
    (("data scien",), "Data Scientist"),
    (("data analyst", "analytics", "business intelligence", "bi "), "Data Analyst"),
    (("full stack", "fullstack", "frontend", "front-end", "backend", "back-end",
      "web", "cloud", "devops", "site reliability", "platform"), "Full Stack Developer"),
    (("security", "cyber", "penetration", "soc "), "Cyber Security Specialist"),
    (("embedded", "firmware", "iot"), "Embedded Systems Engineer"),
    (("vlsi", "verilog", "asic", "fpga", "chip"), "VLSI Design Engineer"),
    (("robot", "control systems"), "Robotics Engineer"),
    (("mechanical", "thermal", "cad"), "Mechanical Engineer"),
]


def resolve_canonical_role(role: str) -> str:
    """Return the closest canonical role for any user-entered role string."""
    if not role:
        return "Software Engineer"
    if role in CANONICAL_ROLES:
        return role
    r = role.lower()
    for keywords, canonical in _KEYWORD_MAP:
        if any(k in r for k in keywords):
            return canonical
    return "Software Engineer"
