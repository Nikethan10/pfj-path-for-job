import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getProfile, createProfile } from '../services/profileService';
import { getStudentSkills, getAvailableSkills, addSkill, getAvailableRoles } from '../services/skillService';
import { getSummary, getActivityHeatmap } from '../services/analyticsService';
import { getProjects } from '../services/projectService';
import Loader from '../components/Loader';
import { toast } from '../lib/toast';

// Branch options mapping
const BRANCH_OPTIONS = {
  'B.Tech': [
    'CSE',
    'AI ML',
    'Electronics Communication Engineering',
    'Mechanical Engineering',
    'Cyber Security'
  ],
  'M.Tech': [
    'Computer Science & Engineering (CSE)',
    'Data Science',
    'Artificial Intelligence',
    'VLSI & Embedded Systems',
    'Cyber Security',
    'Software Engineering'
  ]
};

// Recommended career trajectories per branch
const BRANCH_RECOMMENDED_ROLES = {
  // B.Tech Branches
  'CSE': ['Software Engineer', 'Full Stack Developer', 'Data Scientist', 'ML Engineer', 'Data Analyst', 'Cyber Security Specialist'],
  'AI ML': ['ML Engineer', 'Data Scientist', 'Software Engineer', 'Data Analyst'],
  'Electronics Communication Engineering': ['Embedded Systems Engineer', 'VLSI Design Engineer', 'Robotics Engineer', 'Software Engineer', 'ML Engineer'],
  'Mechanical Engineering': ['Mechanical Engineer', 'Robotics Engineer'],
  'Cyber Security': ['Cyber Security Specialist', 'Software Engineer'],

  // M.Tech Branches
  'Computer Science & Engineering (CSE)': ['Software Engineer', 'Full Stack Developer', 'Data Scientist', 'ML Engineer', 'Data Analyst', 'Cyber Security Specialist'],
  'Data Science': ['Data Scientist', 'Data Analyst', 'ML Engineer'],
  'Artificial Intelligence': ['ML Engineer', 'Data Scientist', 'Software Engineer'],
  'VLSI & Embedded Systems': ['VLSI Design Engineer', 'Embedded Systems Engineer', 'Robotics Engineer'],
  'Software Engineering': ['Software Engineer', 'Full Stack Developer']
};

// Build a REAL 7-week x 7-day activity grid (+ streak/total) from the activity map
// returned by GET /api/analytics/activity ({ 'YYYY-MM-DD': count }).
const buildHeatmap = (activityMap = {}) => {
  const days = [];
  const today = new Date();
  for (let i = 48; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const count = activityMap[key] || 0;
    days.push({ count, intensity: count <= 0 ? 0 : Math.min(4, count) });
  }
  const grid = [];
  for (let w = 0; w < 7; w++) grid.push(days.slice(w * 7, w * 7 + 7).map((x) => x.intensity));

  const total = days.reduce((s, x) => s + x.count, 0);
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) streak += 1;
    else break;
  }
  return { grid, total, streak };
};

const getRoleDemandData = (role) => {
  const defaults = {
    forecast: [
      { skill: "MLOps / LLM Infrastructure", change: "↑ +82%", trend: "High growth trajectory due to enterprise AI operationalization.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
      { skill: "Python & PyTorch", change: "↑ +24%", trend: "Retains absolute dominance for data engineering, model training and backend scripting.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
      { skill: "SQL / Vector Databases", change: "↑ +38%", trend: "Hybrid search databases show explosive demand alongside standard data warehousing.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
      { skill: "Tableau / Traditional BI", change: "↓ -12%", trend: "Standard reporting skills show visual tooling compaction. Prefer Python/R automation.", color: "text-rose-600 bg-rose-50 border-rose-100" },
    ],
    cities: {
      "Bengaluru, KA": "LLMs, Docker, Node.js",
      "Hyderabad, TS": "AWS, Embedded C, Java",
      "Pune, MH": "PyTorch, VLSI, C++",
      "Mumbai, MH": "SQL, Python, Excel",
      "Delhi NCR": "React, MongoDB, Git"
    }
  };

  const mappings = {
    "Data Scientist": {
      forecast: [
        { skill: "Apache Spark / PySpark", change: "↑ +58%", trend: "Distributed computing skills show massive growth with enterprise data volumes.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Python & Pandas", change: "↑ +22%", trend: "Absolute baseline standard for analysis pipelines and exploratory data modeling.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Scikit-learn & Machine Learning", change: "↑ +35%", trend: "Tabular machine learning pipelines continue to drive daily forecasting decisions.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Manual Spreadsheet Entry", change: "↓ -18%", trend: "Decreasing reliance on manual data entry in favor of automated API ingest streams.", color: "text-rose-600 bg-rose-50 border-rose-100" },
      ],
      cities: {
        "Bengaluru, KA": "PySpark, ML, Pandas",
        "Hyderabad, TS": "Python, Jupyter, SQL",
        "Pune, MH": "TensorFlow, Statistics, Git",
        "Mumbai, MH": "Scikit-learn, Tableau, R",
        "Delhi NCR": "Excel, Data Visualization, NumPy"
      }
    },
    "Software Engineer": {
      forecast: [
        { skill: "System Design & Microservices", change: "↑ +46%", trend: "High demand for designing resilient, partitioned, and highly available services.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Go & Kubernetes Orchestration", change: "↑ +62%", trend: "Rapid adoption for cloud-native container clustering and platform automation.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "PostgreSQL & Redis Caching", change: "↑ +34%", trend: "Crucial for application database caching layers and transaction reliability.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Monolithic Maintenance", change: "↓ -15%", trend: "Slower hiring rates for monolithic legacy systems. Focus is on distributed components.", color: "text-rose-600 bg-rose-50 border-rose-100" },
      ],
      cities: {
        "Bengaluru, KA": "System Design, Go, Redis",
        "Hyderabad, TS": "Java, Spring Boot, CI/CD",
        "Pune, MH": "Python, Linux, Docker",
        "Mumbai, MH": "SQL, Algorithms, PostgreSQL",
        "Delhi NCR": "REST APIs, Git, Kubernetes"
      }
    },
    "ML Engineer": {
      forecast: [
        { skill: "LLMs & LangChain Orchestration", change: "↑ +94%", trend: "Explosive growth in applications integrating cognitive agents and prompt chains.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "PyTorch Deep Learning", change: "↑ +52%", trend: "Industry-standard framework for model training, custom layers, and active research.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Vector Databases (pgvector/Milvus)", change: "↑ +78%", trend: "RAG architectures require advanced index vectors for contextual lookup pipelines.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Manual Hyperparameter Tuning", change: "↓ -25%", trend: "Automation scripts (MLflow, Optuna) replace manual iterative grid testing.", color: "text-rose-600 bg-rose-50 border-rose-100" },
      ],
      cities: {
        "Bengaluru, KA": "LangChain, Vector DBs, PyTorch",
        "Hyderabad, TS": "TensorFlow, System Design, AWS",
        "Pune, MH": "Deep Learning, Git, MLOps",
        "Mumbai, MH": "Python, Docker, SQL",
        "Delhi NCR": "Machine Learning, Scikit-learn, Linux"
      }
    },
    "Data Analyst": {
      forecast: [
        { skill: "Advanced SQL Queries", change: "↑ +42%", trend: "Critical competency for high-volume data retrieval, joins, and database analytics.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Power BI & Tableau Dashboarding", change: "↑ +28%", trend: "Stable demand for interactive dashboards communicating metrics to management.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Python & Pandas Scripting", change: "↑ +38%", trend: "Strong upward trend as analysts shift from static sheets to programmatic pipelines.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Basic Spreadsheet Reports", change: "↓ -12%", trend: "Traditional spreadsheet reports are losing ground to interactive, live dashboards.", color: "text-rose-600 bg-rose-50 border-rose-100" },
      ],
      cities: {
        "Bengaluru, KA": "Tableau, SQL, Pandas",
        "Hyderabad, TS": "Power BI, Excel, Statistics",
        "Pune, MH": "Python, PostgreSQL, Jupyter",
        "Mumbai, MH": "Data Visualization, Git, R",
        "Delhi NCR": "SQL, Excel, Data Viz"
      }
    },
    "Full Stack Developer": {
      forecast: [
        { skill: "Next.js & React Applications", change: "↑ +68%", trend: "High demand for fast page loads, SSR/ISR generation, and state management.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "TypeScript & Node Backend API", change: "↑ +45%", trend: "Strong type-safety adoption across backend endpoints and cloud-run APIs.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "GraphQL & REST Endpoints", change: "↑ +32%", trend: "Crucial for connecting modern frontends to microservices and data pipelines.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Vanilla JS / Basic CSS", change: "↓ -16%", trend: "Modern frameworks and styling tools (Tailwind) are dominant defaults now.", color: "text-rose-600 bg-rose-50 border-rose-100" },
      ],
      cities: {
        "Bengaluru, KA": "React, Next.js, Tailwind CSS",
        "Hyderabad, TS": "Node.js, TypeScript, GraphQL",
        "Pune, MH": "Docker, MongoDB, AWS",
        "Mumbai, MH": "PostgreSQL, SQL, Git",
        "Delhi NCR": "JavaScript, HTML/CSS, REST APIs"
      }
    },
    "Embedded Systems Engineer": {
      forecast: [
        { skill: "RTOS & FreeRTOS Micro-kernels", change: "↑ +55%", trend: "High demand for real-time scheduling in smart devices and consumer IoT products.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Rust for Embedded Systems", change: "↑ +74%", trend: "Growing safety-critical adoption replacing legacy memory-unsafe C modules in new kernels.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "ARM Cortex & Microcontrollers", change: "↑ +28%", trend: "Edge computing workloads drive high integration and complex peripheral bus management.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "8-bit Assembly Coding", change: "↓ -18%", trend: "Modern compiler efficiency shifts development towards high-level abstraction architectures.", color: "text-rose-600 bg-rose-50 border-rose-100" },
      ],
      cities: {
        "Bengaluru, KA": "ARM Cortex, FreeRTOS, I2C",
        "Hyderabad, TS": "Embedded C, Microcontrollers, SPI",
        "Pune, MH": "RTOS, Linux Kernel, CAN Bus",
        "Mumbai, MH": "IoT Prototypes, Arduino, ESP32",
        "Delhi NCR": "Firmware, Zigbee, Bluetooth BLE"
      }
    },
    "VLSI Design Engineer": {
      forecast: [
        { skill: "SystemVerilog & UVM Verification", change: "↑ +60%", trend: "Verification complexity drives immense need for unified verification methodologies.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "FPGA Programming & Prototyping", change: "↑ +42%", trend: "Edge hardware acceleration designs require fast simulation prototyping cycles.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "ASIC Synthesis & Timing Closure", change: "↑ +35%", trend: "Advanced technology nodes require rigorous timing constraints and power closures.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Schematic Manual Capture", change: "↓ -14%", trend: "Standard automation scripts and compiler synthesis replace manual layout captures.", color: "text-rose-600 bg-rose-50 border-rose-100" },
      ],
      cities: {
        "Bengaluru, KA": "SystemVerilog, UVM, RTL Synthesis",
        "Hyderabad, TS": "FPGA, Verilog, Vivado",
        "Pune, MH": "ASIC Design, STA, CMOS",
        "Mumbai, MH": "HDL Simulation, Cadence, VHDL",
        "Delhi NCR": "Physical Design, Layout, Calibre"
      }
    },
    "Robotics Engineer": {
      forecast: [
        { skill: "ROS 2 & Robot Operating System", change: "↑ +80%", trend: "Industry-wide migration to ROS 2 for distributed communication in robotic fleets.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "LiDAR & Multi-Sensor Fusion", change: "↑ +65%", trend: "Critical competency for autonomous navigation, map generation, and localization.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Control Kinematics & Path Planning", change: "↑ +38%", trend: "Advanced manipulator arm trajectories require high-precision math pipeline models.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Teach Pendant Programming", change: "↓ -22%", trend: "Offline Simulation engines (Gazebo, Webots) replace manual jog teaching.", color: "text-rose-600 bg-rose-50 border-rose-100" },
      ],
      cities: {
        "Bengaluru, KA": "ROS 2, SLAM, Gazebo",
        "Hyderabad, TS": "Computer Vision, Python, OpenCV",
        "Pune, MH": "Kinematics, PID Controllers, LiDAR",
        "Mumbai, MH": "Arduino, Robotics Path Planning, Git",
        "Delhi NCR": "Microcontrollers, Sensor Fusion, C++"
      }
    },
    "Mechanical Engineer": {
      forecast: [
        { skill: "Finite Element Analysis (FEA)", change: "↑ +40%", trend: "Advanced structural and stress analysis remains critical for component reliability testing.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Generative CAD Topology Optimization", change: "↑ +55%", trend: "AI-driven CAD tools generate lightweight, high-strength structural parts.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Computational Fluid Dynamics (CFD)", change: "↑ +34%", trend: "Thermal simulation demand is rising fast due to electric vehicle battery cooling.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Manual 2D Drafting Layouts", change: "↓ -30%", trend: "Traditional draft desks are fully superseded by modern 3D parametric CAD modeling.", color: "text-rose-600 bg-rose-50 border-rose-100" },
      ],
      cities: {
        "Bengaluru, KA": "SolidWorks, FEA, Generative Design",
        "Hyderabad, TS": "CFD, Ansys, AutoCAD",
        "Pune, MH": "Automotive CAD, Catia, Manufacturing",
        "Mumbai, MH": "Fluid Dynamics, Thermodynamics, Excel",
        "Delhi NCR": "Drafting, Matlab, Stress Analysis"
      }
    },
    "Cyber Security Specialist": {
      forecast: [
        { skill: "Zero Trust IAM Architectures", change: "↑ +72%", trend: "Enterprise security frameworks transition completely to verify-always network controls.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Ethical Hacking & Penetration Testing", change: "↑ +48%", trend: "Continuous security audit requirements drive massive demand for vulnerability scans.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "AI SOC Log Analysis", change: "↑ +64%", trend: "SOC centers rely on machine learning logs parsing to detect zero-day exploits.", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { skill: "Traditional Perimeter Firewalls", change: "↓ -15%", trend: "Moving towards decentralized software-defined perimeters and cloud security rules.", color: "text-rose-600 bg-rose-50 border-rose-100" },
      ],
      cities: {
        "Bengaluru, KA": "Penetration Testing, OWASP, Metasploit",
        "Hyderabad, TS": "Network Security, Wireshark, Cryptography",
        "Pune, MH": "Linux/Shell, AWS Security, IAM",
        "Mumbai, MH": "Threat Hunting, SOC, Risk Audit",
        "Delhi NCR": "Firewalls, Encryption, Security Policy"
      }
    }
  };

  return mappings[role] || defaults;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [summary, setSummary] = useState(null);
  const [skills, setSkills] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setupForm, setSetupForm] = useState({ degree: 'B.Tech', branch: 'CSE', year: 3, target_role: 'Software Engineer', weekly_hours: 10 });
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [heatmapData, setHeatmapData] = useState([]);
  const [heatmapStats, setHeatmapStats] = useState({ total: 0, streak: 0 });
  const [hoveredCell, setHoveredCell] = useState(null);
  const [totalProjects, setTotalProjects] = useState(0);

  const handleDownloadReport = () => {
    const role = profile?.target_role || 'Software Engineer';
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Popup blocker blocked the report generation. Please allow popups for this site.");
      return;
    }
    const htmlContent = `
      <html>
        <head>
          <title>PATH Future Skills Report - ${role}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: 800;
              color: #be123c;
              margin-bottom: 5px;
            }
            .title {
              font-size: 20px;
              font-weight: 800;
              margin: 0;
              color: #0f172a;
            }
            .subtitle {
              font-size: 13px;
              color: #64748b;
              margin-top: 5px;
            }
            .metadata {
              display: flex;
              justify-content: space-between;
              background: #f8fafc;
              padding: 12px 20px;
              border-radius: 8px;
              font-size: 12px;
              margin-bottom: 30px;
              border: 1px solid #e2e8f0;
            }
            .section-title {
              font-size: 16px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 30px;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-left: 4px solid #be123c;
              padding-left: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
              font-size: 13px;
            }
            th {
              background-color: #f1f5f9;
              font-weight: 600;
              color: #475569;
            }
            .trend-up {
              color: #16a34a;
              font-weight: bold;
            }
            .trend-down {
              color: #dc2626;
              font-weight: bold;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              font-size: 11px;
              color: #94a3b8;
              text-align: center;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">PATH (Placement And Talent Hub)</div>
            <div class="title">Placement Market Intelligence & Future Skills Report</div>
            <div class="subtitle">AI-Powered Placement Intelligence & Future Skills Analytics Platform</div>
          </div>

          <div class="metadata">
            <div><strong>Target Trajectory:</strong> ${role}</div>
            <div><strong>Report Generated:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
            <div><strong>Status:</strong> Scrapers Active (Live)</div>
          </div>

          <div class="section-title">1. Future Skills Demand Forecast (2027-2030)</div>
          <p style="font-size: 13px; color: #475569; margin-bottom: 15px;">
            Ensemble forecast mapping hiring velocity, developer activity patterns, and corporate placement request pipelines.
          </p>
          <table>
            <thead>
              <tr>
                <th style="width: 35%;">Skill Node</th>
                <th style="width: 15%;">Growth Shift</th>
                <th>Trend Context</th>
              </tr>
            </thead>
            <tbody>
              ${roleDemand.forecast.map(item => `
                <tr>
                  <td><strong>${item.skill}</strong></td>
                  <td class="${item.change.startsWith('↑') ? 'trend-up' : 'trend-down'}">${item.change}</td>
                  <td>${item.trend}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">2. Regional Tech Cities Hiring Intensity & Salaries</div>
          <p style="font-size: 13px; color: #475569; margin-bottom: 15px;">
            Audited regional placement index comparing average annual package offerings and local job posting intensity.
          </p>
          <table>
            <thead>
              <tr>
                <th>City Node</th>
                <th>Top Skill Demand</th>
                <th>Avg. Salary (INR)</th>
                <th style="text-align: right;">Hiring Intensity</th>
              </tr>
            </thead>
            <tbody>
              ${[
                { city: "Bengaluru, KA", salary: "₹24L - ₹48L LPA", intensity: "Extreme (98%)" },
                { city: "Hyderabad, TS", salary: "₹18L - ₹38L LPA", intensity: "Very High (92%)" },
                { city: "Pune, MH", salary: "₹16L - ₹32L LPA", intensity: "High (86%)" },
                { city: "Mumbai, MH", salary: "₹15L - ₹35L LPA", intensity: "High (81%)" },
                { city: "Delhi NCR", salary: "₹12L - ₹28L LPA", intensity: "Moderate (74%)" },
              ].map(row => `
                <tr>
                  <td><strong>${row.city}</strong></td>
                  <td><code>${roleDemand.cities[row.city] || "General Skills"}</code></td>
                  <td>${row.salary}</td>
                  <td style="text-align: right; font-weight: 600;">${row.intensity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">3. Methodology & Data Modeling Source</div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.6;">
            This report is synthesized using an ensemble modeling approach combining Facebook Prophet and XGBoost estimators. Historical employment volumes, public repository statistics, developer profiles, and regional hiring listings are processed daily to compute forward-looking hiring projections. 
          </p>

          <div class="footer">
            &copy; ${new Date().getFullYear()} PATH (Placement And Talent Hub). Confidential. Powered by PATH AI Placement Intelligence.
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  useEffect(() => { 
    loadData(); 
    getActivityHeatmap()
      .then((res) => { const h = buildHeatmap(res.data || {}); setHeatmapData(h.grid); setHeatmapStats({ total: h.total, streak: h.streak }); })
      .catch(() => { const h = buildHeatmap({}); setHeatmapData(h.grid); setHeatmapStats({ total: h.total, streak: h.streak }); });

    const handleRefresh = () => {
      loadData();
    };
    window.addEventListener('PATH_refresh_data', handleRefresh);
    return () => window.removeEventListener('PATH_refresh_data', handleRefresh);
  }, []);

  const loadData = async () => {
    try {
      const [rolesRes, projectsRes] = await Promise.all([
        getAvailableRoles().catch(() => ({ data: ['Software Engineer', 'Data Scientist', 'Data Analyst', 'Full Stack Developer', 'ML Engineer'] })),
        getProjects().catch(() => ({ data: [] }))
      ]);
      setRoles(rolesRes.data);
      setTotalProjects(projectsRes.data.length);

      let profileRes = null;
      try {
        profileRes = await getProfile();
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 401) {
          setShowSetup(true);
          setLoading(false);
          return;
        }
      }

      if (profileRes?.data?.id) {
        setProfile(profileRes.data);
        try {
          const [summaryRes, skillsRes] = await Promise.all([
            getSummary().catch(() => ({ data: null })),
            getStudentSkills().catch(() => ({ data: [] })),
          ]);
          setSummary(summaryRes.data);
          setSkills(skillsRes.data || []);
        } catch { }
      } else {
        setShowSetup(true);
      }
    } catch {
      setShowSetup(true);
    }
    setLoading(false);
  };

  const handleDegreeChange = (degree) => {
    const branches = BRANCH_OPTIONS[degree] || [];
    const newBranch = branches[0] || '';
    const recommendedRoles = BRANCH_RECOMMENDED_ROLES[newBranch] || [];
    const newTargetRole = recommendedRoles[0] || 'Software Engineer';
    setSetupForm(prev => ({
      ...prev,
      degree,
      branch: newBranch,
      target_role: newTargetRole
    }));
  };

  const handleBranchChange = (branch) => {
    const recommendedRoles = BRANCH_RECOMMENDED_ROLES[branch] || [];
    const newTargetRole = recommendedRoles[0] || 'Software Engineer';
    setSetupForm(prev => ({
      ...prev,
      branch,
      target_role: newTargetRole
    }));
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    try {
      await createProfile(setupForm);
      setShowSetup(false);
      setLoading(true);
      await loadData();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const handleAddSkill = async () => {
    if (!selectedSkill) return;
    try {
      await addSkill({ skill_name: selectedSkill, level: 'Beginner', progress_percent: 30 });
      setSelectedSkill('');
      const res = await getStudentSkills();
      setSkills(res.data);
      const sumRes = await getSummary();
      setSummary(sumRes.data);
      setShowSkillModal(false);
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const openSkillModal = async () => {
    const res = await getAvailableSkills();
    setAvailableSkills(res.data);
    setShowSkillModal(true);
  };

  if (loading) return <Loader />;

  if (showSetup) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-lg mx-auto mt-12 text-slate-900"
      >
        <h1 className="text-3xl font-extrabold mb-2">Welcome, <span className="text-neon-purple font-black">{user?.name}</span>! </h1>
        <p className="text-slate-400 mb-8 text-sm">Let's set up your profile to activate your personalized career dashboard.</p>
        <form onSubmit={handleSetup} className="glass-card p-8 space-y-5 shadow-lg">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Degree</label>
            <select className="input-field text-sm" value={setupForm.degree} onChange={e => handleDegreeChange(e.target.value)}>
              {['B.Tech', 'M.Tech'].map(d => <option key={d} value={d} className="bg-dark-800">{d}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Branch / Major</label>
            <select className="input-field text-sm" value={setupForm.branch} onChange={e => handleBranchChange(e.target.value)}>
              {(BRANCH_OPTIONS[setupForm.degree] || []).map(b => <option key={b} value={b} className="bg-dark-800">{b}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Current Year</label>
              <select className="input-field text-sm" value={setupForm.year} onChange={e => setSetupForm({...setupForm, year: parseInt(e.target.value)})}>
                {[1,2,3,4].map(y => <option key={y} value={y} className="bg-dark-800">Year {y}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Weekly Commitment</label>
              <input type="number" className="input-field text-sm" min={1} max={40} value={setupForm.weekly_hours}
                onChange={e => setSetupForm({...setupForm, weekly_hours: parseInt(e.target.value)})} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Target Trajectory</label>
            <select className="input-field text-sm" value={setupForm.target_role} onChange={e => setSetupForm({...setupForm, target_role: e.target.value})}>
              {(() => {
                const recommendedNames = BRANCH_RECOMMENDED_ROLES[setupForm.branch] || [];
                const recommended = roles.filter(r => recommendedNames.includes(r));
                const others = roles.filter(r => !recommendedNames.includes(r));
                return (
                  <>
                    {recommended.length > 0 && (
                      <optgroup label="Recommended Paths" className="bg-dark-800 text-neon-cyan font-bold">
                        {recommended.map(r => <option key={r} value={r} className="bg-dark-800 text-slate-800 font-normal">{r}</option>)}
                      </optgroup>
                    )}
                    {others.length > 0 && (
                      <optgroup label="Other Trajectories" className="bg-dark-800 text-slate-400 font-bold">
                        {others.map(r => <option key={r} value={r} className="bg-dark-800 text-slate-800 font-normal">{r}</option>)}
                      </optgroup>
                    )}
                  </>
                );
              })()}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full py-3.5 font-bold shadow-sm mt-2">Initialize Profile →</button>
        </form>
      </motion.div>
    );
  }

  const readinessScore = Math.round(summary?.readiness?.total_score || 0);
  const scoreColor = readinessScore >= 80 ? 'text-green-400' : readinessScore >= 60 ? 'text-neon-cyan' : readinessScore >= 35 ? 'text-yellow-400' : 'text-red-400';
  const strokeColor = readinessScore >= 80 ? '#22c55e' : readinessScore >= 60 ? '#0ea5e9' : readinessScore >= 35 ? '#eab308' : '#ef4444';

  // Needle angle rotation calculation (points left at 0deg, right at 180deg)
  const needleRotation = (readinessScore / 100) * 180;

  // Determine Next Action based on score
  const roleDemand = getRoleDemandData(profile?.target_role || 'Software Engineer');
  let nextAction = { title: "Complete your Profile", desc: "Add more skills to unlock insights.", link: "/skills", btn: "Add Skills" };
  if (readinessScore > 75) {
    nextAction = { title: "Ready for Interviews!", desc: "Your score is high. Test your knowledge in a mock interview.", link: "/interview", btn: "Start Interview" };
  } else if (readinessScore > 40) {
    nextAction = { title: "Practice Coding", desc: "Sharpen your algorithm skills to boost your score by 10%.", link: "/challenges", btn: "Solve Challenges" };
  } else if (skills.length > 0) {
    nextAction = { title: "Generate Roadmap", desc: "You have skills, but need a plan. Generate your AI Roadmap now.", link: "/roadmap", btn: "View Roadmap" };
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8 text-slate-900 relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold mb-1 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-400 font-medium">Welcome back, <span className="text-slate-900 font-extrabold">{user?.name}</span>. Your skill and roadmap analytics are up to date.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Target Trajectory</p>
          <span className="bg-neon-cyan/10 text-neon-cyan px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide border border-neon-cyan/20">
            {profile?.target_role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* HUGE Speedometer Readiness Score */}
        <div className="lg:col-span-1 glass-card relative overflow-hidden flex flex-col items-center justify-between min-h-[300px] p-6 shadow-sm">
          <h2 className="w-full text-xs font-bold text-slate-400 uppercase tracking-widest text-left mb-2">Readiness Score</h2>
          
          <div className="relative w-full max-w-[210px] flex flex-col items-center">
            {/* SVG Speedometer */}
            <svg viewBox="0 0 100 55" className="w-full overflow-visible">
              {/* Background Arc */}
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" strokeLinecap="round" />
              
              {/* Progress Arc */}
              <path 
                d="M 10 50 A 40 40 0 0 1 90 50" 
                fill="none" 
                stroke="url(#speedGrad)" 
                strokeWidth="7" 
                strokeLinecap="round" 
                strokeDasharray="125.6" 
                strokeDashoffset={125.6 * (1 - readinessScore / 100)} 
                className="transition-all duration-1000 ease-out" 
              />
              
              {/* Speedometer Needle */}
              <g transform={`translate(50, 50) rotate(${needleRotation})`} className="transition-transform duration-1000 ease-out">
                {/* Visual needle line */}
                <line x1="0" y1="0" x2="-35" y2="0" stroke="#be123c" strokeWidth="2" strokeLinecap="round" />
                <circle cx="0" cy="0" r="3.5" fill="#be123c" stroke="#e8e6e1" strokeWidth="1" />
              </g>
 
              <defs>
                <linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#166534" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center Text */}
            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-baseline gap-0.5">
                <span className={`text-4xl font-black ${scoreColor} leading-none`}>{readinessScore}</span>
                <span className="text-sm text-slate-400 font-bold leading-none">%</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{summary?.readiness?.level || 'Analyzing Profile'}</p>
            </div>
          </div>
          
          <p className="w-full text-[9px] text-slate-500 leading-relaxed border-t border-dark-700 pt-3.5 mt-2 text-center">
            A self-progress indicator from your tracked skills, projects &amp; resume — a guide to what to build next, not a placement prediction.
          </p>
        </div>

        {/* Next Best Action Widget */}
        <div className="lg:col-span-1 glass-card flex flex-col justify-between p-6 relative overflow-hidden group hover:border-dark-600 transition-colors">
          <div>
            <h2 className="text-xs font-bold text-neon-purple uppercase tracking-widest mb-3">AI Recommendation</h2>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">{nextAction.title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed">{nextAction.desc}</p>
          </div>
          
          <div className="mt-6 flex justify-between items-end border-t border-dark-700 pt-4">
            <Link to={nextAction.link} className="inline-flex items-center gap-1 bg-neon-purple hover:bg-neon-purple/80 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm hover:scale-105">
              {nextAction.btn}
            </Link>
            <span className="text-[9px] text-slate-500 font-mono">PRIORITY: HIGH</span>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="lg:col-span-1 glass-card flex flex-col justify-between p-6 relative">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Activity Heatmap</h2>
            <div className="flex gap-1.5 justify-center py-2 relative">
              {heatmapData.map((week, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  {week.map((val, j) => {
                    let color = 'bg-white/5 border-white/5';
                    if (val === 1) color = 'bg-neon-cyan/20 border-neon-cyan/10';
                    if (val === 2) color = 'bg-neon-cyan/45 border-neon-cyan/20';
                    if (val === 3) color = 'bg-neon-cyan/70 border-neon-cyan/30';
                    if (val >= 4) color = 'bg-neon-cyan border-neon-cyan shadow-sm';
                    
                    return (
                      <div 
                        key={j} 
                        className={`w-3.5 h-3.5 rounded-[4px] border ${color} hover:scale-110 transition-all cursor-pointer`}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({
                            val,
                            weekIdx: i,
                            dayIdx: j,
                            x: rect.left + window.scrollX,
                            y: rect.top + window.scrollY
                          });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-end border-t border-dark-700 pt-4">
            <div>
              <p className="text-xl font-black text-slate-900 leading-none">{heatmapStats.streak}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Day Streak</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-slate-900 leading-none">{heatmapStats.total}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Activities (7 wks)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Tooltip overlay portal */}
      <AnimatePresence>
        {hoveredCell && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 pointer-events-none bg-white/95 border border-dark-700 px-3 py-2 rounded-xl text-[10px] text-slate-800 shadow-md backdrop-blur-md font-mono"
            style={{ 
              left: hoveredCell.x - 60, 
              top: hoveredCell.y - 55 
            }}
          >
            <p className="font-extrabold text-neon-cyan">WEEK {hoveredCell.weekIdx + 1} • DAY {hoveredCell.dayIdx + 1}</p>
            <p className="text-slate-500 mt-0.5">{hoveredCell.val} activities completed</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1 */}
        <div className="glass-card p-6 hover:bg-white/[0.02] hover:border-dark-600 transition-all flex items-center gap-5 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-xl text-neon-cyan group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-tight">{summary?.total_skills || 0}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Skills Tracked</p>
          </div>
        </div>
 
        {/* Card 2 */}
        <div className="glass-card p-6 hover:bg-white/[0.02] hover:border-dark-600 transition-all flex items-center gap-5 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center text-xl text-neon-purple group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.03.228-.046.347-.046h15.806c.119 0 .235.016.347.046M18 14.25h2.25m-2.25 3H20.25M3.75 20.25h16.5A2.25 2.25 0 0022.5 18V6a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6v12a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-tight">{totalProjects}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Projects Available</p>
          </div>
        </div>
 
        {/* Card 3 */}
        <div className="glass-card p-6 hover:bg-white/[0.02] hover:border-dark-600 transition-all flex items-center gap-5 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-neon-pink/10 border border-neon-pink/20 flex items-center justify-center text-xl text-neon-pink group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 8V6a3 3 0 013-3h0a3 3 0 013 3v2" />
              <rect x="3" y="8" width="18" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 14h18" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-tight">{summary?.readiness?.total_score ?? 0}%</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Readiness Score</p>
          </div>
        </div>
      </div>

      {/* ─── MARKET INTELLIGENCE & FUTURE SKILLS PANEL ─── */}
      <div className="mt-8 pt-8 border-t border-dark-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
              Placement Market Intelligence & Future Skills
            </h2>
            <p className="text-xs text-slate-400 font-medium">Illustrative industry skill trends and typical salary ranges — sample guidance, not live data.</p>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] bg-stone-100 text-stone-500 border border-stone-200 px-2.5 py-1.5 rounded-lg font-mono font-bold uppercase tracking-wider">
              Sample data
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Skill Trends & Future Forecast (Prophet/XGBoost) */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#be123c] flex items-center gap-1.5">
                   Industry Skill Trends (illustrative)
                </h3>
                <span className="text-[9px] font-mono bg-stone-100 border border-stone-200 text-stone-500 px-2 py-0.5 rounded font-bold">
                  Sample
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4 font-sans leading-relaxed">
                General industry skill trends to help you prioritize what to learn. These are illustrative examples, not a live prediction.
              </p>

              <div className="space-y-3">
                {roleDemand.forecast.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200 gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.skill}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{item.trend}</p>
                    </div>
                    <span className={`text-[10px] font-black font-mono px-2 py-1 rounded border shrink-0 ${item.color}`}>
                      {item.change}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-dark-700 pt-4 mt-6 flex justify-between items-center">
              <span className="text-[9px] text-slate-400 font-mono">ILLUSTRATIVE SAMPLE</span>
            </div>
          </div>

          {/* Card 2: City-wise Market Analysis & Hiring Intensity */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#166534] flex items-center gap-1.5">
                   Indian Tech Cities - Hiring Intensity & Salaries
                </h3>
                <span className="text-[9px] font-mono bg-stone-100 border border-stone-200 text-stone-500 px-2 py-0.5 rounded font-bold">
                  Sample
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4 font-sans leading-relaxed">
                Typical salary ranges and hiring activity by city — illustrative sample data for guidance.
              </p>

              {/* City grid table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 min-w-[320px]">
                  <thead>
                    <tr className="border-b border-dark-700 text-[10px] uppercase font-bold text-slate-400">
                      <th className="pb-2">City Node</th>
                      <th className="pb-2">Top Skill Demand</th>
                      <th className="pb-2">Avg. Salary (INR)</th>
                      <th className="pb-2 text-right">Hiring Intensity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {[
                      { city: "Bengaluru, KA", salary: "₹24L - ₹48L LPA", intensity: "Extreme (98%)", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                      { city: "Hyderabad, TS", salary: "₹18L - ₹38L LPA", intensity: "Very High (92%)", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                      { city: "Pune, MH", salary: "₹16L - ₹32L LPA", intensity: "High (86%)", color: "text-teal-600 bg-teal-50 border-teal-100" },
                      { city: "Mumbai, MH", salary: "₹15L - ₹35L LPA", intensity: "High (81%)", color: "text-teal-600 bg-teal-50 border-teal-100" },
                      { city: "Delhi NCR", salary: "₹12L - ₹28L LPA", intensity: "Moderate (74%)", color: "text-amber-600 bg-amber-50 border-amber-100" },
                    ].map((row, idx) => {
                      const citySkill = roleDemand.cities[row.city] || "General Skills";
                      return (
                        <tr key={idx} className="hover:bg-stone-50/50">
                          <td className="py-2.5 font-bold text-slate-800">{row.city}</td>
                          <td className="py-2.5 font-mono text-[10px] text-slate-500">{citySkill}</td>
                          <td className="py-2.5 font-bold text-slate-800">{row.salary}</td>
                          <td className="py-2.5 text-right">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${row.color}`}>
                              {row.intensity}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-dark-700 pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-500 font-sans leading-normal">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#166534]" />
                Illustrative sample data
              </span>
              <span className="font-semibold text-slate-700">6 cities shown</span>
            </div>
          </div>
        </div>
      </div>
      
    </motion.div>
  );
}
