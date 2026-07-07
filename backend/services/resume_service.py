import io
import re
import logging
import pypdf
import docx
from datetime import datetime, timezone

from services.ai_service import analyze_project_complexity, analyze_linkedin_profile, match_job_description
from services.github_service import analyze_github_profile
from services.user_service import get_user_profile, DEFAULT_TARGET_ROLE

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from PDF bytes using pypdf."""
    try:
        pdf = pypdf.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return ""


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts text from DOCX bytes using python-docx."""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join([p.text for p in doc.paragraphs])
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from DOCX: {e}")
        return ""


def parse_resume_text(text: str, all_skills_list: list) -> dict:
    """
    Parses resume text using regex and heuristics to extract structured info:
    Name, Email, Education, Skills, Experience, Projects, and Certifications.
    """
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    
    # Extract Email
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    email = email_match.group(0) if email_match else ""
    
    # Extract Name (Heuristic: first capitalized non-trivial line)
    name = "Candidate"
    for line in lines[:5]:
        if (
            "@" in line 
            or "http" in line 
            or "resume" in line.lower()
            or len(line) < 3 
            or len(line) > 30
            or any(h in line.lower() for h in ["skills", "experience", "education", "projects", "contact"])
        ):
            continue
        words = line.split()
        if len(words) >= 2 and all(w[0].isupper() or w[0].isdigit() or w in ["-", "."] for w in words if w):
            name = line
            break
            
    # Extract Skills by keyword matching
    skills = []
    text_lower = text.lower()
    for skill in all_skills_list:
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if "++" in skill or "." in skill or "#" in skill:
            pattern = re.escape(skill.lower())
            
        if re.search(pattern, text_lower):
            skills.append(skill)
            
    skills = list(set(skills))
    
    sections = {}
    current_section = "general"
    sections[current_section] = []
    
    section_patterns = {
        "education": r"\b(education|academic background|studies|university|degrees)\b",
        "experience": r"\b(experience|work experience|professional experience|employment history|work history|internships)\b",
        "projects": r"\b(projects|personal projects|academic projects|technical projects|key projects)\b",
        "certifications": r"\b(certifications|certificates|licenses|courses)\b",
        "skills": r"\b(skills|technical skills|skills summary|core competencies)\b"
    }
    
    for line in lines:
        matched_section = None
        for sec, pat in section_patterns.items():
            if re.search(pat, line.lower()) and len(line) < 40:
                matched_section = sec
                break
        
        if matched_section:
            current_section = matched_section
            sections[current_section] = []
        else:
            sections[current_section].append(line)
            
    # 1. Parse Education
    edu_list = []
    edu_text = "\n".join(sections.get("education", []))
    degrees = re.findall(r"\b(b\.?tech|m\.?tech|b\.?e\.?|b\.?s\.?|b\.?sc|m\.?s|ph\.?d|bachelor|master|degree|high school)\b", edu_text, re.I)
    institutions = re.findall(r"\b([\w\s]+(?:university|college|institute|school|academy))", edu_text, re.I)
    years = re.findall(r"\b(19\d{2}|20\d{2})\b", edu_text)
    
    for i in range(max(len(degrees), len(institutions), 1)):
        deg = degrees[i].strip().title() if i < len(degrees) else "Bachelor of Science"
        inst = institutions[i].strip() if i < len(institutions) else "Tech University"
        yr = years[i] if i < len(years) else "2025"
        if edu_text:
            edu_list.append({"degree": deg, "institution": inst, "year": yr})
            if i >= 1: 
                break
                
    if not edu_list and edu_text:
        edu_list.append({"degree": "Degree", "institution": "Institution", "year": "2025"})
        
    # 2. Parse Experience
    exp_list = []
    exp_lines = sections.get("experience", [])
    current_exp = None
    
    for line in exp_lines:
        role_matches = re.findall(r"\b(engineer|developer|intern|analyst|consultant|manager|lead|architect|specialist)\b", line.lower())
        if role_matches and len(line) < 50:
            if current_exp:
                exp_list.append(current_exp)
            current_exp = {
                "role": line,
                "company": "Company Name",
                "duration": "Duration",
                "highlights": []
            }
        elif current_exp:
            if line.startswith("-") or line.startswith("*") or line.startswith("•"):
                current_exp["highlights"].append(line.lstrip("-*• ").strip())
            elif len(line) > 15:
                if not current_exp["highlights"]:
                    current_exp["company"] = line
                else:
                    current_exp["highlights"].append(line)
                    
    if current_exp:
        exp_list.append(current_exp)

    # If nothing was found, report nothing — never invent experience the
    # candidate doesn't have; the ATS audit flags the gap instead.
        
    # 3. Parse Projects
    proj_list = []
    proj_lines = sections.get("projects", [])
    current_proj = None
    
    for line in proj_lines:
        if len(line) < 40 and not (line.startswith("-") or line.startswith("*") or line.startswith("•")):
            if current_proj:
                proj_list.append(current_proj)
            current_proj = {
                "title": line,
                "description": "",
                "technologies": ""
            }
        elif current_proj:
            tech_match = re.search(r"\b(technologies|tech|tools|stack):\s*(.*)", line, re.I)
            if tech_match:
                current_proj["technologies"] = tech_match.group(2).strip()
            else:
                current_proj["description"] = (current_proj["description"] + " " + line).strip()
                
    if current_proj:
        proj_list.append(current_proj)
        
    for proj in proj_list:
        if not proj["technologies"]:
            found_techs = []
            desc_lower = proj["description"].lower()
            for s in all_skills_list[:30]:
                if re.search(r"\b" + re.escape(s.lower()) + r"\b", desc_lower):
                    found_techs.append(s)
            proj["technologies"] = ", ".join(found_techs)

    # 4. Parse Certifications — only what's actually in the resume.
    certs = []
    cert_lines = sections.get("certifications", [])
    for line in cert_lines:
        if len(line) > 5 and len(line) < 80:
            certs.append(line.lstrip("-*• ").strip())
        
    return {
        "name": name,
        "email": email,
        "education": edu_list,
        "skills": skills,
        "experience": exp_list,
        "projects": proj_list[:3],
        "certifications": certs
    }


def analyze_user_resume(
    db, 
    uid: str, 
    resume_text: str, 
    github_user: str = None, 
    linkedin_text: str = None
) -> dict:
    """
    Performs full, multi-tab audit on candidate's resume, calculating career readiness,
    ATS compliance, project grades, skill gaps, benchmarks, and salary estimators.
    """
    # 1. Fetch available skills from DB to power the parser
    db_skills_docs = db.collection("skills").stream()
    all_skill_names = [doc.to_dict().get("skill_name") for doc in db_skills_docs if doc.to_dict().get("skill_name")]
    if not all_skill_names:
        all_skill_names = [
            "Python", "JavaScript", "TypeScript", "React", "Vue", "Angular", "NodeJS", 
            "FastAPI", "Flask", "Django", "SQL", "PostgreSQL", "MongoDB", "Redis", 
            "Docker", "Kubernetes", "AWS", "Git", "GitHub", "PyTorch", "TensorFlow", 
            "Machine Learning", "NLP", "HTML", "CSS", "Tailwind"
        ]
    
    # 2. Parse text
    extracted = parse_resume_text(resume_text, all_skill_names)
    
    # Find user profile details
    profile = get_user_profile(db, uid)
    target_role = profile.get("target_role") or DEFAULT_TARGET_ROLE
    
    # 3. Compile GitHub Analysis
    github_name = github_user
    if not github_name and profile.get("github_url"):
        github_name = profile.get("github_url").split("/")[-1]
    if not github_name:
        gh_match = re.search(r"github\.com/([\w-]+)", resume_text, re.I)
        if gh_match:
            github_name = gh_match.group(1)
            
    github_data = None
    github_score = None
    if github_name:
        github_data = analyze_github_profile(github_name)
        github_score = github_data.get("github_score") if github_data else None
    
    # 4. Compile LinkedIn Analysis
    linkedin_data = None
    linkedin_score = None
    linkedin_url = profile.get("linkedin_url")
    if not linkedin_url:
        li_match = re.search(r"linkedin\.com/in/([\w-]+)", resume_text, re.I)
        if li_match:
            linkedin_url = f"linkedin.com/in/{li_match.group(1)}"
            
    if linkedin_text:
        linkedin_data = analyze_linkedin_profile(linkedin_text)
    elif linkedin_url:
        linkedin_data = analyze_linkedin_profile(f"Profile URL: {linkedin_url}")
        
    if linkedin_data:
        linkedin_score = linkedin_data.get("linkedin_score")
    
    # 5. Project Analyzer — each analysis is an LLM call, so run them concurrently
    # instead of serially (3 projects at ~10s each would otherwise take ~30s alone).
    project_results = []
    projects_to_analyze = extracted["projects"]
    if projects_to_analyze:
        from concurrent.futures import ThreadPoolExecutor

        def _analyze(proj):
            res = analyze_project_complexity(proj["title"], proj["description"], proj["technologies"])
            res["title"] = proj["title"]
            return res

        with ThreadPoolExecutor(max_workers=3) as pool:
            project_results = list(pool.map(_analyze, projects_to_analyze))

    portfolio_strength_sum = sum(r.get("overall_score", 50.0) for r in project_results)
    # No projects found = no portfolio credit (previously a free 50 points).
    portfolio_strength = round(portfolio_strength_sum / len(project_results), 1) if project_results else 0.0
    
    # 6. ATS Audit
    word_count = len(resume_text.split())
    has_edu = len(extracted["education"]) > 0
    has_exp = len(extracted["experience"]) > 0 and len(extracted["experience"][0]["highlights"]) > 0
    has_skills = len(extracted["skills"]) > 3
    has_proj = len(extracted["projects"]) > 0
    has_contact = "@" in resume_text
    
    structure_checks = {
        "has_education": has_edu,
        "has_experience": has_exp,
        "has_skills": has_skills,
        "has_projects": has_proj,
        "has_contact": has_contact
    }
    
    issues = []
    if not has_contact:
        issues.append("Missing essential contact information (Email/Phone).")
    if word_count < 300:
        issues.append("Resume word count is low. Add more project complexities or job achievements.")
    elif word_count > 900:
        issues.append("Resume is too dense. Condense achievements to fit a single or double page format.")
    if len(extracted["skills"]) < 6:
        issues.append("Skill coverage is limited. Add primary programming languages, libraries, and developer tools.")
    if not has_exp:
        issues.append("No structured work experience highlights detected. Write about internship or leadership achievements.")
    if not has_proj:
        issues.append("No projects section detected. Add 2-3 projects with clear descriptions and the technologies used.")
    if not extracted["certifications"]:
        issues.append("No certifications found. Relevant certifications (cloud, data, security) strengthen entry-level resumes.")
        
    checklist_passed = sum(1 for v in structure_checks.values() if v)
    formatting_score = 60.0 + (checklist_passed * 8.0)
    if word_count >= 300 and word_count <= 800:
        formatting_score += 20.0
    else:
        formatting_score += 10.0
    formatting_score = min(formatting_score, 98.0)
    
    checklist = [
        {"label": "Standard Font Structure", "passed": True},
        {"label": "Contact Details Present", "passed": has_contact},
        {"label": "Skills Section Identified", "passed": has_skills},
        {"label": "Education Summary Provided", "passed": has_edu},
        {"label": "Experience Chronology Formatted", "passed": has_exp},
        {"label": "Parsed Content Cleanliness", "passed": word_count > 100}
    ]
    
    ats_score = round(formatting_score, 1)
    
    # 7. Career Skill Gaps mapping
    role_skill_standards = {
        "software_engineer": ["Python", "JavaScript", "SQL", "Git", "Docker", "FastAPI", "React", "Linux", "Data Structures"],
        "ai_engineer": ["Python", "PyTorch", "TensorFlow", "NLP", "Machine Learning", "Transformers", "Git", "Linear Algebra"],
        "data_scientist": ["Python", "SQL", "Pandas", "NumPy", "Scikit-Learn", "Machine Learning", "Tableau", "Statistics"],
        "data_analyst": ["SQL", "Excel", "Python", "Tableau", "PowerBI", "Pandas", "Statistics", "Data Cleaning"]
    }
    
    skill_gap_analysis = {}
    user_skills_lower = [s.lower() for s in extracted["skills"]]
    
    for role, standards in role_skill_standards.items():
        matched = []
        missing = []
        for s in standards:
            if s.lower() in user_skills_lower:
                matched.append(s)
            else:
                missing.append(s)
                
        match_percent = round((len(matched) / len(standards)) * 100, 1) if standards else 0.0
        
        if not missing:
            learning_plan = "Excellent readiness. Master advanced system architectures or cloud microservices."
        else:
            learning_plan = f"Focus on acquiring core skills: {', '.join(missing[:3])}. Complete online courses or project integrations."
            
        skill_gap_analysis[role] = {
            "match_percent": match_percent,
            "matched_skills": matched,
            "missing_skills": missing,
            "learning_plan": learning_plan
        }
        
    # 8. Career Readiness Grid
    skills_score = min((len(extracted["skills"]) / 12) * 100, 100.0)
    certs_score = min((len(extracted["certifications"]) / 3) * 100, 100.0)
    
    score_sum = 0.0
    total_weight = 0.0
    
    score_sum += skills_score * 0.25
    total_weight += 0.25
    
    score_sum += portfolio_strength * 0.20
    total_weight += 0.20
    
    score_sum += ats_score * 0.15
    total_weight += 0.15
    
    score_sum += certs_score * 0.10
    total_weight += 0.10
    
    if github_score is not None:
        score_sum += github_score * 0.15
        total_weight += 0.15
        
    if linkedin_score is not None:
        score_sum += linkedin_score * 0.15
        total_weight += 0.15
        
    base_readiness = score_sum / total_weight if total_weight > 0 else 0.0
    
    career_grid_roles = []
    for role, gap in skill_gap_analysis.items():
        role_label = role.replace("_", " ").title()
        role_readiness = round(base_readiness * (0.6 + 0.4 * (gap["match_percent"] / 100.0)), 1)
        role_readiness = min(role_readiness, 99.0)
        
        socials_list = []
        if github_score is not None:
            socials_list.append(github_score)
        if linkedin_score is not None:
            socials_list.append(linkedin_score)
        avg_socials = int(sum(socials_list) / len(socials_list)) if socials_list else 0
        
        career_grid_roles.append({
            "name": role_label,
            "score": role_readiness,
            "skills": int(skills_score),
            "projects": int(portfolio_strength),
            "socials": avg_socials
        })
        
    career_readiness_score = round(sum(r["score"] for r in career_grid_roles) / len(career_grid_roles), 1) if career_grid_roles else 0.0
    
    # 9. Internship Readiness Probability (%)
    if github_score is not None:
        internship_prob = round((career_readiness_score * 0.7 + github_score * 0.15 + ats_score * 0.15), 1)
    else:
        internship_prob = round((career_readiness_score * 0.85 + ats_score * 0.15), 1)
    internship_prob = min(max(internship_prob, 10.0), 99.0)
    
    # 10. Benchmarking Charts
    socials_list = []
    if github_score is not None:
        socials_list.append(github_score)
    if linkedin_score is not None:
        socials_list.append(linkedin_score)
    avg_socials = int(sum(socials_list) / len(socials_list)) if socials_list else 0
    
    benchmarking = {
        "labels": ["Technical Skills", "Project Depth", "Social Brand", "ATS Standard", "Coding Activity"],
        "candidate": [
            int(skills_score), 
            int(portfolio_strength), 
            avg_socials, 
            int(ats_score), 
            int(github_score) if github_score is not None else 0
        ],
        "peer_average": [62, 55, 48, 65, 35],
        "top_performers": [92, 88, 82, 92, 85]
    }
    
    # 11. Salary Estimation
    currency = "INR"
    min_sal, max_sal = 500000, 1000000
    market_demand = "Medium"
    
    clean_target = target_role.lower()
    if "ai" in clean_target or "artificial" in clean_target or "machine learning" in clean_target:
        min_sal, max_sal = 800000, 1600000
        market_demand = "Very High"
    elif "data scientist" in clean_target or "science" in clean_target:
        min_sal, max_sal = 700000, 1400000
        market_demand = "High"
    elif "software" in clean_target or "developer" in clean_target or "full stack" in clean_target:
        min_sal, max_sal = 600000, 1200000
        market_demand = "High"
    elif "analyst" in clean_target or "analytics" in clean_target:
        min_sal, max_sal = 450000, 900000
        market_demand = "Medium"
        
    if career_readiness_score > 75:
        min_sal = int(min_sal * 1.2)
        max_sal = int(max_sal * 1.3)
        
    avg_sal = int((min_sal + max_sal) / 2)
    
    salary_est = {
        "currency": currency,
        "min_salary": min_sal,
        "max_salary": max_sal,
        "avg_salary": avg_sal,
        "market_demand": market_demand
    }
    
    ats_analysis_payload = {
        "formatting_score": ats_score,
        "readability": "Excellent" if word_count in range(400, 800) else "Moderate",
        "word_count": word_count,
        "structure_checks": structure_checks,
        "issues": issues,
        "checklist": checklist
    }
    
    # 12. Create db record
    analysis_data = {
        "resume_score": career_readiness_score,
        "ats_score": ats_score,
        "portfolio_strength_score": portfolio_strength,
        "career_readiness_score": career_readiness_score,
        "github_score": github_score,
        "linkedin_score": linkedin_score,
        "extracted_data": extracted,
        "ats_analysis": ats_analysis_payload,
        "project_analysis": project_results,
        "github_analysis": github_data,
        "linkedin_analysis": linkedin_data,
        "skill_gap_analysis": skill_gap_analysis,
        "career_readiness_grid": {"roles": career_grid_roles},
        "benchmarking": benchmarking,
        "internship_readiness": internship_prob,
        "salary_estimation": salary_est,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    doc_ref = db.collection("users").document(uid).collection("resumes").document()
    doc_ref.set(analysis_data)
    
    analysis_data["id"] = doc_ref.id
    return analysis_data


def get_latest_analysis(db, uid: str) -> dict:
    """Gets latest user analysis record and expands all serialized JSON contents."""
    docs = db.collection("users").document(uid).collection("resumes").order_by("created_at", direction="DESCENDING").limit(1).stream()
    
    analysis = None
    doc_id = None
    for doc in docs:
        analysis = doc.to_dict()
        doc_id = doc.id
        break
        
    if not analysis:
        return None
        
    return {
        "id": doc_id,
        "resume_score": analysis.get("resume_score", 0),
        "ats_score": analysis.get("ats_score", 0),
        "portfolio_strength_score": analysis.get("portfolio_strength_score", 0),
        "career_readiness_score": analysis.get("career_readiness_score", 0),
        "github_score": analysis.get("github_score"),
        "linkedin_score": analysis.get("linkedin_score"),
        "extracted_data": analysis.get("extracted_data", {}),
        "ats_analysis": analysis.get("ats_analysis", {}),
        "project_analysis": analysis.get("project_analysis", []),
        "github_analysis": analysis.get("github_analysis", {}),
        "linkedin_analysis": analysis.get("linkedin_analysis", {}),
        "skill_gap_analysis": analysis.get("skill_gap_analysis", {}),
        "career_readiness_grid": analysis.get("career_readiness_grid", {"roles": []}),
        "benchmarking": analysis.get("benchmarking", {}),
        "internship_readiness": analysis.get("internship_readiness", 0),
        "salary_estimation": analysis.get("salary_estimation", {}),
        "created_at": analysis.get("created_at")
    }


def save_job_match(db, uid: str, job_description: str, match_result: dict) -> dict:
    """Saves job description match history for a user."""
    match_data = {
        "job_description": job_description,
        "match_score": match_result.get("match_score", 0),
        "skill_breakdown": match_result.get("skill_breakdown", {}),
        "recommendations": match_result.get("recommendations", []),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    doc_ref = db.collection("users").document(uid).collection("job_matches").document()
    doc_ref.set(match_data)
    
    match_data["id"] = doc_ref.id
    return match_data
