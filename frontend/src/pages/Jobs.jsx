import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getJobs } from '../services/jobService';
import Loader from '../components/Loader';

// Match score color helpers – using natural, organic palette
const getMatchGradient = (percent) => {
  if (percent >= 90) return 'from-emerald-500 to-green-600';
  if (percent >= 70) return 'from-teal-500 to-emerald-600';
  if (percent >= 50) return 'from-amber-400 to-orange-500';
  return 'from-slate-400 to-slate-500';
};

const getMatchColor = (percent) => {
  if (percent >= 90) return 'text-emerald-600';
  if (percent >= 70) return 'text-teal-600';
  if (percent >= 50) return 'text-amber-600';
  return 'text-slate-500';
};

const getMatchBg = (percent) => {
  if (percent >= 90) return 'bg-emerald-50 border-emerald-200';
  if (percent >= 70) return 'bg-teal-50 border-teal-200';
  if (percent >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-slate-50 border-slate-200';
};

const getCompanyLogo = (name) => {
  // Monogram initials -- clean, professional, no emoji.
  if (!name) return '';
  const words = name.replace(/&/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export default function Jobs() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [matchFilter, setMatchFilter] = useState('All');
  const [selectedJob, setSelectedJob] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState([]);

  const handleApply = (jobId) => {
    if (appliedJobs.includes(jobId)) return;
    setAppliedJobs(prev => [...prev, jobId]);
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await getJobs();
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) return <Loader />;

  const filteredJobs = data?.jobs?.filter(job => {
    // 1. Search term filter
    const matchesSearch = 
      job.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.required_skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

    // 2. Category filter
    const matchesCategory = 
      categoryFilter === 'All' || 
      job.category === categoryFilter;

    // 3. Match score filter
    let matchesScore = true;
    if (matchFilter === 'High') {
      matchesScore = job.match_percentage >= 70;
    } else if (matchFilter === 'Good') {
      matchesScore = job.match_percentage >= 50 && job.match_percentage < 70;
    } else if (matchFilter === 'Low') {
      matchesScore = job.match_percentage < 50;
    }

    return matchesSearch && matchesCategory && matchesScore;
  }) || [];

  const handlePrevJob = () => {
    if (!selectedJob || filteredJobs.length <= 1) return;
    const currentIndex = filteredJobs.findIndex(j => j.id === selectedJob.id);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + filteredJobs.length) % filteredJobs.length;
    setSelectedJob(filteredJobs[prevIndex]);
  };

  const handleNextJob = () => {
    if (!selectedJob || filteredJobs.length <= 1) return;
    const currentIndex = filteredJobs.findIndex(j => j.id === selectedJob.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % filteredJobs.length;
    setSelectedJob(filteredJobs[nextIndex]);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="section-title text-3xl mb-1"> Job & Internship Matcher</h1>
          <p className="text-slate-500">Real-time matching against premium tech roles based on your verified skills.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 mb-1">Your Acquired Skills</p>
          <div className="flex gap-2 justify-end">
            <span className="text-xl font-bold text-neon-cyan">{data?.user_skills?.length || 0}</span>
            <span className="text-slate-500 self-end">skills</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card mb-6 p-4 shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg></span>
            <input
              type="text"
              placeholder="Search by role, company, or skill..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="All">All Categories</option>
              <option value="Software">Software & Web Development</option>
              <option value="AI/ML">AI & Data Science</option>
              <option value="ECE/VLSI">Electronics & Embedded/VLSI</option>
              <option value="Mechanical">Mechanical & Robotics</option>
              <option value="Security">Cyber Security</option>
            </select>
          </div>

          {/* Match Score Dropdown */}
          <div>
            <select
              value={matchFilter}
              onChange={e => setMatchFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="All">All Match Percentages</option>
              <option value="High">High Match (70%+)</option>
              <option value="Good">Good Match (50% - 69%)</option>
              <option value="Low">Needs Skill Building (&lt;50%)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-8">
        {filteredJobs.length === 0 ? (
          <div className="glass-card text-center py-16">
            <p className="text-5xl mb-4"></p>
            <p className="text-slate-500">No jobs match your current search/filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredJobs.map((job, index) => (
              <motion.div 
                key={job.id} 
                onClick={() => setSelectedJob(job)}
                className="glass-card relative overflow-hidden group hover:border-dark-600 cursor-pointer hover:-translate-y-0.5 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Left accent bar based on match */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${getMatchGradient(job.match_percentage)}`} />

                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-dark-700 flex items-center justify-center text-2xl font-black text-slate-700 select-none">
                      {getCompanyLogo(job.company)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 group-hover:text-neon-cyan transition-colors flex flex-wrap items-center gap-2">
                        {job.role}
                        {job.category && (
                          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border border-neon-cyan/20 bg-neon-cyan/10 text-neon-cyan">
                            {job.category}
                          </span>
                        )}
                      </h2>
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        <span className="font-medium text-slate-700">{job.company}</span>
                        <span>•</span>
                        <span>{job.location}</span>
                        <span>•</span>
                        <span className="text-neon-purple font-medium">{job.salary_range}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Circular Match Badge */}
                  <div className="text-right flex flex-col items-end">
                    <div className="relative flex items-center justify-center w-14 h-14">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-200" />
                        <circle 
                          cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 24} 
                          strokeDashoffset={2 * Math.PI * 24 * (1 - job.match_percentage / 100)} 
                          className={`${getMatchColor(job.match_percentage)} transition-all duration-1000 ease-out`} 
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className={`absolute text-sm font-bold ${getMatchColor(job.match_percentage)}`}>
                        {job.match_percentage}%
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Match</span>
                  </div>
                </div>

                <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">{job.description}</p>

                <div className="grid grid-cols-2 gap-4 border-t border-dark-700 pt-4">
                  {/* Required Skills (Matched) */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.slice(0, 3).map(skill => {
                        const hasSkill = data.user_skills.map(s => s.toLowerCase()).includes(skill.toLowerCase());
                        return (
                          <span 
                            key={skill} 
                            className={`text-xs px-2 py-1 rounded border ${
                              hasSkill 
                                ? 'bg-green-50 border-green-300 text-green-700' 
                                : 'bg-slate-50 border-dark-700 text-slate-500'
                            }`}
                          >
                            {hasSkill && '✓ '}{skill}
                          </span>
                        );
                      })}
                      {job.required_skills.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-bold self-center">+{job.required_skills.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  {/* Skill Gaps (To Learn) */}
                  <div className="border-l border-dark-700 pl-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Skill Gaps</h3>
                    {job.missing_skills.length === 0 ? (
                      <div className="flex items-center gap-2 text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 w-fit">
                        <span className="text-green-700"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></span>
                        <span className="text-xs font-bold">100% Match!</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {job.missing_skills.slice(0, 2).map(skill => (
                          <span key={skill} className="text-xs px-2 py-1 rounded bg-red-50 border border-red-200 text-red-600">
                             {skill}
                          </span>
                        ))}
                        {job.missing_skills.length > 2 && (
                          <span className="text-[10px] text-slate-400 font-bold self-center">+{job.missing_skills.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Action */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 pointer-events-none">
                  <span className="text-neon-cyan text-xs font-bold tracking-widest drop-shadow-sm opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 uppercase">
                    {job.match_percentage >= 70 ? 'High Match - Click to view brief' : 'Study Gaps - Click to view brief'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ─── JOB DETAILS MODAL ───────────────────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {selectedJob && (
            <motion.div
              key="job-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
              onClick={() => setSelectedJob(null)}
            >
              <div className="relative max-w-2xl w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                {/* Left Navigation Arrow */}
                {filteredJobs.length > 1 && (
                  <button
                    onClick={handlePrevJob}
                    className="absolute left-2 md:-left-20 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-[#e8e6e1] shadow-lg hover:shadow-xl flex items-center justify-center transition-all focus:outline-none"
                    aria-label="Previous Job"
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
                  {/* Close Button */}
                  <button 
                    onClick={() => {
                      console.log("Closing job modal via close button");
                      setSelectedJob(null);
                    }} 
                    className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 p-2 rounded-xl transition-all"
                  >
                    ✕
                  </button>

                  {/* Header: Logo, Company & Role */}
                  <div className="flex items-center gap-4 mb-6 mt-2">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-dark-700 flex items-center justify-center text-3xl font-black text-slate-700 select-none shadow-xs">
                      {getCompanyLogo(selectedJob.company)}
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">{selectedJob.role}</h2>
                      <p className="text-sm font-bold text-slate-500 mt-0.5">{selectedJob.company}</p>
                    </div>
                  </div>

                  {/* Quick Specs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 border-b border-dark-700 pb-6">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-dark-700">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Location</span>
                      <span className="text-xs font-extrabold text-slate-800">{selectedJob.location}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-dark-700">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Employment Type</span>
                      <span className="text-xs font-extrabold text-slate-800">{selectedJob.type}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-dark-700">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Salary Range</span>
                      <span className="text-xs font-extrabold text-neon-purple">{selectedJob.salary_range}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-dark-700">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Category</span>
                      <span className="text-xs font-extrabold text-neon-cyan">{selectedJob.category}</span>
                    </div>
                  </div>

                  {/* Matching Analytics */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 border border-dark-700 rounded-2xl p-5 mb-6">
                    <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-200" />
                        <circle 
                          cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 34} 
                          strokeDashoffset={2 * Math.PI * 34 * (1 - selectedJob.match_percentage / 100)} 
                          className={`${getMatchColor(selectedJob.match_percentage)} transition-all duration-1000 ease-out`} 
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className={`absolute text-base font-extrabold ${getMatchColor(selectedJob.match_percentage)}`}>
                        {selectedJob.match_percentage}%
                      </span>
                    </div>

                    <div className="text-left space-y-1">
                      <h4 className="text-sm font-bold text-slate-800">Verified Skill Compatibility</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {selectedJob.match_percentage >= 70
                          ? "Excellent Match! You have acquired almost all key tools and conceptual capabilities required for this role."
                          : selectedJob.match_percentage >= 50
                            ? "Good Match! You possess a solid foundation but acquiring a few more missing skill modules will secure your placement advantage."
                            : "Skill Building Recommended. Explore targeted learning modules in your active skills roadmap to match this profile."}
                      </p>
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="mb-6">
                    <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Role Overview & Scope</h3>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 border border-dark-700 p-4 rounded-2xl">
                      {selectedJob.description}
                    </p>
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Required Skills */}
                    <div>
                      <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2.5">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {(selectedJob.required_skills || []).map(skill => {
                          const hasSkill = (data?.user_skills || []).map(s => s.toLowerCase()).includes(skill.toLowerCase());
                          return (
                            <span 
                              key={skill} 
                              className={`text-xs px-2.5 py-1.5 rounded-xl border flex items-center gap-1 ${
                                hasSkill 
                                  ? 'bg-green-50 border-green-300 text-green-700 font-medium' 
                                  : 'bg-slate-50 border-dark-700 text-slate-500'
                              }`}
                            >
                              <span>{hasSkill ? '✓' : '•'}</span>
                              <span>{skill}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Gap analysis */}
                    <div>
                      <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2.5">Skill Gap Breakdown</h3>
                      {(selectedJob.missing_skills || []).length === 0 ? (
                        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-2xl">
                          <span className="text-green-700"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></span>
                          <span className="text-xs font-bold">100% Prepared for placement!</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {(selectedJob.missing_skills || []).map(skill => (
                            <span key={skill} className="text-xs px-2.5 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center gap-1">
                              
                              <span>{skill}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action CTA Footer */}
                  <div className="border-t border-dark-700 pt-5 mt-6 flex flex-wrap justify-end gap-3">
                    <button 
                      onClick={() => setSelectedJob(null)}
                      className="px-5 py-2.5 border border-dark-700 text-slate-650 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
                    >
                      Close Brief
                    </button>
                    
                    {selectedJob.match_percentage < 70 && (
                      <a 
                        href="/skills"
                        className="px-6 py-2.5 bg-gradient-to-r from-neon-purple to-neon-pink hover:-translate-y-0.5 text-white rounded-xl text-xs font-bold transition-all shadow-md text-center flex items-center gap-1.5"
                      >
                        <span>Learn Missing Skills</span>
                      </a>
                    )}

                    <button 
                      onClick={() => handleApply(selectedJob.id)}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                        appliedJobs.includes(selectedJob.id)
                          ? 'bg-emerald-600 text-white cursor-default' 
                          : 'bg-[#166534] hover:bg-[#0f4c28] text-white hover:-translate-y-0.5'
                      }`}
                    >
                      {appliedJobs.includes(selectedJob.id) ? (
                        <>
                          <span>Applied Successfully</span>
                          <span>✓</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Application via PATH</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Right Navigation Arrow */}
                {filteredJobs.length > 1 && (
                  <button
                    onClick={handleNextJob}
                    className="absolute right-2 md:-right-20 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-[#e8e6e1] shadow-lg hover:shadow-xl flex items-center justify-center transition-all focus:outline-none"
                    aria-label="Next Job"
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
