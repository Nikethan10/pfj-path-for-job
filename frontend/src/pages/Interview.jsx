import { useState, useRef, useEffect } from 'react';
import { toast } from '../lib/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getInterviewQuestion, evaluateInterviewAnswer } from '../services/interviewService';
import { getProfile } from '../services/profileService';

export default function Interview() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [previousQuestions, setPreviousQuestions] = useState([]);
  const [interviewType, setInterviewType] = useState('technical');
  
  // Voice & Speech parameters
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Telemetry HUD stats
  const [totalScore, setTotalScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [profile, setProfile] = useState(null);

  const messagesEndRef = useRef(null);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to load profile for interview role", err);
      }
    };
    fetchProfile();
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };
      recognitionRef.current = rec;
    }
  }, []);

  // Timer Effect
  useEffect(() => {
    if (sessionActive && !loading) {
      const interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionActive, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const [preferredVoice, setPreferredVoice] = useState(null);

  // Load and select premium natural voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        
        // Find high-quality English voice
        const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
        const bestVoice = 
          englishVoices.find(v => v.name.includes('Natural')) ||
          englishVoices.find(v => v.name.includes('Google US English')) ||
          englishVoices.find(v => v.name.includes('Google')) ||
          englishVoices.find(v => v.name.includes('Aria')) ||
          englishVoices.find(v => v.name.includes('Guy')) ||
          englishVoices.find(v => v.name.includes('Zira')) ||
          englishVoices.find(v => v.name.includes('David')) ||
          englishVoices[0];
          
        setPreferredVoice(bestVoice);
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Voice synthesis read out helper
  const speakText = (text) => {
    if (isMuted) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // stop current readouts
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      // Make it sound like a real person: moderate pitch, slightly slower natural cadence
      utterance.rate = 0.90;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const startSession = async () => {
    setSessionActive(true);
    setSecondsElapsed(0);
    setTotalScore(0);
    setQuestionCount(0);
    setPreviousQuestions([]);
    
    const trackName = interviewType === 'technical' 
      ? 'Technical & Coding' 
      : interviewType === 'aptitude' 
        ? 'Quantitative & Logical Aptitude' 
        : 'Verbal Ability';
        
    setMessages([{ 
      sender: 'ai', 
      type: 'system', 
      text: `Mock ${trackName} interview session started. Ready for your first question.` 
    }]);
    
    await fetchNextQuestion([]);
  };

  const stopSession = () => {
    setSessionActive(false);
    setCurrentQuestion(null);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleReset = () => {
    stopSession();
    setMessages([]);
    setInput('');
    setTotalScore(0);
    setQuestionCount(0);
    setSecondsElapsed(0);
    setPreviousQuestions([]);
  };

  const fetchNextQuestion = async (overridePrevQs) => {
    setLoading(true);
    const qs = Array.isArray(overridePrevQs) ? overridePrevQs : previousQuestions;
    try {
      const res = await getInterviewQuestion({ 
        previous_questions: qs,
        interview_type: interviewType
      });
      setCurrentQuestion(res.data);
      setPreviousQuestions(prev => [...prev, res.data.question]);
      
      setMessages(prev => [
        ...prev, 
        { sender: 'ai', type: 'question', text: res.data.question }
      ]);
      
      // Auto speech synthesis read-out
      setTimeout(() => {
        speakText(res.data.question);
      }, 100);

    } catch (err) {
      setMessages(prev => [
        ...prev, 
        { sender: 'ai', type: 'error', text: 'Error: Failed to fetch the next question. Please try again.' }
      ]);
    }
    setLoading(false);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.info('Voice input is not supported in this browser. You can still type your answers. (Chrome recommended for speech.)');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentQuestion || loading) return;

    const userText = input.trim();
    setInput('');
    
    // stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setMessages(prev => [...prev, { sender: 'user', type: 'answer', text: userText }]);
    setLoading(true);

    try {
      const payload = {
        question: currentQuestion.question,
        user_answer: userText,
        expected_keywords: currentQuestion.expected_keywords
      };
      
      const res = await evaluateInterviewAnswer(payload);
      
      // Update score telemetry
      setTotalScore(prev => prev + res.data.score);
      setQuestionCount(prev => prev + 1);

      // Add feedback to chat
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        type: 'feedback', 
        text: res.data.feedback,
        score: res.data.score,
        keywords: res.data.matched_keywords
      }]);
      
      // Speak the feedback
      const cleanFeedbackText = res.data.feedback.replace(/Strengths:|Development Areas:/g, '');
      speakText(`Your score is ${res.data.score}. ` + cleanFeedbackText.slice(0, 100));

      setCurrentQuestion(null);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', type: 'error', text: 'Error: Failed to evaluate response.' }]);
    }
    setLoading(false);
  };

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.15)]';
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const avgScore = questionCount > 0 ? Math.round(totalScore / questionCount) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-6.5rem)] flex flex-col pb-4 text-left">
      
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shrink-0 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold mb-1 tracking-tight flex items-center gap-3">
            <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent"> AI Mock Interview Simulator</span>
            {sessionActive && (
              <span className="text-[10px] px-2.5 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-md font-mono tracking-widest uppercase animate-pulse">
                Interview Active
              </span>
            )}
          </h1>
          <p className="text-gray-400 text-sm">Practice technical, aptitude, and verbal interviews with real-time feedback.</p>
        </div>
        
        {/* Main session controls */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              const newMuted = !isMuted;
              setIsMuted(newMuted);
              if (newMuted && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-300 flex items-center gap-2 ${
              !isMuted 
                ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20' 
                : 'bg-slate-100 border-dark-700 text-slate-400 hover:bg-slate-200'
            }`}
            title={!isMuted ? "Mute interviewer voice" : "Unmute interviewer voice"}
          >
            {!isMuted ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span>Voice: ON</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
                <span>Voice: OFF</span>
              </>
            )}
          </button>

          {sessionActive ? (
            <button 
              onClick={stopSession} 
              className="px-5 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
            >
              Terminate Session 
            </button>
          ) : (
            <button 
              onClick={startSession} 
              className="px-6 py-3 rounded-xl text-xs font-black tracking-widest uppercase bg-gradient-to-r from-neon-cyan to-neon-purple text-white border border-transparent shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:scale-105 transition-all"
            >
              Start Mock Interview 
            </button>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
        
        {/* Chat Window Panel */}
        <div className="flex-1 glass-card flex flex-col overflow-hidden relative border-white/10 p-0 bg-black/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl">
          {/* Holographic grid scan lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:100%_24px] pointer-events-none z-0" />
          
          {!sessionActive ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 overflow-y-auto">
              <div className="mb-6 max-w-xl text-center">
                <h2 className="text-xl font-extrabold text-slate-800 mb-2 tracking-tight">
                  Select Your Interview Track
                </h2>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Choose a track to customize your session. The AI interviewer will generate questions and evaluate your responses dynamically.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-6">
                {/* Technical Card */}
                <div
                  onClick={() => setInterviewType('technical')}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between h-44 relative ${
                    interviewType === 'technical'
                      ? 'bg-white border-neon-cyan shadow-[0_4px_20px_rgba(22,101,52,0.15)] ring-1 ring-neon-cyan'
                      : 'bg-white/50 border-dark-700 hover:border-dark-600 hover:-translate-y-0.5 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                      interviewType === 'technical' ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1">Technical & Coding</h3>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Coding, systems, and algorithms for your role: <span className="font-semibold text-neon-cyan">{profile?.target_role || 'Software Engineer'}</span>.
                    </p>
                  </div>
                  {interviewType === 'technical' && (
                    <span className="absolute top-4 right-4 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan"></span>
                    </span>
                  )}
                </div>

                {/* Aptitude Card */}
                <div
                  onClick={() => setInterviewType('aptitude')}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between h-44 relative ${
                    interviewType === 'aptitude'
                      ? 'bg-white border-neon-purple shadow-[0_4px_20px_rgba(190,18,60,0.15)] ring-1 ring-neon-purple'
                      : 'bg-white/50 border-dark-700 hover:border-dark-600 hover:-translate-y-0.5 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                      interviewType === 'aptitude' ? 'bg-neon-purple/20 text-neon-purple' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1">Aptitude & Logic</h3>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Quantitative math, logical puzzles, numbers, ratios, and analytical questions.
                    </p>
                  </div>
                  {interviewType === 'aptitude' && (
                    <span className="absolute top-4 right-4 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-purple opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-purple"></span>
                    </span>
                  )}
                </div>

                {/* Verbal Card */}
                <div
                  onClick={() => setInterviewType('verbal')}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between h-44 relative ${
                    interviewType === 'verbal'
                      ? 'bg-white border-neon-pink shadow-[0_4px_20px_rgba(217,119,6,0.15)] ring-1 ring-neon-pink'
                      : 'bg-white/50 border-dark-700 hover:border-dark-600 hover:-translate-y-0.5 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                      interviewType === 'verbal' ? 'bg-neon-pink/20 text-neon-pink' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1">Verbal Ability</h3>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      English grammar, sentence correction, reading comprehension, and vocabulary.
                    </p>
                  </div>
                  {interviewType === 'verbal' && (
                    <span className="absolute top-4 right-4 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-pink opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-pink"></span>
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={startSession}
                className="px-6 py-3 rounded-xl text-xs font-black tracking-widest uppercase bg-gradient-to-r from-neon-cyan to-neon-purple text-white border border-transparent shadow-[0_0_20px_rgba(22,101,52,0.2)] hover:scale-105 hover:shadow-[0_0_25px_rgba(22,101,52,0.3)] transition-all duration-300"
              >
                Start Mock Interview
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 custom-scrollbar">
              {messages.map((msg, idx) => {
                const isAi = msg.sender === 'ai';
                return (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col max-w-[90%] sm:max-w-[80%] ${isAi ? 'mr-auto items-start' : 'ml-auto items-end'}`}
                  >
                    {/* Message Tag */}
                    <div className="flex items-center gap-2 mb-1.5 px-2">
                      <span className={`text-[10px] font-bold tracking-wider uppercase ${
                        isAi 
                          ? msg.type === 'system' ? 'text-neon-cyan/60' : 'text-neon-cyan' 
                          : 'text-neon-purple'
                       }`}>
                        {isAi ? `Interviewer` : `You`}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-[9px] text-gray-500 font-medium">
                        {msg.type === 'feedback' ? 'Evaluation' : msg.type === 'system' ? 'System' : `Question #${Math.floor(idx/2) + 1}`}
                      </span>
                    </div>

                    {/* Message bubble */}
                    <div className={`p-4 rounded-2xl border relative overflow-hidden transition-all duration-300 ${
                      !isAi 
                        ? 'bg-neon-purple/10 border-neon-purple/20 text-slate-800 rounded-tr-none shadow-sm'
                        : msg.type === 'feedback'
                          ? 'bg-white border-dark-700 rounded-tl-none shadow-sm w-full text-slate-800'
                          : msg.type === 'system'
                            ? 'bg-slate-50 border-dark-700 text-slate-700 font-mono text-xs rounded-tl-none leading-relaxed'
                            : 'bg-slate-50 border-dark-700 text-slate-800 rounded-tl-none shadow-sm'
                    }`}>
                      
                      {isAi && msg.type !== 'system' && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-neon-cyan" />
                      )}
                      {!isAi && (
                        <div className="absolute top-0 right-0 w-1 h-full bg-neon-purple" />
                      )}

                      {/* Speaking indicator overlay */}
                      {isAi && msg.type === 'question' && (
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <button 
                            onClick={() => speakText(msg.text)}
                            className="text-slate-500 hover:text-neon-cyan p-1 transition-colors shrink-0 text-xs flex items-center justify-center"
                            title="Speak question"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {(!isAi || msg.type !== 'question') && (
                        <p className={`text-sm leading-relaxed whitespace-pre-line ${msg.type === 'system' ? 'font-mono' : 'font-sans'}`}>
                          {msg.text}
                        </p>
                      )}
                      
                      {/* Evaluation Metrics card inside feedback message */}
                      {msg.type === 'feedback' && (
                        <div className="mt-4 pt-4 border-t border-dark-700 space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Score:</span>
                              <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-md border ${getScoreColorClass(msg.score)}`}>
                                {msg.score} / 100
                              </span>
                            </div>
                            {msg.keywords && msg.keywords.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Matched Keywords:</span>
                                {msg.keywords.map((kw, i) => (
                                  <span key={i} className="text-[9px] font-mono bg-green-500/10 border border-green-500/20 text-green-700 px-2 py-0.5 rounded">
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Telemetry response latency loader */}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mr-auto flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-1 px-2">
                    <span className="text-[10px] font-bold text-neon-cyan/80">INTERVIEWER</span>
                  </div>
                  <div className="bg-slate-50 border border-dark-700 px-4 py-3 rounded-xl rounded-tl-none flex gap-3 items-center shadow-sm">
                    <span className="text-xs text-slate-500 font-medium tracking-wide">Processing response...</span>
                    <div className="flex gap-1.5">
                      <motion.div animate={{ scale: [0.7, 1.2, 0.7] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-neon-cyan rounded-full" />
                      <motion.div animate={{ scale: [0.7, 1.2, 0.7] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-neon-purple rounded-full" />
                      <motion.div animate={{ scale: [0.7, 1.2, 0.7] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-neon-pink rounded-full" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Next Question Trigger */}
              {!loading && messages.length > 0 && messages[messages.length - 1].type === 'feedback' && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center mt-6">
                  <button 
                    onClick={fetchNextQuestion} 
                    className="px-6 py-3 rounded-2xl font-black text-xs tracking-widest bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 hover:border-neon-cyan hover:bg-neon-cyan/15 text-white transition-all hover:scale-105 duration-200 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                  >
                    Next Question →
                  </button>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Telemetry Stats HUD Sidebar */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4 overflow-y-auto h-full min-h-0 pr-1 custom-scrollbar">
          
          <div className="glass-card border border-dark-700 bg-white rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[210px] shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-2xl rounded-full pointer-events-none" />
            
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" /> Interview Progress
              </h3>
              
              <div className="space-y-2.5 font-mono">
                <div className="flex justify-between items-center pb-2.5 border-b border-dark-700">
                  <span className="text-xs text-slate-500 font-mono">Interview Type</span>
                  <span className="text-[10px] font-black text-neon-cyan font-mono uppercase text-right max-w-[150px] truncate" title={
                    interviewType === 'technical'
                      ? (profile?.target_role || 'SOFTWARE ENGINEER')
                      : interviewType === 'aptitude'
                        ? 'APTITUDE TEST'
                        : 'VERBAL ABILITY'
                  }>
                    {interviewType === 'technical'
                      ? (profile?.target_role || 'SOFTWARE ENGINEER')
                      : interviewType === 'aptitude'
                        ? 'APTITUDE TEST'
                        : 'VERBAL ABILITY'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-2.5 border-b border-dark-700">
                  <span className="text-xs text-slate-500 font-mono">Average Score</span>
                  <span className={`text-base font-black font-mono ${avgScore >= 80 ? 'text-emerald-700' : avgScore >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                    {avgScore}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-2.5 border-b border-dark-700">
                  <span className="text-xs text-slate-500 font-mono">Questions Answered</span>
                  <span className="text-sm font-bold text-slate-800 font-mono">{questionCount}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-mono">Elapsed Time</span>
                  <span className="text-sm font-bold text-neon-purple font-mono">{formatTime(secondsElapsed)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-3.5 pt-3.5 border-t border-dark-700 flex gap-2">
              <button 
                onClick={handleReset}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider font-mono border transition-all ${
                  messages.length === 0 
                    ? 'bg-slate-100 border-dark-700 text-slate-400 cursor-not-allowed' 
                    : 'bg-white border-dark-700 text-slate-700 hover:bg-slate-50'
                }`}
                disabled={messages.length === 0}
              >
                Reset Session
              </button>
            </div>
          </div>

          {/* Evaluation Guidelines Panel */}
          <div className="glass-card border border-dark-700 bg-white rounded-3xl p-5 flex-1 flex flex-col justify-between min-h-fit shrink-0">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 font-mono">Evaluation Tips</h3>
              <ul className="space-y-3 text-xs text-slate-500 leading-relaxed">
                <li className="flex gap-2 items-start">
                  <span className="text-neon-cyan font-bold">•</span>
                  <p>
                    <strong className="text-slate-800">Be comprehensive:</strong> elaborate on your answers with explanations and examples.
                  </p>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-neon-cyan font-bold">•</span>
                  <p>
                    <strong className="text-slate-800">Technical Concepts:</strong> use precise engineering terms matching the question context.
                  </p>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-neon-cyan font-bold">•</span>
                  <p>
                    <strong className="text-slate-800">Voice Input:</strong> use the <strong className="text-neon-purple font-bold">Microphone</strong> button to speak your answer clearly.
                  </p>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-neon-cyan font-bold">•</span>
                  <p>
                    <strong className="text-slate-800">Audio Readout:</strong> toggle real-time question read-out via the header toggle or repeat using the speaker button.
                  </p>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-neon-cyan font-bold">•</span>
                  <p>
                    <strong className="text-slate-800">Scoring:</strong> evaluations are weighted based on keyword accuracy and explanation depth.
                  </p>
                </li>
              </ul>
            </div>
            
            <div className="border-t border-dark-700 pt-3.5 mt-4 text-[10px] text-slate-400 font-mono">
              <span>TELEMETRY SECURE</span>
            </div>
          </div>

        </div>

      </div>

      {/* Answer Form Input HUD */}
      <form onSubmit={handleSubmit} className="shrink-0 flex gap-4 mt-4 relative z-10">
        
        {/* Speech Dictation Trigger */}
        <button
          type="button"
          onClick={toggleListening}
          disabled={!sessionActive || !currentQuestion || loading}
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 relative shrink-0
            ${isListening 
              ? 'bg-rose-500/10 border-rose-500 text-rose-700 animate-pulse'
              : (!sessionActive || !currentQuestion || loading)
                ? 'bg-slate-100 border border-dark-700 text-slate-400 cursor-not-allowed'
                : 'bg-slate-50 border border-dark-700 text-slate-600 hover:border-neon-cyan hover:text-slate-800'
            }
          `}
          title={isListening ? "Listening... Click to stop" : "Speak your answer"}
        >
          {isListening ? (
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          ) : (
            <svg className="w-5 h-5 text-slate-500 hover:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        <textarea 
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={
            sessionActive 
              ? currentQuestion 
                ? "Type or speak your answer here..." 
                : "Awaiting next question..." 
              : "Start the mock interview above..."
          }
          disabled={!sessionActive || !currentQuestion || loading}
          className="input-field flex-1 font-mono text-sm pl-4 bg-white border border-dark-700 focus:border-neon-cyan/50 focus:ring-neon-cyan/30 rounded-xl text-slate-800"
        />
        <button 
          type="submit" 
          disabled={!sessionActive || !currentQuestion || !input.trim() || loading}
          className={`
            px-6 rounded-xl font-bold text-xs tracking-widest uppercase transition-all duration-300 border
            ${(!sessionActive || !currentQuestion || !input.trim() || loading)
              ? 'bg-slate-100 border border-dark-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white border-transparent shadow-sm hover:scale-105 active:scale-95'
            }
          `}
        >
          Submit Answer
        </button>
      </form>

    </motion.div>
  );
}
