from typing import List, Dict, Set
import re


STOP_WORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "was", "are", "were", "been", "be",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "this", "that", "these",
    "those", "i", "me", "my", "we", "our", "you", "your", "he", "she",
    "it", "they", "them", "their", "what", "which", "who", "when", "where",
    "how", "not", "no", "as", "if", "then", "than", "too", "very", "just",
    "about", "also", "am", "any", "each", "few", "more", "most", "other",
    "some", "such", "up", "out", "so", "over", "between",
}


def extract_keywords(text: str) -> Set[str]:
    """Extract meaningful keywords from resume text."""
    text = text.lower()
    text = re.sub(r"[^a-zA-Z0-9\s\+\#\.]", " ", text)
    words = text.split()
    return {w.strip(".") for w in words if w not in STOP_WORDS and len(w) > 1}


def analyze_resume(
    resume_text: str,
    target_role: str,
    required_skills: List[str],
    all_skill_names: List[str],
) -> Dict:
    """
    Analyze resume against target role requirements.
    ATS Score = (matched_required / total_required) * 100
    Resume Score = 0.5*skill_coverage + 0.3*skill_density + 0.2*length_score
    """
    keywords = extract_keywords(resume_text)
    required_lower = {s.lower().strip() for s in required_skills}
    all_lower = {s.lower().strip() for s in all_skill_names}

    matched_required = set()
    for skill in required_lower:
        parts = skill.split()
        if skill in keywords or any(p in keywords for p in parts if len(p) > 2):
            matched_required.add(skill)

    all_matched = set()
    for skill in all_lower:
        parts = skill.split()
        if skill in keywords or any(p in keywords for p in parts if len(p) > 2):
            all_matched.add(skill)

    missing = list(required_lower - matched_required)
    keyword_matches = list(matched_required)

    ats_score = (len(matched_required) / len(required_lower) * 100) if required_lower else 0

    skill_coverage = ats_score / 100
    skill_density = min(len(all_matched) / 10, 1.0)
    word_count = len(resume_text.split())
    if word_count < 800:
        length_score = min(word_count / 300, 1.0)
    else:
        length_score = max(1.0 - (word_count - 800) / 1000, 0.5)

    resume_score = round((skill_coverage * 0.5 + skill_density * 0.3 + length_score * 0.2) * 100, 1)

    suggestions = []
    if missing:
        suggestions.append(f"Add these key skills: {', '.join(missing[:5])}")
    if word_count < 200:
        suggestions.append("Resume is too short. Add more project and experience details.")
    if word_count > 1000:
        suggestions.append("Consider condensing your resume for better readability.")
    if ats_score < 50:
        suggestions.append(f"ATS compatibility for {target_role} is low. Include more technical keywords.")
    if not suggestions:
        suggestions.append("Strong resume! Add quantified achievements for extra impact.")

    return {
        "resume_score": round(resume_score, 1),
        "ats_score": round(ats_score, 1),
        "missing_skills": missing,
        "keyword_matches": keyword_matches,
        "suggestions": suggestions,
    }
