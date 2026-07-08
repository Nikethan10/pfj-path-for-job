import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getProjects } from '../services/projectService';
import { getProfile } from '../services/profileService';
import Loader from '../components/Loader';

const difficultyColors = {
  Beginner: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20',
  Intermediate: 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20',
  Advanced: 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
};

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('target'); // 'target' or 'all'
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [domainFilter, setDomainFilter] = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    loadData();

    const handleRefresh = () => {
      loadData();
    };
    window.addEventListener('PATH_refresh_data', handleRefresh);
    return () => window.removeEventListener('PATH_refresh_data', handleRefresh);
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, profileRes] = await Promise.all([
        getProjects(),
        getProfile()
      ]);
      setProjects(projectsRes.data);
      setProfile(profileRes.data);
    } catch (err) {
      console.error("Failed to load projects page data:", err);
    } finally {
      setLoading(false);
    }
  };



  if (loading) return <Loader />;

  const targetRole = profile?.target_role || '';
  
  // Dynamic filter lists
  const domains = ['All', ...new Set(projects.map(p => p.domain))];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // Identify target role matches
  const getIsTargetMatch = (p) => {
    return p.explanation && p.explanation.includes('[TARGET]');
  };

  // Filter projects
  const filteredProjects = projects.filter(p => {
    const isTarget = getIsTargetMatch(p);
    const matchesView = viewMode === 'all' || (viewMode === 'target' && isTarget);
    const matchesDifficulty = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
    const matchesDomain = domainFilter === 'All' || p.domain === domainFilter;
    return matchesView && matchesDifficulty && matchesDomain;
  });

  const handlePrevProject = () => {
    if (!selectedProject || filteredProjects.length <= 1) return;
    const currentIndex = filteredProjects.findIndex(p => p.id === selectedProject.id);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + filteredProjects.length) % filteredProjects.length;
    setSelectedProject(filteredProjects[prevIndex]);
  };

  const handleNextProject = () => {
    if (!selectedProject || filteredProjects.length <= 1) return;
    const currentIndex = filteredProjects.findIndex(p => p.id === selectedProject.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % filteredProjects.length;
    setSelectedProject(filteredProjects[nextIndex]);
  };

  // Calculate HUD statistics
  const targetMatches = projects.filter(getIsTargetMatch);
  const totalTargetCount = targetMatches.length;

  // Average alignment score for target projects
  const averageAlignment = targetMatches.length > 0 
    ? Math.round((targetMatches.reduce((acc, p) => acc + (p.match_score || 0), 0) / targetMatches.length) * 100)
    : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
      
      {/* ─── HUD BANNER ────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-white p-6 md:p-8 rounded-3xl border border-dark-700 shadow-sm">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Left Column: Title & Target Path */}
          <div className="lg:col-span-2 space-y-3 text-left">
            <h1 className="section-title text-4xl mb-1 font-extrabold tracking-tight">Project Labs</h1>
            <p className="text-slate-600 text-sm max-w-xl">
              Construct your engineering portfolio with job-aligned projects tailored directly to your career aims.
            </p>
            {targetRole ? (
              <div className="inline-flex items-center gap-2 bg-slate-50 border border-dark-700 px-4 py-1.5 rounded-2xl">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon-cyan"></span>
                </span>
                <span className="text-xs text-neon-cyan font-bold tracking-wider uppercase">
                  Target Path: {targetRole}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-slate-100 border border-dark-700 px-4 py-1.5 rounded-2xl">
                <span className="text-xs text-slate-500">Aim target role not set. Set one in settings.</span>
              </div>
            )}
          </div>

          {/* Right Column: Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-dark-700 text-center shadow-sm">
              <span className="text-xs text-slate-500 block mb-1">Target Path Alignment</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                {averageAlignment}%
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-dark-700 text-center shadow-sm">
              <span className="text-xs text-slate-500 block mb-1">Target Projects</span>
              <span className="text-2xl font-bold text-emerald-700">
                {totalTargetCount} Available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CONTROLS & FILTERS ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-dark-700 pb-6">
        
        {/* Toggle between target and all */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-dark-700 self-start">
          <button
            onClick={() => setViewMode('target')}
            className={`px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              viewMode === 'target'
                ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-md'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Target Job Matches ({totalTargetCount})
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              viewMode === 'all'
                ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-md'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Explore All ({projects.length})
          </button>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Difficulty Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Difficulty:</span>
            <select
              className="bg-white border border-dark-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-neon-cyan"
              value={difficultyFilter}
              onChange={e => setDifficultyFilter(e.target.value)}
            >
              {difficulties.map(d => <option key={d} value={d} className="bg-white text-slate-800">{d}</option>)}
            </select>
          </div>

          {/* Domain Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Domain:</span>
            <select
              className="bg-white border border-dark-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-neon-purple"
              value={domainFilter}
              onChange={e => setDomainFilter(e.target.value)}
            >
              {domains.map(d => <option key={d} value={d} className="bg-white text-slate-800">{d}</option>)}
            </select>
          </div>
        </div>

      </div>

      {/* ─── PROJECTS GRID ──────────────────────────────────────────── */}
      {filteredProjects.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card text-center py-16">
          <p className="text-slate-500 mb-2">No projects match the selected filters.</p>
          <button 
            onClick={() => { setViewMode('all'); setDifficultyFilter('All'); setDomainFilter('All'); }}
            className="text-xs text-neon-cyan underline hover:text-neon-purple font-semibold"
          >
            Reset Filters
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((p) => {
              const isTargetMatch = getIsTargetMatch(p);

              return (
                <motion.div
                  layout
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className={`glass-card flex flex-col justify-between relative overflow-hidden transition-all duration-300 border cursor-pointer group bg-white ${
                    isTargetMatch 
                      ? 'border-neon-cyan/40 hover:border-neon-cyan shadow-sm hover:shadow-md' 
                      : 'border-dark-700 hover:border-dark-600 shadow-sm'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -6 }}
                >
                  {/* Subtle target alignment glow bar */}
                  {isTargetMatch && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-neon-cyan to-neon-purple" />
                  )}

                  {/* Header info */}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${difficultyColors[p.difficulty]}`}>
                      {p.difficulty}
                    </span>
                    {isTargetMatch ? (
                      <span className="text-[10px] text-neon-cyan font-bold tracking-widest uppercase bg-neon-cyan/10 px-2 py-0.5 rounded-md border border-neon-cyan/20">
                        JOB TRACK MATCH
                      </span>
                    ) : p.match_score > 0 ? (
                      <span className="text-xs text-neon-purple font-bold">{Math.round(p.match_score * 100)}% Match</span>
                    ) : null}
                  </div>

                  {/* Project Name + one-line tagline */}
                  <div className="mb-6">
                    <h3 className="font-bold text-base text-slate-800 tracking-tight group-hover:text-neon-cyan transition-colors line-clamp-2">
                      {p.project_name}
                    </h3>
                    {p.description && (
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                        {p.description}
                      </p>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-3.5 border-t border-dark-700 mt-auto">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">{p.domain}</span>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-neon-cyan group-hover:translate-x-1 transition-transform">
                        Brief ➜
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ─── PROJECT DETAILS MODAL ─────────────────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {selectedProject && (
            <motion.div
              key="project-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
              onClick={() => setSelectedProject(null)}
            >
              <div className="relative max-w-2xl w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                {/* Left Navigation Arrow */}
                {filteredProjects.length > 1 && (
                  <button
                    onClick={handlePrevProject}
                    className="absolute left-2 md:-left-20 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-[#e8e6e1] shadow-lg hover:shadow-xl flex items-center justify-center transition-all focus:outline-none"
                    aria-label="Previous Project"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="relative w-full max-h-[85vh] overflow-y-auto bg-white border border-dark-700 rounded-3xl shadow-2xl p-6 md:p-8 text-left z-10"
                >
                  {/* Target glow top bar */}
                  {selectedProject?.explanation?.includes('[TARGET]') && (
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink" />
                  )}

                  {/* Close Button */}
                  <button 
                    onClick={() => setSelectedProject(null)} 
                    className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 p-2 rounded-xl transition-all"
                  >
                    ✕
                  </button>

                  {/* Metadata tags */}
                  <div className="flex flex-wrap items-center gap-3 mb-4 mt-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${difficultyColors[selectedProject?.difficulty]}`}>
                      {selectedProject?.difficulty}
                    </span>
                    <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase bg-slate-100 border border-dark-700 px-2.5 py-1 rounded">
                      {selectedProject?.domain}
                    </span>
                    {selectedProject?.explanation?.includes('[TARGET]') && (
                      <span className="text-[10px] text-neon-cyan font-bold tracking-widest uppercase bg-neon-cyan/10 border border-neon-cyan/20 px-2.5 py-1 rounded">
                        Target Career Track
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4 tracking-tight drop-shadow-sm">
                    {selectedProject?.project_name}
                  </h2>



                  {/* About */}
                  <div className="mb-6">
                    <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">About this project</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedProject?.overview || selectedProject?.description}
                    </p>
                  </div>

                  {/* What you'll build */}
                  {selectedProject?.features?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2.5">What you'll build</h3>
                      <ul className="space-y-2">
                        {selectedProject.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon-cyan shrink-0" />
                            <span className="leading-relaxed">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skills */}
                  <div className="mb-6">
                    <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2.5">Skills you'll showcase</h3>
                    <div className="flex flex-wrap gap-2">
                      {(selectedProject?.skills || []).map(s => (
                        <span key={s} className="text-xs bg-slate-100 border border-dark-700 px-3 py-1 rounded-xl text-slate-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Resume impact */}
                  {selectedProject?.outcomes?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2.5">Resume impact</h3>
                      <div className="space-y-2">
                        {selectedProject.outcomes.map((o, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-sm text-emerald-800 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-3 leading-relaxed">
                            <svg className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            <span>{o}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Career Alignment / Evaluation Tips */}
                  {selectedProject?.explanation && (
                    <div className="border-t border-dark-700 pt-5">
                      <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">Why this fits your path</h3>
                      <div className="space-y-2.5">
                        {selectedProject.explanation.split(' · ').map((part, idx) => {
                          // Backend tags each clause with a plain-text token; map it to a
                          // clean coloured label (no emoji) and strip the token from the text.
                          let label = "";
                          let bgStyle = "bg-slate-50 border-dark-700";
                          let textColor = "text-slate-700";

                          if (part.includes("[TARGET]")) {
                            label = "Target Role";
                            bgStyle = "bg-neon-cyan/5 border-neon-cyan/15";
                            textColor = "text-neon-cyan font-medium";
                          } else if (part.includes("[MATCH]")) {
                            label = "Your Skills";
                            bgStyle = "bg-emerald-500/5 border-emerald-500/10";
                            textColor = "text-emerald-700";
                          } else if (part.includes("[LEARN]")) {
                            label = "You'll Learn";
                            bgStyle = "bg-neon-purple/5 border-neon-purple/10";
                            textColor = "text-neon-purple";
                          }

                          const cleanText = part.replace(/^\[(TARGET|MATCH|LEARN)\]\s*/, '');

                          return (
                            <div key={idx} className={`text-xs flex items-start gap-3 p-3 border rounded-2xl leading-relaxed ${bgStyle} ${textColor}`}>
                              {label && (
                                <span className="flex-shrink-0 mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-current opacity-70">
                                  {label}
                                </span>
                              )}
                              <span>{cleanText}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Right Navigation Arrow */}
                {filteredProjects.length > 1 && (
                  <button
                    onClick={handleNextProject}
                    className="absolute right-2 md:-right-20 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-[#e8e6e1] shadow-lg hover:shadow-xl flex items-center justify-center transition-all focus:outline-none"
                    aria-label="Next Project"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}
