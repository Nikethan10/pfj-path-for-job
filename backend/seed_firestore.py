import sys
from dotenv import load_dotenv

load_dotenv()
from database.firebase_db import get_firestore

db = get_firestore()

# Role names must match the frontend's role pickers (Dashboard BRANCH_RECOMMENDED_ROLES).
SE = "Software Engineer"
FS = "Full Stack Developer"
DS = "Data Scientist"
ML = "ML Engineer"
DA = "Data Analyst"
CS = "Cyber Security Specialist"
ES = "Embedded Systems Engineer"
VL = "VLSI Design Engineer"
RO = "Robotics Engineer"
ME = "Mechanical Engineer"

# (name, category, difficulty_weight 0.5-2.0, {role: importance_score 0-1})
# importance_score reads as "required in N% of job listings" and drives the
# roadmap's priority ordering; difficulty_weight scales estimated learning weeks.
SKILL_CATALOG = [
    ("Python", "Programming Languages", 1.0, {SE: 0.9, DS: 0.95, ML: 0.95, DA: 0.85, FS: 0.5, CS: 0.6, RO: 0.7}),
    ("JavaScript", "Programming Languages", 1.0, {FS: 0.95, SE: 0.7}),
    ("TypeScript", "Programming Languages", 1.0, {FS: 0.8}),
    ("Java", "Programming Languages", 1.2, {SE: 0.6}),
    ("C++", "Programming Languages", 1.5, {ES: 0.8, VL: 0.7, RO: 0.8, SE: 0.5}),
    ("Embedded C", "Embedded Systems", 1.3, {ES: 0.95}),
    ("SQL", "Databases", 0.8, {DA: 0.95, DS: 0.9, SE: 0.8, FS: 0.7, ML: 0.6}),
    ("Data Structures", "CS Fundamentals", 1.5, {SE: 0.95, FS: 0.7, ML: 0.6}),
    ("Algorithms", "CS Fundamentals", 1.5, {SE: 0.9, ML: 0.6}),
    ("System Design", "CS Fundamentals", 1.8, {SE: 0.7, FS: 0.6}),
    ("Git", "Developer Tools", 0.5, {SE: 0.9, FS: 0.9, DS: 0.7, ML: 0.8, DA: 0.6, CS: 0.7, ES: 0.7, VL: 0.6, RO: 0.7}),
    ("Linux/Shell", "Developer Tools", 0.8, {SE: 0.6, CS: 0.8, ES: 0.7, ML: 0.6}),
    ("React", "Frontend Frameworks", 1.2, {FS: 0.9}),
    ("HTML/CSS", "Frontend Frameworks", 0.6, {FS: 0.85}),
    ("Node.js", "Backend Frameworks", 1.0, {FS: 0.85, SE: 0.5}),
    ("FastAPI", "Backend Frameworks", 0.8, {SE: 0.5}),
    ("REST APIs", "Backend Frameworks", 0.8, {SE: 0.8, FS: 0.85}),
    ("Docker", "DevOps", 1.0, {SE: 0.7, ML: 0.6, FS: 0.6}),
    ("Kubernetes", "DevOps", 1.5, {SE: 0.4}),
    ("CI/CD", "DevOps", 0.9, {SE: 0.6, FS: 0.5}),
    ("AWS", "Cloud Computing", 1.3, {SE: 0.6, FS: 0.5, ML: 0.5}),
    ("MongoDB", "Databases", 0.8, {FS: 0.6}),
    ("PostgreSQL", "Databases", 0.9, {SE: 0.6, FS: 0.6}),
    ("Pandas", "Data Science", 0.8, {DS: 0.9, DA: 0.9, ML: 0.7}),
    ("NumPy", "Data Science", 0.7, {DS: 0.8, ML: 0.7}),
    ("Statistics", "Data Science", 1.2, {DS: 0.9, DA: 0.85}),
    ("Machine Learning", "Data Science", 1.8, {DS: 0.95, ML: 0.95}),
    ("Deep Learning", "Data Science", 2.0, {ML: 0.9, DS: 0.6}),
    ("PyTorch", "ML Frameworks", 1.5, {ML: 0.85, DS: 0.5}),
    ("TensorFlow", "ML Frameworks", 1.5, {ML: 0.6}),
    ("Scikit-learn", "ML Frameworks", 1.0, {DS: 0.8, ML: 0.7, DA: 0.5}),
    ("NLP", "Data Science", 1.8, {ML: 0.6, DS: 0.5}),
    ("Computer Vision", "Data Science", 1.8, {ML: 0.55, RO: 0.6}),
    ("Tableau", "Data Visualization", 0.8, {DA: 0.8}),
    ("Power BI", "Data Visualization", 0.8, {DA: 0.75}),
    ("Excel", "Data Analysis", 0.5, {DA: 0.9}),
    ("Data Visualization", "Data Science", 0.8, {DA: 0.85, DS: 0.7}),
    ("Network Security", "Security", 1.5, {CS: 0.9}),
    ("Penetration Testing", "Security", 1.6, {CS: 0.85}),
    ("Cryptography", "Security", 1.6, {CS: 0.8}),
    ("Microcontrollers (Arduino/ARM)", "Embedded Systems", 1.3, {ES: 0.9, RO: 0.7}),
    ("RTOS", "Embedded Systems", 1.6, {ES: 0.8}),
    ("Circuit Design", "Hardware", 1.4, {ES: 0.7, VL: 0.8, ME: 0.5}),
    ("VLSI & Verilog", "Hardware", 1.8, {VL: 0.95}),
    ("CAD/SolidWorks", "Mechanical", 1.2, {ME: 0.9}),
    ("Thermodynamics", "Mechanical", 1.4, {ME: 0.8}),
    ("ROS (Robot Operating System)", "Robotics", 1.6, {RO: 0.9}),
    ("Control Systems", "Robotics", 1.5, {RO: 0.8, ME: 0.6}),
    ("MATLAB", "Engineering Tools", 1.0, {ME: 0.7, RO: 0.6, VL: 0.5}),
]


def seed_skills(refresh: bool = False):
    skills_ref = db.collection("skills")

    existing = list(skills_ref.limit(1).stream())
    if existing and not refresh:
        print("Skills collection already has data. Run with --refresh-skills to replace it.")
        return

    if existing and refresh:
        deleted = 0
        for doc in skills_ref.stream():
            doc.reference.delete()
            deleted += 1
        print(f"Deleted {deleted} old skill docs.")

    for name, category, difficulty_weight, role_importance in SKILL_CATALOG:
        skills_ref.add({
            "skill_name": name,
            "category": category,
            "difficulty_weight": difficulty_weight,
            # Both shapes are consumed by the app: `roles` powers array_contains
            # queries (compare, /skills/available?role=), `career_skills` powers
            # roadmap priority ordering.
            "roles": list(role_importance.keys()),
            "career_skills": {
                role: {"importance_score": score}
                for role, score in role_importance.items()
            },
        })
    print(f"Seeded {len(SKILL_CATALOG)} skills across 10 career roles.")

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
    seed_skills(refresh="--refresh-skills" in sys.argv)
    seed_projects()
    seed_jobs()
    print("Seeding Complete.")
