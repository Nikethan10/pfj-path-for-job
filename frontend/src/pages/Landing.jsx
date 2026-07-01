import { useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfig } from '../context/ConfigContext';

const HeroScene = lazy(() => import('../components/HeroScene'));

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }
  })
};

const roleData = {
  se: {
    title: 'Software Engineer',
    score: 84,
    skills: [
      { name: 'React & State Architecture', status: 'matched' },
      { name: 'Node.js REST Services', status: 'matched' },
      { name: 'System Design & Scalability', status: 'gap' }
    ],
    project: {
      title: 'Real-time Event Broker',
      desc: 'Build a high-throughput event hub utilizing WebSockets and Redis Streams.',
      tags: ['Redis', 'WebSockets', 'Docker']
    }
  },
  pm: {
    title: 'Product Manager',
    score: 72,
    skills: [
      { name: 'Agile & Product Specs', status: 'matched' },
      { name: 'A/B Testing & Funnel Analysis', status: 'gap' },
      { name: 'SQL & Data Instrumentation', status: 'matched' }
    ],
    project: {
      title: 'Conversion Spec Ledger',
      desc: 'Formulate comprehensive PRDs and telemetry metrics for checkouts.',
      tags: ['Figma', 'Amplitude', 'SQL']
    }
  },
  ds: {
    title: 'Data Scientist',
    score: 79,
    skills: [
      { name: 'Python & Pandas Pipelines', status: 'matched' },
      { name: 'Machine Learning Classification', status: 'matched' },
      { name: 'Deep Learning & PyTorch', status: 'gap' }
    ],
    project: {
      title: 'Customer Churn Predictor',
      desc: 'Train an ensemble ML pipeline with feature engineering.',
      tags: ['Scikit-Learn', 'Pandas', 'XGBoost']
    }
  }
};

export default function Landing() {
  const { config } = useConfig();
  const hero = config?.content?.hero || {};
  const [activeRole, setActiveRole] = useState('se');
  const activeData = roleData[activeRole];
  const [enable3D] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(min-width: 1024px)').matches &&
      !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1e1816] relative overflow-hidden selection:bg-[#9a3412] selection:text-white font-sans">
      {/* Subtle static background accents (replaces the old animated particle canvas) */}
      <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-35 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(154, 52, 18, 0.09) 0%, transparent 70%)' }} />
      <div className="absolute top-[20%] left-[-15%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(180, 83, 9, 0.07) 0%, transparent 70%)' }} />

      {/* Tasteful 3D accent (desktop only, respects reduced-motion) */}
      {enable3D && (
        <div className="absolute top-24 right-0 w-[46%] h-[520px] opacity-40 pointer-events-none hidden lg:block">
          <Suspense fallback={null}>
            <HeroScene />
          </Suspense>
        </div>
      )}

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#e8e6e1] bg-white/75 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="w-9 h-9 rounded-xl bg-[#9a3412] flex items-center justify-center font-black text-white text-base shadow-sm group-hover:scale-105 transition-transform">
              P
            </span>
            <div>
              <h1 className="text-lg font-extrabold tracking-wider leading-none text-[#1e1816]">PFJ</h1>
              <span className="text-[9px] text-[#9a3412] font-bold uppercase tracking-widest leading-none block mt-0.5">Path For Job</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs font-semibold text-stone-600 hover:text-[#9a3412] px-4 py-2 rounded-xl hover:bg-stone-100/50 transition-all">
              Login
            </Link>
            <Link to="/signup" className="text-xs font-bold text-white bg-[#9a3412] hover:bg-[#7c2d12] px-5 py-2.5 rounded-xl shadow-sm hover:-translate-y-0.5 active:scale-[0.98] transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24 grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Copy */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#9a3412]/20 bg-[#9a3412]/5 text-xs font-semibold text-[#9a3412]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9a3412] animate-pulse" />
              Real-Time Placement Diagnostics
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-[#1e1816]"
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
          >
            {hero.title ? hero.title : (
              <>
                Stop Guessing Your Career.<br />
                <span className="gradient-text bg-gradient-to-r from-[#7c2d12] via-[#9a3412] to-[#b45309] bg-clip-text text-transparent">
                  Start Navigating It.
                </span>
              </>
            )}
          </motion.h1>

          <motion.p
            className="text-base md:text-lg text-stone-600 max-w-xl leading-relaxed font-normal"
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
          >
            {hero.subtitle || 'PFJ maps your skills, designs study roadmaps, recommends projects, and audits your ATS fit against market standards.'}
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4 pt-2"
            variants={fadeUp} initial="hidden" animate="visible" custom={3}
          >
            <Link to="/signup" className="text-sm font-semibold text-white bg-[#9a3412] hover:bg-[#7c2d12] py-3.5 px-8 rounded-xl shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all">
              {hero.primaryCta || 'Build Your Roadmap'}
            </Link>
            <a href="#how" className="text-sm font-semibold text-stone-600 bg-white border border-[#e8e6e1] hover:bg-stone-50 py-3.5 px-8 rounded-xl hover:-translate-y-0.5 transition-all">
              {hero.secondaryCta || 'How It Works'}
            </a>
          </motion.div>

          {/* Mini Statistics Row */}
          <motion.div
            className="grid grid-cols-3 gap-6 pt-8 border-t border-[#e8e6e1] max-w-lg"
            variants={fadeUp} initial="hidden" animate="visible" custom={4}
          >
            {[
              ['5+', 'Target Tracks', 'border-[#9a3412]'],
              ['40+', 'Skills Cataloged', 'border-[#b45309]'],
              ['82%', 'Avg. Readiness Score', 'border-[#7c2d12]']
            ].map(([number, label, accentBorder]) => (
              <div key={label} className={`border-l-[3px] ${accentBorder} pl-4`}>
                <p className="text-2xl font-black text-[#1e1816] tracking-tight">{number}</p>
                <p className="text-[11px] text-stone-500 font-medium leading-tight mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Columns: Interactive Preview Widget */}
        <div className="lg:col-span-6 relative flex justify-center w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-[460px] bg-white border border-[#e8e6e1] rounded-3xl p-6 shadow-xl flex flex-col justify-between relative z-10"
            style={{ boxShadow: '0 20px 40px -15px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)' }}
          >
            {/* Top Widget Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-[#e8e6e1]">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7c2d12]/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#b45309]/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#9a3412]/20" />
              </div>
              <span className="text-[9px] tracking-widest text-stone-400 font-mono font-bold">CAREER_BLUEPRINT_SIMULATOR</span>
            </div>

            {/* Interactive Tabs */}
            <div className="flex gap-2 p-1 bg-stone-100/80 rounded-xl mt-4">
              {Object.keys(roleData).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveRole(key)}
                  className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${
                    activeRole === key
                      ? 'bg-white text-[#9a3412] shadow-sm'
                      : 'text-[#57534e] hover:text-stone-800'
                  }`}
                >
                  {roleData[key].title.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Dynamic Dashboard Simulation */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 items-center justify-center py-6">
              {/* Circular Gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
                <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="#f5f2eb" strokeWidth="7.5" fill="none" />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="#9a3412"
                    strokeWidth="7.5"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ strokeDasharray: 264, strokeDashoffset: 264 }}
                    animate={{ strokeDashoffset: 264 - (264 * activeData.score) / 100 }}
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                  />
                </svg>
                <div className="text-center z-10">
                  <motion.span 
                    key={activeData.score}
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl font-black text-[#1e1816] tracking-tight block"
                  >
                    {activeData.score}%
                  </motion.span>
                  <span className="text-[8px] text-[#9a3412] font-black tracking-widest uppercase block mt-0.5">READINESS</span>
                </div>
              </div>

              {/* Skills Analysis */}
              <div className="w-full space-y-2 text-left">
                <p className="text-[10px] uppercase font-bold tracking-wider text-stone-450">Skill Diagnostic</p>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {activeData.skills.map((skill, index) => (
                      <motion.div
                        key={skill.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-2 text-xs font-semibold text-stone-750 bg-[#faf8f5] px-3 py-1.5 rounded-lg border border-[#e8e6e1]/70"
                      >
                        {skill.status === 'matched' ? (
                          <svg className="w-3.5 h-3.5 text-[#9a3412] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-[#b45309] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                        <span className="truncate">{skill.name}</span>
                        {skill.status === 'gap' && (
                          <span className="ml-auto text-[9px] bg-[#b45309]/10 text-[#b45309] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">GAP</span>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Dynamic Target Project Preview */}
            <div className="bg-[#faf8f5]/80 border border-[#e8e6e1] rounded-2xl p-4 text-left space-y-2 mt-2">
              <span className="text-[9px] font-bold tracking-widest text-[#9a3412] bg-[#9a3412]/5 border border-[#9a3412]/15 px-2 py-0.5 rounded-md uppercase">Matched Resume Project</span>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeData.project.title}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-sm font-bold text-stone-850">{activeData.project.title}</p>
                  <p className="text-[11px] text-stone-500 mt-1 leading-normal">{activeData.project.desc}</p>
                  <div className="flex gap-1.5 mt-3">
                    {activeData.project.tags.map(t => (
                      <span key={t} className="text-[9px] font-mono font-bold bg-white text-stone-600 border border-[#e8e6e1] px-2 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer diagnostics simulation bar */}
            <div className="pt-4 mt-4 border-t border-[#e8e6e1] flex justify-between items-center text-[9px] text-stone-400 font-mono">
              <span>MAPPED_NODES: {activeData.skills.length + 8}</span>
              <span className="text-[#9a3412] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9a3412] animate-pulse" />
                SIMULATOR LIVE
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison Section (The Outdated Way vs The PFJ Way) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-[#e8e6e1]">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-[#1e1816] tracking-tight">The Placement Search, Reimagined.</h2>
          <p className="text-stone-500 text-sm mt-3 leading-relaxed">Generic tutorials and speculative resumes are a bottleneck. Here is how PFJ changes the pipeline.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Outdated Side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#faf8f5]/40 border border-[#78716c]/20 hover:border-[#78716c]/40 rounded-3xl p-8 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-lg"></span>
                <h3 className="text-lg font-bold text-stone-500 tracking-tight">The Outdated Way</h3>
              </div>
              <ul className="space-y-4 text-left">
                {[
                  'Stuck in tutorial hell, earning random certificates.',
                  'Static, generic roadmaps that ignore your skill level.',
                  'Guesswork projects that fail ATS resume filters.',
                  'No metric indicating if you are ready to pass interviews.'
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-xs font-medium text-[#78716c] leading-normal">
                    <span className="text-stone-400 font-bold text-sm select-none">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-stone-200 text-left text-[11px] font-mono text-stone-400 font-semibold">
              SPECULATIVE OUTCOMES & WASTED EFFORT
            </div>
          </motion.div>

          {/* Sienna Side - The PFJ Way */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white border border-[#9a3412]/25 hover:border-[#9a3412]/50 rounded-3xl p-8 transition-all flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-10 h-10 rounded-xl bg-[#9a3412]/5 border border-[#9a3412]/20 flex items-center justify-center text-lg"></span>
                <h3 className="text-lg font-bold text-[#9a3412] tracking-tight">The PFJ Pathway</h3>
              </div>
              <ul className="space-y-4 text-left">
                {[
                  'Direct skill diagnostics mapping exact gap vectors.',
                  'Personalized study roadmaps scaled to your weekly schedule.',
                  'Curated resume projects matching target job stacks.',
                  'Real-time readiness score measuring your placement fit.'
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-xs font-semibold text-stone-700 leading-normal">
                    <svg className="w-4 h-4 text-[#9a3412] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-[#9a3412]/10 text-left text-[11px] font-mono text-[#9a3412] font-bold">
              DATA-BACKED PROGRESSION & SYSTEMATIC PLACEMENT
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature pillars */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-[#e8e6e1] bg-white/40">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-[#1e1816] tracking-tight">Systematic Job Prep</h2>
          <p className="text-stone-500 text-sm mt-3 leading-relaxed">Integrated features designed to help you prepare, practice, and secure jobs.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'AI Skill Analysis',
              desc: 'Map your skills against target roles to identify immediate gap areas.',
              color: 'rgba(154, 52, 18, 0.05)',
              border: '#9a3412/20',
              text: '#9a3412',
              svg: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )
            },
            {
              title: 'Dynamic Roadmaps',
              desc: 'Custom milestones that scale to your profile and weekly study hours.',
              color: 'rgba(217, 119, 6, 0.05)',
              border: '#d97706/20',
              text: '#d97706',
              svg: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              )
            },
            {
              title: 'Adaptive Coding Challenges',
              desc: 'Solve algorithmic challenges directly mapped to your target milestones.',
              color: 'rgba(180, 83, 9, 0.05)',
              border: '#b45309/20',
              text: '#b45309',
              svg: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              )
            },
            {
              title: 'Interactive Mock Interviews',
              desc: 'Conduct text mock interviews to prepare for technical screenings.',
              color: 'rgba(120, 113, 108, 0.05)',
              border: 'rgba(120, 113, 108, 0.2)',
              text: '#78716c',
              svg: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )
            },
            {
              title: 'Resume ATS Scanner',
              desc: 'Audit your resume against job specifications to improve alignments.',
              color: 'rgba(124, 45, 18, 0.05)',
              border: 'rgba(124, 45, 18, 0.2)',
              text: '#7c2d12',
              svg: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )
            },
            {
              title: 'Project Recommendations',
              desc: 'Get verified, portfolio-grade project repositories tailored to your stack.',
              color: 'rgba(41, 37, 36, 0.05)',
              border: 'rgba(41, 37, 36, 0.2)',
              text: '#292524',
              svg: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )
            }
          ].map((feat, idx) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, duration: 0.5 }}
              className="bg-white border border-[#e8e6e1] rounded-2xl p-6 hover:shadow-md hover:border-[#9a3412]/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between text-left"
            >
              <div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center border mb-5"
                  style={{ backgroundColor: feat.color, borderColor: feat.border, color: feat.text }}
                >
                  {feat.svg}
                </div>
                <h4 className="text-base font-bold text-stone-850 mb-2">{feat.title}</h4>
                <p className="text-xs text-stone-500 leading-relaxed">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works pipeline */}
      <section id="how" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-[#e8e6e1]">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-[#1e1816] tracking-tight">The 4-Step Process</h2>
          <p className="text-stone-500 text-sm mt-3">From configuration to validation in four continuous phases.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Create Target Profile',
              desc: 'Define your target engineering role and weekly study schedule.',
              color: 'border-[#9a3412]'
            },
            {
              step: '02',
              title: 'Execute Skill Audit',
              desc: 'Scan current skills to find knowledge gaps compared to listings.',
              color: 'border-[#b45309]'
            },
            {
              step: '03',
              title: 'Scale Roadmap Node',
              desc: 'Follow structured, interactive milestone nodes and references.',
              color: 'border-[#7c2d12]'
            },
            {
              step: '04',
              title: 'Confirm Placement Fit',
              desc: 'Track your placement readiness score and pass mock interviews.',
              color: 'border-[#57534e]'
            }
          ].map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
              className="bg-white border border-[#e8e6e1] rounded-2xl p-6 relative hover:shadow-sm hover:border-stone-300 transition-all text-left"
            >
              <div className="absolute top-4 right-4 font-mono font-black text-4xl text-stone-100 select-none">
                {item.step}
              </div>
              <div className={`w-8 h-8 rounded-lg border-l-[3px] ${item.color} flex items-center justify-center font-bold text-stone-400 bg-[#faf8f5] text-xs font-mono mb-6 shadow-sm`}>
                S{item.step}
              </div>
              <h4 className="text-sm font-extrabold text-stone-800 mb-2 tracking-tight">{item.title}</h4>
              <p className="text-xs text-stone-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-white border border-[#e8e6e1] rounded-3xl p-10 md:p-14 text-center relative overflow-hidden shadow-lg flex flex-col items-center justify-center"
          style={{ boxShadow: '0 25px 50px -15px rgba(0,0,0,0.03)' }}
        >
          {/* Subtle gradient pattern in CTA */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #9a3412 1px, transparent 0)', backgroundSize: '16px 16px' }} />

          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-[#1e1816] tracking-tight">
            Ready to secure your next role?
          </h2>
          <p className="text-stone-500 mb-8 max-w-lg text-sm leading-relaxed">
            Get instant analysis of your skills, gap roadmaps, and resume ATS compatibility.
          </p>
          <Link
            to="/signup"
            className="text-sm font-bold text-white bg-[#9a3412] hover:bg-[#7c2d12] py-4 px-10 rounded-xl shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all inline-block"
          >
            Create Your Free Account
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#e8e6e1]/70 bg-white py-12 text-center text-stone-400 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-medium">© 2026 PFJ — Path For Job. Designed for clear progression. </p>
          <div className="flex gap-6 text-[10px]">
            <a href="#" className="hover:text-stone-600">Privacy Policy</a>
            <a href="#" className="hover:text-stone-600">Terms of Service</a>
            <a href="#" className="hover:text-stone-600">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
