import json
import re
import logging
from config.settings import get_settings
from database.firebase_db import get_rtdb
import hashlib

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False


def clean_json_response(text: str) -> str:
    """Extracts JSON structure from possible markdown code block wrappers."""
    if not text:
        return ""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text


import random

# Per-call timeout (seconds). Without this a slow provider hangs the request until the
# frontend's 30s axios timeout fires, which shows up to users as an infinite spinner.
AI_TIMEOUT_SECONDS = 25
GROQ_MODEL = "llama-3.3-70b-versatile"
GEMINI_MODEL = "gemini-2.5-flash"


def _gemini_keys() -> list:
    settings = get_settings()
    keys = [k for k in [settings.GEMINI_API_KEY, settings.GEMINI_API_KEY_2] if k]
    random.shuffle(keys)  # spread load across both keys
    return keys


def _groq_keys() -> list:
    settings = get_settings()
    keys = [k for k in [settings.GROQ_API_KEY, settings.GROQ_API_KEY_2] if k]
    random.shuffle(keys)
    return keys


def run_gemini_prompt(prompt: str, system_instruction: str = None, temperature: float = 0.4) -> str:
    if not HAS_GEMINI:
        return None
    full_prompt = prompt
    if system_instruction:
        full_prompt = f"{system_instruction}\n\nUser Request:\n{prompt}"
    # Fail over across keys: if one is rate-limited or erroring, try the other.
    for key in _gemini_keys():
        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel(GEMINI_MODEL)
            response = model.generate_content(
                full_prompt,
                generation_config={"temperature": temperature},
                request_options={"timeout": AI_TIMEOUT_SECONDS},
            )
            return response.text
        except Exception as e:
            logger.warning(f"Gemini generation failed on one key, trying next: {e}")
    return None


def run_groq_prompt(prompt: str, system_instruction: str = None, temperature: float = 0.2) -> str:
    if not HAS_OPENAI:
        return None
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    for key in _groq_keys():
        try:
            client = OpenAI(
                api_key=key,
                base_url="https://api.groq.com/openai/v1",
                timeout=AI_TIMEOUT_SECONDS,
                max_retries=0,  # we do our own failover across keys/providers
            )
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=temperature,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.warning(f"Groq completion failed on one key, trying next: {e}")
    return None


def run_ai_prompt(prompt: str, system_instruction: str = None, prefer: str = "groq", temperature: float = 0.2) -> str:
    """Runs a prompt against Groq or Gemini based on preference.

    `temperature` controls variety: keep it low (~0.2) for JSON-extraction tasks where
    determinism is fine, and raise it (~0.9) for generative tasks like interview
    questions so identical inputs don't keep producing the identical output.
    """
    if prefer == "groq":
        res = run_groq_prompt(prompt, system_instruction, temperature)
        return res if res else run_gemini_prompt(prompt, system_instruction, temperature)
    else:
        res = run_gemini_prompt(prompt, system_instruction, temperature)
        return res if res else run_groq_prompt(prompt, system_instruction, temperature)


def analyze_project_complexity(title: str, description: str, technologies: str) -> dict:
    # Use Gemini for heavy analysis
    system_instruction = (
        "You are an expert technical interviewer and senior software engineer. Analyze the project details "
        "and return a JSON object with: complexity_score (0-100), innovation_score (0-100), industry_value_score (0-100), "
        "overall_score (0-100), strengths (list of strings), weaknesses (list of strings), suggestions (list of strings), "
        "and complexity_breakdown (object with keys: architecture, code_quality, problem_solving). "
        "Return ONLY the raw JSON string, without markdown formatting."
    )
    
    prompt = f"Project Title: {title}\nProject Description: {description}\nTechnologies Used: {technologies}"
    ai_output = run_ai_prompt(prompt, system_instruction, prefer="gemini")
    
    if ai_output:
        try:
            return json.loads(clean_json_response(ai_output))
        except Exception:
            pass
            
    # Mock Fallback based on technologies
    return {
        "complexity_score": 70, "innovation_score": 70, "industry_value_score": 70, "overall_score": 70,
        "strengths": ["Used modern stack"], "weaknesses": ["Lacks testing"], "suggestions": ["Add CI/CD"],
        "complexity_breakdown": {"architecture": 70, "code_quality": 70, "problem_solving": 70}
    }


def rewrite_bullet_points(bullet_points: list) -> dict:
    # Use Gemini for rewriting
    system_instruction = (
        "You are an expert career consultant. Rewrite the given resume bullet points to use strong action verbs, "
        "quantifiable metrics, and clear impact (using the STAR/XYZ format: Accomplished [X] as measured by [Y], by doing [Z]). "
        "Return a JSON object with a single key 'rewritten_points' containing a list of objects, each having "
        "'original', 'rewritten', and 'impact' fields. Return ONLY the raw JSON string, without markdown formatting."
    )
    prompt = f"Bullet points to rewrite:\n" + "\n".join([f"- {pt}" for pt in bullet_points])
    ai_output = run_ai_prompt(prompt, system_instruction, prefer="gemini")
    if ai_output:
        try:
            return json.loads(clean_json_response(ai_output))
        except Exception:
            pass
    return {"rewritten_points": [{"original": pt, "rewritten": pt + " (Optimized)", "impact": "Improved wording."} for pt in bullet_points]}


def match_job_description(resume_text: str, job_description: str) -> dict:
    # Use Gemini for heavy matching
    system_instruction = (
        "You are an ATS parser and recruitment auditor. Compare the provided resume text against the job description. "
        "Return a JSON object with: match_score (float 0-100), matched_skills (list of strings), missing_skills (list of strings), "
        "skill_breakdown (list of objects with 'skill', 'matched' (boolean), and 'importance' ('High', 'Medium', 'Low')), "
        "and recommendations (list of strings). Return ONLY the raw JSON, without markdown code formatting."
    )
    prompt = f"--- RESUME ---\n{resume_text[:4000]}\n--- JOB ---\n{job_description[:4000]}"
    ai_output = run_ai_prompt(prompt, system_instruction, prefer="gemini")
    if ai_output:
        try:
            return json.loads(clean_json_response(ai_output))
        except Exception:
            pass
    return {"match_score": 50, "matched_skills": [], "missing_skills": [], "skill_breakdown": [], "recommendations": []}


def analyze_linkedin_profile(linkedin_text: str) -> dict:
    # Use Gemini for text analysis
    system_instruction = (
        "You are an expert executive recruiter and social branding consultant. Analyze the provided text from "
        "a candidate's LinkedIn profile or draft. Return a JSON object with: linkedin_score (0-100), "
        "headline_suggestions (list), about_suggestions (string), experience_tips (list), project_tips (list), and overall_suggestions (list). "
        "Return ONLY raw JSON without markdown blocks."
    )
    prompt = f"LinkedIn Profile Text:\n{linkedin_text[:4000]}"
    ai_output = run_ai_prompt(prompt, system_instruction, prefer="gemini")
    if ai_output:
        try:
            return json.loads(clean_json_response(ai_output))
        except Exception:
            pass
    return {"linkedin_score": 50, "headline_suggestions": [], "about_suggestions": "", "experience_tips": [], "project_tips": [], "overall_suggestions": []}


def _get_cache_key(skill_name: str) -> str:
    """Generate a consistent safe key for Firebase Realtime Database."""
    return hashlib.md5(skill_name.strip().lower().encode()).hexdigest()

def generate_skill_quiz(skill_name: str) -> dict:
    """
    Generates a 3-question multiple-choice quiz using Groq.
    Caches questions in Firebase Realtime Database to reduce costs.
    """
    import random
    
    # 1. Check Cache
    try:
        ref = get_rtdb().child('cached_quizzes').child(_get_cache_key(skill_name))
        cached_data = ref.get()
        if cached_data and "questions" in cached_data:
            logger.info(f"Quiz cache hit for '{skill_name}'")
            return cached_data
    except Exception as e:
        logger.error(f"Error reading cache for '{skill_name}': {e}")

    # 2. Generate via Groq (Fast & Low Cost)
    prompt = f"""
Generate a multiple-choice quiz with exactly 3 challenging questions to assess a developer's knowledge in '{skill_name}'.
Return ONLY a valid JSON list of objects, where each object has:
- "question": string
- "options": list of 4 strings
- "correct_idx": integer (0 to 3) representing the index of the correct answer in the options list.
"""
    system_instruction = "You are an expert technical interviewer. Return ONLY valid JSON matching the schema."
    
    response = run_ai_prompt(prompt, system_instruction, prefer="groq")
    
    if response:
        try:
            cleaned = clean_json_response(response)
            data = json.loads(cleaned)
            if isinstance(data, list) and len(data) >= 3:
                result = {"questions": data[:3]}
                
                # 3. Save to Cache
                try:
                    get_rtdb().child('cached_quizzes').child(_get_cache_key(skill_name)).set(result)
                    logger.info(f"Quiz cache saved for '{skill_name}'")
                except Exception as cache_err:
                    logger.error(f"Failed to cache quiz: {cache_err}")
                    
                return result
        except Exception as e:
            logger.error(f"Failed to parse AI quiz response: {e}")

    # Fallback to a single mock question if AI fails
    return {"questions": [{
        "question": f"What is a core feature of {skill_name}?",
        "options": ["Scalability", "Latency", "Memory Leak", "Timeout"],
        "correct_idx": 0
    }]}
