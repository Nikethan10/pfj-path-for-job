import os
from dotenv import load_dotenv

load_dotenv()
from database.firebase_db import get_firestore

db = get_firestore()

def seed_skills():
    skills_ref = db.collection("skills")
    
    # Check if empty
    docs = list(skills_ref.limit(1).stream())
    if docs:
        print("Skills collection already has data. Skipping skills seed.")
        return

    skills_data = [
        {"skill_name": "Python", "category": "Programming Languages", "difficulty": "Beginner"},
        {"skill_name": "JavaScript", "category": "Programming Languages", "difficulty": "Beginner"},
        {"skill_name": "React", "category": "Frontend Frameworks", "difficulty": "Intermediate"},
        {"skill_name": "Node.js", "category": "Backend Frameworks", "difficulty": "Intermediate"},
        {"skill_name": "Docker", "category": "DevOps", "difficulty": "Advanced"},
        {"skill_name": "Kubernetes", "category": "DevOps", "difficulty": "Advanced"},
        {"skill_name": "SQL", "category": "Databases", "difficulty": "Beginner"},
        {"skill_name": "MongoDB", "category": "Databases", "difficulty": "Intermediate"},
        {"skill_name": "AWS", "category": "Cloud Computing", "difficulty": "Intermediate"},
        {"skill_name": "Machine Learning", "category": "Data Science", "difficulty": "Advanced"}
    ]

    for skill in skills_data:
        skills_ref.add(skill)
    print(f"Seeded {len(skills_data)} skills.")

def seed_projects():
    projects_ref = db.collection("projects")
    
    docs = list(projects_ref.limit(1).stream())
    if docs:
        print("Projects collection already has data. Skipping projects seed.")
        return

    projects_data = [
        {
            "project_name": "E-Commerce Microservices",
            "domain": "Web Development",
            "difficulty": "Advanced",
            "description": "Build a scalable e-commerce platform using microservices architecture with Node.js, Docker, and React.",
            "skills": ["Node.js", "React", "Docker", "Microservices"],
            "explanation": "🎯 Target Career Track · This project directly aligns with Full Stack and Backend Engineering roles. · Demonstrates ability to handle complex system architecture and modern deployment practices.",
            "match_score": 0.95
        },
        {
            "project_name": "Data Analytics Dashboard",
            "domain": "Data Science",
            "difficulty": "Intermediate",
            "description": "Create an interactive dashboard that analyzes and visualizes large datasets using Python and React.",
            "skills": ["Python", "React", "Data Visualization", "SQL"],
            "explanation": "🎯 Target Career Track · Excellent for Data Engineering or Full Stack paths. · Shows practical ability to handle data pipelines and frontend visualization.",
            "match_score": 0.85
        },
        {
            "project_name": "To-Do List API",
            "domain": "Backend Development",
            "difficulty": "Beginner",
            "description": "A simple RESTful API for managing tasks, built with Python (FastAPI) and SQLite.",
            "skills": ["Python", "API Design", "SQL"],
            "explanation": "Great entry-level project to demonstrate fundamental API concepts and basic database operations.",
            "match_score": 0.60
        }
    ]

    for proj in projects_data:
        projects_ref.add(proj)
    print(f"Seeded {len(projects_data)} projects.")

def seed_jobs():
    jobs_ref = db.collection("jobs")
    
    docs = list(jobs_ref.limit(1).stream())
    if docs:
        print("Jobs collection already has data. Skipping jobs seed.")
        return

    jobs_data = [
        {
            "title": "Software Engineer",
            "company": "Google",
            "location": "Bangalore, India",
            "type": "Full-time",
            "salary_range": "$120k - $160k",
            "category": "Engineering",
            "description": "We are looking for a Software Engineer to develop scalable applications. You will be responsible for...",
            "required_skills": ["Python", "JavaScript", "React", "Node.js"],
            "match_percentage": 85
        },
        {
            "title": "Cloud Architect",
            "company": "Amazon",
            "location": "Remote",
            "type": "Full-time",
            "salary_range": "$150k - $200k",
            "category": "Engineering",
            "description": "Join our AWS team to design and implement highly available and scalable cloud architectures.",
            "required_skills": ["AWS", "Docker", "Kubernetes", "Python"],
            "match_percentage": 65
        },
        {
            "title": "Data Scientist",
            "company": "Microsoft",
            "location": "Hyderabad, India",
            "type": "Full-time",
            "salary_range": "$110k - $150k",
            "category": "Data Science",
            "description": "Analyze large datasets and build predictive models to drive business insights.",
            "required_skills": ["Python", "SQL", "Machine Learning"],
            "match_percentage": 90
        }
    ]
    for job in jobs_data:
        jobs_ref.add(job)
    print(f"Seeded {len(jobs_data)} jobs.")

if __name__ == "__main__":
    print("Starting Firestore Seeding...")
    seed_skills()
    seed_projects()
    seed_jobs()
    print("Seeding Complete.")
