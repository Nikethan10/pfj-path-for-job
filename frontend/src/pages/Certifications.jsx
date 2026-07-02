import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CERT_DATABASE } from '../data/certificationsData';
import { getProfile } from '../services/profileService';
import { getAvailableRoles } from '../services/skillService';
import Loader from '../components/Loader';

export default function Certifications() {
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('Software Engineer');
  const [priceFilter, setPriceFilter] = useState('All');
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Selected certification for detailed brief modal view
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, rolesRes] = await Promise.all([
          getProfile(),
          getAvailableRoles()
        ]);
        setProfile(profileRes.data);
        setRoles(rolesRes.data);
        if (profileRes.data?.target_role) {
          setSelectedRole(profileRes.data.target_role);
        }
      } catch { }

      // Fetch LocalStorage progress configuration
      try {
        const savedProgress = localStorage.getItem('PATH_certifications_progress');
        if (savedProgress) {
          setProgress(JSON.parse(savedProgress));
        }
      } catch { }

      setLoading(false);
    })();
  }, []);

  const handleUpdateStatus = (certId, status) => {
    const updated = { ...progress, [certId]: status };
    setProgress(updated);
    localStorage.setItem('PATH_certifications_progress', JSON.stringify(updated));
    // Synced status inside the modal as well if active
    if (selectedCert && selectedCert.id === certId) {
      setSelectedCert(prev => ({ ...prev, status }));
    }
  };

  const handlePrevCert = () => {
    if (!selectedCert || filteredCerts.length <= 1) return;
    const currentIndex = filteredCerts.findIndex(c => c.id === selectedCert.id);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + filteredCerts.length) % filteredCerts.length;
    setSelectedCert(filteredCerts[prevIndex]);
  };

  const handleNextCert = () => {
    if (!selectedCert || filteredCerts.length <= 1) return;
    const currentIndex = filteredCerts.findIndex(c => c.id === selectedCert.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % filteredCerts.length;
    setSelectedCert(filteredCerts[nextIndex]);
  };

  if (loading) return <Loader />;

  // Fetch current database items matching target selected trajectory
  const activeCertifications = CERT_DATABASE[selectedRole] || [];

  // Filter based on Free vs Paid exam types
  const filteredCerts = activeCertifications.filter(cert => {
    if (priceFilter === 'All') return true;
    return cert.price === priceFilter;
  });

  // Calculate metrics matching this specific trajectory
  const totalInSelected = activeCertifications.length;
  const completedInSelected = activeCertifications.filter(c => progress[c.id] === 'Completed').length;
  const inProgressInSelected = activeCertifications.filter(c => progress[c.id] === 'In Progress').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8 text-left relative">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold mb-1 tracking-tight">Certifications Recommender</h1>
          <p className="text-xs text-slate-400 font-medium">Verify industry-grade courses & professional credentials to boost your placement resume.</p>
        </div>
      </div>

      {/* Selectors and Filters Card */}
      <div className="glass-card mb-8 p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center shadow-xs">
        {/* Trajectory Dropdown Selector */}
        <div className="w-full md:w-1/2 space-y-1.5">
          <label className="text-[9px] text-slate-400 font-black tracking-widest uppercase">Target Trajectory</label>
          <select 
            className="input-field w-full pl-4 pr-10 py-3 font-semibold text-sm cursor-pointer bg-white"
            value={selectedRole} 
            onChange={e => setSelectedRole(e.target.value)}
          >
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Paid / Free Pricing Filters */}
        <div className="space-y-1.5 shrink-0">
          <label className="text-[9px] text-slate-400 font-black tracking-widest uppercase block mb-1">Pricing Filter</label>
          <div className="flex bg-slate-100 border border-dark-700 rounded-xl p-1 shrink-0">
            {['All', 'Free', 'Paid'].map(filter => (
              <button
                key={filter}
                onClick={() => setPriceFilter(filter)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  priceFilter === filter
                    ? 'bg-white text-slate-800 shadow-xs border border-dark-700'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {filter === 'All' ? 'All Credentials' : filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Certifications Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedRole}-${priceFilter}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {filteredCerts.length === 0 ? (
            <div className="lg:col-span-2 glass-card p-12 text-center text-slate-400 text-sm">
              No certifications match your selected filters. Try switching filters to Free/Paid options.
            </div>
          ) : (
            filteredCerts.map((cert, index) => {
              const status = progress[cert.id] || 'Not Started';
              return (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedCert(cert)}
                  className={`glass-card p-6 shadow-xs flex flex-col justify-between relative overflow-hidden cursor-pointer hover:border-[#166534]/35 hover:-translate-y-0.5 transition-all duration-300 ${
                    status === 'Completed' ? 'border-[#166534]/30 bg-green-50/10' : ''
                  }`}
                >
                  <div>
                    {/* Header tags */}
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{cert.provider}</span>
                        <h3 className="text-base font-extrabold text-slate-800 leading-snug mt-0.5">{cert.name}</h3>
                      </div>
                      
                      {/* Price status badges */}
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border shrink-0 ${
                        cert.price === 'Free'
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-yellow-50 border-yellow-250 text-yellow-755'
                      }`}>
                        {cert.type}
                      </span>
                    </div>

                    {/* Meta specifics */}
                    <div className="flex gap-4 mb-4 text-[10px] text-slate-500 font-bold uppercase">
                      <div className="flex items-center gap-1">
                        <span>⌛</span> {cert.duration}
                      </div>
                      <div className="flex items-center gap-1 border-l border-dark-700 pl-4">
                         {cert.difficulty}
                      </div>
                      <div className="flex items-center gap-1 border-l border-dark-700 pl-4 text-purple-650">
                         {cert.weight}
                      </div>
                    </div>

                    {/* Course description */}
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">{cert.desc}</p>

                    {/* Associated Skills */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {cert.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="text-[9px] font-mono font-bold bg-[#faf8f5] text-slate-650 border border-dark-700 px-2 py-0.5 rounded">
                          {skill}
                        </span>
                      ))}
                      {cert.skills.length > 3 && (
                        <span className="text-[9px] font-mono font-bold text-slate-400 px-1 py-0.5">+{cert.skills.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  {/* Operational controls footer */}
                  <div className="border-t border-dark-700 pt-4 flex justify-between items-center gap-3" onClick={e => e.stopPropagation()}>
                    <span className="text-[10px] tracking-widest text-[#166534] font-black hover:underline cursor-pointer">
                      VIEW DETAILS →
                    </span>
                  </div>

                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>

      {/* Certification Details Brief Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedCert && (() => {
            const status = progress[selectedCert.id] || 'Not Started';
            return (
              <motion.div
                key="cert-modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
                onClick={() => setSelectedCert(null)}
              >
              <div className="relative max-w-2xl w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                {/* Left Navigation Arrow */}
                {filteredCerts.length > 1 && (
                  <button
                    onClick={handlePrevCert}
                    className="absolute left-2 md:-left-20 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-[#e8e6e1] shadow-lg hover:shadow-xl flex items-center justify-center transition-all focus:outline-none"
                    aria-label="Previous Course"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="bg-white w-full rounded-3xl p-6 md:p-8 border border-dark-700 shadow-2xl relative overflow-y-auto max-h-[90vh]"
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedCert(null)}
                    className="absolute top-5 right-5 w-8 h-8 rounded-full border border-dark-700 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all text-sm font-black select-none"
                  >
                    ✕
                  </button>

                  {/* Modal Header */}
                  <div className="border-b border-[#e8e6e1] pb-6 mb-6 text-left">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{selectedCert.provider}</span>
                      <span className="text-slate-300">•</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                        selectedCert.price === 'Free'
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-yellow-50 border-yellow-250 text-yellow-755'
                      }`}>
                        {selectedCert.type}
                      </span>
                    </div>
                    
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 leading-snug">{selectedCert.name}</h2>
                  </div>

                  {/* Modal Grid Columns */}
                  <div className="grid md:grid-cols-3 gap-6 text-left">
                    
                    {/* Left Column: Metadata & Syllabus */}
                    <div className="md:col-span-2 space-y-5">
                      
                      {/* Course Overview */}
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Course Overview</h4>
                        <p className="text-xs text-slate-650 leading-relaxed">{selectedCert.desc}</p>
                      </div>

                      {/* Syllabus Breakdown */}
                      {selectedCert.syllabus && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Syllabus Breakdown</h4>
                          <ul className="space-y-2">
                            {selectedCert.syllabus.map((topic, i) => (
                              <li key={i} className="flex gap-2.5 text-xs text-slate-600 leading-normal">
                                <span className="text-[#166534] font-extrabold select-none">✓</span>
                                <span>{topic}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Prerequisites */}
                      {selectedCert.prerequisites && (
                        <div className="space-y-1">
                          <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Course Prerequisites</h4>
                          <p className="text-xs text-slate-500 leading-normal">{selectedCert.prerequisites}</p>
                        </div>
                      )}

                    </div>

                    {/* Right Column: Career Details & Action Actions */}
                    <div className="md:col-span-1 space-y-6 md:border-l md:border-[#e8e6e1] md:pl-6 flex flex-col justify-between">
                      <div className="space-y-5">
                        
                        {/* Metric Specifications */}
                        <div className="space-y-2.5">
                          <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Course Details</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500">Duration</span>
                              <span className="font-bold text-slate-800">{selectedCert.duration}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2">
                              <span className="text-slate-500">Difficulty</span>
                              <span className="font-bold text-slate-800">{selectedCert.difficulty}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2">
                              <span className="text-slate-500">Impact</span>
                              <span className="font-bold text-purple-650">{selectedCert.weight}</span>
                            </div>
                          </div>
                        </div>

                        {/* Career Value */}
                        <div className="space-y-1">
                          <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Career Value</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{selectedCert.careerImpact}</p>
                        </div>

                        {/* Progress Toggle removed */}

                      </div>

                      {/* Primary Apply Button */}
                      <a
                        href={selectedCert.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center text-xs font-bold text-white bg-[#166534] hover:bg-[#0f4c28] py-3 px-4 rounded-xl shadow-md hover:-translate-y-0.5 transition-all mt-4 flex items-center justify-center gap-1.5"
                      >
                        <span>Apply & Enroll Course</span>
                        <span className="text-xs">↗</span>
                      </a>

                    </div>

                  </div>

                </motion.div>

                {/* Right Navigation Arrow */}
                {filteredCerts.length > 1 && (
                  <button
                    onClick={handleNextCert}
                    className="absolute right-2 md:-right-20 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-[#e8e6e1] shadow-lg hover:shadow-xl flex items-center justify-center transition-all focus:outline-none"
                    aria-label="Next Course"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </motion.div>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}

    </motion.div>
  );
}
