import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from '../lib/toast';
import { motion, AnimatePresence } from 'framer-motion';
import ReactFlow, { Background, Controls, Panel, Handle, Position, MarkerType, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { generateRoadmap, getRoadmap, updateRoadmapStatus, generateQuiz, submitQuiz } from '../services/roadmapService';
import { getProjects } from '../services/projectService';
import Loader from '../components/Loader';

// Emojis based on category for a visual pop
const getCategoryIcon = (cat) => {
  if (!cat) return '';
  const c = cat.toLowerCase();
  if (c.includes('backend') || c.includes('api') || c.includes('server')) return '';
  if (c.includes('frontend') || c.includes('ui') || c.includes('react')) return '';
  if (c.includes('database') || c.includes('sql') || c.includes('mongo')) return '';
  if (c.includes('devops') || c.includes('cloud') || c.includes('aws') || c.includes('ci/cd')) return '';
  if (c.includes('security') || c.includes('crypto')) return '';
  if (c.includes('data') || c.includes('analyst') || c.includes('stats')) return '';
  if (c.includes('ml') || c.includes('deep') || c.includes('nlp') || c.includes('vision')) return '';
  if (c.includes('hardware') || c.includes('embedded') || c.includes('circuit') || c.includes('vlsi') || c.includes('rtos')) return '';
  if (c.includes('mechanical') || c.includes('thermo') || c.includes('cad') || c.includes('robot')) return '';
  return '';
};

// Rich local database of learning paths, syllabi, and reference links for all 53 skills
const getSkillDetails = (skillName, category) => {
  const db = {
    "AWS": {
      syllabus: [
        "Week 1: Core services (EC2, S3, RDS, VPC network architecture)",
        "Week 2: Identity & Access Management (IAM) and security rules",
        "Week 3: Serverless architectures (Lambda, API Gateway, DynamoDB)",
        "Week 4: Scaling, load balancing (ELB/ASG), and CloudWatch monitoring"
      ],
      resources: [
        { name: "AWS Certified Cloud Practitioner Exam Guide (PDF)", url: "https://d1.awsstatic.com/training-and-certification/docs-cloud-practitioner/AWS-Certified-Cloud-Practitioner_Exam-Guide.pdf", type: "doc" },
        { name: "AWS Basics Course (freeCodeCamp)", url: "https://www.youtube.com/watch?v=3hLmDS179YE", type: "video" },
        { name: "AWS Ramp-Up Guide: Cloud Essentials", url: "https://aws.amazon.com/training/ramp-up-guides/", type: "guide" }
      ]
    },
    "Agile/Scrum": {
      syllabus: [
        "Week 1: Agile Manifesto principles vs traditional waterfall methodologies",
        "Week 2: Scrum framework roles (Product Owner, Scrum Master, Developers)",
        "Week 3: Sprint events (Planning, Daily Standup, Review, Retrospective)",
        "Week 4: Scrum artifacts (Product Backlog, Sprint Backlog, Burndown charts)"
      ],
      resources: [
        { name: "The Official Scrum Guide (Schwaber & Sutherland)", url: "https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-US.pdf", type: "doc" },
        { name: "Agile Project Management Course (Google)", url: "https://www.coursera.org/learn/agile-project-management", type: "video" },
        { name: "Atlassian Agile Coach Guidebook", url: "https://www.atlassian.com/agile", type: "guide" }
      ]
    },
    "Algorithms": {
      syllabus: [
        "Week 1: Divide and Conquer (Binary Search, Merge Sort, Quick Sort)",
        "Week 2: Greedy Algorithms and Dynamic Programming (Knapsack, LCS)",
        "Week 3: Graph Algorithms (BFS, DFS, Dijkstra, Prim/Kruskal)",
        "Week 4: Complexity Classes (P vs NP) and Approximation Algorithms"
      ],
      resources: [
        { name: "MIT 6.006: Introduction to Algorithms Lectures", url: "https://www.youtube.com/playlist?list=PLUl4u3cNGP61Oq3tWYp6V_F-5jb5L2iHb", type: "video" },
        { name: "Algorithms Lecture Notes (Jeff Erickson, UIUC Textbook PDF)", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", type: "doc" },
        { name: "Algorithm Design (Jon Kleinberg & Éva Tardos)", url: "https://www.cs.princeton.edu/~wayne/kleinberg-tardos/", type: "guide" }
      ]
    },
    "C++": {
      syllabus: [
        "Week 1: Basic syntax, pointers, references, and memory allocation",
        "Week 2: Object-Oriented C++ (Encapsulation, Inheritance, Polymorphism)",
        "Week 3: Standard Template Library (STL) vectors, maps, and algorithms",
        "Week 4: Modern C++ features (Smart pointers, Move semantics, Lambda expressions)"
      ],
      resources: [
        { name: "C++ Programming Series (The Cherno Playlist)", url: "https://www.youtube.com/playlist?list=PLlrATfBNZ98dudnM48yfGUldqGD0S4FFb", type: "video" },
        { name: "Cppreference.com Official Documentation", url: "https://en.cppreference.com/w/", type: "doc" },
        { name: "A Tour of C++ (Bjarne Stroustrup)", url: "https://isocpp.org/tour", type: "guide" }
      ]
    },
    "CAD/SolidWorks": {
      syllabus: [
        "Week 1: 2D sketching, constraint matching, and dimensioning standard practices",
        "Week 2: 3D extrusions, cuts, revolves, and fillet/chamfer features",
        "Week 3: Multi-part Assembly creation, mates, and interference detection",
        "Week 4: Generating technical 2D drawings, orthographic views, and BOM tables"
      ],
      resources: [
        { name: "SolidWorks Official Tutorials & Guides", url: "https://my.solidworks.com/", type: "doc" },
        { name: "SolidWorks Beginner Tutorial (CAD CAM Tutorials)", url: "https://www.youtube.com/playlist?list=PLrOFa8sDv6jcp8E3ayUFZ4iNI8uuPjXHe", type: "video" },
        { name: "GrabCAD Design Tutorials Hub", url: "https://grabcad.com/tutorials", type: "guide" }
      ]
    },
    "CI/CD": {
      syllabus: [
        "Week 1: Continuous Integration concepts, source control flows, and build steps",
        "Week 2: Automated testing frameworks integration inside pipelines",
        "Week 3: Continuous Deployment using GitHub Actions and GitLab CI",
        "Week 4: Container deployment orchestration, environment tagging, and rollbacks"
      ],
      resources: [
        { name: "GitHub Actions Documentation", url: "https://docs.github.com/en/actions", type: "doc" },
        { name: "CI/CD Pipelines Tutorial (TechWorld with Nana)", url: "https://www.youtube.com/watch?v=scEDHsr3APg", type: "video" },
        { name: "Continuous Delivery (Martin Fowler Blog)", url: "https://martinfowler.com/bliki/ContinuousDelivery.html", type: "guide" }
      ]
    },
    "Circuit Design": {
      syllabus: [
        "Week 1: Passive components, Ohm's law, KCL/KVL, and AC analysis",
        "Week 2: Operational Amplifiers, filters, diodes, and transistors biasing",
        "Week 3: Schematics capture and PCB layout principles in Altium/EasyEDA",
        "Week 4: Signal integrity, decoupling, grounding, and power routing layout"
      ],
      resources: [
        { name: "MIT 6.002: Circuits and Electronics Playlist", url: "https://www.youtube.com/playlist?list=PLf156157833055979", type: "video" },
        { name: "Altium Essentials Training Guide PDF", url: "https://www.altium.com/documentation/altium-designer", type: "doc" },
        { name: "The Art of Electronics (Horowitz & Hill)", url: "https://artofelectronics.net/", type: "guide" }
      ]
    },
    "Computer Vision": {
      syllabus: [
        "Week 1: Image representation, color spaces, filtering, and edge detection",
        "Week 2: Traditional feature detection (SIFT, SURF, ORB) and morphology",
        "Week 3: Convolutional Neural Networks (CNNs) for classification",
        "Week 4: Object detection (YOLO, SSD) and semantic segmentation (U-Net)"
      ],
      resources: [
        { name: "Stanford CS231n: Deep Learning for Computer Vision", url: "http://cs231n.stanford.edu/", type: "doc" },
        { name: "OpenCV Official Tutorials & Guides", url: "https://docs.opencv.org/4.x/d9/df8/tutorial_root.html", type: "guide" },
        { name: "Deep Learning for Computer Vision Playlist", url: "https://www.youtube.com/playlist?list=PL5-TkQAfAZFbzxjBHtzdVCqq0Ze507YyF", type: "video" }
      ]
    },
    "Cryptography": {
      syllabus: [
        "Week 1: Symmetric ciphers (AES, DES), block modes, and stream ciphers",
        "Week 2: Asymmetric encryption (RSA, Diffie-Hellman) and prime theory",
        "Week 3: Cryptographic hash functions (SHA-2, SHA-3) and MACs",
        "Week 4: Digital signatures, certificates (X.509), and TLS handshakes"
      ],
      resources: [
        { name: "Stanford Cryptography Course (Dan Boneh Lecture Slides)", url: "https://crypto.stanford.edu/~dabo/courses/OnlineCrypto/", type: "doc" },
        { name: "Handbook of Applied Cryptography (Menezes & van Oorschot)", url: "http://cacr.uwaterloo.ca/hac/", type: "guide" },
        { name: "Cryptography I Course (Coursera Dan Boneh)", url: "https://www.coursera.org/learn/crypto", type: "video" }
      ]
    },
    "Data Structures": {
      syllabus: [
        "Week 1: Arrays, Linked Lists (Single, Double), Stack and Queue structures",
        "Week 2: Trees (Binary, BST, AVL, Red-Black) and traversals",
        "Week 3: Heaps, Hash Tables, and Hash collision resolution strategies",
        "Week 4: Graphs (Adjacency Matrix/List), representation and Union-Find"
      ],
      resources: [
        { name: "Data Structures Lectures (Abdul Bari Playlist)", url: "https://www.youtube.com/playlist?list=PLV8vIYTObSnZeS76JvHnB3y2Rj5a4V4p4", type: "video" },
        { name: "Open Data Structures (Pat Morin Textbook PDF)", url: "https://opendatastructures.org/ods-python.pdf", type: "doc" },
        { name: "GeeksforGeeks Data Structures Guide", url: "https://www.geeksforgeeks.org/data-structures/", type: "guide" }
      ]
    },
    "Data Visualization": {
      syllabus: [
        "Week 1: Visual encoding principles, color scales, and typography",
        "Week 2: Chart design guidelines (Bar, Line, Scatter plots, Heatmaps)",
        "Week 3: Dashboard layout principles, storyboarding, and grid alignments",
        "Week 4: Interactivity controls (filters, parameters, tooltips) in visual reports"
      ],
      resources: [
        { name: "Storytelling with Data (Cole Nussbaumer Knaflic Book Resources)", url: "https://www.storytellingwithdata.com/books", type: "doc" },
        { name: "Data Visualization & Dashboard Design (freeCodeCamp)", url: "https://www.youtube.com/watch?v=2K2Q8A3vMoc", type: "video" },
        { name: "D3.js Graph Gallery Guides", url: "https://d3-graph-gallery.com/", type: "guide" }
      ]
    },
    "Deep Learning": {
      syllabus: [
        "Week 1: Neural Networks basics, activation functions, loss, and backpropagation",
        "Week 2: Convolutional Neural Networks (CNNs) for spatial grids",
        "Week 3: Recurrent Neural Networks (RNNs, LSTMs) and Attention Models",
        "Week 4: Transformers (Self-Attention, BERT, GPT) and autoencoders"
      ],
      resources: [
        { name: "MIT 6.S191: Introduction to Deep Learning Lectures", url: "https://introtodeeplearning.com/", type: "video" },
        { name: "Deep Learning Textbook (Ian Goodfellow, Yoshua Bengio)", url: "https://www.deeplearningbook.org/", type: "doc" },
        { name: "Stanford CS230 Deep Learning Lecture Notes", url: "https://cs230.stanford.edu/", type: "guide" }
      ]
    },
    "Django": {
      syllabus: [
        "Week 1: MVT pattern, routing, views, templates, and server settings",
        "Week 2: Django ORM migrations, schemas, relationships, and queries",
        "Week 3: Form processing, user auth session, and token managers",
        "Week 4: Django REST Framework (DRF) serializing, views, and authentication"
      ],
      resources: [
        { name: "Django Tutorial Series (Corey Schafer Playlist)", url: "https://www.youtube.com/playlist?list=PL-osiE80TeTs4UjLw5MM6OjgkjFeUxCYH", type: "video" },
        { name: "Official Django Documentation & Guide", url: "https://docs.djangoproject.com/en/stable/", type: "doc" },
        { name: "Tango with Django (Interactive Web Tutorial)", url: "https://www.tangowithdjango.com/", type: "guide" }
      ]
    },
    "Docker": {
      syllabus: [
        "Week 1: Containers vs Virtual Machines, Docker Engine architecture",
        "Week 2: Writing Dockerfiles, building custom images, and running containers",
        "Week 3: Docker networks, local storage volumes, and port mapping",
        "Week 4: Multi-container orchestration using Docker Compose configurations"
      ],
      resources: [
        { name: "Docker Official Docs", url: "https://docs.docker.com", type: "doc" },
        { name: "Docker for Beginners (TechWorld with Nana)", url: "https://www.youtube.com/watch?v=3c-iKn5qK70", type: "video" },
        { name: "Interactive Docker Tutorial (Play with Docker)", url: "https://labs.play-with-docker.com/", type: "guide" }
      ]
    },
    "Embedded C": {
      syllabus: [
        "Week 1: Memory alignment, pointers, bit manipulation, and volatile keyword",
        "Week 2: Interrupt Service Routines (ISRs), timer registers, and GPIO configurations",
        "Week 3: Communication protocols: UART, SPI, I2C driver writing",
        "Week 4: Low-power modes, compiler optimization, and memory mapping linkage"
      ],
      resources: [
        { name: "Embedded Systems Course (Quantum Leaps)", url: "https://www.youtube.com/playlist?list=PLPW8O3mRky6aL-5yq0kH5N1-v65e53o9W", type: "video" },
        { name: "Barr Group's Embedded C Coding Standard Manual", url: "https://barrgroup.com/", type: "doc" },
        { name: "Embedded Systems Roadmap & Syllabus", url: "https://github.com/m3y54m/Embedded-Engineering-Roadmap", type: "guide" }
      ]
    },
    "Excel": {
      syllabus: [
        "Week 1: Absolute/relative references, logical functions (IF, AND, OR)",
        "Week 2: Lookup functions (VLOOKUP, INDEX-MATCH, XLOOKUP)",
        "Week 3: Pivot tables, filtering, data sorting, and chart generation",
        "Week 4: VBA basics, macros, and basic data automation operations"
      ],
      resources: [
        { name: "Excel Formulas & Functions (Kevin Stratvert Course)", url: "https://www.youtube.com/watch?v=04854Xq1Z9w", type: "video" },
        { name: "Microsoft Support Excel Functions Manual", url: "https://support.microsoft.com/en-us/excel", type: "doc" },
        { name: "Chandoo Excel Resources & Training", url: "https://chandoo.org/", type: "guide" }
      ]
    },
    "FastAPI": {
      syllabus: [
        "Week 1: Routing parameters, Pydantic validations, and server run config",
        "Week 2: Dependency injection systems, authentication, and security parameters",
        "Week 3: Database integrations (SQLAlchemy, Tortoise ORM, PostgreSQL)",
        "Week 4: Testing APIs using HTTPX, background tasks, and Docker deployment"
      ],
      resources: [
        { name: "Official FastAPI Documentation", url: "https://fastapi.tiangolo.com/", type: "doc" },
        { name: "FastAPI Complete Tutorial (freeCodeCamp Course)", url: "https://www.youtube.com/watch?v=0sOvCWFmrtA", type: "video" },
        { name: "FastAPI Developer Guide & Examples", url: "https://github.com/tiangolo/full-stack-fastapi-template", type: "guide" }
      ]
    },
    "Git": {
      syllabus: [
        "Week 1: Version Control basics, git init, git add, git commit",
        "Week 2: Branching, merging, and resolving merge conflicts",
        "Week 3: Remotes, git push, git pull, and Pull Requests on GitHub",
        "Week 4: Advanced commands (git rebase, git stash, git cherry-pick, git revert)"
      ],
      resources: [
        { name: "Pro Git Book (Scott Chacon & Ben Straub)", url: "https://git-scm.com/book/en/v2", type: "doc" },
        { name: "Git & GitHub Crash Course (Traversy Media)", url: "https://www.youtube.com/watch?v=RGOj5yH7evk", type: "video" },
        { name: "Learn Git Branching (Interactive Sandbox)", url: "https://learngitbranching.js.org/", type: "guide" }
      ]
    },
    "HTML/CSS": {
      syllabus: [
        "Week 1: Semantic HTML elements, layouts, and accessibility tagging",
        "Week 2: CSS selectors, Box Model, and flexbox structural layouts",
        "Week 3: CSS Grid, typography, positioning parameters, and sizing units",
        "Week 4: Responsive media queries, keyframe animations, and styling variables"
      ],
      resources: [
        { name: "MDN Web Docs - HTML & CSS Guide", url: "https://developer.mozilla.org/en-US/docs/Web/HTML", type: "doc" },
        { name: "CSS Flexbox & Grid Course (Kevin Powell Playlist)", url: "https://www.youtube.com/playlist?list=PL4-IK0AVhM41-Ezm5tmESVchNEi7aZU", type: "video" },
        { name: "Learn CSS Interactive Course (web.dev)", url: "https://web.dev/learn/css/", type: "guide" }
      ]
    },
    "Java": {
      syllabus: [
        "Week 1: Language syntax, basic data structures, and compiler compile loop",
        "Week 2: OOP paradigm: interfaces, abstract classes, polymorphism",
        "Week 3: Memory allocation: garbage collection, heap vs stack",
        "Week 4: Multi-threading concurrency, collections framework, and JVM config"
      ],
      resources: [
        { name: "Introduction to Programming in Java (Princeton University Notes)", url: "https://introcs.cs.princeton.edu/java/home/", type: "doc" },
        { name: "Java Programming Course for Beginners (Mosh)", url: "https://www.youtube.com/watch?v=eIrMbAQSU34", type: "video" },
        { name: "Oracle Java Documentation Tutorials", url: "https://docs.oracle.com/javase/tutorial/", type: "guide" }
      ]
    },
    "JavaScript": {
      syllabus: [
        "Week 1: Variable Scopes (let, const, var), Arrow functions, and Arrays",
        "Week 2: DOM Manipulation, Event Listeners, and Local Storage",
        "Week 3: Asynchronous Programming (Promises, Async/Await, Fetch API)",
        "Week 4: Advanced concepts (Closures, Prototypes, Event Loop, Event Bubbling)"
      ],
      resources: [
        { name: "Eloquent JavaScript (Marijn Haverbeke Textbook PDF)", url: "https://eloquentjavascript.net/Eloquent_JavaScript.pdf", type: "doc" },
        { name: "Namaste JavaScript Course (Akshay Saini Playlist)", url: "https://www.youtube.com/playlist?list=PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP", type: "video" },
        { name: "MDN Web Docs - JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript", type: "guide" }
      ]
    },
    "Kubernetes": {
      syllabus: [
        "Week 1: Pods, replica controllers, deployments, and cluster nodes",
        "Week 2: K8s services (ClusterIP, NodePort, LoadBalancer) and routing",
        "Week 3: Persistent volumes, ConfigMaps, and Secrets credentials management",
        "Week 4: Ingress routing controllers, Helm charts, and custom resource limits"
      ],
      resources: [
        { name: "Kubernetes Tutorial for Beginners (TechWorld with Nana Course)", url: "https://www.youtube.com/watch?v=X48VuDVv0do", type: "video" },
        { name: "Kubernetes.io Official Docs & Reference Guides", url: "https://kubernetes.io/docs/home/", type: "doc" },
        { name: "Interactive Kubernetes Playground (Killercoda)", url: "https://killercoda.com/playgrounds", type: "guide" }
      ]
    },
    "Linear Algebra": {
      syllabus: [
        "Week 1: Vectors, matrix operations, systems of linear equations, Gaussian elimination",
        "Week 2: Determinants, matrix inverses, vector spaces, and linear independence",
        "Week 3: Eigenvalues, eigenvectors, diagonalization, and symmetric matrices",
        "Week 4: Singular Value Decomposition (SVD), PCA, and matrix projections"
      ],
      resources: [
        { name: "MIT 18.06: Linear Algebra Lectures (Prof. Gilbert Strang)", url: "https://www.youtube.com/playlist?list=PL49CF3715CB72B641", type: "video" },
        { name: "Linear Algebra Done Right (Sheldon Axler Textbook Page)", url: "https://linear.axler.net/", type: "doc" },
        { name: "Essence of Linear Algebra (3Blue1Brown Playlist)", url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab", type: "guide" }
      ]
    },
    "Linux/Shell": {
      syllabus: [
        "Week 1: Linux directory hierarchy, permissions, and basic file operations",
        "Week 2: Pipings, redirections, grep, awk, and sed stream editors",
        "Week 3: Bash scripting: loops, variables, functions, and arguments",
        "Week 4: Process management, crontabs scheduling, systemd, and ssh setups"
      ],
      resources: [
        { name: "The Linux Command Line (William Shotts Textbook PDF)", url: "https://linuxcommand.org/tlcl.php", type: "doc" },
        { name: "Linux Bash Scripting Tutorial (The Linux Experiment)", url: "https://www.youtube.com/watch?v=s3ii48qY3sc", type: "video" },
        { name: "GNU Bash Reference Manual", url: "https://www.gnu.org/software/bash/manual/bash.html", type: "guide" }
      ]
    },
    "Machine Learning": {
      syllabus: [
        "Week 1: Supervised vs Unsupervised learning, Data Preprocessing",
        "Week 2: Regression (Linear, Logistic) & Decision Trees",
        "Week 3: SVMs, KNN, and Ensemble Methods (Random Forest, XGBoost)",
        "Week 4: Model Evaluation (Cross-validation, ROC/AUC, Precision-Recall curves)"
      ],
      resources: [
        { name: "An Introduction to Statistical Learning (ISLR Website)", url: "https://www.statlearning.com/", type: "doc" },
        { name: "Stanford CS229: Machine Learning Lectures (Andrew Ng)", url: "https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU", type: "video" },
        { name: "Machine Learning Roadmap Resource (Daniel Bourke)", url: "https://github.com/mrdbourke/machine-learning-roadmap", type: "guide" }
      ]
    },
    "Matlab": {
      syllabus: [
        "Week 1: Arrays, matrix declarations, operators, and loops in Matlab",
        "Week 2: Custom function script writing, 2D/3D plotting, and data import",
        "Week 3: Symbolic Math, numerical integration, ODE solvers (ode45)",
        "Week 4: Simulink block modeling, system simulators, and Control System Toolbox"
      ],
      resources: [
        { name: "MathWorks Official Documentation & Onramp Courses", url: "https://www.mathworks.com/help/matlab/", type: "doc" },
        { name: "MATLAB for Beginners Playlist (freeCodeCamp)", url: "https://www.youtube.com/watch?v=T_ekAD7U-wU", type: "video" },
        { name: "MATLAB tutorials for Engineering (MIT OCW)", url: "https://ocw.mit.edu/courses/res-18-002-introduction-to-matlab-fall-2008/", type: "guide" }
      ]
    },
    "Microcontrollers (Arduino/ARM)": {
      syllabus: [
        "Week 1: CPU architectures (Harvard vs Von Neumann), register maps, GPIOs",
        "Week 2: Timers, interrupts, watchdog controls, and power management",
        "Week 3: Communication peripherals: UART, SPI, I2C drivers writing",
        "Week 4: Analog interfaces: ADCs, DACs, PWM output generation, and ARM Cortex assembly"
      ],
      resources: [
        { name: "ARM Cortex-M Architecture Technical Manuals", url: "https://developer.arm.com/", type: "doc" },
        { name: "Embedded Systems Cortex-M Tutorials (Prof. Valvano Slides)", url: "https://users.ece.utexas.edu/~valvano/", type: "guide" },
        { name: "Microcontroller Programming Lectures (Quantum Leaps)", url: "https://www.youtube.com/playlist?list=PLPW8O3mRky6aL-5yq0kH5N1-v65e53o9W", type: "video" }
      ]
    },
    "MongoDB": {
      syllabus: [
        "Week 1: Document stores, JSON/BSON syntax, collections, insertion/retrieval",
        "Week 2: Complex queries: filtering, projections, and aggregation pipelines",
        "Week 3: Indexing structures, performance optimization, and storage engines",
        "Week 4: Replica sets, sharding architecture, clustering config, and security"
      ],
      resources: [
        { name: "MongoDB Official Manual & Tutorial Guides", url: "https://www.mongodb.com/docs/manual/", type: "doc" },
        { name: "MongoDB Complete Tutorial Course (freeCodeCamp)", url: "https://www.youtube.com/watch?v=ExcRb37GQTo", type: "video" },
        { name: "MongoDB University Learning Paths", url: "https://learn.mongodb.com/", type: "guide" }
      ]
    },
    "NLP": {
      syllabus: [
        "Week 1: Tokenization, TF-IDF, lemmatization, and Word2Vec models",
        "Week 2: Recurrent Neural Networks (RNNs, LSTMs) for text sequences",
        "Week 3: Transformers, Self-Attention, BERT, and Hugging Face pipelines",
        "Week 4: Large Language Models (LLMs), prompt engineering, and fine-tuning"
      ],
      resources: [
        { name: "Speech and Language Processing (Jurafsky & Martin Textbook PDF)", url: "https://web.stanford.edu/~jurafsky/slp3/ed3book.pdf", type: "doc" },
        { name: "Stanford CS224N: Natural Language Processing with Deep Learning", url: "https://www.youtube.com/playlist?list=PLoROMvodv4rOSH4v6183sVLF3Fnj91UAq", type: "video" },
        { name: "Hugging Face NLP Course Chapters", url: "https://huggingface.co/learn/nlp-course", type: "guide" }
      ]
    },
    "Network Security": {
      syllabus: [
        "Week 1: OSI Model, TCP/IP stack handshake mechanics, and subnet configuration",
        "Week 2: Firewall rulesets, routing tables, and VPN encryption protocols (IPsec/TLS)",
        "Week 3: Intrusion Detection Systems (IDS/IPS), Wireshark packet capture analysis",
        "Week 4: Network penetration scanning, ports auditing, and mitigation controls"
      ],
      resources: [
        { name: "Cisco Networking Academy documentation", url: "https://www.netacad.com/", type: "doc" },
        { name: "CompTIA Security+ course (Prof. Messer Playlist)", url: "https://www.youtube.com/playlist?list=PLG49S3nxzAnkL2gLyS11mq1vONDyC807_", type: "video" },
        { name: "Computer Networking: A Top-Down Approach (Kurose & Ross Slide Deck)", url: "http://gaia.cs.umass.edu/kurose_ross/ppt.php", type: "guide" }
      ]
    },
    "Node.js": {
      syllabus: [
        "Week 1: Event loop mechanics, V8 engine runtime, and asynchronous non-blocking",
        "Week 2: File System module, path management, and streams/buffers",
        "Week 3: Express.js routing framework, middleware layers, and controllers",
        "Week 4: Node clustering concurrency, unit testing with Jest, and deploy tools"
      ],
      resources: [
        { name: "Node.js Official Documentation Guide", url: "https://nodejs.org/en/docs", type: "doc" },
        { name: "Node.js & Express Tutorial (Coding Addict Course)", url: "https://www.youtube.com/watch?v=Oe421EPjeBE", type: "video" },
        { name: "Node.js Design Patterns (Book Resources)", url: "https://www.nodejsdesignpatterns.com/", type: "guide" }
      ]
    },
    "NumPy": {
      syllabus: [
        "Week 1: Ndarrays, data types, shapes, dimensions, and index slices",
        "Week 2: Broadcasting rules, arithmetic matrix ops, and vectorization",
        "Week 3: Matrix manipulations, dot products, transposes, and SVD/Eigen operations",
        "Week 4: File operations, masking, random sampling, and performance tips"
      ],
      resources: [
        { name: "NumPy User Guide & Reference Manuals", url: "https://numpy.org/doc/stable/user/", type: "doc" },
        { name: "NumPy Crash Course Tutorial (freeCodeCamp)", url: "https://www.youtube.com/watch?v=QUT1VHiLmmI", type: "video" },
        { name: "Interactive NumPy Tutorial (Scipy Lectures)", url: "https://scipy-lectures.org/intro/numpy/index.html", type: "guide" }
      ]
    },
    "Pandas": {
      syllabus: [
        "Week 1: Series, DataFrames, loading CSV/Excel, index selection & slices",
        "Week 2: Filtering records, dropping nulls, and data cleansing methods",
        "Week 3: GroupBy operations, pivot tables, and merging/joining data sets",
        "Week 4: Time series data offsets, memory optimization, and data exporter tools"
      ],
      resources: [
        { name: "Pandas API Documentation Portal", url: "https://pandas.pydata.org/docs/", type: "doc" },
        { name: "Pandas Tutorial Series (Corey Schafer Playlist)", url: "https://www.youtube.com/playlist?list=PL-osiE80TeTsWmV9i9c58mdDCSskIFdDS", type: "video" },
        { name: "Python for Data Analysis (Hadley/McKinney Book Reference)", url: "https://wesmckinney.com/book/", type: "guide" }
      ]
    },
    "Penetration Testing": {
      syllabus: [
        "Week 1: Reconnaissance, DNS lookups, Port scanning with Nmap, footprinting",
        "Week 2: Vulnerability scanning (Nessus, OpenVAS) and web exploits",
        "Week 3: Exploitation frameworks (Metasploit, Burp Suite interceptors)",
        "Week 4: Post-exploitation pivoting, privilege escalation, and reports compilation"
      ],
      resources: [
        { name: "OWASP Web Security Testing Guide (WSTG Project Page)", url: "https://owasp.org/www-project-web-security-testing-guide/", type: "doc" },
        { name: "Ethical Hacking Full Course (freeCodeCamp)", url: "https://www.youtube.com/watch?v=3Kq1MIfTWCE", type: "video" },
        { name: "The Pentester BluePrint (Phillip L. Wylie Book Guide)", url: "https://www.wiley.com/en-us/The+Pentester+BluePrint%3A+Your+Guide+to+Being+a+Pentester-p-9781119683698", type: "guide" }
      ]
    },
    "PostgreSQL": {
      syllabus: [
        "Week 1: SQL standard syntax, Postgres specific data types (JSONB), schemas",
        "Week 2: Subqueries, Common Table Expressions (CTEs), and window metrics",
        "Week 3: Indexing types (B-Tree, GIN, GiST), EXPLAIN analyzer, query tuning",
        "Week 4: Procedures, triggers, transactions ACID, and replication cluster"
      ],
      resources: [
        { name: "PostgreSQL Official Technical Manual", url: "https://www.postgresql.org/docs/", type: "doc" },
        { name: "PostgreSQL Database Course (freeCodeCamp Playlist)", url: "https://www.youtube.com/watch?v=qw--VYLpxG4", type: "video" },
        { name: "Postgres Tutorial.com Practical Guides", url: "https://www.postgresqltutorial.com/", type: "guide" }
      ]
    },
    "Power BI": {
      syllabus: [
        "Week 1: Power Query ETL engine, data imports, mergers, and cleaning",
        "Week 2: DAX formulas syntax, calculated columns, and measure indexes",
        "Week 3: Data modeling schemas, relationships, and cross-filter parameters",
        "Week 4: Report dashboard designs, formatting metrics, and Power BI Service publishing"
      ],
      resources: [
        { name: "Microsoft Power BI Official Docs & Guides", url: "https://learn.microsoft.com/en-us/power-bi/", type: "doc" },
        { name: "Power BI Course for Beginners (Kevin Stratvert Tutorial)", url: "https://www.youtube.com/watch?v=T5N0Z_6m70E", type: "video" },
        { name: "SQLBI DAX Guide (Alberto Ferrari & Marco Russo)", url: "https://dax.guide/", type: "guide" }
      ]
    },
    "PyTorch": {
      syllabus: [
        "Week 1: PyTorch Tensors, basic operations, and automatic gradient tracking",
        "Week 2: Neural network architectures using torch.nn module templates",
        "Week 3: Custom datasets, DataLoader batches, and training loops configuration",
        "Week 4: Model checkpoints, saving/loading weights, GPU acceleration, and torchscript"
      ],
      resources: [
        { name: "PyTorch.org Official Documentation & Tutorials", url: "https://pytorch.org/tutorials/", type: "doc" },
        { name: "PyTorch for Deep Learning Course (Daniel Bourke Video)", url: "https://www.youtube.com/watch?v=Z_ikD1xGBDg", type: "video" },
        { name: "Deep Learning with PyTorch (Eli Stevens Book Reference)", url: "https://pytorch.org/deep-learning-with-pytorch", type: "guide" }
      ]
    },
    "Python": {
      syllabus: [
        "Week 1: Variables, Control Flows, and Basic Data Types",
        "Week 2: Functions, Modules, and File I/O operations",
        "Week 3: Object-Oriented Programming (Classes, Inheritance, Decorators)",
        "Week 4: Virtual environments and Package Managers (pip, poetry)"
      ],
      resources: [
        { name: "Official Python 3 Documentation Tutorial", url: "https://docs.python.org/3/tutorial/index.html", type: "doc" },
        { name: "Python Corey Schafer Tutorials (OOP Playlist)", url: "https://www.youtube.com/playlist?list=PL-osiE80TeTsqidIuOsYlOK88MHnmrWZO", type: "video" },
        { name: "Think Python (2nd Edition, Allen B. Downey Textbook PDF)", url: "https://greenteapress.com/thinkpython2/thinkpython2.pdf", type: "guide" }
      ]
    },
    "R": {
      syllabus: [
        "Week 1: R Syntax, vectors, data frames, matrices, and list types",
        "Week 2: R Tidyverse framework (dplyr filters, mutations, data loaders)",
        "Week 3: R Ggplot2 visualizations, charts, and customizing themes",
        "Week 4: Statistical checks: ANOVA, linear regression, and R Markdown reporting"
      ],
      resources: [
        { name: "CRAN R Project Manuals", url: "https://cran.r-project.org/manuals.html", type: "doc" },
        { name: "R Programming Tutorial (Harvard CS50 R Course)", url: "https://www.youtube.com/watch?v=P56n14o8w7c", type: "video" },
        { name: "R for Data Science (Hadley Wickham Textbook Page)", url: "https://r4ds.hadley.nz/", type: "guide" }
      ]
    },
    "REST APIs": {
      syllabus: [
        "Week 1: HTTP protocol methods (GET, POST, PUT, DELETE) and status codes",
        "Week 2: Resource-oriented URI routing structures, headers, and payloads",
        "Week 3: Statelessness authentication (OAuth2, JWT) and token decoders",
        "Week 4: REST guidelines, rate-limiting, CORS handling, and API specs (OpenAPI)"
      ],
      resources: [
        { name: "Microsoft REST API Design Guidelines", url: "https://github.com/microsoft/api-guidelines", type: "doc" },
        { name: "REST API Design & Best Practices (Hussein Nasser Playlist)", url: "https://www.youtube.com/playlist?list=PLQnLJOPFTMpa83T8d9bT8yCqZqB5k-f5o", type: "video" },
        { name: "RESTful Web APIs Book Resources", url: "https://restfulwebapis.com/", type: "guide" }
      ]
    },
    "RTOS": {
      syllabus: [
        "Week 1: Task states, multitasking, schedulers (preemptive, cooperative)",
        "Week 2: Task synchronization: semaphores, mutexes, and priority inversions",
        "Week 3: Inter-task communication: message queues, direct notifications, events",
        "Week 4: Memory management, RTOS tick configurations, and porting to ARM"
      ],
      resources: [
        { name: "Mastering the FreeRTOS Real Time Kernel (Official Book)", url: "https://www.freertos.org/Documentation/RTOS_book.html", type: "doc" },
        { name: "FreeRTOS API Reference Documentation", url: "https://www.freertos.org/a00111.html", type: "guide" },
        { name: "RTOS Training & Scheduling Lectures (Quantum Leaps Playlist)", url: "https://www.youtube.com/playlist?list=PLPW8O3mRky6aL-5yq0kH5N1-v65e53o9W", type: "video" }
      ]
    },
    "React": {
      syllabus: [
        "Week 1: JSX, Functional Components, and Props passing",
        "Week 2: State Management (useState, useEffect) and Lifecycle events",
        "Week 3: Custom Hooks, Memoization (useMemo, useCallback), and Refs",
        "Week 4: Context API and Global State (Redux Toolkit or Zustand)"
      ],
      resources: [
        { name: "React.dev Official Documentation", url: "https://react.dev", type: "doc" },
        { name: "React JS Full Course (Dave Gray Video)", url: "https://www.youtube.com/watch?v=RVFAyFWO4go", type: "video" },
        { name: "React Roadmap & Guides (roadmap.sh)", url: "https://roadmap.sh/react", type: "guide" }
      ]
    },
    "Robotics & ROS": {
      syllabus: [
        "Week 1: Kinematic kinematics, frames translation, rotations, and Jacobians",
        "Week 2: ROS2 architecture: nodes, topics, publishers, and subscribers",
        "Week 3: ROS2 services, actions, custom messages, and launch files",
        "Week 4: Path planning, obstacle avoidance, LIDAR mapping, and SLAM navigations"
      ],
      resources: [
        { name: "ROS 2 Official Documentation Portal (docs.ros.org)", url: "https://docs.ros.org/en/ros2_documentation/rolling/index.html", type: "doc" },
        { name: "ROS2 Tutorial for Beginners (Articulated Robotics)", url: "https://www.youtube.com/playlist?list=PLgnSwdtH5_9o02iS2x9_11Yj14g1G133H", type: "video" },
        { name: "Introduction to Autonomous Mobile Robots (MIT OpenCourseWare Notes)", url: "https://ocw.mit.edu/courses/6-186-mobile-autonomous-systems-laboratory-january-iap-2005/", type: "guide" }
      ]
    },
    "SQL": {
      syllabus: [
        "Week 1: Relational Database models, SELECT queries, filtering with WHERE",
        "Week 2: Aggregate functions (SUM, AVG, COUNT), GROUP BY, and HAVING",
        "Week 3: Table JOINS (INNER, LEFT, RIGHT, FULL) and subqueries",
        "Week 4: Database design constraints, indexes, views, and transactions"
      ],
      resources: [
        { name: "SQL Tutorial for Beginners (Mosh Course)", url: "https://www.youtube.com/watch?v=p3qvJ9hO6Cc", type: "video" },
        { name: "SQLBolt Interactive Exercises Guide", url: "https://sqlbolt.com/", type: "guide" },
        { name: "PostgreSQL Tutorial Documentation", url: "https://www.postgresql.org/docs/", type: "doc" }
      ]
    },
    "Scikit-learn": {
      syllabus: [
        "Week 1: Datasets API, train_test_split, estimators, and fit/predict loops",
        "Week 2: Supervised classification, SVM, Decision trees, and KNN API models",
        "Week 3: Model pipelines, StandardScalers, and ColumnTransformer structures",
        "Week 4: GridSearch Cross-Validation, learning curves, and model metrics"
      ],
      resources: [
        { name: "Scikit-Learn User Guide Documentation", url: "https://scikit-learn.org/stable/user_guide.html", type: "doc" },
        { name: "Scikit-Learn ML Course (freeCodeCamp Course)", url: "https://www.youtube.com/watch?v=6avJHaC3C2U", type: "video" },
        { name: "Introduction to Machine Learning (Andreas Müller Book GitHub)", url: "https://github.com/amueller/introduction_to_ml_with_python", type: "guide" }
      ]
    },
    "Spring Boot": {
      syllabus: [
        "Week 1: Dependency Injection, Spring IoC Container, Bean lifecycles",
        "Week 2: Spring MVC routing, REST endpoints, JSON converters, validations",
        "Week 3: Spring Data JPA ORM, Hibernate mapping, and entity relationships",
        "Week 4: Security configurations (JWT, OAuth2), profiles, and actuary metrics"
      ],
      resources: [
        { name: "Spring Framework Reference Documentation", url: "https://docs.spring.io/spring-framework/reference/", type: "doc" },
        { name: "Spring Boot Full Course (Java Brains Playlist)", url: "https://www.youtube.com/playlist?list=PLqq-6Pq4lTTbx8p2oCgcAQGQyqN8XeA1x", type: "video" },
        { name: "Spring Boot in Action (Craig Walls Reference)", url: "https://www.manning.com/books/spring-boot-in-action", type: "guide" }
      ]
    },
    "Statistics": {
      syllabus: [
        "Week 1: Probability spaces, conditional probability, Bayes' theorem, permutations",
        "Week 2: Random variables, PDF/CDF, expectation, and variance formulas",
        "Week 3: Common distributions: Normal, Binomial, Poisson, Exponential, t-dist",
        "Week 4: Central Limit Theorem (CLT), hypothesis testing (t-tests, ANOVA), and confidence"
      ],
      resources: [
        { name: "Harvard Stat 110: Probability Lectures (Prof. Joe Blitzstein)", url: "https://www.youtube.com/playlist?list=PL2SOU6wwxB0uwwH80KTQ6ht66KWxbzTIo", type: "video" },
        { name: "OpenIntro Statistics (David Diez Textbook PDF)", url: "https://www.openintro.org/book/os/", type: "doc" },
        { name: "Penn State STAT 414 Probability Theory Material", url: "https://online.stat.psu.edu/stat414/", type: "guide" }
      ]
    },
    "System Design": {
      syllabus: [
        "Week 1: Vertical vs horizontal scaling, load balancers, caching layers (Redis)",
        "Week 2: Database sharding, partitioning, replication topologies, CAP Theorem",
        "Week 3: Message queues (Kafka, RabbitMQ) and event-driven architectures",
        "Week 4: Microservices architecture, API Gateways, rate limiters, and SLA metrics"
      ],
      resources: [
        { name: "System Design Primer Github Repository (donnemartin)", url: "https://github.com/donnemartin/system-design-primer", type: "doc" },
        { name: "System Design Concepts (ByteByteGo Playlist)", url: "https://www.youtube.com/playlist?list=PLMCXHnjXnTnvo2_6P61gS-o8yO1x_c6_W", type: "video" },
        { name: "Designing Data-Intensive Applications (Martin Kleppmann Reference)", url: "https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/", type: "guide" }
      ]
    },
    "Tableau": {
      syllabus: [
        "Week 1: Connecting to data sources, live vs extract files, dimensions vs measures",
        "Week 2: Building discrete/continuous charts (dual axis, maps, area charts)",
        "Week 3: Calculated fields writing, level-of-detail (LOD) formulas, parameters",
        "Week 4: Dashboards storyboards, cross-filter triggers, and tooltips formatting"
      ],
      resources: [
        { name: "Tableau Training & Help Reference Guides", url: "https://help.tableau.com/current/pro/desktop/en-us/default.htm", type: "doc" },
        { name: "Tableau Full Course for Beginners (Edureka Course)", url: "https://www.youtube.com/watch?v=aHaOIvR00Mc", type: "video" },
        { name: "Tableau Visual Gallery Best Practices", url: "https://public.tableau.com/app/discover", type: "guide" }
      ]
    },
    "TensorFlow": {
      syllabus: [
        "Week 1: Tensors, computation graphs, Keras sequential API architectures",
        "Week 2: Model compilation: optimizers (Adam, SGD), loss functions, callbacks",
        "Week 3: Custom layers, functional API, and custom training loops (tf.GradientTape)",
        "Week 4: Model deployment: TensorFlow Lite, TF Serving, and serialization (SavedModel)"
      ],
      resources: [
        { name: "TensorFlow Core Official Guides & Tutorials", url: "https://www.tensorflow.org/tutorials", type: "doc" },
        { name: "TensorFlow Crash Course (Daniel Bourke Video)", url: "https://www.youtube.com/watch?v=kY0vQqbP5tY", type: "video" },
        { name: "Hands-On ML with Scikit-Learn and TensorFlow (A. Géron Reference)", url: "https://www.oreilly.com/library/view/hands-on-machine-learning/9781492032632/", type: "guide" }
      ]
    },
    "Thermodynamics": {
      syllabus: [
        "Week 1: Properties of pure substances, Zeroth and First Laws of Thermodynamics",
        "Week 2: Second Law, entropy calculations, Carnot cycle efficiency, heat engines",
        "Week 3: Vapor and gas power cycles (Rankine, Brayton, Otto, Diesel cycles)",
        "Week 4: Refrigeration/heat pump cycles, psychrometrics, and combustion stoichiometry"
      ],
      resources: [
        { name: "Thermodynamics Lecture Slides & Problems (MIT OCW)", url: "https://ocw.mit.edu/courses/2-51-intermediate-thermodynamics-fluid-mechanics-spring-2004/", type: "doc" },
        { name: "Fundamentals of Engineering Thermodynamics (Moran & Shapiro)", url: "https://www.wiley.com/en-us/Fundamentals+of+Engineering+Thermodynamics-p-9781119391388", type: "guide" },
        { name: "Thermodynamics Lecture Course (IIT Kharagpur / NPTEL Playlist)", url: "https://www.youtube.com/playlist?list=PLDBE646BA83366BCB", type: "video" }
      ]
    },
    "TypeScript": {
      syllabus: [
        "Week 1: Static types declarations, compiler configurations (tsconfig), any vs unknown",
        "Week 2: Interfaces, type aliases, union & intersection types, index signatures",
        "Week 3: Generic constraints, conditional types, utility types (Partial, Omit)",
        "Week 4: TypeScript decorator config, modules handling, and testing integration"
      ],
      resources: [
        { name: "TypeScript Official Handbook Documentation", url: "https://www.typescriptlang.org/docs/handbook/intro.html", type: "doc" },
        { name: "TypeScript Course for Beginners (Programming with Mosh)", url: "https://www.youtube.com/watch?v=d56mG7DezGs", type: "video" },
        { name: "TypeScript Deep Dive (Basarat)", url: "https://basarat.gitbook.io/typescript/", type: "guide" }
      ]
    },
    "VLSI & Verilog": {
      syllabus: [
        "Week 1: CMOS transistor layouts, logic gates fabrication, Boolean optimization",
        "Week 2: Verilog HDL syntax: structural, dataflow, behavioral modeling",
        "Week 3: Synchronous logic, Setup & Hold slack, Clock Domain Crossing (CDC)",
        "Week 4: Synthesis constraints, Static Timing Analysis (STA), ASIC vs FPGA layouts"
      ],
      resources: [
        { name: "Verilog HDL Course Playlist (Neso Academy)", url: "https://www.youtube.com/playlist?list=PLMn9V9QauiN4bLbqWZW21dGFE8oE6QPBi", type: "video" },
        { name: "Digital Design and Computer Architecture (Harris & Harris Lectures)", url: "https://www.youtube.com/playlist?list=PLUl4u3cNGP62WVs95MNq3dQBqY2vGOtQ2", type: "guide" },
        { name: "Static Timing Analysis Reference Guide PDF", url: "http://www.vlsi-expert.com/p/static-timing-analysis.html", type: "doc" }
      ]
    }
  };

  return db[skillName] || {
    syllabus: [
      `Week 1: Core concepts and theoretical foundations of ${skillName}`,
      `Week 2: Tooling installation, standard setup, and configuration`,
      `Week 3: Developing custom modules and basic projects using ${skillName}`,
      `Week 4: Implementation testing, debugging practices, and deployment`
    ],
    resources: [
      { name: `${skillName} Official Documentation`, url: "https://docs.google.com/search?q=" + encodeURIComponent(skillName + " documentation"), type: "doc" },
      { name: `${skillName} Beginners Tutorial`, url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(skillName + " tutorial"), type: "video" },
      { name: "Roadmap.sh Developer Guides", url: "https://roadmap.sh", type: "guide" }
    ]
  };
};

// Custom Node for the Premium Glassmorphism Look
const RoadmapNode = ({ data }) => {
  const isCompleted = data.status === 'Completed';
  const isOngoing = data.status === 'Ongoing';
  const isLocked = data.isLocked;
  const isCurrent = data.isCurrent;
  
  return (
    <div className={`
      relative p-5 rounded-2xl w-80 backdrop-blur-xl transition-all duration-300 overflow-hidden group
      hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-md
      ${isLocked 
        ? 'bg-[#1f2335]/95 border-slate-700/80 opacity-85 cursor-not-allowed' 
        : isCompleted 
          ? 'bg-[#13251d]/90 border-emerald-500/80 hover:border-emerald-400' 
          : isOngoing 
            ? 'bg-[#2a2215]/90 border-amber-500/80 hover:border-amber-400' 
            : isCurrent 
              ? 'bg-white border-2 border-violet-600 shadow-md shadow-violet-600/10' 
              : 'bg-[#171926]/95 border-violet-500/30 hover:border-violet-500/70'
      }
      border cursor-pointer
    `}>
      {/* Decorative top corner accent line */}
      <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${
        isLocked 
          ? 'from-transparent via-slate-500 to-transparent' 
          : isCompleted 
            ? 'from-transparent via-emerald-400 to-transparent' 
            : isOngoing 
              ? 'from-transparent via-amber-400 to-transparent' 
              : isCurrent 
                ? 'from-violet-500 to-fuchsia-500'
                : 'from-transparent via-violet-400 to-transparent'
      }`} />

      {/* Pulsing glow ring for current step */}
      {isCurrent && (
        <div className="absolute inset-0 border-2 border-violet-500 rounded-2xl animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-25 pointer-events-none" />
      )}

      {/* Huge faded background icon */}
      <div className="absolute -right-4 -bottom-6 text-8xl opacity-[0.04] grayscale group-hover:grayscale-0 group-hover:scale-110 group-hover:opacity-10 transition-all duration-500 pointer-events-none">
        {getCategoryIcon(data.skill_name)}
      </div>

      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-slate-900 !bg-violet-500 shadow-sm" />
      
      <div className="flex items-start gap-4 mb-3 relative z-10">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shrink-0 text-white shadow-sm
          ${isLocked 
            ? 'bg-slate-600 text-slate-200' 
            : isCompleted 
              ? 'bg-emerald-600' 
              : isOngoing 
                ? 'bg-amber-500' 
                : 'bg-gradient-to-br from-violet-600 to-fuchsia-600'}
        `}>
          {isCompleted ? '✓' : data.priority_order}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-extrabold text-base truncate ${
              isLocked 
                ? 'text-slate-200' 
                : isCompleted 
                  ? 'text-emerald-100' 
                  : isOngoing 
                    ? 'text-amber-100' 
                    : isCurrent 
                      ? 'text-slate-900' 
                      : 'text-slate-200'
            }`}>{data.skill_name}</h3>
          </div>
          <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold ${
            isLocked 
              ? 'bg-slate-800/80 text-slate-300' 
              : isCompleted 
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' 
                : isOngoing 
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' 
                  : 'bg-violet-500/20 border border-violet-500/30 text-violet-400'
          }`}>
            {getCategoryIcon(data.category)} {data.category}
          </span>
        </div>
      </div>
      
      <p className={`text-xs line-clamp-2 mb-4 relative z-10 font-normal leading-relaxed ${
        isLocked 
          ? 'text-slate-400' 
          : isCompleted 
            ? 'text-emerald-300/80' 
            : isOngoing 
              ? 'text-amber-300/80' 
              : isCurrent 
                ? 'text-slate-600' 
                : 'text-slate-400'
      }`}>{data.explanation}</p>
      
      <div className={`flex justify-between items-center mt-auto pt-3 border-t relative z-10 ${
        isCurrent ? 'border-slate-200' : 'border-slate-800/85'
      }`}>
        <span className={`text-[10px] font-mono tracking-widest px-2.5 py-1 rounded border ${
          isCurrent 
            ? 'bg-slate-100 border-slate-200 text-slate-700' 
            : 'bg-[#1e2030]/60 border-slate-800/80 text-slate-400'
        }`}>
          ⏱️ {data.estimated_weeks} WKS
        </span>
        
        <div className="flex items-center gap-1.5">
          {isLocked ? (
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-900/50 border border-slate-800 px-2.5 py-1 rounded">
              Locked
            </span>
          ) : isCompleted ? (
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
              Completed
            </span>
          ) : isOngoing ? (
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded animate-pulse">
              Ongoing
            </span>
          ) : (
            <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded">
              Ready
            </span>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-slate-900 !bg-fuchsia-500 shadow-sm" />
    </div>
  );
};

const nodeTypes = { custom: RoadmapNode };

export default function Roadmap() {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [initialFitDone, setInitialFitDone] = useState(false);

  // Quiz Modal State Variables
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizToken, setQuizToken] = useState('');
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  const handleLaunchQuiz = async (skillName, itemId) => {
    setQuizOpen(true);
    setQuizLoading(true);
    setQuizResult(null);
    setUserAnswers({});
    setQuizQuestions([]);
    setQuizToken('');
    try {
      const res = await generateQuiz({ skill_name: skillName });
      setQuizQuestions(res.data.questions);
      setQuizToken(res.data.session_id);
    } catch (err) {
      toast.error('Failed to generate skill assessment quiz');
      setQuizOpen(false);
    }
    setQuizLoading(false);
  };

  const handleQuizSubmit = async () => {
    const answersList = [];
    for (let i = 0; i < 3; i++) {
      if (userAnswers[i] === undefined) {
        toast.error('Please answer all questions before submitting');
        return;
      }
      answersList.push(userAnswers[i]);
    }

    setQuizSubmitting(true);
    try {
      const res = await submitQuiz({
        roadmap_item_id: selectedNode.id,
        session_id: quizToken,
        user_answers: answersList
      });
      setQuizResult(res.data);
      if (res.data.passed) {
        loadRoadmap();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit quiz');
    }
    setQuizSubmitting(false);
  };

  // Fetch all recommended projects to link to roadmap nodes
  const loadProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch (e) {
      console.error("Failed to load projects", e);
    }
  };

  const handleStatusChange = useCallback(async (itemId, status) => {
    try {
      await updateRoadmapStatus(itemId, { status });
      
      setRoadmap((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.map((item) => 
          item.id === itemId ? { ...item, status } : item
        );
        return { ...prev, items: updatedItems };
      });
    } catch { 
      toast.error('Failed to update status'); 
    }
  }, []);

  const mapDataToGraph = useCallback((items) => {
    const newNodes = [];
    const newEdges = [];

    // Calculate locks and current flags on the nodes array
    let foundCurrent = false;
    const itemsWithStatus = items.map((item, index) => {
      const isLocked = items.slice(0, index).some(p => p.status !== 'Completed');
      let isCurrent = false;
      if (!foundCurrent && item.status !== 'Completed') {
        isCurrent = true;
        foundCurrent = true;
      }
      return { ...item, isLocked, isCurrent };
    });

    itemsWithStatus.forEach((item, index) => {
      // Beautiful central spine layout: alternating left and right
      const isLeft = index % 2 === 0;
      const x = isLeft ? 100 : 500;
      const y = index * 240; // Increased spacing for larger nodes

      newNodes.push({
        id: item.id.toString(),
        type: 'custom',
        position: { x: x, y: y },
        data: { 
          ...item, 
          onStatusChange: handleStatusChange
        }
      });

      // Connect to the next node with smoothstep
      if (index < itemsWithStatus.length - 1) {
        const nextItem = itemsWithStatus[index + 1];
        const isComp = item.status === 'Completed';
        const isNextComp = nextItem.status === 'Completed';
        const isOngoing = item.status === 'Ongoing';
        
        let pathColor = '#475569'; // locked or default gray pipeline
        let strokeW = 2.5;
        let animated = false;
        
        if (isComp && isNextComp) {
          pathColor = '#10b981'; // fully completed emerald green pipeline
          strokeW = 4;
        } else if (isComp && nextItem.status === 'Ongoing') {
          pathColor = '#8b5cf6'; // active loading violet pipeline
          strokeW = 4;
          animated = true;
        } else if (isComp) {
          pathColor = '#a78bfa'; // unlocked ready light-violet pipeline (high contrast)
          strokeW = 3;
          animated = true;
        } else if (isOngoing) {
          pathColor = '#f59e0b'; // ongoing amber pipeline
          strokeW = 3;
          animated = true;
        }

        newEdges.push({
          id: `e${item.id}-${nextItem.id}`,
          source: item.id.toString(),
          target: nextItem.id.toString(),
          type: 'smoothstep', // Gives it a circuit-board/tree look
          animated: animated,
          style: { 
            stroke: pathColor, 
            strokeWidth: strokeW,
            opacity: 0.85
          },
          markerEnd: { 
            type: MarkerType.ArrowClosed, 
            color: pathColor 
          }
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [handleStatusChange, setNodes, setEdges]);

  const loadRoadmap = async () => {
    try {
      const res = await getRoadmap();
      setRoadmap(res.data);
    } catch { 
      setRoadmap(null); 
    }
    setLoading(false);
  };

  useEffect(() => { 
    loadRoadmap(); 
    loadProjects();

    const handleRefresh = () => {
      loadRoadmap();
      loadProjects();
    };
    window.addEventListener('pfj_refresh_data', handleRefresh);
    return () => window.removeEventListener('pfj_refresh_data', handleRefresh);
  }, []);

  // 1. Sync roadmap items to React Flow nodes/edges
  useEffect(() => {
    if (roadmap?.items) {
      mapDataToGraph(roadmap.items);
    }
  }, [roadmap, mapDataToGraph]);

  // 2. Auto-sync selectedNode details when roadmap status updates
  useEffect(() => {
    if (!roadmap?.items) return;
    
    setSelectedNode((prevSelected) => {
      if (!prevSelected) return null;
      
      const items = roadmap.items;
      const matchedItem = items.find(i => i.id === prevSelected.id);
      if (matchedItem) {
        const isLocked = items.slice(0, items.indexOf(matchedItem)).some(p => p.status !== 'Completed');
        let isCurrent = false;
        for (let item of items) {
          if (item.status !== 'Completed') {
            if (item.id === matchedItem.id) isCurrent = true;
            break;
          }
        }
        return { ...matchedItem, isLocked, isCurrent };
      }
      return null;
    });
  }, [roadmap]);

  // 3. Fit view exactly once when nodes are loaded and reactFlowInstance is ready
  useEffect(() => {
    if (nodes.length > 0 && reactFlowInstance && !initialFitDone) {
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.15 });
        setInitialFitDone(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes, reactFlowInstance, initialFitDone]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateRoadmap({});
      setRoadmap(res.data);
      setInitialFitDone(false);
      setSelectedNode(null);
    } catch (err) { 
      toast.error(err.response?.data?.detail || 'Failed to generate roadmap'); 
    }
    setGenerating(false);
  };

  // ReactFlow custom event when a node card is clicked
  const onNodeClick = (event, node) => {
    // Determine the lock/current status for the inspector
    const items = roadmap?.items || [];
    const matchedItem = items.find(i => i.id === node.data.id);
    if (matchedItem) {
      const isLocked = items.slice(0, items.indexOf(matchedItem)).some(p => p.status !== 'Completed');
      let isCurrent = false;
      for (let item of items) {
        if (item.status !== 'Completed') {
          if (item.id === matchedItem.id) isCurrent = true;
          break;
        }
      }
      setSelectedNode({ ...matchedItem, isLocked, isCurrent });
    }
  };

  // Dynamic calculations for the top HUD bar
  const progressMetrics = useMemo(() => {
    if (!roadmap?.items?.length) return { percent: 0, completed: 0, total: 0, weeksRemaining: 0 };
    const total = roadmap.items.length;
    const completed = roadmap.items.filter(i => i.status === 'Completed').count || roadmap.items.filter(i => i.status === 'Completed').length;
    const percent = Math.round((completed / total) * 100);
    const weeksRemaining = roadmap.items
      .filter(i => i.status !== 'Completed')
      .reduce((sum, i) => sum + i.estimated_weeks, 0);
    return { percent, completed, total, weeksRemaining: round(weeksRemaining, 1) };
  }, [roadmap]);

  function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }

  // Get syllabus and links for the selected skill
  const selectedNodeDetails = useMemo(() => {
    if (!selectedNode) return null;
    return getSkillDetails(selectedNode.skill_name, selectedNode.category);
  }, [selectedNode]);

  // Find recommended projects requiring this skill
  const matchingProjects = useMemo(() => {
    if (!selectedNode) return [];
    return projects.filter(proj => 
      proj.skills.some(skill => skill.toLowerCase() === selectedNode.skill_name.toLowerCase())
    );
  }, [selectedNode, projects]);

  if (loading) return <Loader />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-6rem)] flex flex-col roadmap-page">
      
      {/* ─── HUD TOP PROGRESS BAR ─── */}
      {roadmap?.items?.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800/80 backdrop-blur-md rounded-2xl mb-6 p-4 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 shadow-lg">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="font-bold text-white text-base">Path to {roadmap.target_role}</h2>
                  <p className="text-[11px] text-slate-400">Personalized Curriculum</p>
                </div>
              </div>
              <span className="text-sm font-black text-violet-400 drop-shadow-[0_0_5px_rgba(139,92,246,0.3)]">
                {progressMetrics.percent}% COMPLETE
              </span>
            </div>
            
            {/* High-tech glow progress bar container */}
            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-violet-500 to-fuchsia-500 transition-all duration-1000 shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
                style={{ width: `${progressMetrics.percent}%` }}
              />
            </div>
          </div>
          
          <div className="flex gap-4 self-center md:self-auto font-mono">
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl px-4 py-2 text-center min-w-[100px]">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Progress</div>
              <div className="text-lg font-black text-white">{progressMetrics.completed}/{progressMetrics.total}</div>
            </div>
            
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl px-4 py-2 text-center min-w-[100px]">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Remaining</div>
              <div className="text-lg font-black text-neon-pink">~{progressMetrics.weeksRemaining} Wks</div>
            </div>
            
            <button onClick={handleGenerate} disabled={generating} className="btn-primary py-2 px-5 text-sm disabled:opacity-50 shadow-[0_0_20px_rgba(168,85,247,0.4)] self-center">
              {generating ? 'Rebuilding...' : ' Rebuild Path'}
            </button>
          </div>
        </div>
      )}

      {/* Main Section Header if roadmap is empty */}
      {!roadmap?.items?.length && (
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h1 className="section-title text-3xl"> Skill Tree</h1>
            <p className="text-gray-400 mt-1">Initialize your personalized path to target job roles.</p>
          </div>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary disabled:opacity-50 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            {generating ? 'Generating AI Roadmap...' : ' Generate Path'}
          </button>
        </div>
      )}

      {!roadmap?.items?.length ? (
        <div className="glass-card text-center py-16 mt-10">
          <p className="text-5xl mb-4"></p>
          <p className="text-gray-400 mb-2">Your skill tree is empty.</p>
          <p className="text-xs text-gray-500">Ensure your profile is set up, then click Generate to create your personalized path.</p>
        </div>
      ) : (
        <div className="flex-1 flex gap-6 min-h-0 relative">
          
          {/* ─── LEFT: REACT FLOW CANVAS ─── */}
          <div className="flex-1 bg-slate-950 p-0 overflow-hidden relative border border-slate-800 rounded-3xl shadow-xl">
            
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              onInit={setReactFlowInstance}
              className="aurora-canvas"
              minZoom={0.2}
              maxZoom={1.5}
            >
              <Background variant="dots" color="#475569" gap={28} size={1.5} opacity={0.7} />
              
              <Controls className="bg-slate-900 border border-slate-800 text-slate-300 fill-slate-300 rounded-lg overflow-hidden shadow-md" />
              
              {/* Legend Panel */}
              <Panel position="top-left" className="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-2xl text-xs max-w-xs text-slate-300 shadow-xl hidden sm:block">
                <h4 className="font-bold text-white mb-2 text-[10px] uppercase tracking-widest text-violet-400">Pipeline Legend</h4>
                <div className="flex flex-col gap-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-200">✓ Completed Step</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-semibold text-slate-200">🔥 Ongoing Focus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                    <span className="font-semibold text-slate-200"> Ready to Learn</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-50">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                    <span className="font-semibold text-slate-400"> Locked (Pending Prereqs)</span>
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </div>

          {/* ─── RIGHT: SELECTED NODE DETAILS ─── */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-full md:w-[420px] bg-slate-900/95 border border-slate-800 rounded-3xl overflow-y-auto dark-scrollbar flex flex-col shrink-0 p-5 shadow-lg backdrop-blur-md"
              >
                {/* Drawer Header */}
                <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-800">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCategoryIcon(selectedNode.skill_name)}</span>
                      <h2 className="font-extrabold text-white text-lg truncate">{selectedNode.skill_name}</h2>
                    </div>
                    <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-extrabold bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan">
                      {selectedNode.category}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedNode(null)} 
                    className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 p-2 rounded-xl transition-all"
                  >
                    ✕
                  </button>
                </div>

                {/* Lock Alert Banner */}
                {selectedNode.isLocked && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 flex items-start gap-3">
                    <span className="text-base mt-0.5"></span>
                    <div>
                      <p className="font-bold">Prerequisite Pending</p>
                      <p className="opacity-80 mt-0.5">Please complete the earlier steps in your curriculum to unlock this skill module.</p>
                    </div>
                  </div>
                )}

                {/* Quick Stats Panel */}
                <div className="grid grid-cols-2 gap-3 mb-5 font-mono">
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3 text-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Study Duration</div>
                    <div className="text-sm font-bold text-slate-200">{selectedNode.estimated_weeks} Weeks</div>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3 text-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Priority Index</div>
                    <div className="text-sm font-bold text-cyan-400">Step #{selectedNode.priority_order}</div>
                  </div>
                </div>

                {/* Dynamic Status Switcher (Action Item) */}
                <div className="mb-5 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4">
                  <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Set Milestone Status</h3>
                  
                  <div className="flex gap-2">
                    <button 
                      disabled={selectedNode.isLocked}
                      onClick={() => handleStatusChange(selectedNode.id, 'Pending')}
                      className={`flex-1 py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all border ${
                        selectedNode.status === 'Pending' 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30'
                      }`}
                    >
                      Ready
                    </button>
                    
                    <button 
                      disabled={selectedNode.isLocked}
                      onClick={() => handleStatusChange(selectedNode.id, 'Ongoing')}
                      className={`flex-1 py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all border ${
                        selectedNode.status === 'Ongoing' 
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30'
                      }`}
                    >
                      Active
                    </button>

                    <button 
                      disabled={selectedNode.isLocked}
                      onClick={() => selectedNode.status !== 'Completed' ? handleLaunchQuiz(selectedNode.skill_name, selectedNode.id) : null}
                      className={`flex-1 py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all border ${
                        selectedNode.status === 'Completed' 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30'
                      }`}
                    >
                      Done
                    </button>
                  </div>
                </div>

                {/* Explanation */}
                <div className="mb-5">
                  <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Demand Analysis</h3>
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3.5 text-xs text-slate-300 leading-relaxed">
                     {selectedNode.explanation}
                  </div>
                </div>

                {/* Dynamic Syllabus Checklist */}
                {selectedNodeDetails?.syllabus && (
                  <div className="mb-5">
                    <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Study Syllabus</h3>
                    <div className="flex flex-col gap-2.5">
                      {selectedNodeDetails.syllabus.map((week, idx) => (
                        <div key={idx} className="flex gap-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3 text-xs text-slate-300 items-start">
                          <span className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center font-bold shrink-0 text-cyan-400">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{week}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Learning Resources */}
                {selectedNodeDetails?.resources && (
                  <div className="mb-5">
                    <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Reference Materials</h3>
                    <div className="flex flex-col gap-2">
                      {selectedNodeDetails.resources.map((res, idx) => (
                        <a 
                          key={idx} 
                          href={res.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-emerald-500/5 rounded-2xl transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">
                              {res.type === 'doc' ? '' : res.type === 'video' ? '' : ''}
                            </span>
                            <span className="text-xs font-medium text-slate-300 group-hover:text-white">{res.name}</span>
                          </div>
                          <span className="text-[10px] text-emerald-400 group-hover:translate-x-1 transition-transform">➜</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matching Hands-on Projects */}
                <div>
                  <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Hands-on Practice Projects</h3>
                  {matchingProjects.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      {matchingProjects.map((proj) => (
                        <div key={proj.id} className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3.5 shadow-sm">
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <h4 className="font-bold text-xs text-white">{proj.project_name}</h4>
                            <span className="text-[9px] px-2 py-0.5 rounded font-mono uppercase bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold shrink-0">
                              {proj.difficulty}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-400 line-clamp-2 leading-relaxed mb-3">{proj.description}</p>
                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80">
                            <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">{proj.domain}</span>
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                              Matches Skill
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-950/20 border border-slate-800/50 rounded-2xl p-4 text-center">
                       Build your own sandbox project to apply this skill once you complete the syllabus.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* ─── AI SKILL ASSESSMENT QUIZ MODAL ─── */}
      <AnimatePresence>
        {quizOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !quizLoading && !quizSubmitting && setQuizOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md z-10 text-white overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex flex-col shrink-0 mb-4">
                <div className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent leading-tight py-1">
                  Skill Verification
                </div>
                <div className="text-sm font-bold text-slate-300 truncate leading-normal mt-0.5">
                  Verify competency for {selectedNode?.skill_name}
                </div>
              </div>
              
              {quizLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-mono animate-pulse">Generating custom AI assessment...</p>
                </div>
              ) : quizResult ? (
                /* QUIZ RESULT PANEL */
                <div className="flex flex-col items-center py-6 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-black mb-4 ${
                    quizResult.passed 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {quizResult.passed ? '✓' : '✕'}
                  </div>
                  
                  <h4 className="text-lg font-extrabold mb-1">
                    {quizResult.passed ? 'Verification Passed!' : 'Verification Failed'}
                  </h4>
                  <p className="text-slate-300 text-sm mb-6 max-w-md">
                    {quizResult.passed 
                      ? `Congratulations! You scored ${quizResult.score}/${quizResult.total} and verified your expertise. The next steps are now unlocked.`
                      : `You scored ${quizResult.score}/${quizResult.total}. Please review the syllabus guidelines and references, and try again.`}
                  </p>
                  
                  <button 
                    onClick={() => {
                      setQuizOpen(false);
                      setQuizResult(null);
                    }}
                    className={`px-8 py-3 rounded-xl text-sm font-bold tracking-wide transition-all shadow-md active:scale-95 ${
                      quizResult.passed 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {quizResult.passed ? 'Close & Unlock' : 'Close & Study'}
                  </button>
                </div>
              ) : (
                /* QUIZ QUESTIONS PANEL */
                <div className="flex-1 overflow-y-auto pr-2 mb-6 space-y-6 dark-scrollbar">
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 font-normal">
                    Prove your knowledge! Select the correct option for each of the 3 questions below. You need to answer at least 2 questions correctly to unlock the skill node.
                  </p>
                  
                  {quizQuestions.map((q, qIdx) => (
                    <div key={q.id} className="space-y-3">
                      <h4 className="text-sm font-extrabold text-slate-200 flex gap-2">
                        <span className="text-violet-400 font-bold">Q{qIdx + 1}.</span>
                        <span>{q.question}</span>
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = userAnswers[qIdx] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => setUserAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                              className={`text-left p-3.5 rounded-2xl text-xs font-medium border transition-all duration-200 cursor-pointer ${
                                isSelected 
                                  ? 'bg-violet-500/20 border-violet-500 text-violet-200 shadow-md shadow-violet-500/10' 
                                  : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold border shrink-0 ${
                                  isSelected 
                                    ? 'bg-violet-500 border-violet-400 text-white' 
                                    : 'border-slate-800 text-slate-500'
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!quizLoading && !quizResult && (
                <div className="flex justify-between items-center pt-4 border-t border-slate-800/80 mt-auto">
                  <button 
                    onClick={() => setQuizOpen(false)}
                    disabled={quizSubmitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleQuizSubmit}
                    disabled={quizSubmitting || Object.keys(userAnswers).length < 3}
                    className="btn-primary py-2.5 px-6 text-xs disabled:opacity-50 shadow-[0_0_15px_rgba(22,101,52,0.4)]"
                  >
                    {quizSubmitting ? 'Evaluating...' : 'Submit Answers'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
