from fastapi import APIRouter, Depends, HTTPException, Request
from database.firebase_db import get_firestore
from utils.jwt_handler import verify_token
from middleware.security import limiter
from services.ai_service import run_ai_prompt, clean_json_response
from pydantic import BaseModel, Field
import json
import re
from datetime import datetime

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)

def log_activity(db, uid: str, action_type: str, details: dict = None):
    doc_ref = db.collection("users").document(uid).collection("activity").document()
    data = {
        "type": action_type,
        "timestamp": datetime.utcnow().isoformat()
    }
    if details:
        data.update(details)
    doc_ref.set(data)

@router.post("/chat")
@limiter.limit("20/minute")
def chat_with_assistant(
    request: Request,
    data: ChatRequest,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    user_message = data.message.strip()
    user_message_lower = user_message.lower()
    
    # 1. Fetch user context
    profile_doc = db.collection("users").document(uid).collection("profile").document("main").get()
    profile = profile_doc.to_dict() if profile_doc.exists else {}
    target_role = profile.get("target_role", "Software Engineer")
    branch = profile.get("branch", "CSE")
    year = profile.get("year", 3)
    degree = profile.get("degree", "B.Tech")
    
    # Get active skills
    skills_docs = db.collection("users").document(uid).collection("skills").get()
    skill_names = [doc.to_dict().get("skill_name") for doc in skills_docs if doc.to_dict().get("skill_name")]
            
    active_skills_str = ", ".join(skill_names) if skill_names else "None"
    
    # 2. Try LLM first
    system_instruction = (
        "You are PFJ Intelligence, an advanced AI career mentor and placement copilot. "
        "Your goal is to help students prepare for technical roles (Software Engineer, ML Engineer, Data Scientist, etc.). "
        "Provide detailed, motivating, and actionable responses. Format your answer in readable markdown with bullet points, bolding, and clear spacing. "
        "You MUST respond ONLY with a raw JSON object containing the keys: "
        "'response' (the markdown string), "
        "'path' (optional string path to navigate to, e.g. '/roadmap', '/skills', '/projects', '/interview', '/resume', '/challenges', '/jobs', '/compare'), "
        "and 'action' (optional object, e.g. {'type': 'refresh_data', 'route': 'skills'} or {'type': 'refresh_data', 'route': 'profile'}). "
        "If the user asks to open or navigate to a section (e.g. 'go to roadmap', 'take me to the code editor'), set 'path' to the corresponding route. "
        "Keep the responses highly relevant to the candidate's career details."
    )
    
    prompt = f"""
    Candidate Profile:
    - Degree: {degree} in {branch} ({year} Year)
    - Target Trajectory: {target_role}
    - Active Skills List: {active_skills_str}
    
    User Query: "{user_message}"
    """
    
    ai_output = run_ai_prompt(prompt, system_instruction)
    
    if ai_output:
        try:
            cleaned = clean_json_response(ai_output)
            res_json = json.loads(cleaned)
            if "response" in res_json:
                log_activity(db, uid, "assistant_chat")
                return res_json
        except Exception:
            pass
            
    # 3. Sophisticated offline rules-based NLP fallback
    is_nav_intent = any(verb in user_message_lower for verb in [
        "go to", "open", "take me to", "navigate", "show me", "view", "head to", 
        "switch to", "visit", "redirect"
    ]) or (len(user_message_lower.split()) <= 2 and not any(w in user_message_lower for w in ["why", "how", "what", "will", "is", "can", "hello", "hi"]))
    
    if is_nav_intent:
        nav_map = {
            "roadmap": ("/roadmap", "🗺️ Opening your personalized career roadmap! Here you can check required milestones and skill tracks."),
            "skills": ("/skills", "🛠️ Opening your active skills inventory. You can add or complete skills to boost your placement readiness score."),
            "skill": ("/skills", "🛠️ Opening your active skills inventory."),
            "projects": ("/projects", "💻 Taking you to your Project Portfolio. Let's look at aligning your practical work to placement criteria."),
            "project": ("/projects", "💻 Taking you to your Project Portfolio."),
            "interview": ("/interview", "🎙️ Heading to the AI Mock Interview simulator. Ready to practice technical questions?"),
            "resume": ("/resume", "📄 Opening the AI Resume Lab. Upload your PDF or DOCX to run ATS audits and rewrite bullet points."),
            "challenges": ("/challenges", "💻 Opening coding challenges. Let's practice algorithms in the editor!"),
            "challenge": ("/challenges", "💻 Opening coding challenges."),
            "jobs": ("/jobs", "💼 Finding placement vacancies and internship openings matching your profile."),
            "job": ("/jobs", "💼 Finding placement vacancies."),
            "compare": ("/compare", "⚖️ Opening Career Comparison. Evaluate path overlaps side-by-side."),
        }
        
        for key, (path, resp) in nav_map.items():
            if re.search(r'\b' + re.escape(key) + r'\b', user_message_lower):
                log_activity(db, uid, "assistant_nav")
                return {
                    "response": resp,
                    "intent": "navigation",
                    "path": path
                }

    # Conversational Greetings
    greetings = ["hello", "hi", "hey", "morning", "evening", "yo", "greetings"]
    if any(re.search(r'\b' + re.escape(g) + r'\b', user_message_lower) for g in greetings):
        return {
            "response": f"Hello! I am your PFJ Intelligence Bot, your placement preparation mentor. "
                        f"I see your target track is **{target_role}**. How can I help you build your portfolio, review skills, or polish your resume today?",
            "intent": "greeting"
        }

    # Add Skill Trigger
    is_add = any(p in user_message_lower for p in ["add skill", "add to my skills", "add to skills"]) or (user_message_lower.startswith("add ") and len(user_message_lower.split()) <= 4)
    if is_add:
        cleaned_msg = user_message_lower.replace("add skill", "").replace("to my skills", "").replace("to skills", "").replace("add", "").strip()
        skill_name = cleaned_msg.title()
        
        existing = None
        for doc in skills_docs:
            if doc.to_dict().get("skill_name", "").lower() == cleaned_msg:
                existing = doc.to_dict()
                break
                
        if existing:
            return {
                "response": f"You already have **{existing.get('skill_name')}** added to your active skills (Level: {existing.get('level')}, Progress: {existing.get('progress_percent')}%).",
                "intent": "skills"
            }
            
        new_ss_ref = db.collection("users").document(uid).collection("skills").document()
        new_ss_ref.set({
            "skill_name": skill_name,
            "level": "Beginner",
            "progress_percent": 10
        })
        log_activity(db, uid, "add_skill", {"skill_id": new_ss_ref.id, "skill_name": skill_name})
        return {
            "response": f"✅ Core Skill added! I've linked **{skill_name}** to your skills catalog. Check the roadmap for next branches.",
            "intent": "add_skill",
            "action": {"type": "refresh_data", "route": "skills"}
        }

    # Remove Skill Trigger
    is_remove = any(p in user_message_lower for p in ["remove skill", "delete skill", "remove ", "delete "])
    if is_remove:
        cleaned_msg = user_message_lower.replace("remove skill", "").replace("delete skill", "").replace("from my skills", "").replace("from skills", "").replace("remove", "").replace("delete", "").strip()
        
        matched_doc = None
        for doc in skills_docs:
            if cleaned_msg in doc.to_dict().get("skill_name", "").lower():
                matched_doc = doc
                break
                
        if matched_doc:
            db.collection("users").document(uid).collection("skills").document(matched_doc.id).delete()
            log_activity(db, uid, "delete_skill", {"skill_id": matched_doc.id})
            return {
                "response": f"❌ Removed **{matched_doc.to_dict().get('skill_name')}** from your active skills. Telemetry updated.",
                "intent": "remove_skill",
                "action": {"type": "refresh_data", "route": "skills"}
            }

    # FAQ 1: Will projects help me get a placement / job?
    if "project" in user_message_lower and any(w in user_message_lower for w in ["placement", "job", "help", "hire", "work", "resume", "recruit", "career"]):
        return {
            "response": "💡 **Yes, projects are highly critical for landing top job offers!**\n\n"
                        "For college graduates and junior developers, projects act as **verified proof of execution**. Here is why they are essential:\n\n"
                        "1. **Bypasses 'No Experience' Blockers**: If you don't have previous company experience, a robust, deployed full-stack project shows you can build real software.\n"
                        "2. **Provides Interview Discussion**: Recruiters will ask you to explain your technical decisions. Having built a complex project lets you explain how you designed databases, handled API latency, or integrated AI features.\n"
                        "3. **Demonstrates Professional Tooling**: Adding standard software engineering tools (like **Docker**, **GitHub Actions/CI-CD**, and **PostgreSQL**) proves you are ready for actual production environments.\n\n"
                        "💡 Navigate to your **[Project Portfolio](/projects)** to view recommended templates, or type *'recommend project'* to see aligned ideas!",
            "intent": "faq_projects"
        }

    # Career Trajectory: Data Scientist from Scratch
    if "data scientist" in user_message_lower or "data science" in user_message_lower:
        if target_role != "Data Scientist":
            db.collection("users").document(uid).collection("profile").document("main").set({"target_role": "Data Scientist"}, merge=True)
        return {
            "response": "📊 **Starting Data Science from Scratch (Roadmap)**:\n\n"
                        "To enter data science, you must master programming, data structures, statistics, and modeling frameworks. Here are the core stages:\n\n"
                        "1. **Learn Python**: Master python syntax, lists, dictionaries, functions, and object-oriented programming.\n"
                        "2. **Data Manipulation**: Deep-dive into **Pandas** and **NumPy** to clean, filter, and merge datasets.\n"
                        "3. **Database Queries**: Master **SQL**. Relational queries (filtering, joins, groupings) are highly requested in recruitment rounds.\n"
                        "4. **Descriptive & Inferential Statistics**: Understand probability, distributions, hypothesis testing, and regressions.\n"
                        "5. **Machine Learning**: Learn to train classifiers, clusters, and regression models using **Scikit-Learn**.\n"
                        "6. **Visual Analysis**: Learn to build visual dashboards (using Tableau, PowerBI, or Chart.js).\n\n"
                        "🎯 I have updated your target path to **Data Scientist**! Check your **[Roadmap Milestones](/roadmap)** to view specific skill branches.",
            "intent": "career_guidance",
            "action": {"type": "refresh_data", "route": "profile"}
        }

    # Aligned project suggesting trigger
    if any(p in user_message_lower for p in ["recommend project", "suggest project", "what project", "project suggestion"]):
        top_projects = [
            {"project_name": "E-Commerce API", "difficulty": "Medium", "domain": "Backend", "description": "Build a robust backend with auth, product listings, and cart management."},
            {"project_name": "Weather Dashboard", "difficulty": "Easy", "domain": "Frontend", "description": "Create a responsive app that fetches and displays real-time weather data."},
            {"project_name": "Resume Analyzer ML", "difficulty": "Hard", "domain": "AI/ML", "description": "Develop a model to parse resumes and predict ATS scores based on job descriptions."}
        ]
        proj_lines = []
        for p in top_projects:
            proj_lines.append(f"• **{p['project_name']}** ({p['difficulty']} | {p['domain']})\n  *Description: {p['description'][:120]}...*")
        proj_str = "\n\n".join(proj_lines)
        return {
            "response": f"🛠️ **Recommended Projects for {target_role}**:\n\n{proj_str}\n\nType *'go to projects'* to add them to your portfolio tracker.",
            "intent": "recommend_projects"
        }

    # Readiness Score Trigger
    if any(p in user_message_lower for p in ["score", "readiness", "progress", "how am i", "report card"]):
        projects_docs = db.collection("users").document(uid).collection("projects").get()
        resumes_docs = db.collection("users").document(uid).collection("resumes").get()

        skill_score = min(len(skills_docs) / 10.0, 1.0)
        project_score = min(len(projects_docs) / 3.0, 1.0)
        resume_score = 1.0 if len(resumes_docs) > 0 else 0.0

        total = int((skill_score * 40) + (project_score * 40) + (resume_score * 20))
        level = "Advanced" if total > 80 else ("Intermediate" if total > 50 else "Beginner")

        return {
            "response": f"📈 **Hiring Readiness Telemetry**:\n\n"
                        f"• **Placement Readiness**: {total}% ({level})\n"
                        f"• **Skill Coverage Weight**: {int(skill_score * 100)}%\n"
                        f"• **Project Porting Score**: {int(project_score * 100)}%\n"
                        f"• **Resume Scanning Score**: {int(resume_score * 100)}%\n\n"
                        f"Unlock premium job recommendations by getting your overall score above **80%**! Continue building your active skills.",
            "intent": "score_check"
        }

    # FAQ 2: What is PFJ?
    if any(p in user_message_lower for p in ["website", "platform", "pfj", "this site", "purpose", "what is this"]):
        return {
            "response": "🧭 **About PFJ (Path For Job)**:\n\n"
                        "PFJ is an AI-powered career launchpad designed to help students transition into high-paying engineering roles.\n\n"
                        "We offer:\n"
                        "• **Market Intelligence**: Real-time hiring trends, emerging skill scores, and city-wide analysis.\n"
                        "• **Adaptive Skill Roadmaps**: Track and build target competencies.\n"
                        "• **Project Analytics & Complexity check**: Score and audit your projects.\n"
                        "• **AI Resume Lab**: Extract text, run ATS check, and rewrite bullets.\n"
                        "• **Interview Simulations**: Code challenges and mock sessions.\n\n"
                        "Type *'go to roadmap'* or *'go to resume'* to explore the dashboard!",
            "intent": "platform_faq"
        }

    # Default Fallback response
    return {
        "response": f"I'm here as your career copilot. I didn't identify a direct match command for your query, but I can help guide your **{target_role}** preparation!\n\n"
                    "Try asking me details like:\n"
                    "• *'Will projects help me get a job?'*\n"
                    "• *'How do I learn Data Science from scratch?'*\n"
                    "• *'Recommend a project to build'*\n"
                    "• *'What is my current readiness score?'*\n"
                    "• *'Go to coding challenges'* to practice problem-solving.",
        "intent": "fallback"
    }
