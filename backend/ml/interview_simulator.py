import random
import json
from services.ai_service import run_ai_prompt, clean_json_response

APTITUDE_TOPICS = [
    "Quantitative Aptitude - Number System (Divisibility rules, Factors and multiples, HCF & LCM, Remainders, Cyclicity, Base conversions, Surds and indices)",
    "Quantitative Aptitude - Percentages (Percentage increase/decrease, Successive percentages, Population growth, Profit percentage)",
    "Quantitative Aptitude - Profit and Loss (Cost Price, Selling Price, Marked Price, Discounts, Successive discounts)",
    "Quantitative Aptitude - Ratio and Proportion (Ratios, Proportions, Direct/Inverse variation)",
    "Quantitative Aptitude - Partnership (Working partnership, Investment sharing)",
    "Quantitative Aptitude - Averages (Simple average, Weighted average, Replacement concept)",
    "Quantitative Aptitude - Simple Interest & Compound Interest (SI, CI formula, SI/CI difference)",
    "Quantitative Aptitude - Time and Work (Efficiency, Work equivalence, Pipes and cisterns)",
    "Quantitative Aptitude - Time, Speed and Distance (Relative speed, Trains, Boats and streams, Circular tracks)",
    "Quantitative Aptitude - Mixtures and Alligations (Mixing solutions, Replacement method)",
    "Quantitative Aptitude - Ages (Present, Past/Future age problems)",
    "Quantitative Aptitude - Permutations and Combinations (Arrangements, Selections, Circular permutations)",
    "Quantitative Aptitude - Probability (Basic probability, Conditional probability, Bayes theorem)",
    "Quantitative Aptitude - Progressions (AP, GP, HP)",
    "Quantitative Aptitude - Geometry (Triangles, Circles, Quadrilaterals, Coordinate geometry)",
    "Quantitative Aptitude - Mensuration (Areas, Volumes, Surface areas)",
    "Quantitative Aptitude - Data Interpretation (Tables, Pie charts, Line/Bar graphs, Caselets)",
    "Quantitative Aptitude - Data Sufficiency (Statement analysis, Decision making)",
    "Quantitative Aptitude - Logarithms (Log laws, Simplifications)",
    "Quantitative Aptitude - Algebra (Linear/Quadratic equations, Inequalities)",
    "Logical Reasoning - Seating Arrangements (Circular, Linear, Square)",
    "Logical Reasoning - Puzzles (Floor, Scheduling, Box puzzles)",
    "Logical Reasoning - Blood Relations",
    "Logical Reasoning - Direction Sense",
    "Logical Reasoning - Coding-Decoding",
    "Logical Reasoning - Syllogisms",
    "Logical Reasoning - Statements and Conclusions",
    "Logical Reasoning - Statements and Assumptions",
    "Logical Reasoning - Cause and Effect",
    "Logical Reasoning - Course of Action",
    "Logical Reasoning - Input-Output",
    "Logical Reasoning - Ranking and Order",
    "Logical Reasoning - Number Series",
    "Logical Reasoning - Alphabet Series",
    "Logical Reasoning - Missing Characters",
    "Logical Reasoning - Odd One Out",
    "Logical Reasoning - Clock Problems",
    "Logical Reasoning - Calendar Problems",
    "Logical Reasoning - Cube and Dice",
    "Logical Reasoning - Analytical Reasoning"
]

VERBAL_TOPICS = [
    "Reading Comprehension (Passage-based questions, Inference, Tone of author, Main idea)",
    "Vocabulary (Synonyms, Antonyms, One-word substitutions, Homophones, Idioms and phrases, Phrasal verbs)",
    "Grammar (Parts of Speech, Noun/Pronoun/Verb/Adjective/Adverb/Preposition/Conjunction/Interjection, Tenses, Subject-Verb Agreement, Articles, Active/Passive Voice, Direct/Indirect Speech, Conditional Sentences, Modifiers, Parallelism, Error Detection)",
    "Sentence Correction",
    "Para Jumbles",
    "Sentence Completion",
    "Fill in the Blanks",
    "Cloze Test",
    "Critical Reasoning (Assumptions, Strengthen/Weaken arguments, Conclusions)",
    "Sentence Improvement",
    "Paragraph Completion",
    "Odd Sentence Out"
]

QUESTION_BANK = {
    "Software Engineer": [
        {"question": "Can you explain the difference between REST and GraphQL?", "keywords": ["endpoint", "over-fetching", "under-fetching", "query", "mutation", "schema", "http", "resource", "json"]},
        {"question": "What are the core principles of Object-Oriented Programming?", "keywords": ["encapsulation", "inheritance", "polymorphism", "abstraction", "class", "object", "method"]},
        {"question": "Explain the concept of Big O notation and why it's important.", "keywords": ["time complexity", "space complexity", "algorithm", "scaling", "performance", "worst case", "asymptotic"]},
        {"question": "What is the difference between synchronous and asynchronous programming?", "keywords": ["blocking", "non-blocking", "event loop", "promises", "callbacks", "await", "concurrency", "thread"]},
        {"question": "How does a hash table work under the hood?", "keywords": ["hash function", "collision", "array", "buckets", "O(1)", "key", "value", "chaining", "probing"]},
        {"question": "Describe the principles of SOLID design.", "keywords": ["single responsibility", "open/closed", "liskov substitution", "interface segregation", "dependency inversion", "maintainability"]},
        {"question": "What is the difference between a process and a thread?", "keywords": ["memory", "isolation", "shared", "context switch", "lightweight", "concurrency", "multitasking"]},
        {"question": "Explain what a deadlock is and how it can be prevented.", "keywords": ["lock", "mutex", "circular wait", "starvation", "concurrency", "resources", "timeout"]},
        {"question": "Describe how garbage collection works in modern runtimes.", "keywords": ["memory", "allocation", "deallocation", "mark and sweep", "reference counting", "heap", "leak"]},
        {"question": "Explain the MVC (Model-View-Controller) design pattern.", "keywords": ["model", "view", "controller", "data", "ui", "logic", "separation", "pattern"]}
    ],
    "Data Scientist": [
        {"question": "Explain the difference between supervised and unsupervised learning.", "keywords": ["labels", "training data", "classification", "regression", "clustering", "k-means", "predict", "target"]},
        {"question": "What is overfitting and how can you prevent it?", "keywords": ["regularization", "dropout", "cross-validation", "noise", "complexity", "pruning", "generalize", "early stopping"]},
        {"question": "How do you handle imbalanced datasets?", "keywords": ["smote", "undersampling", "oversampling", "f1-score", "precision", "recall", "weights", "augmentation"]},
        {"question": "What is the Curse of Dimensionality in data analysis?", "keywords": ["features", "sparse", "distance", "pca", "reduction", "variance", "exponential", "volume"]},
        {"question": "Explain the difference between bagging and boosting.", "keywords": ["ensemble", "random forest", "parallel", "sequential", "gradient boosting", "variance", "bias", "trees"]},
        {"question": "What is the difference between linear and logistic regression?", "keywords": ["continuous", "binary", "classification", "sigmoid", "relationship", "dependent"]},
        {"question": "Describe the bias-variance trade-off in machine learning.", "keywords": ["error", "underfitting", "overfitting", "complexity", "generalization", "bias", "variance"]},
        {"question": "What is an ROC-AUC curve and how is it used?", "keywords": ["false positive", "true positive", "threshold", "classification", "performance", "rate"]},
        {"question": "How does cross-validation work and why is it important?", "keywords": ["k-fold", "testing", "validation", "overfitting", "dataset", "split"]},
        {"question": "Explain how the K-Means clustering algorithm works.", "keywords": ["centroid", "inertia", "distance", "unsupervised", "clusters", "mean"]}
    ],
    "Data Analyst": [
        {"question": "What is the difference between an INNER JOIN and a LEFT JOIN in SQL?", "keywords": ["matching", "both tables", "all records", "left table", "null", "intersection", "records"]},
        {"question": "Explain how you would handle missing data in a dataset.", "keywords": ["imputation", "mean", "median", "drop", "null", "remove", "predict", "forward fill"]},
        {"question": "What are the key differences between a data warehouse and a data lake?", "keywords": ["structured", "unstructured", "schema-on-write", "schema-on-read", "storage", "etl", "raw data", "transformed"]},
        {"question": "How do you detect outliers in a dataset?", "keywords": ["z-score", "iqr", "box plot", "scatter", "standard deviation", "percentile", "anomaly", "skew"]},
        {"question": "Explain the concept of normalization in a relational database.", "keywords": ["redundancy", "anomalies", "foreign key", "primary key", "normal forms", "tables", "relationships", "integrity"]},
        {"question": "What is the difference between GROUP BY and HAVING clauses in SQL?", "keywords": ["aggregation", "filter", "where clause", "results", "row", "column"]},
        {"question": "Explain what key performance indicators (KPIs) are and how they are determined.", "keywords": ["metric", "target", "business", "value", "performance", "goals"]},
        {"question": "Describe the concept and application of A/B testing.", "keywords": ["control", "variation", "significance", "p-value", "hypothesis", "conversion"]},
        {"question": "What is an ETL pipeline and what does it do?", "keywords": ["extract", "transform", "load", "warehouse", "database", "pipeline"]},
        {"question": "Compare a star schema and a snowflake schema in data modeling.", "keywords": ["dimension", "fact table", "normalization", "join", "schema"]}
    ],
    "Full Stack Developer": [
        {"question": "Describe the lifecycle of an HTTP request from a browser to a server.", "keywords": ["dns", "tcp", "ip", "handshake", "request", "response", "headers", "status code", "render"]},
        {"question": "What are the benefits of using a microservices architecture over a monolith?", "keywords": ["scalability", "deploy", "independent", "coupling", "fault tolerance", "technology stack", "services"]},
        {"question": "How do you mitigate Cross-Site Scripting (XSS) attacks?", "keywords": ["sanitization", "escaping", "csp", "content security policy", "input validation", "encoding", "malicious", "script"]},
        {"question": "Explain the difference between SQL and NoSQL databases.", "keywords": ["relational", "document", "schema", "acid", "horizontal scaling", "vertical scaling", "joins", "collections"]},
        {"question": "What is CORS and why is it necessary in web development?", "keywords": ["cross-origin", "security", "browser", "headers", "domain", "options", "preflight", "same-origin policy"]},
        {"question": "Explain what the Virtual DOM is in modern frontend frameworks.", "keywords": ["react", "reconciliation", "diff", "state", "render", "ui", "dom"]},
        {"question": "Compare session-based authentication with token-based (JWT) authentication.", "keywords": ["stateful", "stateless", "cookie", "payload", "signature", "jwt", "storage"]},
        {"question": "What are WebSockets and how do they differ from standard HTTP?", "keywords": ["bi-directional", "tcp", "polling", "real-time", "connection", "latency"]},
        {"question": "Describe the key concepts of responsive web design.", "keywords": ["media queries", "flexbox", "grid", "viewport", "layouts", "fluid"]},
        {"question": "What is database indexing and how does it speed up queries?", "keywords": ["b-tree", "query performance", "scan", "speed", "key", "index"]}
    ],
    "ML Engineer": [
        {"question": "Explain the mathematical intuition behind Gradient Descent.", "keywords": ["learning rate", "local minima", "cost function", "step", "derivative", "gradient", "optimization"]},
        {"question": "How does backpropagation work in deep neural networks?", "keywords": ["chain rule", "derivative", "weight", "gradient", "loss", "activation"]},
        {"question": "Describe the architecture of a Convolutional Neural Network (CNN).", "keywords": ["filters", "pooling", "kernel", "spatial", "convolutional", "layer", "feature"]},
        {"question": "What is regularization in ML and explain L1 vs L2 regularization.", "keywords": ["l1", "l2", "lasso", "ridge", "penalty", "overfitting", "weights"]},
        {"question": "Explain the core mechanics of the Transformer architecture.", "keywords": ["self-attention", "encoder", "decoder", "sequence", "weights", "attention"]},
        {"question": "How do you define and choose between Precision and Recall?", "keywords": ["true positive", "false negative", "false positive", "metric", "threshold", "trade-off"]},
        {"question": "What are key methods for hyperparameter optimization?", "keywords": ["grid search", "random search", "bayesian", "tuning", "iteration", "cross-validation"]},
        {"question": "What is model quantization and why is it useful?", "keywords": ["inference speed", "float16", "int8", "size reduction", "latency", "hardware"]},
        {"question": "What is feature engineering and what are some common techniques?", "keywords": ["one-hot", "scaling", "normalization", "correlation", "imputation", "features"]},
        {"question": "Describe the role of activation functions in deep learning models.", "keywords": ["relu", "sigmoid", "tanh", "derivative", "non-linear", "neuron"]}
    ],
    "Cyber Security Specialist": [
        {"question": "Compare symmetric and asymmetric encryption.", "keywords": ["public key", "private key", "aes", "rsa", "secret key", "cryptography", "speed"]},
        {"question": "What is phishing and how can organizations mitigate it?", "keywords": ["email", "spoofing", "credentials", "awareness", "mfa", "filter", "domain"]},
        {"question": "Explain the difference between a firewall, an IDS, and an IPS.", "keywords": ["filtering", "signature", "prevention", "traffic", "detection", "packets"]},
        {"question": "What are the core phases of a professional penetration test?", "keywords": ["reconnaissance", "scanning", "exploitation", "reporting", "vulnerability", "discovery"]},
        {"question": "Describe the principles of Zero Trust Architecture.", "keywords": ["least privilege", "verification", "micro-segmentation", "implicit trust", "network", "identity"]},
        {"question": "How do you protect applications against SQL Injection (SQLi) attacks?", "keywords": ["prepared statements", "parameterization", "escaping", "input validation", "query"]},
        {"question": "What is Cross-Site Request Forgery (CSRF) and how is it blocked?", "keywords": ["token", "cookies", "samesite", "request", "origin", "anti-csrf"]},
        {"question": "Explain how DDoS attacks work and how they are mitigated.", "keywords": ["botnet", "amplification", "traffic", "rate-limit", "cdn", "bandwidth"]},
        {"question": "What is Multi-Factor Authentication (MFA) and why is it recommended?", "keywords": ["token", "biometrics", "code", "factor", "something you know", "something you have"]},
        {"question": "Explain the principle of least privilege in access control.", "keywords": ["access control", "roles", "authorization", "permissions", "user", "minimize"]}
    ],
    "Embedded Systems Engineer": [
        {"question": "What is an Interrupt Service Routine (ISR) and what are its constraints?", "keywords": ["context switch", "register", "latency", "non-blocking", "interrupt", "execution"]},
        {"question": "Compare real-time operating systems (RTOS) with bare-metal systems.", "keywords": ["scheduler", "determinism", "multitasking", "overhead", "priority", "latency"]},
        {"question": "Explain the interface difference between I2C and SPI protocols.", "keywords": ["two-wire", "master-slave", "chip-select", "speed", "address", "clock", "full-duplex"]},
        {"question": "How does a watchdog timer operate in embedded microcontrollers?", "keywords": ["reset", "hang", "system lockup", "timeout", "feed", "countdown"]},
        {"question": "Why is the 'volatile' keyword crucial in embedded C?", "keywords": ["compiler optimization", "register", "memory-mapped", "hardware", "interrupt"]},
        {"question": "Explain the concept and utilization of PWM (Pulse Width Modulation).", "keywords": ["duty cycle", "frequency", "average voltage", "analog", "timer", "gpios"]},
        {"question": "What are pull-up and pull-down resistors and why are they needed?", "keywords": ["floating state", "current", "logic high", "logic low", "switch", "gpio"]},
        {"question": "Describe Direct Memory Access (DMA) and its benefits.", "keywords": ["cpu", "peripheral", "memory", "transfer", "bus", "throughput"]},
        {"question": "What factors determine Analog to Digital (ADC) conversion accuracy?", "keywords": ["bit depth", "sampling", "quantization", "reference voltage", "resolution"]},
        {"question": "Describe the UART asynchronous communication protocol.", "keywords": ["asynchronous", "baud rate", "start bit", "parity", "tx", "rx"]}
    ],
    "VLSI Design Engineer": [
        {"question": "Compare the design and implementation of ASIC and FPGA.", "keywords": ["custom", "reconfigurable", "lut", "gate array", "time to market", "silicon"]},
        {"question": "Explain the concepts of setup time and hold time in flip-flops.", "keywords": ["propagation delay", "clock edge", "flip-flop", "slack", "metastability", "data"]},
        {"question": "What is Clock Domain Crossing (CDC) and how is it handled?", "keywords": ["synchronizer", "metastability", "fifo", "setup violation", "clocks"]},
        {"question": "Compare FinFET structure with traditional planar MOSFETs.", "keywords": ["gate control", "leakage current", "short channel", "scaling", "drain", "source"]},
        {"question": "What is Static Timing Analysis (STA)?", "keywords": ["path delay", "setup check", "hold check", "clock skew", "gates", "timing"]},
        {"question": "What are the primary components of power dissipation in CMOS circuits?", "keywords": ["switching", "leakage", "static", "dynamic", "load capacitance", "voltage"]},
        {"question": "Explain how Karnaugh Maps are used for digital logic minimization.", "keywords": ["boolean expression", "logic gate", "simplification", "sum of products", "product of sums"]},
        {"question": "How can Multiplexers be used to implement general combinational logic?", "keywords": ["select lines", "input", "logic gates", "multiplexer", "boolean"]},
        {"question": "What are Mealy and Moore Finite State Machines?", "keywords": ["mealy", "moore", "outputs", "input transitions", "states", "clock"]},
        {"question": "What is sign-extension and why is it used in computer arithmetic?", "keywords": ["bit-width", "signed number", "register", "overflow", "sign bit", "bits"]}
    ],
    "Mechanical Engineer": [
        {"question": "Explain the key regions of a typical metal Stress-Strain curve.", "keywords": ["elastic", "plastic", "yield strength", "ultimate tensile", "necking", "fracture"]},
        {"question": "Describe the Carnot cycle and its thermodynamic efficiency limit.", "keywords": ["thermodynamics", "hot reservoir", "cold reservoir", "heat", "reversible", "isentropic"]},
        {"question": "What factors influence the deflection of a cantilever beam?", "keywords": ["bending moment", "inertia", "load", "young's modulus", "length", "support"]},
        {"question": "How are speed and torque related in a spur gear pair?", "keywords": ["driven gear", "driver gear", "velocity ratio", "teeth", "rpm", "power"]},
        {"question": "What is the physical meaning of the Reynolds Number?", "keywords": ["laminar", "transient", "turbulent", "viscosity", "inertial forces", "flow"]},
        {"question": "Explain the concept of Factor of Safety in engineering design.", "keywords": ["yield strength", "allowable stress", "failure", "load", "uncertainty"]},
        {"question": "Compare the three modes of heat transfer.", "keywords": ["conduction", "convection", "radiation", "fourier's law", "fluid", "electromagnetic"]},
        {"question": "State the Ideal Gas Law and explain each variable.", "keywords": ["pressure", "volume", "temperature", "moles", "constant", "gas"]},
        {"question": "What is natural frequency and why does resonance occur?", "keywords": ["damping", "stiffness", "mass", "resonance", "vibration", "amplitude"]},
        {"question": "What is the Coefficient of Performance (COP) in refrigeration systems?", "keywords": ["cop", "low temperature", "high temperature", "work", "heat transfer", "carnot"]}
    ],
    "Robotics Engineer": [
        {"question": "Explain the difference between Forward and Inverse Kinematics.", "keywords": ["joint angles", "end-effector", "cartesian", "geometry", "pose", "transforms"]},
        {"question": "How do you tune the gains of a PID controller in robotic joints?", "keywords": ["gain", "integral windup", "derivative", "overshoot", "error", "proportional"]},
        {"question": "How does a LIDAR sensor construct a 3D environment representation?", "keywords": ["distance", "laser", "point cloud", "scan", "range", "reflection", "tof"]},
        {"question": "What is odometry and what are its primary limitations in autonomous mobile robots?", "keywords": ["heading", "differential drive", "wheel encoder", "cumulative error", "slippage"]},
        {"question": "Explain how a complementary filter fuses accelerometer and gyroscope data.", "keywords": ["accelerometer", "gyroscope", "high-pass", "low-pass", "angle", "drift"]},
        {"question": "What is a 4x4 Homogeneous Transformation Matrix?", "keywords": ["rotation", "translation", "coordinate frame", "4x4", "homogeneous", "3d"]},
        {"question": "Describe the node-and-topic architecture of ROS (Robot Operating System).", "keywords": ["publish", "subscribe", "publisher", "subscriber", "message", "node", "topic"]},
        {"question": "Explain the logic of the A* search algorithm for robot path planning.", "keywords": ["heuristic", "manhattan", "cost", "path planning", "graph", "astar"]},
        {"question": "What is a Jacobian matrix in robotics and what represents a kinematic singularity?", "keywords": ["velocities", "determinant", "workspace boundary", "jacobian", "singularity", "freedom"]},
        {"question": "Describe the use of trapezoidal velocity profiles in robot joint trajectories.", "keywords": ["acceleration", "deceleration", "trapezoidal", "velocity limit", "position", "time"]}
    ],
    "General": [
        {"question": "Describe a time you solved a particularly difficult technical problem.", "keywords": ["debug", "research", "documentation", "logs", "reproduce", "test", "isolate", "colleague"]},
        {"question": "How do you ensure your code is secure and free of vulnerabilities?", "keywords": ["sanitization", "validation", "injection", "xss", "csrf", "auth", "dependency", "audit", "review"]},
        {"question": "How do you prioritize tasks when you have multiple tight deadlines?", "keywords": ["agile", "sprint", "kanban", "blockers", "communication", "stakeholders", "impact", "mvp"]}
    ],
    "Aptitude": [
        {"question": "A train passes a station platform in 36 seconds and a man standing on the platform in 20 seconds. If the speed of the train is 54 km/hr, what is the length of the platform?", "keywords": ["240", "meters", "train", "platform", "speed", "distance"]},
        {"question": "A and B invest in a business in the ratio 3:2. If 5% of the total profit goes to charity and A's share is Rs. 855, what is the total profit?", "keywords": ["1500", "profit", "charity", "ratio", "share", "partnership"]},
        {"question": "Six people (A, B, C, D, E, F) are sitting in a circle facing the center. B is between F and C; A is between E and D; F is to the left of D. Who is between A and F?", "keywords": ["E", "seating", "circle", "facing", "left", "logical"]},
        {"question": "A sum of money at compound interest amounts to thrice itself in 3 years. In how many years will it be 9 times itself?", "keywords": ["6", "years", "compound", "interest", "thrice", "nine"]}
    ],
    "Verbal": [
        {"question": "Identify the grammatical error in this sentence: 'Between you and I, I think the project will fail.' Explain why it is incorrect and provide the corrected sentence.", "keywords": ["between you and me", "pronoun", "preposition", "objective", "me"]},
        {"question": "What is the synonym of the word 'Pernicious'? Define its meaning and use it in a sentence.", "keywords": ["harmful", "destructive", "damaging", "ruinous", "deadly", "pernicious"]},
        {"question": "Explain the difference between 'its' and 'it's' with examples.", "keywords": ["possessive", "contraction", "it is", "pronoun", "apostrophe"]},
        {"question": "Correct this sentence: 'Although he was tired, but he finished the homework.' Explain the rule regarding conjunctions used here.", "keywords": ["although", "conjunction", "but", "redundant", "finished"]}
    ]
}

# Rotating focus areas for technical questions. Picking one at random each call — and
# telling the model to build the question around it — guarantees variety even when the
# role and history are identical (otherwise a low-temperature model repeats itself).
TECHNICAL_FOCUS = [
    "arrays and two-pointer techniques", "hash maps and frequency counting",
    "sliding window problems", "binary search on answer",
    "linked list manipulation", "stacks and queues", "recursion and backtracking",
    "dynamic programming", "greedy algorithms", "trees and traversals",
    "binary search trees", "heaps and priority queues", "graph BFS/DFS",
    "shortest-path or union-find", "sorting and custom comparators",
    "string parsing and pattern matching", "bit manipulation",
    "system design and scalability", "concurrency and threading",
    "database indexing and query optimization", "API design and caching",
]

# Map arbitrary target roles onto the closest technical question bank so roles that
# aren't literal bank keys (e.g. "Cloud Architect") still get relevant fallback questions
# instead of dropping to the tiny 3-question "General" set.
def _resolve_bank_key(role: str) -> str:
    if not role:
        return "Software Engineer"
    if role in QUESTION_BANK:
        return role
    r = role.lower()
    if any(k in r for k in ["ml", "machine learning", "ai engineer", "deep learning"]):
        return "ML Engineer"
    if any(k in r for k in ["data scien", "data science"]):
        return "Data Scientist"
    if any(k in r for k in ["data analyst", "analytics", "business intelligence"]):
        return "Data Analyst"
    if any(k in r for k in ["full stack", "fullstack", "frontend", "front-end", "backend", "back-end", "web", "cloud", "devops", "site reliability", "platform"]):
        return "Full Stack Developer"
    if any(k in r for k in ["security", "cyber", "penetration", "soc"]):
        return "Cyber Security Specialist"
    if any(k in r for k in ["embedded", "firmware", "iot"]):
        return "Embedded Systems Engineer"
    if any(k in r for k in ["vlsi", "verilog", "asic", "fpga", "chip"]):
        return "VLSI Design Engineer"
    if any(k in r for k in ["mechanical", "thermal", "cad"]):
        return "Mechanical Engineer"
    if any(k in r for k in ["robot", "control"]):
        return "Robotics Engineer"
    return "Software Engineer"


def generate_interview_question(role: str, previous_questions: list = None, interview_type: str = "technical") -> dict:
    """Generates a contextual interview question, avoiding previously asked questions."""
    if previous_questions is None:
        previous_questions = []

    # A random seed makes every call distinct even for identical role/history, so
    # restarting a session no longer yields the exact same first question.
    seed = random.randint(1000, 9999)

    # 1. Attempt to query configured Groq / Gemini APIs using run_ai_prompt
    if interview_type == "technical":
        focus = random.choice(TECHNICAL_FOCUS)
        prompt = f"""You are a technical interviewer at a top-tier tech firm.
Generate ONE technical/coding interview question for a candidate applying for the role of: {role}.

Build the question around this focus area: {focus}.
Style it after algorithmic problem-solving tasks from LeetCode, HackerRank, or Codeforces.
It should ask the candidate to explain their solution approach, data structures, and time/space complexity.

Do NOT repeat any of these previously asked questions:
{json.dumps(previous_questions)}

Uniqueness token (ignore in your answer, it only ensures variety): {seed}

Output MUST be a valid JSON object ONLY. No conversational text, no markdown code blocks.
JSON Structure:
{{
  "question": "A detailed question prompting the candidate to explain their approach, data structures used, and Big O time/space complexity.",
  "expected_keywords": ["5-10 key technical keywords or complexity classes, e.g. 'O(N)', 'hash map', 'two pointers', 'dynamic programming', 'stack'"]
}}"""
    elif interview_type == "aptitude":
        topic = random.choice(APTITUDE_TOPICS)
        prompt = f"""You are an aptitude examiner. Generate ONE question on EXACTLY this sub-topic:
{topic}

Do NOT repeat any of these previously asked questions:
{json.dumps(previous_questions)}

Uniqueness token (ignore in your answer, it only ensures variety): {seed}

Provide the question with all necessary details (and options/statement details if applicable). Ask the candidate to solve it and explain their step-by-step reasoning.
Output MUST be a valid JSON object ONLY. No conversational text, no markdown code blocks.
JSON Structure:
{{
  "question": "A detailed aptitude or logical reasoning question, asking the user to solve it and explain their step-by-step logic.",
  "expected_keywords": ["3-5 key numerical answers, final values, or logical keywords, e.g. '120', 'relative speed', 'south-west'"]
}}"""
    else:  # verbal
        topic = random.choice(VERBAL_TOPICS)
        prompt = f"""You are a verbal ability and English grammar examiner. Generate ONE question on EXACTLY this sub-topic:
{topic}

Do NOT repeat any of these previously asked questions:
{json.dumps(previous_questions)}

Uniqueness token (ignore in your answer, it only ensures variety): {seed}

Provide the question (vocabulary check, error correction, reading comprehension snippet, or para-jumble). Ask the candidate to solve it and explain their grammatical reasoning.
Output MUST be a valid JSON object ONLY. No conversational text, no markdown code blocks.
JSON Structure:
{{
  "question": "A detailed verbal ability question, asking the user to solve it and explain their choice or grammatical reasoning.",
  "expected_keywords": ["3-5 correct grammar options, synonyms, correct sentences, or grammatical terms that must appear in a correct answer"]
}}"""

    system_instruction = "You are a professional examiner. Return JSON only."

    try:
        # High temperature = varied questions (the default 0.2 was near-deterministic,
        # which is why restarting produced the identical question every time).
        ai_output = run_ai_prompt(prompt, system_instruction, temperature=0.9)
        if ai_output:
            cleaned = clean_json_response(ai_output)
            res = json.loads(cleaned)
            q = res.get("question")
            if q and res.get("expected_keywords") is not None and q not in previous_questions:
                return {
                    "question": q,
                    "expected_keywords": res["expected_keywords"],
                }
    except Exception as e:
        print(f"[AI Service] API question generation failed: {e}")

    # 2. Fall back to the curated static question bank
    if interview_type == "aptitude":
        bank_key = "Aptitude"
    elif interview_type == "verbal":
        bank_key = "Verbal"
    else:
        bank_key = _resolve_bank_key(role)

    available_questions = list(QUESTION_BANK.get(bank_key, []))
    # For technical tracks, widen the pool with the General behavioural questions
    # so there's more variety than a single role bank.
    if interview_type == "technical":
        available_questions += QUESTION_BANK.get("General", [])
    if not available_questions:
        available_questions = QUESTION_BANK.get("General", [])

    # Filter out questions that have already been asked this session
    filtered_questions = [q for q in available_questions if q["question"] not in previous_questions]
    if not filtered_questions:
        filtered_questions = available_questions

    selected = random.choice(filtered_questions)

    return {
        "question": selected["question"],
        "expected_keywords": selected.get("keywords", selected.get("expected_keywords", [])),
    }

def evaluate_interview_answer(question: str, user_answer: str, expected_keywords: list) -> dict:
    # 1. Attempt to query configured OpenAI / Groq / Gemini APIs using run_ai_prompt
    prompt = f"""You are a technical interviewer evaluating a candidate's verbal/text explanation to a coding question.

Question:
{question}

Expected Concepts/Keywords to address:
{", ".join(expected_keywords)}

Candidate's Answer:
{user_answer}

Evaluate the response based on accuracy, structure, correctness of their algorithmic approach, and if they correctly explained time/space complexities (e.g. O(N), O(log N)).

Return a valid JSON object ONLY. Do not include any other text or markdown code blocks.
JSON Structure:
{{
  "score": 10-100 (integer score: 80+ for correct explanations with complexities, 50-80 for partial/missing details, under 50 for incorrect or very brief explanations),
  "feedback": "Actionable, constructive feedback summarizing their strengths (e.g. 'Good understanding of sliding window') and development areas (e.g. 'Missed explaining the space complexity which is O(1)')",
  "matched_keywords": ["list of strings from the expected keywords that the candidate successfully addressed or explained in their answer"]
}}"""
    system_instruction = "You are a professional technical interviewer. Return JSON only."
    
    try:
        ai_output = run_ai_prompt(prompt, system_instruction)
        if ai_output:
            cleaned = clean_json_response(ai_output)
            res = json.loads(cleaned)
            if "score" in res and "feedback" in res and "matched_keywords" in res:
                return {
                    "score": int(res["score"]),
                    "feedback": res["feedback"],
                    "matched_keywords": res["matched_keywords"]
                }
    except Exception as e:
        print(f"[AI Service] API answer evaluation failed: {e}")

    # 2. Fall back to a deterministic rule-based evaluation
    user_answer_lower = user_answer.lower()
    matched_keywords = [kw for kw in expected_keywords if kw.lower() in user_answer_lower]
    
    # Calculate keyword coverage score
    total_keywords = len(expected_keywords)
    threshold = max(3, total_keywords // 2)
    
    if total_keywords == 0:
        keyword_score = 100
    else:
        keyword_score = min(100, int((len(matched_keywords) / threshold) * 100))
        
    # Calculate length & structure score
    words_count = len(user_answer.split())
    if words_count < 10:
        length_score = 20
    elif words_count < 30:
        length_score = 60
    elif words_count < 60:
        length_score = 90
    else:
        length_score = 100
        
    # Combine scores (70% keyword content, 30% structure/length)
    score = int(0.7 * keyword_score + 0.3 * length_score)
    score = max(10, min(100, score))
    
    # Generate contextual structured feedback
    strong_points = []
    improvements = []
    
    if len(matched_keywords) >= threshold:
        strong_points.append("You addressed key technical concepts in your explanation.")
    else:
        improvements.append("The response misses several core technical concepts expected for this question.")
        
    if words_count < 20:
        improvements.append("The response was relatively brief. In interviews, it is crucial to elaborate and provide examples.")
    elif words_count >= 50:
        strong_points.append("Your response shows solid elaboration and detail depth.")
        
    # Add suggestions of missing keywords
    missing_keywords = [kw for kw in expected_keywords if kw.lower() not in user_answer_lower]
    if missing_keywords:
        suggestions_str = ", ".join(missing_keywords[:3])
        improvements.append(f"Consider explaining related details such as: {suggestions_str}.")
        
    # Compose final feedback text
    feedback = ""
    if score >= 80:
        feedback = "EXCELLENT PERFORMANCE: "
    elif score >= 50:
        feedback = "SATISFACTORY PERFORMANCE: "
    else:
        feedback = "NEEDS REINFORCEMENT: "
        
    if strong_points:
        feedback += "Strengths: " + " ".join(strong_points) + " "
    if improvements:
        feedback += "Development Areas: " + " ".join(improvements)
        
    return {
        "score": score,
        "feedback": feedback,
        "matched_keywords": matched_keywords
    }
