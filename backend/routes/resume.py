from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request
from starlette.concurrency import run_in_threadpool
from database.firebase_db import get_firestore
from middleware.security import limiter
from utils.jwt_handler import verify_token
from services.resume_service import (
    analyze_user_resume, 
    get_latest_analysis, 
    extract_text_from_pdf, 
    extract_text_from_docx,
    save_job_match
)
from services.ai_service import rewrite_bullet_points, match_job_description, analyze_linkedin_profile
from services.github_service import analyze_github_profile
from services.activity_service import log_activity
from typing import Optional, List
from pydantic import BaseModel
import json
from google.cloud import firestore

router = APIRouter(prefix="/api/resume", tags=["Resume"])

class JobMatchRequest(BaseModel):
    job_description: str

class RewriteRequest(BaseModel):
    bullet_points: List[str]

class SocialAuditRequest(BaseModel):
    github_user: Optional[str] = None
    linkedin_text: Optional[str] = None


MAX_RESUME_BYTES = 5 * 1024 * 1024  # 5 MB upload cap


@router.post("/analyze")
@limiter.limit("5/minute")
async def analyze_resume(
    request: Request,
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    github_user: Optional[str] = Form(None),
    linkedin_text: Optional[str] = Form(None),
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    """
    Analyzes resume. Accepts file upload or raw resume text.
    Optionally triggers social audit for GitHub and LinkedIn if credentials supplied.
    """
    extracted_text = ""

    if file:
        file_bytes = await file.read()
        if len(file_bytes) > MAX_RESUME_BYTES:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 5 MB.")
        filename = (file.filename or "").lower()
        # Validate by extension AND magic bytes (PDF: %PDF-, DOCX: PK zip header).
        is_pdf = filename.endswith(".pdf") and file_bytes[:5] == b"%PDF-"
        is_docx = filename.endswith(".docx") and file_bytes[:4] == b"PK\x03\x04"
        if is_pdf:
            extracted_text = extract_text_from_pdf(file_bytes)
        elif is_docx:
            extracted_text = extract_text_from_docx(file_bytes)
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported or invalid file. Please upload a valid PDF or DOCX.",
            )
    elif resume_text:
        extracted_text = resume_text
    else:
        raise HTTPException(status_code=400, detail="Either a file upload or raw resume text is required.")
        
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any readable text from the provided input.")
        
    log_activity(db, uid, "resume_analysis")

    # The analysis pipeline makes several blocking AI/network calls; run it in the
    # threadpool so it doesn't stall the event loop for every other request.
    analysis_result = await run_in_threadpool(
        analyze_user_resume,
        db=db,
        uid=uid,
        resume_text=extracted_text,
        github_user=github_user,
        linkedin_text=linkedin_text,
    )

    return analysis_result


@router.get("")
def get_analysis(
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    """Retrieves the latest compiled resume audit, parsing nested JSON modules."""
    result = get_latest_analysis(db, uid)
    if not result:
        raise HTTPException(status_code=404, detail="No resume analysis found. Please upload a resume first.")
    return result


@router.post("/match")
def match_resume_to_job(
    request: JobMatchRequest,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    """
    Compares user's latest parsed resume against a pasted job description.
    Saves the matching analysis in the job_matches database table.
    """
    latest = get_latest_analysis(db, uid)
    if not latest:
        raise HTTPException(
            status_code=400, 
            detail="No uploaded resume found. Please upload a resume before matching against job descriptions."
        )
        
    # Get raw resume text or combine extracted summaries
    resume_text = latest.get("resume_text")
    if not resume_text:
        # Construct summary text if raw text was not saved
        extracted = latest.get("extracted_data", {})
        if isinstance(extracted, str):
            try:
                extracted = json.loads(extracted)
            except:
                extracted = {}
        skills = ", ".join(extracted.get("skills", []))
        projects = " ".join(
            f"{p.get('title', '')}: {p.get('description', '')}"
            for p in extracted.get("projects", [])
        )
        experience = " ".join(
            f"{e.get('role', '')} at {e.get('company', '')}: {', '.join(e.get('highlights', []))}"
            for e in extracted.get("experience", [])
        )
        resume_text = f"Skills: {skills}. Projects: {projects}. Experience: {experience}"
        
    match_result = match_job_description(resume_text, request.job_description)
    save_job_match(db, uid, request.job_description, match_result)
    
    log_activity(db, uid, "resume_job_match")
    
    return match_result


@router.post("/rewrite")
def rewrite_resume_bullets(
    request: RewriteRequest,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    """Polishes dry bullet points to STAR impact-driven benchmarks using generative AI."""
    if not request.bullet_points:
        raise HTTPException(status_code=400, detail="Bullet points list cannot be empty.")
        
    log_activity(db, uid, "resume_rewrite")
    return rewrite_bullet_points(request.bullet_points)


@router.post("/social")
def audit_social_links(
    request: SocialAuditRequest,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    """
    Executes crawler checks on a candidate's GitHub repos or audits a LinkedIn about text.
    Updates the scores dynamically inside the session without overwriting entire resume structures.
    """
    github_result = {}
    linkedin_result = {}

    if request.github_user:
        # analyze_github_profile returns None when the profile can't be fetched.
        github_result = analyze_github_profile(request.github_user) or {
            "error": "GitHub profile could not be fetched. Check the username and try again."
        }

    if request.linkedin_text:
        linkedin_result = analyze_linkedin_profile(request.linkedin_text)
        
    log_activity(db, uid, "social_audit")
    
    # Try to link update back to latest analysis if it exists
    resumes_ref = db.collection("users").document(uid).collection("resumes")
    query = resumes_ref.order_by("created_at", direction=firestore.Query.DESCENDING).limit(1)
    docs = list(query.stream())
    
    if docs:
        latest_doc = docs[0]
        latest_data = latest_doc.to_dict()
        
        update_data = {}
        # Only fold GitHub results into the stored analysis when the fetch succeeded.
        if request.github_user and github_result.get("github_score") is not None:
            github_score = github_result["github_score"]
            update_data["github_score"] = github_score
            update_data["github_analysis"] = json.dumps(github_result)
            latest_data["github_score"] = github_score
            
        if request.linkedin_text:
            linkedin_score = linkedin_result.get("linkedin_score", latest_data.get("linkedin_score", 0))
            update_data["linkedin_score"] = linkedin_score
            update_data["linkedin_analysis"] = json.dumps(linkedin_result)
            latest_data["linkedin_score"] = linkedin_score
            
        # Re-calculate aggregate career readiness score
        extracted = latest_data.get("extracted_data", {})
        if isinstance(extracted, str):
            try:
                extracted = json.loads(extracted)
            except:
                extracted = {}
                
        skills_score = min((len(extracted.get("skills", [])) / 12) * 100, 100.0)
        certs_score = min((len(extracted.get("certifications", [])) / 3) * 100, 100.0)
        
        portfolio_strength_score = latest_data.get("portfolio_strength_score", 0)
        github_s = latest_data.get("github_score", 0)
        linkedin_s = latest_data.get("linkedin_score", 0)
        ats_s = latest_data.get("ats_score", 0)
        
        base_readiness = (
            (skills_score * 0.25) + 
            (portfolio_strength_score * 0.20) + 
            (github_s * 0.15) + 
            (linkedin_s * 0.15) + 
            (ats_s * 0.15) + 
            (certs_score * 0.10)
        )
        
        update_data["career_readiness_score"] = round(base_readiness, 1)
        update_data["resume_score"] = round(base_readiness, 1)
        
        latest_doc.reference.update(update_data)
        
    return {
        "github": github_result,
        "linkedin": linkedin_result,
        "message": "Social audit successfully processed."
    }
