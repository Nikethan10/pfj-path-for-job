import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  analyzeResume, 
  getResumeAnalysis, 
  matchJobDescription, 
  rewriteBulletPoints, 
  updateSocialProfiles 
} from '../services/resumeService';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import Loader from '../components/Loader';

// Helper to load PDF.js dynamically from CDN
const loadPdfJs = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error('Failed to load PDF decryption library.'));
    document.head.appendChild(script);
  });
};

// Helper to load Mammoth.js dynamically from CDN
const loadMammoth = () => {
  return new Promise((resolve, reject) => {
    if (window.mammoth) {
      resolve(window.mammoth);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
    script.onload = () => resolve(window.mammoth);
    script.onerror = () => reject(new Error('Failed to load Word document parser.'));
    document.head.appendChild(script);
  });
};

// Client-side parser for TXT, PDF, and DOCX files
const extractTextFromFile = async (file, onProgress) => {
  const extension = file.name.split('.').pop().toLowerCase();
  
  if (extension === 'txt' || extension === 'md') {
    onProgress('Reading plain text...');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }
  
  if (extension === 'pdf') {
    onProgress('Initializing PDF parser...');
    const pdfjs = await loadPdfJs();
    onProgress('Extracting text...');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await pdfjs.getDocument(typedarray).promise;
          let extractedText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);
            extractedText += strings.join(' ') + '\n';
          }
          resolve(extractedText);
        } catch (err) {
          reject(new Error('Failed to extract text from PDF structure.'));
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  }
  
  if (extension === 'docx') {
    onProgress('Reading Word document...');
    const mammoth = await loadMammoth();
    onProgress('Preparing document text...');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(result.value);
        } catch (err) {
          reject(new Error('Failed to extract text from Word document structure.'));
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  }
  
  throw new Error('Unsupported format. Please upload a .pdf, .docx, or .txt file.');
};

// Circular gauge component
function ScoreGauge({ value, label, subtitle, colorTheme = 'cyan' }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - value / 100);

  const colors = {
    cyan: { stroke: '#06b6d4', track: 'rgba(6, 182, 212, 0.1)', text: 'text-neon-cyan', gradStart: '#06b6d4', gradEnd: '#3b82f6' },
    purple: { stroke: '#a855f7', track: 'rgba(168, 85, 247, 0.1)', text: 'text-neon-purple', gradStart: '#a855f7', gradEnd: '#ec4899' },
    green: { stroke: '#10b981', track: 'rgba(16, 185, 129, 0.1)', text: 'text-emerald-400', gradStart: '#10b981', gradEnd: '#059669' },
    rose: { stroke: '#f43f5e', track: 'rgba(244, 63, 94, 0.1)', text: 'text-rose-400', gradStart: '#f43f5e', gradEnd: '#be123c' },
  };
  const c = colors[colorTheme] || colors.cyan;

  return (
    <div className="glass-card flex items-center justify-between p-6 transition-all duration-300 relative overflow-hidden">
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">{label}</p>
        <p className="text-xs text-slate-500 max-w-[160px] leading-relaxed">{subtitle}</p>
      </div>

      <div className="relative w-20 h-20 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <defs>
            <linearGradient id={`grad-${colorTheme}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c.gradStart} />
              <stop offset="100%" stopColor={c.gradEnd} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r={radius} stroke={c.track} strokeWidth="6" fill="none" />
          <circle 
            cx="50" 
            cy="50" 
            r={radius} 
            stroke={`url(#grad-${colorTheme})`} 
            strokeWidth="6" 
            fill="none" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-extrabold tracking-tighter ${c.text}`}>
            {Math.round(value)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Resume() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'ats' | 'job_match' | 'analytics' | 'projects' | 'social_rewriter'
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Connection fields
  const [githubInput, setGithubInput] = useState('');
  const [linkedinInput, setLinkedinInput] = useState('');

  // Job Matcher tab state
  const [jobDescription, setJobDescription] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [matching, setMatching] = useState(false);

  // Rewriter state
  const [bulletToRewrite, setBulletToRewrite] = useState('');
  const [rewriting, setRewriting] = useState(false);
  const [rewrittenResult, setRewrittenResult] = useState(null);

  // Social Audit status
  const [socialAuditing, setSocialAuditing] = useState(false);
  const [socialResult, setSocialResult] = useState(null);

  const [simulatedLogs, setSimulatedLogs] = useState([]);
  const [logIndex, setLogIndex] = useState(0);

  const scanStages = [
    "Loading resume document...",
    "Extracting text from raw buffers...",
    "Parsing metadata (Name, Email, Profile details)...",
    "Running tokenization and lexical pattern matching...",
    "Identifying technical competencies and certifications...",
    "Crawling external public profiles...",
    "Executing ML complexity checks on projects...",
    "Mapping skills against industry career paths...",
    "Simulating ATS scanner formatting audits...",
    "Saving results to portfolio db..."
  ];

  useEffect(() => {
    (async () => {
      try {
        const res = await getResumeAnalysis();
        if (res.data?.id) {
          setResult(res.data);
          if (res.data.extracted_data?.github_username) {
            setGithubInput(res.data.extracted_data.github_username);
          }
        }
      } catch { }
      setLoading(false);
    })();
  }, []);

  // Telemetry Console logs
  useEffect(() => {
    let interval;
    if (analyzing) {
      setSimulatedLogs([scanStages[0]]);
      setLogIndex(1);
      interval = setInterval(() => {
        setLogIndex((prev) => {
          if (prev < scanStages.length) {
            setSimulatedLogs((logs) => [...logs, scanStages[prev]]);
            return prev + 1;
          }
          clearInterval(interval);
          return prev;
        });
      }, 350);
    } else {
      setSimulatedLogs([]);
      setLogIndex(0);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (selectedFile) => {
    setParsing(true);
    setParseStatus('Processing file...');
    setFile(selectedFile);
    try {
      const extractedText = await extractTextFromFile(selectedFile, (status) => {
        setParseStatus(status);
      });
      setText(extractedText);
      setParseStatus('File processed successfully.');
    } catch (err) {
      alert(err.message || 'Failed to read file.');
      setFile(null);
      setText('');
      setParseStatus('');
    } finally {
      setParsing(false);
    }
  };

  const clearFileSelection = () => {
    setFile(null);
    setText('');
    setParseStatus('');
  };

  const handleAnalyze = async () => {
    if (!text.trim() && !file) return alert('Please upload a file or write/paste resume text.');
    
    setAnalyzing(true);
    // Switch to upload tab to see telemetry
    setActiveTab('upload');
    
    try {
      // Send file directly if we have one, otherwise send text
      const resumeInput = file ? file : text;
      const res = await analyzeResume(resumeInput, githubInput, linkedinInput);
      
      // Wait for telemetry mock delay to feel real
      await new Promise(resolve => setTimeout(resolve, 3800));
      setResult(res.data);
      setMatchResult(null); // clear old matching
      setRewrittenResult(null);
      
      // Select the analytics tab by default to WOW them
      setActiveTab('analytics');
    } catch (err) {
      alert(err.response?.data?.detail || 'Analysis failed. Make sure your server is running.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleJobMatch = async () => {
    if (!jobDescription.trim()) return alert('Please enter a Job Description to match.');
    setMatching(true);
    try {
      const res = await matchJobDescription(jobDescription);
      setMatchResult(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Matching failed');
    } finally {
      setMatching(false);
    }
  };

  const handleRewrite = async () => {
    if (!bulletToRewrite.trim()) return alert('Please enter a resume bullet point to polish.');
    setRewriting(true);
    try {
      const res = await rewriteBulletPoints([bulletToRewrite]);
      if (res.data?.rewritten_points?.length > 0) {
        setRewrittenResult(res.data.rewritten_points[0]);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Rewrite failed');
    } finally {
      setRewriting(false);
    }
  };

  const handleSocialConnect = async () => {
    if (!githubInput.trim() && !linkedinInput.trim()) {
      return alert('Provide a GitHub username or LinkedIn text to audit.');
    }
    setSocialAuditing(true);
    try {
      const res = await updateSocialProfiles(githubInput, linkedinInput);
      setSocialResult(res.data);
      // Trigger full refresh of main result to pull new scores
      const getRes = await getResumeAnalysis();
      if (getRes.data) setResult(getRes.data);
      alert('Social profile audit completed successfully!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Social audit failed');
    } finally {
      setSocialAuditing(false);
    }
  };

  if (loading) return <Loader />;

  // Prepare Recharts data if results exist
  const benchmarkingData = result?.benchmarking ? [
    { subject: 'Technical Skills', candidate: result.benchmarking.candidate[0], peer_average: result.benchmarking.peer_average[0], top_performers: result.benchmarking.top_performers[0] },
    { subject: 'Project Depth', candidate: result.benchmarking.candidate[1], peer_average: result.benchmarking.peer_average[1], top_performers: result.benchmarking.top_performers[1] },
    { subject: 'Social Brand', candidate: result.benchmarking.candidate[2], peer_average: result.benchmarking.peer_average[2], top_performers: result.benchmarking.top_performers[2] },
    { subject: 'ATS Standard', candidate: result.benchmarking.candidate[3], peer_average: result.benchmarking.peer_average[3], top_performers: result.benchmarking.top_performers[3] },
    { subject: 'Coding Activity', candidate: result.benchmarking.candidate[4], peer_average: result.benchmarking.peer_average[4], top_performers: result.benchmarking.top_performers[4] },
  ] : [];

  const pathReadinessData = result?.career_readiness_grid?.roles ? 
    result.career_readiness_grid.roles.map(r => ({
      name: r.name,
      score: r.score
    })) : [];

  const tabItems = [
    { id: 'upload', label: 'Parse Portal', icon: '' },
    { id: 'ats', label: 'ATS Compliance', icon: '' },
    { id: 'job_match', label: 'JD Matcher', icon: '' },
    { id: 'analytics', label: 'Employability Metrics', icon: '' },
    { id: 'projects', label: 'AI Project Grader', icon: '' },
    { id: 'social_rewriter', label: 'Social & Rewriter', icon: '' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-16 max-w-7xl mx-auto px-4">
      
      {/* Visual Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-dark-700 pb-6">
        <div>
          <h1 className="text-4xl font-black mb-2 tracking-tight flex items-center gap-3">
            <span className="bg-gradient-to-r from-neon-cyan via-blue-400 to-neon-purple bg-clip-text text-transparent">
              AI Resume & Employability Platform
            </span>
            <span className="text-xs px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-neon-cyan rounded-md font-bold tracking-wide uppercase">
              Pro Suite
            </span>
          </h1>
          <p className="text-slate-400 text-sm">
            Evaluate placement readiness, audit ATS alignment, calculate salary vectors, and grade project complexities.
          </p>
        </div>
        
        {result && (
          <div className="mt-4 md:mt-0 flex gap-4 bg-dark-800/40 p-1.5 border border-dark-700 rounded-xl">
            <div className="text-right px-3 py-1">
              <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Overall Score</span>
              <span className="text-lg font-black text-neon-cyan">{result.career_readiness_score || 0}%</span>
            </div>
            <div className="w-[1px] bg-dark-700 my-1" />
            <div className="text-right px-3 py-1">
              <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">ATS Score</span>
              <span className="text-lg font-black text-emerald-400">{result.ats_score || 0}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex flex-wrap gap-2 mb-8 bg-dark-900/50 p-1 border border-dark-800 rounded-xl overflow-x-auto select-none">
        {tabItems.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2.5 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200
              ${activeTab === tab.id 
                ? 'bg-gradient-to-r from-neon-cyan/20 to-blue-500/10 border border-neon-cyan/40 text-neon-cyan shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                : 'hover:bg-dark-800 border border-transparent text-slate-400 hover:text-slate-200'
              }
            `}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Workspace Tab Contents */}
        <div className="lg:col-span-12">
          <AnimatePresence mode="wait">
            
            {/* ── TAB 1: PARSE PORTAL ───────────────────────────────────── */}
            {activeTab === 'upload' && (
              <motion.div 
                key="tab-upload"
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Upload Action Zone */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  
                  {/* File Zone Card */}
                  <div className={`
                    glass-card p-1 relative overflow-hidden transition-all duration-300 min-h-[300px] flex flex-col
                    ${dragActive ? 'border-neon-cyan shadow-lg bg-neon-cyan/5' : file ? 'border-neon-purple/50 bg-dark-800/20' : 'border-dark-700 hover:border-dark-600'}
                  `}>
                    {analyzing && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-dark-800 overflow-hidden z-20">
                        <motion.div 
                          initial={{ width: '0%' }}
                          animate={{ width: `${(logIndex / scanStages.length) * 100}%` }}
                          transition={{ ease: "easeInOut", duration: 0.3 }}
                          className="h-full bg-neon-cyan shadow-[0_0_10px_#06b6d4]"
                        />
                      </div>
                    )}

                    <div className="bg-dark-900/60 rounded-xl h-full flex flex-col p-5 relative z-10 flex-1 border border-dark-800">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-dark-800">
                        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                          Resume Document
                        </h2>
                        <span className="text-[9px] text-slate-500 font-mono border border-dark-800 px-2 py-0.5 rounded">
                          PDF, DOCX OR TXT
                        </span>
                      </div>
                      
                      {analyzing ? (
                        <div className="flex-1 font-mono text-[11px] text-slate-400 p-4 bg-dark-950/80 rounded-lg overflow-y-auto space-y-2 select-none min-h-[180px] border border-dark-800 custom-scrollbar">
                          <div className="text-slate-500 mb-2 border-b border-dark-800 pb-2">PARSING METRICS TELEMETRY:</div>
                          {simulatedLogs.map((log, i) => (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              key={i} 
                              className="flex items-start gap-2"
                            >
                              <span className="text-neon-cyan font-bold">›</span>
                              <span>{log}</span>
                            </motion.div>
                          ))}
                          <motion.div
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="w-1.5 h-3.5 bg-neon-cyan inline-block ml-1 mt-1 shadow-[0_0_8px_#06b6d4]"
                          />
                        </div>
                      ) : (
                        <div 
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          className="flex-1 border-2 border-dashed border-dark-700 hover:border-dark-600 rounded-xl flex flex-col items-center justify-center p-6 transition-all duration-300"
                        >
                          <input 
                            type="file" 
                            id="resume-file" 
                            className="hidden" 
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileChange}
                          />
                          
                          {!file ? (
                            <label 
                              htmlFor="resume-file" 
                              className="cursor-pointer flex flex-col items-center text-center select-none group"
                            >
                              <div className="w-14 h-14 rounded-xl bg-dark-800 border border-dark-750 flex items-center justify-center text-2xl mb-4 group-hover:border-neon-cyan/40 transition-colors shadow-inner">
                                📥
                              </div>
                              <span className="text-xs text-slate-300 font-bold mb-1 group-hover:text-neon-cyan transition-colors">
                                Drag & Drop Resume File
                              </span>
                              <span className="text-[10px] text-slate-500 mb-3">
                                or click to browse files
                              </span>
                            </label>
                          ) : (
                            <div className="w-full flex flex-col justify-between items-center text-center py-2">
                              <div className="w-12 h-12 rounded-xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center text-xl mb-3">
                                
                              </div>
                              
                              <div className="space-y-0.5 max-w-[200px] mb-2">
                                <p className="text-xs text-slate-300 font-bold truncate">{file.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>

                              <button 
                                onClick={clearFileSelection}
                                className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-md text-[10px] font-bold hover:bg-rose-500/20 transition-all"
                              >
                                Remove File
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Manual Paste Text Box */}
                  {!file && !analyzing && (
                    <div className="glass-card p-5 border-dark-700">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-2">Or Paste Resume Raw Text</label>
                      <textarea
                        rows={4}
                        placeholder="Paste full text copied from your resume..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full text-xs bg-dark-900 border border-dark-700 rounded-lg p-3 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-neon-cyan transition-all resize-none"
                      />
                    </div>
                  )}

                  {/* Social Profile Credentials */}
                  <div className="glass-card p-5 border-dark-700 space-y-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-dark-800 pb-2 flex items-center gap-2">
                      <span>🔗</span> Linked Developer Accounts
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] text-slate-500 block uppercase tracking-wider mb-1">GitHub Username</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-slate-600">github.com/</span>
                          <input 
                            type="text" 
                            placeholder="octocat"
                            value={githubInput}
                            onChange={(e) => setGithubInput(e.target.value)}
                            className="w-full text-xs bg-dark-900 border border-dark-700 rounded-lg py-2 pl-24 pr-3 text-slate-300 focus:outline-none focus:border-neon-cyan"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-[9px] text-slate-500 block uppercase tracking-wider mb-1">LinkedIn Profile Bio (For Social Auditing)</label>
                        <textarea 
                          rows={2}
                          placeholder="Paste your LinkedIn 'About' summary text..."
                          value={linkedinInput}
                          onChange={(e) => setLinkedinInput(e.target.value)}
                          className="w-full text-xs bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-slate-300 focus:outline-none focus:border-neon-cyan resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing || parsing || (!text && !file)}
                    className={`
                      w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 border
                      ${(analyzing || parsing || (!text && !file))
                        ? 'bg-dark-850 text-slate-500 border-dark-800 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-neon-cyan to-blue-600 text-white border-transparent shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:scale-[1.01] active:scale-[0.99]'
                      }
                    `}
                  >
                    {analyzing ? 'Scanning Resume & Social Matrices...' : 'ANALYZE APPLICANT PROFILE '}
                  </button>

                </div>

                {/* Parsed Output Result Inspector */}
                <div className="lg:col-span-7">
                  {result ? (
                    <div className="glass-card p-6 border-dark-700 space-y-6">
                      <div className="flex justify-between items-center border-b border-dark-800 pb-3">
                        <div>
                          <h3 className="text-lg font-black text-slate-200">{result.extracted_data?.name || 'Applicant'}</h3>
                          <p className="text-xs text-slate-500">{result.extracted_data?.email || 'email@example.com'}</p>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-neon-purple rounded font-bold uppercase tracking-wider">
                          Extracted Structured Data
                        </span>
                      </div>

                      {/* Education Summary */}
                      {result.extracted_data?.education?.length > 0 && (
                        <div className="space-y-2.5">
                          <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Education Summary</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {result.extracted_data.education.map((edu, idx) => (
                              <div key={idx} className="bg-dark-900/40 p-3 rounded-lg border border-dark-800">
                                <p className="text-xs font-bold text-slate-300">{edu.degree}</p>
                                <p className="text-[10px] text-slate-500">{edu.institution} | Class of {edu.year}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills Coverage Chips */}
                      {result.extracted_data?.skills?.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Identified Skills</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {result.extracted_data.skills.map(s => (
                              <span key={s} className="text-[10px] font-bold px-2.5 py-1 bg-dark-800 text-cyan-400 border border-dark-700 rounded-md">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience Timeline */}
                      {result.extracted_data?.experience?.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Experience History</h4>
                          <div className="space-y-3 relative border-l border-dark-800 pl-4 ml-2">
                            {result.extracted_data.experience.map((exp, idx) => (
                              <div key={idx} className="relative space-y-1">
                                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-neon-cyan border border-dark-900 rounded-full" />
                                <div className="flex justify-between items-start">
                                  <h5 className="text-xs font-bold text-slate-300">{exp.role}</h5>
                                  <span className="text-[9px] font-mono text-slate-500">{exp.duration}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold">{exp.company}</p>
                                <ul className="list-disc pl-4 text-[10px] text-slate-400 space-y-1 mt-1.5">
                                  {exp.highlights?.map((h, i) => <li key={i}>{h}</li>)}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Project Breakdown */}
                      {result.extracted_data?.projects?.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Parsed Project Highlights</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {result.extracted_data.projects.map((proj, idx) => (
                              <div key={idx} className="bg-dark-900/40 p-4 rounded-xl border border-dark-800 flex flex-col justify-between">
                                <div>
                                  <h5 className="text-xs font-bold text-slate-300 mb-1">{proj.title}</h5>
                                  <p className="text-[10px] text-slate-400 leading-relaxed mb-3 line-clamp-3">{proj.description}</p>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {proj.technologies?.split(',').map(tech => (
                                    <span key={tech} className="text-[8px] font-mono bg-dark-800 text-slate-500 px-1.5 py-0.5 rounded border border-dark-750">
                                      {tech.strip ? tech.strip() : tech.trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="glass-card h-full flex flex-col items-center justify-center py-20 border-dashed border border-dark-800">
                      <span className="text-4xl mb-4">🔬</span>
                      <h4 className="text-sm font-bold text-slate-400 mb-1">Telemetry Monitor Idle</h4>
                      <p className="text-xs text-slate-600 max-w-xs text-center">
                        Upload your resume to output parsed parameters and timeline indexes.
                      </p>
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* ── TAB 2: ATS COMPLIANCE ───────────────────────────────────── */}
            {activeTab === 'ats' && (
              <motion.div 
                key="tab-ats"
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {!result ? (
                  <div className="glass-card text-center py-20 border-dashed border border-dark-850">
                    <p className="text-4xl mb-4">🎯</p>
                    <p className="text-slate-400 text-sm font-bold">Resume Parsing Required</p>
                    <p className="text-xs text-slate-600 mt-1">Please connect your resume file in the Parse Portal first.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* ATS Score & Gauge */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                      <ScoreGauge 
                        value={result.ats_score || 0} 
                        label="ATS Core Score" 
                        subtitle="Compatibility against standard semantic screening filters." 
                        colorTheme="green" 
                      />

                      {/* Word Count Audit Card */}
                      <div className="glass-card p-6 border-dark-700 space-y-4">
                        <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-dark-800 pb-2">Word Density Audit</h4>
                        
                        <div className="flex justify-between items-baseline">
                          <span className="text-3xl font-black text-slate-200">{result.ats_analysis?.word_count || 0}</span>
                          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Words parsed</span>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>Short (300)</span>
                            <span>Optimal (400-800)</span>
                            <span>Dense (900+)</span>
                          </div>
                          <div className="h-2 bg-dark-900 rounded-full overflow-hidden border border-dark-800">
                            <div 
                              className={`h-full rounded-full ${
                                result.ats_analysis?.word_count < 300 ? 'bg-amber-400 w-1/3' :
                                result.ats_analysis?.word_count <= 800 ? 'bg-emerald-400 w-2/3' : 'bg-rose-400 w-full'
                              }`} 
                            />
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed bg-dark-900/60 p-3 rounded-lg border border-dark-800">
                          {result.ats_analysis?.word_count < 300 
                            ? "🚨 Resume word count is low. Add more project complexities or job achievements to rank higher on semantic match models." 
                            : result.ats_analysis?.word_count <= 800 
                              ? "✓ Ideal text density. Spacing and readability score are fully optimized." 
                              : " Text density is high. Condense sentences to fit a compact 1-2 page format."
                          }
                        </p>
                      </div>
                    </div>

                    {/* ATS Checks & Issues List */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                      
                      {/* Structure Checklist Card */}
                      <div className="glass-card p-6 border-dark-700">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-dark-800 pb-2">ATS Structural Audits</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.ats_analysis?.checklist?.map((item, idx) => (
                            <div 
                              key={idx} 
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                item.passed 
                                  ? 'bg-emerald-500/5 border-emerald-500/10 text-slate-300' 
                                  : 'bg-rose-500/5 border-rose-500/10 text-slate-400'
                              }`}
                            >
                              <span className={`text-sm ${item.passed ? 'text-emerald-400' : 'text-slate-600'}`}>
                                {item.passed ? '✓' : '✗'}
                              </span>
                              <span className="text-xs font-bold font-sans">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Outstanding Issues / Suggestions */}
                      <div className="glass-card p-6 border-dark-700">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-dark-800 pb-2 flex items-center gap-2">
                           Critical Correction Alerts
                        </h3>

                        {result.ats_analysis?.issues?.length > 0 ? (
                          <div className="space-y-3">
                            {result.ats_analysis.issues.map((issue, idx) => (
                              <div key={idx} className="flex items-start gap-3 bg-dark-900/50 p-4 rounded-xl border border-dark-800 hover:border-dark-700 transition-colors">
                                <span className="text-xs font-bold font-mono text-neon-cyan bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                                  ALERT {String(idx + 1).padStart(2, '0')}
                                </span>
                                <p className="text-xs text-slate-300 leading-relaxed font-sans">{issue}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-emerald-500/5 border border-emerald-500/15 p-5 rounded-xl flex items-center gap-4">
                            <span className="text-2xl"></span>
                            <div>
                              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-0.5">Formatting Complete</h4>
                              <p className="text-xs text-slate-400">Excellent! The ATS parsing compiler found no blocking issues with headers or font styling.</p>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                )}
              </motion.div>
            )}

            {/* ── TAB 3: JOB MATCHER ───────────────────────────────────── */}
            {activeTab === 'job_match' && (
              <motion.div 
                key="tab-jobmatch"
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {!result ? (
                  <div className="glass-card text-center py-20 border-dashed border border-dark-850">
                    <p className="text-4xl mb-4"></p>
                    <p className="text-slate-400 text-sm font-bold">Resume Upload Required</p>
                    <p className="text-xs text-slate-600 mt-1">Please upload your resume to compile comparisons against job descriptions.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Panel: Input Job Description */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                      <div className="glass-card p-6 border-dark-700 flex flex-col gap-4">
                        <div>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target Job Description</h3>
                          <p className="text-[10px] text-slate-500">Paste in requirements to simulate recruiters keyword screening.</p>
                        </div>
                        
                        <textarea
                          rows={8}
                          placeholder="Paste requirements, technical stack specifications, or general job description here..."
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          className="w-full text-xs bg-dark-900 border border-dark-700 rounded-lg p-3.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-neon-cyan resize-none"
                        />

                        <button
                          onClick={handleJobMatch}
                          disabled={matching || !jobDescription.trim()}
                          className={`
                            w-full py-3.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300 border
                            ${(matching || !jobDescription.trim())
                              ? 'bg-dark-850 text-slate-500 border-dark-800' 
                              : 'bg-neon-cyan hover:bg-neon-cyan/90 text-slate-900 border-transparent shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                            }
                          `}
                        >
                          {matching ? 'Calculating Semantic Similarity...' : 'COMPUTE ROLE ALIGNMENT '}
                        </button>
                      </div>
                    </div>

                    {/* Right Panel: Job Matching Results */}
                    <div className="lg:col-span-7">
                      <AnimatePresence mode="wait">
                        {!matchResult ? (
                          <div className="glass-card h-full flex flex-col items-center justify-center py-20 border-dashed border border-dark-800">
                            <span className="text-3xl mb-3">🛰️</span>
                            <h4 className="text-xs font-bold text-slate-400 mb-1">Similarity Engine Standby</h4>
                            <p className="text-[10px] text-slate-600 text-center max-w-[240px]">
                              Provide target requirements on the left to compute compatibility aggregates.
                            </p>
                          </div>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            className="space-y-6"
                          >
                            {/* Match Score Indicator */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <ScoreGauge 
                                value={matchResult.match_score || 0} 
                                label="Target Role Match" 
                                subtitle="Aggregate semantic compatibility and technical coverage rating."
                                colorTheme="cyan"
                              />

                              <div className="glass-card p-5 border-dark-700 flex flex-col justify-between">
                                <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Role Alignment Status</h4>
                                <div className="text-xl font-black text-slate-200">
                                  {matchResult.match_score >= 80 ? '🔥 Highly Competitive' :
                                   matchResult.match_score >= 60 ? ' Strong Match Candidate' :
                                   matchResult.match_score >= 35 ? ' Gaps Detected' : '🚨 Low Match Alignment'}
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed mt-2 border-t border-dark-800 pt-2">
                                  We detected {matchResult.matched_skills?.length || 0} overlapping skills and {matchResult.missing_skills?.length || 0} gaps.
                                </p>
                              </div>
                            </div>

                            {/* Skills Breakdown Grid */}
                            {matchResult.skill_breakdown?.length > 0 && (
                              <div className="glass-card p-6 border-dark-700">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-dark-800 pb-2">Skills Compatibility Grid</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {matchResult.skill_breakdown.map((item, idx) => (
                                    <div 
                                      key={idx} 
                                      className={`flex flex-col justify-between p-3 rounded-lg border ${
                                        item.matched 
                                          ? 'bg-emerald-500/5 border-emerald-500/10' 
                                          : 'bg-rose-500/5 border-rose-500/10'
                                      }`}
                                    >
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold text-slate-300 truncate mr-1">{item.skill}</span>
                                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                          item.importance === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                          item.importance === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                          'bg-cyan-500/10 text-neon-cyan border border-cyan-500/20'
                                        }`}>
                                          {item.importance}
                                        </span>
                                      </div>
                                      <span className={`text-[9px] font-bold ${item.matched ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {item.matched ? '✓ Matched' : '✗ Missing'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Match Action recommendations */}
                            {matchResult.recommendations?.length > 0 && (
                              <div className="glass-card p-6 border-dark-700">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-dark-800 pb-2 flex items-center gap-2">
                                   Tailoring Recommendations
                                </h3>
                                <div className="space-y-2.5">
                                  {matchResult.recommendations.map((rec, idx) => (
                                    <div key={idx} className="flex items-start gap-3 bg-dark-900/40 p-3.5 rounded-lg border border-dark-800">
                                      <span className="text-xs font-bold font-mono text-neon-cyan mt-0.5">•</span>
                                      <p className="text-xs text-slate-400 leading-relaxed font-sans">{rec}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>
                )}
              </motion.div>
            )}

            {/* ── TAB 4: EMPLOYABILITY METRICS ───────────────────────────── */}
            {activeTab === 'analytics' && (
              <motion.div 
                key="tab-analytics"
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {!result ? (
                  <div className="glass-card text-center py-20 border-dashed border border-dark-850">
                    <p className="text-4xl mb-4"></p>
                    <p className="text-slate-400 text-sm font-bold">Analytics Pending Resume Scan</p>
                    <p className="text-xs text-slate-600 mt-1">Please connect your resume file in the Parse Portal first.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Career readiness across roles */}
                    <div className="lg:col-span-6 flex flex-col gap-6">
                      <div className="glass-card p-6 border-dark-700">
                        <div className="flex justify-between items-center mb-6 border-b border-dark-800 pb-3">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trajectory Readiness Scores</h3>
                          <span className="text-[9px] text-slate-500 font-mono">WEIGHTED CRITERIA AGGREGATE</span>
                        </div>

                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pathReadinessData} layout="vertical" margin={{ left: 10, right: 10 }}>
                              <XAxis type="number" domain={[0, 100]} stroke="#334155" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                              <YAxis dataKey="name" type="category" stroke="#334155" tick={{ fill: '#e2e8f0', fontSize: 10 }} width={120} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', fontSize: 11 }} />
                              <Bar dataKey="score" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={14} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Salary Estimator Panel */}
                      {result.salary_estimation && (
                        <div className="glass-card p-6 border-dark-700 space-y-4">
                          <div className="flex justify-between items-center border-b border-dark-800 pb-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Salary Range Vector</h3>
                            <span className="text-[9px] font-mono text-neon-cyan bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                              {result.salary_estimation.market_demand} DEMAND
                            </span>
                          </div>

                          <div className="flex justify-between items-baseline py-1">
                            <div>
                              <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Min Estimated</span>
                              <span className="text-lg font-black text-slate-300">₹{(result.salary_estimation.min_salary / 100000).toFixed(1)} LPA</span>
                            </div>
                            <div className="text-center bg-dark-900/60 border border-dark-800 rounded-xl px-4 py-2">
                              <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-bold">Market Average</span>
                              <span className="text-xl font-black text-neon-purple">₹{(result.salary_estimation.avg_salary / 100000).toFixed(1)} LPA</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Max Estimated</span>
                              <span className="text-lg font-black text-slate-300">₹{(result.salary_estimation.max_salary / 100000).toFixed(1)} LPA</span>
                            </div>
                          </div>

                          <div className="h-1 bg-dark-900 rounded-full relative overflow-hidden">
                            <div className="absolute left-1/4 right-1/4 h-full bg-gradient-to-r from-neon-purple to-neon-cyan shadow-[0_0_10px_#06b6d4]" />
                          </div>

                          <p className="text-[10px] text-slate-500 leading-relaxed font-sans text-center">
                            Calculated dynamically based on verified skills, project technical complexity scores, and local internship benchmarks.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Radar Benchmarking & Internship Prob */}
                    <div className="lg:col-span-6 flex flex-col gap-6">
                      <div className="glass-card p-6 border-dark-700">
                        <div className="flex justify-between items-center mb-6 border-b border-dark-800 pb-3">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Candidate Benchmarking</h3>
                          <span className="text-[9px] text-slate-500 font-mono">VS PEERS & TOP PERFORMERS</span>
                        </div>

                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={benchmarkingData}>
                              <PolarGrid stroke="#334155" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#e2e8f0', fontSize: 9 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 8 }} />
                              <Radar name="You" dataKey="candidate" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} />
                              <Radar name="Peer Avg" dataKey="peer_average" stroke="#eab308" fill="#eab308" fillOpacity={0.08} />
                              <Radar name="Top Tier" dataKey="top_performers" stroke="#10b981" fill="#10b981" fillOpacity={0.08} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', fontSize: 10 }} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Internship Probability Gauge */}
                      <div className="glass-card p-5 border-dark-700 flex justify-between items-center relative overflow-hidden">
                        <div className="space-y-1.5">
                          <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Placement Probability</h4>
                          <h3 className="text-2xl font-black text-slate-200">
                            {result.internship_readiness >= 80 ? ' Highly Deployable' :
                             result.internship_readiness >= 60 ? ' Good Placement Outlook' :
                             result.internship_readiness >= 40 ? ' Moderate Readiness' : '🚨 Action Required'}
                          </h3>
                          <p className="text-[10px] text-slate-500 leading-relaxed font-sans max-w-[280px]">
                            Sigmoid hiring simulation based on repository velocity, ATS score, and tech overlap matrices.
                          </p>
                        </div>
                        <div className="w-20 h-20 bg-dark-900 rounded-2xl border border-dark-800 flex flex-col justify-center items-center">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Probability</span>
                          <span className="text-2xl font-black text-neon-cyan mt-0.5">{result.internship_readiness || 0}%</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </motion.div>
            )}

            {/* ── TAB 5: AI PROJECT GRADER ────────────────────────────────── */}
            {activeTab === 'projects' && (
              <motion.div 
                key="tab-projects"
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {!result ? (
                  <div className="glass-card text-center py-20 border-dashed border border-dark-850">
                    <p className="text-4xl mb-4"></p>
                    <p className="text-slate-400 text-sm font-bold">Grader Pending Resume Upload</p>
                    <p className="text-xs text-slate-600 mt-1">Please connect your resume file in the Parse Portal first.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="border-b border-dark-850 pb-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Portfolio Grader</h3>
                      <p className="text-xs text-slate-500 mt-1">LLM evaluation of project scope, engineering complexity, and development best practices.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {result.project_analysis?.map((proj, idx) => (
                        <div key={idx} className="glass-card p-6 border-dark-700 grid grid-cols-1 lg:grid-cols-12 gap-8 hover:border-dark-600 transition-all duration-300">
                          
                          {/* Title & Description */}
                          <div className="lg:col-span-5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-3.5 mb-2">
                                <span className="text-[10px] px-2 py-0.5 bg-dark-900 border border-dark-800 text-slate-400 rounded font-mono">
                                  PROJECT {String(idx + 1).padStart(2, '0')}
                                </span>
                                <h4 className="text-sm font-bold text-slate-200">{proj.title}</h4>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed font-sans mt-2">{proj.description}</p>
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-dark-800">
                              <span className="text-[9px] text-slate-500 block uppercase tracking-wider mb-1.5 font-bold">Strengths</span>
                              <div className="flex flex-col gap-1.5">
                                {proj.strengths?.map((str, i) => (
                                  <div key={i} className="flex gap-2 items-center text-[10px] text-slate-400">
                                    <span className="text-emerald-500">•</span>
                                    <span>{str}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Scores & Gauges */}
                          <div className="lg:col-span-4 flex flex-col justify-center space-y-4">
                            <div>
                              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                <span>Architecture Complexity</span>
                                <span className="font-bold text-neon-cyan">{proj.complexity_breakdown?.architecture || proj.complexity_score || 0}%</span>
                              </div>
                              <div className="h-2 bg-dark-900 rounded-full overflow-hidden border border-dark-800">
                                <div className="h-full bg-neon-cyan rounded-full" style={{ width: `${proj.complexity_breakdown?.architecture || proj.complexity_score || 0}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                <span>Innovation & Tech Usage</span>
                                <span className="font-bold text-neon-purple">{proj.innovation_score || 0}%</span>
                              </div>
                              <div className="h-2 bg-dark-900 rounded-full overflow-hidden border border-dark-800">
                                <div className="h-full bg-neon-purple rounded-full" style={{ width: `${proj.innovation_score || 0}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                <span>Industry Value</span>
                                <span className="font-bold text-emerald-400">{proj.industry_value_score || 0}%</span>
                              </div>
                              <div className="h-2 bg-dark-900 rounded-full overflow-hidden border border-dark-800">
                                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${proj.industry_value_score || 0}%` }} />
                              </div>
                            </div>
                          </div>

                          {/* Overall Score & Recommendations */}
                          <div className="lg:col-span-3 flex flex-col justify-between bg-dark-900/40 p-4 rounded-xl border border-dark-800">
                            <div className="flex justify-between items-center border-b border-dark-800 pb-2 mb-3">
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Overall Grade</span>
                              <span className="text-xs font-black text-neon-cyan">{proj.overall_score || 0}%</span>
                            </div>

                            <div className="flex-1 space-y-2">
                              <span className="text-[8px] text-slate-500 block uppercase tracking-wider font-bold">Suggested Actions</span>
                              {proj.suggestions?.map((sug, i) => (
                                <p key={i} className="text-[10px] text-slate-400 leading-normal bg-dark-950/60 p-2 rounded border border-dark-800 font-sans">
                                  {sug}
                                </p>
                              ))}
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── TAB 6: SOCIAL BRAND & REWRITER ─────────────────────────── */}
            {activeTab === 'social_rewriter' && (
              <motion.div 
                key="tab-social"
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {!result ? (
                  <div className="glass-card text-center py-20 border-dashed border border-dark-850">
                    <p className="text-4xl mb-4">✍</p>
                    <p className="text-slate-400 text-sm font-bold">Scanners Awaiting Resume Scan</p>
                    <p className="text-xs text-slate-600 mt-1">Please connect your resume file in the Parse Portal first.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* GitHub connected statistics */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                      {!result.github_analysis || !result.github_analysis.github_score ? (
                        <div className="glass-card p-6 border-dark-700 space-y-4">
                          <div className="flex items-center gap-3 border-b border-dark-800 pb-3">
                            <span className="text-2xl"></span>
                            <div>
                              <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider">GitHub Scraper</h3>
                              <p className="text-[9px] text-slate-500 font-bold">AUDIT NOT CONNECTED</p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed font-sans">
                            Link your GitHub public profile to evaluate repository count, star counts, commit velocity, and language distributions.
                          </p>
                          <div className="space-y-3 pt-2">
                            <input 
                              type="text" 
                              placeholder="Enter GitHub Username..."
                              value={githubInput}
                              onChange={(e) => setGithubInput(e.target.value)}
                              className="w-full text-xs bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-slate-300 focus:outline-none focus:border-neon-cyan"
                            />
                            <button
                              onClick={handleSocialConnect}
                              disabled={socialAuditing || !githubInput.trim()}
                              className="w-full py-2 bg-dark-800 hover:bg-dark-750 text-cyan-400 border border-dark-700 rounded-lg text-xs font-bold transition-all"
                            >
                              {socialAuditing ? 'Auditing...' : 'Connect GitHub '}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="glass-card p-6 border-dark-700 space-y-4">
                          <div className="flex items-center gap-3 border-b border-dark-800 pb-3">
                            <span className="text-2xl"></span>
                            <div>
                              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">GitHub Scraper Audit</h3>
                              <p className="text-[9px] text-slate-500">github.com/{result.github_analysis?.username || 'candidate'}</p>
                            </div>
                            <span className="ml-auto text-xs font-black text-neon-cyan">
                              {result.github_analysis?.github_score || 0}%
                            </span>
                          </div>

                          {/* Counts grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-dark-900/60 p-3 rounded-lg border border-dark-800">
                              <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Public Repos</span>
                              <span className="text-base font-extrabold text-slate-300">{result.github_analysis?.public_repos || 0}</span>
                            </div>
                            <div className="bg-dark-900/60 p-3 rounded-lg border border-dark-800">
                              <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Commit Velocity</span>
                              <span className="text-[9px] font-bold text-neon-purple mt-1 block truncate">
                                {result.github_analysis?.velocity?.split(' ')[0] || 'Moderate'}
                              </span>
                            </div>
                            <div className="bg-dark-900/60 p-3 rounded-lg border border-dark-800">
                              <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Stars Earned</span>
                              <span className="text-base font-extrabold text-slate-300">{result.github_analysis?.stars || 0}</span>
                            </div>
                            <div className="bg-dark-900/60 p-3 rounded-lg border border-dark-800">
                              <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Total Forks</span>
                              <span className="text-base font-extrabold text-slate-300">{result.github_analysis?.forks || 0}</span>
                            </div>
                          </div>

                          {/* Languages distribution */}
                          {result.github_analysis?.languages && (
                            <div>
                              <span className="text-[9px] text-slate-500 block uppercase tracking-wider mb-2 font-bold">Top Languages</span>
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(result.github_analysis.languages).map(([lang, val]) => (
                                  <span key={lang} className="text-[8px] font-mono px-2 py-0.5 bg-dark-900 text-cyan-400 rounded border border-dark-800">
                                    {lang} ({val})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="border-t border-dark-800 pt-3">
                            <span className="text-[9px] text-slate-500 block uppercase tracking-wider mb-1.5 font-bold">Recommendations</span>
                            <div className="space-y-2">
                              {result.github_analysis?.recommendations?.slice(0, 2).map((rec, i) => (
                                <p key={i} className="text-[10px] text-slate-400 leading-normal font-sans bg-dark-950/40 p-2 rounded border border-dark-800">
                                  • {rec}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Resume Bullet Rewriter & LinkedIn */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                      
                      {/* Live rewriter tool */}
                      <div className="glass-card p-6 border-dark-700 space-y-4">
                        <div>
                          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">AI Resume Bullet Polisher</h3>
                          <p className="text-[10px] text-slate-500">Transform passive phrases into STAR quantitative achievements.</p>
                        </div>

                        <div className="space-y-3">
                          <textarea
                            rows={2}
                            placeholder="Type a dry bullet point e.g., 'Helped build a web application using React and Flask.'"
                            value={bulletToRewrite}
                            onChange={(e) => setBulletToRewrite(e.target.value)}
                            className="w-full text-xs bg-dark-900 border border-dark-700 rounded-lg p-3 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-neon-cyan resize-none"
                          />
                          
                          <button
                            onClick={handleRewrite}
                            disabled={rewriting || !bulletToRewrite.trim()}
                            className={`
                              px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-200 border
                              ${(rewriting || !bulletToRewrite.trim())
                                ? 'bg-dark-850 text-slate-600 border-dark-800' 
                                : 'bg-neon-purple hover:bg-neon-purple/95 text-white border-transparent shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                              }
                            `}
                          >
                            {rewriting ? 'Polishing Phrase...' : 'REWRITE BULLET POINT '}
                          </button>
                        </div>

                        {/* Rewritten results panel */}
                        <AnimatePresence>
                          {rewrittenResult && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-dark-900/60 rounded-xl border border-dark-800 p-4 space-y-3"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold mb-1">Original Draft</span>
                                  <p className="text-xs text-slate-400 bg-dark-950/40 p-2.5 rounded border border-dark-850 italic">
                                    "{rewrittenResult.original}"
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[9px] text-cyan-400 uppercase tracking-wider block font-bold mb-1">Polished STAR Output</span>
                                  <p className="text-xs text-slate-200 bg-cyan-950/20 p-2.5 rounded border border-cyan-800/30">
                                    "{rewrittenResult.rewritten}"
                                  </p>
                                </div>
                              </div>
                              <div className="border-t border-dark-800 pt-2 text-[10px] text-slate-400">
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold mb-0.5">Rewrite Rationale</span>
                                {rewrittenResult.impact}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* LinkedIn profile audit suggestions */}
                      {!result.linkedin_analysis || !result.linkedin_analysis.linkedin_score ? (
                        <div className="glass-card p-6 border-dark-700 space-y-4">
                          <div className="flex items-center gap-3 border-b border-dark-800 pb-3">
                            <span className="text-2xl"></span>
                            <div>
                              <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider">LinkedIn Brand Auditor</h3>
                              <p className="text-[9px] text-slate-500 font-bold">AUDIT NOT CONNECTED</p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed font-sans">
                            Connect your LinkedIn profile summary or biographical text to check keywords coverage, generate profile outlines, and trigger recommendations.
                          </p>
                          <div className="space-y-3 pt-2">
                            <textarea 
                              rows={2}
                              placeholder="Paste your LinkedIn 'About' summary text..."
                              value={linkedinInput}
                              onChange={(e) => setLinkedinInput(e.target.value)}
                              className="w-full text-xs bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-slate-300 focus:outline-none focus:border-neon-cyan resize-none"
                            />
                            <button
                              onClick={handleSocialConnect}
                              disabled={socialAuditing || !linkedinInput.trim()}
                              className="px-4 py-2 bg-dark-800 hover:bg-dark-750 text-cyan-400 border border-dark-700 rounded-lg text-xs font-bold transition-all"
                            >
                              {socialAuditing ? 'Auditing...' : 'Audit LinkedIn Bio '}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="glass-card p-6 border-dark-700 space-y-4">
                          <div className="flex justify-between items-center border-b border-dark-800 pb-2">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">LinkedIn Headline & Bio Optimizer</h3>
                            <span className="text-xs font-black text-neon-purple">{result.linkedin_analysis?.linkedin_score || 0}% Score</span>
                          </div>

                          {/* Headline suggestions */}
                          <div className="space-y-2">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Suggested Headlines</span>
                            {result.linkedin_analysis?.headline_suggestions?.map((hl, idx) => (
                              <div key={idx} className="bg-dark-900/40 p-3 rounded-lg border border-dark-800 text-xs text-slate-300 hover:border-dark-750 transition-colors">
                                {hl}
                              </div>
                            ))}
                          </div>

                          {/* Generated bio summary */}
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Optimized Bio Outline</span>
                            <p className="text-xs text-slate-400 leading-relaxed bg-dark-900/60 p-3 rounded-lg border border-dark-800 font-sans">
                              {result.linkedin_analysis?.about_suggestions}
                            </p>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

    </motion.div>
  );
}
