import random

# A robust, simulated database of premium tech and engineering jobs
JOB_DATABASE = [
    {
        "id": "job_001",
        "company": "Google",
        "role": "Software Engineer Intern",
        "type": "Internship",
        "location": "Remote / Bengaluru, KA",
        "salary_range": "₹80k - ₹1.2L / month",
        "description": "Join our core search team to build scalable microservices and improve algorithm efficiency.",
        "required_skills": ["Python", "Data Structures", "Algorithms", "System Design", "Git", "REST APIs", "SQL", "Linux/Shell"],
        "category": "Software"
    },
    {
        "id": "job_002",
        "company": "OpenAI",
        "role": "Machine Learning Engineer",
        "type": "Full-Time",
        "location": "Remote / Mumbai, MH",
        "salary_range": "₹50L - ₹80L LPA",
        "description": "Train and deploy large-scale generative models. Experience with distributed training required.",
        "required_skills": ["Python", "PyTorch", "Deep Learning", "Machine Learning", "Linux/Shell", "Linear Algebra", "Git", "Docker", "TensorFlow"],
        "category": "AI/ML"
    },
    {
        "id": "job_003",
        "company": "Stripe",
        "role": "Backend Engineer",
        "type": "Full-Time",
        "location": "Remote / Bengaluru, KA",
        "salary_range": "₹40L - ₹60L LPA",
        "description": "Build high-availability financial infrastructure processing millions of transactions.",
        "required_skills": ["Java", "PostgreSQL", "REST APIs", "Docker", "Kubernetes", "Git", "System Design", "SQL", "Spring Boot", "CI/CD"],
        "category": "Software"
    },
    {
        "id": "job_004",
        "company": "Netflix",
        "role": "Data Scientist",
        "type": "Full-Time",
        "location": "Remote / Mumbai, MH",
        "salary_range": "₹55L - ₹85L LPA",
        "description": "Analyze user viewing habits to improve the Netflix recommendation engine.",
        "required_skills": ["Python", "SQL", "Machine Learning", "Pandas", "Statistics", "Data Visualization", "NumPy", "Scikit-learn", "Linear Algebra", "Git"],
        "category": "AI/ML"
    },
    {
        "id": "job_005",
        "company": "Vercel",
        "role": "Frontend Developer",
        "type": "Full-Time",
        "location": "Remote / Hyderabad, TS",
        "salary_range": "₹30L - ₹50L LPA",
        "description": "Create stunning, high-performance web interfaces using React and modern frontend tools.",
        "required_skills": ["JavaScript", "TypeScript", "React", "HTML/CSS", "Git", "REST APIs", "Node.js", "Agile/Scrum", "Docker"],
        "category": "Software"
    },
    {
        "id": "job_006",
        "company": "Meta",
        "role": "Full Stack Engineer",
        "type": "Full-Time",
        "location": "Gurugram, HR",
        "salary_range": "₹45L - ₹70L LPA",
        "description": "Develop features spanning the entire stack for billion-user social platforms.",
        "required_skills": ["JavaScript", "React", "Node.js", "PostgreSQL", "System Design", "Git", "HTML/CSS", "TypeScript", "REST APIs", "Docker"],
        "category": "Software"
    },
    {
        "id": "job_007",
        "company": "Amazon",
        "role": "Cloud Architect Intern",
        "type": "Internship",
        "location": "Hyderabad, TS",
        "salary_range": "₹60k - ₹90k / month",
        "description": "Help enterprise customers design robust, high-performance cloud architectures on AWS.",
        "required_skills": ["AWS", "Docker", "Linux/Shell", "Python", "Git", "Kubernetes", "System Design", "CI/CD", "SQL"],
        "category": "Software"
    },
    {
        "id": "job_008",
        "company": "Spotify",
        "role": "Data Analyst",
        "type": "Full-Time",
        "location": "Remote / Bengaluru, KA",
        "salary_range": "₹22L - ₹38L LPA",
        "description": "Provide data-driven insights to improve music discovery features and playlists.",
        "required_skills": ["SQL", "Tableau", "Python", "Excel", "Statistics", "Pandas", "Data Visualization", "Power BI", "Git"],
        "category": "AI/ML"
    },
    {
        "id": "job_009",
        "company": "Cisco",
        "role": "Cyber Security Specialist",
        "type": "Full-Time",
        "location": "Bengaluru, KA",
        "salary_range": "₹18L - ₹25L LPA",
        "description": "Secure enterprise networks and cloud systems. Perform vulnerability scans and penetration tests.",
        "required_skills": ["Network Security", "Penetration Testing", "Cryptography", "Linux/Shell", "Python", "Git", "Docker", "SQL", "System Design"],
        "category": "Security"
    },
    {
        "id": "job_010",
        "company": "Qualcomm",
        "role": "Embedded Systems Engineer",
        "type": "Full-Time",
        "location": "Hyderabad, TS",
        "salary_range": "₹15L - ₹22L LPA",
        "description": "Develop low-level device drivers and firmware for next-generation mobile and IoT chipsets.",
        "required_skills": ["C++", "Embedded C", "Microcontrollers (Arduino/ARM)", "RTOS", "Git", "Circuit Design", "Linux/Shell", "Algorithms", "System Design"],
        "category": "ECE/VLSI"
    },
    {
        "id": "job_011",
        "company": "NVIDIA",
        "role": "VLSI Design Engineer",
        "type": "Full-Time",
        "location": "Bengaluru, KA",
        "salary_range": "₹20L - ₹30L LPA",
        "description": "Design and verify high-performance graphics and AI processor circuits using hardware description languages.",
        "required_skills": ["C++", "VLSI & Verilog", "Circuit Design", "Linear Algebra", "System Design", "Microcontrollers (Arduino/ARM)", "Git", "Embedded C", "Linux/Shell"],
        "category": "ECE/VLSI"
    },
    {
        "id": "job_012",
        "company": "Tesla",
        "role": "Mechanical Engineer",
        "type": "Full-Time",
        "location": "Remote / Pune, MH",
        "salary_range": "₹30L - ₹48L LPA",
        "description": "Design, prototype, and manufacture physical thermal management subsystems for electric vehicles.",
        "required_skills": ["CAD/SolidWorks", "Thermodynamics", "Matlab", "Git", "Robotics & ROS", "Statistics", "Excel", "Python"],
        "category": "Mechanical"
    },
    {
        "id": "job_013",
        "company": "Boston Dynamics",
        "role": "Robotics Engineer",
        "type": "Full-Time",
        "location": "Remote / Bengaluru, KA",
        "salary_range": "₹35L - ₹55L LPA",
        "description": "Design sophisticated controls algorithms and ROS node architectures for advanced dynamic bipedal systems.",
        "required_skills": ["C++", "Python", "Robotics & ROS", "Microcontrollers (Arduino/ARM)", "Linear Algebra", "CAD/SolidWorks", "Git", "Machine Learning", "Embedded C"],
        "category": "Mechanical"
    },
    {
        "id": "job_014",
        "company": "Razorpay",
        "role": "Backend Developer",
        "type": "Full-Time",
        "location": "Bengaluru, KA",
        "salary_range": "₹14L - ₹20L LPA",
        "description": "Build backend transactional APIs, integrate payment gateways, and design database structures using FastAPI.",
        "required_skills": ["Python", "FastAPI", "Django", "PostgreSQL", "REST APIs", "SQL", "Git", "Docker", "System Design"],
        "category": "Software"
    },
    {
        "id": "job_015",
        "company": "TCS",
        "role": "Systems Engineer",
        "type": "Full-Time",
        "location": "Pune, MH",
        "salary_range": "₹4L - ₹7L LPA",
        "description": "Develop and manage systems and databases for enterprise clients in diverse sectors.",
        "required_skills": ["Java", "SQL", "HTML/CSS", "Data Structures", "Algorithms", "Git", "Agile/Scrum", "REST APIs", "Python"],
        "category": "Software"
    },
    {
        "id": "job_016",
        "company": "Palo Alto Networks",
        "role": "Security Analyst",
        "type": "Full-Time",
        "location": "Bengaluru, KA",
        "salary_range": "₹25L - ₹40L LPA",
        "description": "Perform threat modeling, analyze incident alerts, and automate threat detection rules.",
        "required_skills": ["Network Security", "Linux/Shell", "Cryptography", "Git", "Python", "Penetration Testing", "System Design", "Docker"],
        "category": "Security"
    },
    {
        "id": "job_017",
        "company": "Apple",
        "role": "Hardware Design Intern",
        "type": "Internship",
        "location": "Hyderabad, TS",
        "salary_range": "₹70k - ₹1L / month",
        "description": "Assist in the validation, schematic entry, and layout simulation of custom Apple Silicon power rails.",
        "required_skills": ["Circuit Design", "VLSI & Verilog", "Microcontrollers (Arduino/ARM)", "C++", "Embedded C", "System Design", "Git", "Linear Algebra"],
        "category": "ECE/VLSI"
    },
    {
        "id": "job_018",
        "company": "L&T",
        "role": "Design Engineer",
        "type": "Full-Time",
        "location": "Mumbai, MH",
        "salary_range": "₹7L - ₹11L LPA",
        "description": "Perform stress analysis and design structures using CAD and FEA packages.",
        "required_skills": ["CAD/SolidWorks", "Thermodynamics", "Matlab", "Git", "Statistics", "Excel", "Robotics & ROS"],
        "category": "Mechanical"
    },
    {
        "id": "job_019",
        "company": "Siemens",
        "role": "Automation & Controls Engineer",
        "type": "Full-Time",
        "location": "Bengaluru, KA",
        "salary_range": "₹12L - ₹18L LPA",
        "description": "Configure PLCs, integrate industrial robotic arms, and set up sensor feedback loops using ROS.",
        "required_skills": ["Robotics & ROS", "Circuit Design", "Microcontrollers (Arduino/ARM)", "C++", "Embedded C", "Matlab", "Git", "CAD/SolidWorks"],
        "category": "Mechanical"
    },
    {
        "id": "job_020",
        "company": "HashiCorp",
        "role": "DevOps Engineer",
        "type": "Full-Time",
        "location": "Remote / Bengaluru, KA",
        "salary_range": "₹35L - ₹55L LPA",
        "description": "Maintain high-uptime cloud deployments, build infrastructure pipelines, and orchestrate server grids.",
        "required_skills": ["Docker", "Kubernetes", "CI/CD", "AWS", "Linux/Shell", "Git", "System Design", "Python", "Agile/Scrum"],
        "category": "Software"
    },
    {
        "id": "job_021",
        "company": "CrowdStrike",
        "role": "Penetration Tester",
        "type": "Full-Time",
        "location": "Remote / Pune, MH",
        "salary_range": "₹18L - ₹28L LPA",
        "description": "Emulate real-world adversary behavior to find, exploit, and document security flaws in client systems.",
        "required_skills": ["Penetration Testing", "Network Security", "Linux/Shell", "Python", "Git", "Cryptography", "Docker", "System Design"],
        "category": "Security"
    },
    {
        "id": "job_022",
        "company": "Mahindra & Mahindra",
        "role": "Automotive Design Engineer",
        "type": "Full-Time",
        "location": "Chennai, TN",
        "salary_range": "₹8L - ₹12L LPA",
        "description": "Design and simulate chassis elements and engine components for electric and hybrid SUVs.",
        "required_skills": ["CAD/SolidWorks", "Thermodynamics", "Matlab", "Git", "Robotics & ROS", "Statistics", "Excel"],
        "category": "Mechanical"
    },
    {
        "id": "job_023",
        "company": "Texas Instruments",
        "role": "Embedded Firmware Intern",
        "type": "Internship",
        "location": "Bengaluru, KA",
        "salary_range": "₹45k - ₹65k / month",
        "description": "Develop and debug low-power embedded software projects on MSP430 and ARM Cortex microcontrollers.",
        "required_skills": ["Embedded C", "Microcontrollers (Arduino/ARM)", "Circuit Design", "C++", "RTOS", "Git", "VLSI & Verilog", "Linux/Shell"],
        "category": "ECE/VLSI"
    }
]

def calculate_job_matches(user_skills_dict: dict) -> list:
    """
    Takes a dictionary of user's skills with their level and progress:
    e.g., {"python": {"level": "Intermediate", "progress": 70}}
    Calculates the match percentage and missing skills for all jobs.
    Returns the list of jobs sorted by highest match percentage.
    """
    # Backwards compatibility: if list of strings is passed, convert to standard format
    if isinstance(user_skills_dict, list):
        user_skills_dict = {s: {"level": "Advanced", "progress": 100} for s in user_skills_dict}
        
    user_skills_lower = {k.lower(): v for k, v in user_skills_dict.items()}
    
    matched_jobs = []
    
    for job in JOB_DATABASE:
        required = job["required_skills"]
        
        if not required:
            match_percent = 100
            missing = []
        else:
            missing = []
            total_score = 0.0
            
            for req_skill in required:
                req_skill_lower = req_skill.lower()
                if req_skill_lower in user_skills_lower:
                    skill_data = user_skills_lower[req_skill_lower]
                    level = skill_data.get("level", "Beginner")
                    progress = skill_data.get("progress", 10)
                    
                    # Level multiplier
                    if level == "Advanced":
                        level_mult = 1.0
                    elif level == "Intermediate":
                        level_mult = 0.75
                    else:
                        level_mult = 0.4
                        
                    # Blended skill progress match
                    skill_score = level_mult * (progress / 100.0)
                    total_score += skill_score
                else:
                    missing.append(req_skill)
            
            # Match percent is (total_score / len(required)) * 100
            match_percent = int((total_score / len(required)) * 100)
            # Ensure it is capped at 100 and min at 0
            match_percent = max(0, min(100, match_percent))
            
        # Add matching metadata to the job object
        job_result = job.copy()
        job_result["match_percentage"] = match_percent
        job_result["missing_skills"] = missing
        
        matched_jobs.append(job_result)
        
    # Sort by match percentage (highest first)
    matched_jobs.sort(key=lambda x: x["match_percentage"], reverse=True)
    
    return matched_jobs
