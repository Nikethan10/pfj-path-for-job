import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { compareCareers } from '../services/analyticsService';
import { getAvailableRoles } from '../services/skillService';
import Loader from '../components/Loader';

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  })
};

export default function CareerCompare() {
  const [roles, setRoles] = useState([]);
  const [role1, setRole1] = useState('');
  const [role2, setRole2] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [init, setInit] = useState(true);
  const [activeTab, setActiveTab] = useState('shared');

  useEffect(() => {
    (async () => {
      try {
        const res = await getAvailableRoles();
        setRoles(res.data);
      } catch { }
      setInit(false);
    })();
  }, []);

  const handleCompare = async () => {
    if (!role1 || !role2 || role1 === role2) return alert('Select two different roles');
    setLoading(true);
    try {
      const res = await compareCareers({ role1, role2 });
      setResult(res.data);
      setActiveTab('shared');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to compare career paths');
    }
    setLoading(false);
  };

  if (init) return <Loader />;

  // Compute unique and common lists
  const common = result?.common_skills || [];
  const r1Unique = result ? result.role1_skills.filter(s => !common.includes(s)) : [];
  const r2Unique = result ? result.role2_skills.filter(s => !common.includes(s)) : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8 text-left">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-1 tracking-tight">Career Compare</h1>
        <p className="text-xs text-slate-400 font-medium">Compare competencies, readiness durations, and skill transfers between career paths.</p>
      </div>

      {/* Selectors Card */}
      <div className="glass-card mb-8 p-6 relative overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
          
          {/* Role 1 Selector */}
          <div className="lg:col-span-5 space-y-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-[#166534] font-black tracking-widest uppercase">Career Path A</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#166534]" />
            </div>
            <div className="relative">
              <select 
                className="input-field w-full pl-4 pr-10 py-3 appearance-none font-bold text-sm cursor-pointer bg-white"
                value={role1} 
                onChange={e => setRole1(e.target.value)}
              >
                <option value="">Select Career Path 1...</option>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 text-xs">▼</div>
            </div>
          </div>

          {/* VS Bridge */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center py-2 lg:py-0">
            <motion.div 
              animate={loading ? { rotate: 360 } : {}}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-11 h-11 rounded-full bg-slate-50 border border-dark-700 flex items-center justify-center shadow-sm select-none"
            >
              <span className="text-xs font-black text-slate-800">VS</span>
            </motion.div>
          </div>

          {/* Role 2 Selector */}
          <div className="lg:col-span-5 space-y-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-[#be123c] font-black tracking-widest uppercase">Career Path B</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#be123c]" />
            </div>
            <div className="relative">
              <select 
                className="input-field w-full pl-4 pr-10 py-3 appearance-none font-bold text-sm cursor-pointer bg-white"
                value={role2} 
                onChange={e => setRole2(e.target.value)}
              >
                <option value="">Select Career Path 2...</option>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 text-xs">▼</div>
            </div>
          </div>

        </div>

        {/* Compare Action Button */}
        <button 
          onClick={handleCompare} 
          disabled={loading || !role1 || !role2 || role1 === role2} 
          className={`
            w-full mt-6 py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all duration-300 border
            ${(loading || !role1 || !role2 || role1 === role2)
              ? 'bg-slate-100 border-dark-700 text-slate-400 cursor-not-allowed'
              : 'bg-[#166534] hover:bg-[#0f4c28] text-white border-transparent shadow-sm hover:scale-[1.005]'
            }
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
              COMPARING CAREER PATHS...
            </span>
          ) : (
            <span>Compare Pathways </span>
          )}
        </button>
      </div>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 25 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 25 }}
            className="space-y-6"
          >
            {/* Visual Overlap & Venn Diagram */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Venn Card */}
              <div className="lg:col-span-5 glass-card p-6 flex flex-col items-center justify-center text-center shadow-sm min-h-[300px]">
                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-4">Competency Map</p>
                <div className="w-full relative flex justify-center">
                  <svg viewBox="0 0 320 180" className="w-full max-w-[280px] overflow-visible">
                    {/* Circle 1 - Path A */}
                    <motion.circle 
                      cx="120" 
                      cy="90" 
                      r="60" 
                      fill="rgba(22, 101, 52, 0.04)" 
                      stroke="#166534" 
                      strokeWidth="2" 
                      strokeDasharray="4 2"
                      initial={{ cx: 90, opacity: 0 }}
                      animate={{ cx: 120, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                    />
                    {/* Circle 2 - Path B */}
                    <motion.circle 
                      cx="200" 
                      cy="90" 
                      r="60" 
                      fill="rgba(190, 18, 60, 0.04)" 
                      stroke="#be123c" 
                      strokeDasharray="4 2"
                      strokeWidth="2" 
                      initial={{ cx: 230, opacity: 0 }}
                      animate={{ cx: 200, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                    />
                    
                    {/* Overlap Text */}
                    <motion.g
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <text x="80" y="95" textAnchor="middle" className="text-[10px] font-black fill-[#166534]">
                        {result.role1.split(' ')[0]}
                      </text>
                      <text x="240" y="95" textAnchor="middle" className="text-[10px] font-black fill-[#be123c]">
                        {result.role2.split(' ')[0]}
                      </text>
                      <rect x="135" y="75" width="50" height="30" rx="8" fill="white" stroke="#e8e6e1" strokeWidth="1" />
                      <text x="160" y="94" textAnchor="middle" className="text-xs font-black fill-[#d97706]">
                        {result.overlap_percent}%
                      </text>
                    </motion.g>
                  </svg>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-4">SHARED COMPETENCY INDEX</p>
              </div>

              {/* Compare Metrics List */}
              <div className="lg:col-span-7 glass-card p-6 flex flex-col justify-between shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Transferability Metrics</h3>
                
                <div className="space-y-6">
                  {/* Metric 1 - Overlap Index */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-bold text-slate-800">Overlap Index</span>
                      <span className="text-lg font-black text-[#d97706]">{result.overlap_percent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 p-0.5 border border-dark-700 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.overlap_percent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-gradient-to-r from-[#166534] to-[#be123c] h-1.5 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Metric 2 - Readiness Training Duration comparison */}
                  <div className="grid grid-cols-2 gap-4 border-t border-dark-700 pt-5">
                    <div>
                      <p className="text-[9px] text-[#166534] font-black uppercase tracking-wider mb-1">{result.role1}</p>
                      <p className="text-2xl font-black text-slate-800 leading-none">{result.role1_readiness_weeks} <span className="text-xs text-slate-400 font-bold">Wks</span></p>
                      <p className="text-[9px] text-slate-500 font-medium mt-1.5">Estimated prep timeline based on gaps.</p>
                    </div>
                    <div className="border-l border-dark-700 pl-4">
                      <p className="text-[9px] text-[#be123c] font-black uppercase tracking-wider mb-1">{result.role2}</p>
                      <p className="text-2xl font-black text-slate-800 leading-none">{result.role2_readiness_weeks} <span className="text-xs text-slate-400 font-bold">Wks</span></p>
                      <p className="text-[9px] text-slate-500 font-medium mt-1.5">Estimated prep timeline based on gaps.</p>
                    </div>
                  </div>

                  {/* Metric 3 - Transfer Summary */}
                  <div className="border-t border-dark-700 pt-5 text-left text-xs font-semibold text-slate-650 flex gap-2.5 items-center">
                    <span className="p-2 bg-yellow-50 border border-yellow-250 text-yellow-600 rounded-xl text-lg select-none"></span>
                    <p className="leading-relaxed">
                      By mastering the <span className="text-[#166534] font-bold">{common.length} common skills</span>, you automatically cover <span className="text-[#d97706] font-bold">{Math.round(common.length / Math.max(result.role1_skills.length, 1) * 100)}%</span> of Path A and <span className="text-[#be123c] font-bold">{Math.round(common.length / Math.max(result.role2_skills.length, 1) * 100)}%</span> of Path B requirements.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Side-by-side comparative grid summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Path A summary card */}
              <div className="glass-card border-l-[3px] border-[#166534] p-5 text-left relative overflow-hidden shadow-sm">
                <span className="absolute top-4 right-4 text-[9px] text-slate-400 font-mono font-bold">PATH A</span>
                <p className="text-[9px] text-[#166534] font-black uppercase tracking-widest mb-1.5">Primary Target</p>
                <h4 className="text-xl font-black text-[#166534] leading-tight mb-4">{result.role1}</h4>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>Total Target Skills</span>
                    <span className="font-bold text-slate-800">{result.role1_skills.length}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>Transferable Competencies</span>
                    <span className="font-bold text-[#166534]">{common.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Study Gaps</span>
                    <span className="font-bold text-[#be123c]">{r1Unique.length}</span>
                  </div>
                </div>
              </div>

              {/* Path B summary card */}
              <div className="glass-card border-l-[3px] border-[#be123c] p-5 text-left relative overflow-hidden shadow-sm">
                <span className="absolute top-4 right-4 text-[9px] text-slate-400 font-mono font-bold">PATH B</span>
                <p className="text-[9px] text-[#be123c] font-black uppercase tracking-widest mb-1.5">Secondary Target</p>
                <h4 className="text-xl font-black text-[#be123c] leading-tight mb-4">{result.role2}</h4>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>Total Target Skills</span>
                    <span className="font-bold text-slate-800">{result.role2_skills.length}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>Transferable Competencies</span>
                    <span className="font-bold text-[#be123c]">{common.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Study Gaps</span>
                    <span className="font-bold text-[#be123c]">{r2Unique.length}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Categorized Skills Browser Panel */}
            <div className="glass-card p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-dark-700 pb-4 mb-6 gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Detailed Skills Breakdown</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Explore which skills are shared and which are unique to each path.</p>
                </div>

                {/* Tab Pill Selectors */}
                <div className="flex bg-slate-150 p-1 border border-dark-700 rounded-xl">
                  {[
                    { id: 'shared', label: `Shared (${common.length})` },
                    { id: 'uniqueA', label: `A Unique (${r1Unique.length})` },
                    { id: 'uniqueB', label: `B Unique (${r2Unique.length})` },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-white text-slate-800 shadow-xs border border-dark-700'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Skills List Grid */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="min-h-[120px]"
                >
                  {activeTab === 'shared' && (
                    <div className="space-y-4">
                      {common.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">No common skills shared between these trajectories.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2.5">
                          {common.map(s => (
                            <span 
                              key={s} 
                              className="text-xs font-semibold px-3.5 py-2.5 bg-gradient-to-r from-[#166534]/5 to-[#be123c]/5 border border-[#166534]/15 hover:border-[#166534]/35 text-slate-700 rounded-xl hover:scale-[1.02] transition-all cursor-default select-none flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'uniqueA' && (
                    <div className="space-y-4">
                      {r1Unique.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">All target skills for this path are shared with Path B.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2.5">
                          {r1Unique.map(s => (
                            <span 
                              key={s} 
                              className="text-xs font-semibold px-3.5 py-2.5 bg-[#166534]/5 border border-[#166534]/15 hover:border-[#166534]/35 text-slate-700 rounded-xl hover:scale-[1.02] transition-all cursor-default select-none flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#166534]" />
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'uniqueB' && (
                    <div className="space-y-4">
                      {r2Unique.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">All target skills for this path are shared with Path A.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2.5">
                          {r2Unique.map(s => (
                            <span 
                              key={s} 
                              className="text-xs font-semibold px-3.5 py-2.5 bg-[#be123c]/5 border border-[#be123c]/15 hover:border-[#be123c]/35 text-slate-700 rounded-xl hover:scale-[1.02] transition-all cursor-default select-none flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#be123c]" />
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Shared Explanatory Footer */}
              <div className="border-t border-dark-700 pt-4 mt-6 text-[11px] text-slate-400 leading-normal flex gap-1.5">
                <span>*</span>
                <p>Transferable skills are competencies that appear in both paths. Mastering them simplifies transitioning between roles by shortening roadmap progression timelines.</p>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
