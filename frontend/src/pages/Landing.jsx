import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans overflow-x-hidden selection:bg-[#0a66c2] selection:text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#e2e8f0] bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1 group">
            <h1 className="text-2xl font-bold tracking-tight text-[#111111]">PATH</h1>
            <span className="w-2.5 h-2.5 rounded-full bg-[#0a66c2] mt-1.5" />
          </Link>
          
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-[#111111] transition-colors">Features</a>
            <a href="#how" className="hover:text-[#111111] transition-colors">How it Works</a>
            <Link to="/contact" className="hover:text-[#111111] transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-[#111111] px-4 py-2 rounded-lg hover:bg-gray-50 transition-all">
              Log in
            </Link>
            <Link to="/signup" className="text-sm font-medium text-white bg-[#111111] hover:bg-gray-900 px-5 py-2.5 rounded-lg shadow-sm transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 lg:pb-24 grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Copy */}
        <div className="lg:col-span-7 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2"
          >
            <span className="w-2 h-2 rounded-full bg-[#0a66c2] animate-pulse" />
            AI-Driven Career Intelligence
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-[#111111]"
          >
            Master your skills.<br />
            Secure <span className="text-[#0a66c2]">your future.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-gray-600 max-w-xl leading-relaxed"
          >
            Analyze your skill gaps, generate highly customized learning roadmaps, and track your placement readiness with precision.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="pt-4 flex flex-wrap gap-4"
          >
            <Link to="/signup" className="bg-[#111111] hover:bg-gray-900 text-white font-semibold text-sm px-8 py-3.5 rounded-xl shadow-sm transition-all inline-flex items-center gap-2">
              Start Your Audit
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
            <Link to="/login" className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold text-sm px-8 py-3.5 rounded-xl shadow-sm transition-all">
              View Roadmaps
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center gap-3 pt-6 text-sm"
          >
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-700">1K+</div>
            </div>
            <span className="font-medium text-gray-600">Students actively improving their placement odds.</span>
          </motion.div>
        </div>

        {/* Right Hero Image / Floating Card */}
        <div className="lg:col-span-5 relative hidden lg:block">
          <div className="aspect-[4/3] rounded-3xl bg-gray-100 border border-gray-200 overflow-hidden relative shadow-inner">
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200" 
              alt="Students collaborating" 
              className="w-full h-full object-cover opacity-90"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent" />
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="absolute -bottom-8 -left-8 bg-[#0f172a] text-white p-8 rounded-2xl shadow-xl max-w-sm border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold leading-tight">Placement Score</h3>
              <span className="text-[#0a66c2] font-black text-2xl">92%</span>
            </div>
            <div className="space-y-3">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[92%]"></div></div>
              <p className="text-xs text-gray-400">You are ready for technical interviews at top-tier companies.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Grid (Features) */}
      <section id="features" className="bg-[#f8fafc] border-t border-gray-200 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-[#111111] mb-4">Everything you need to get hired.</h2>
            <p className="text-gray-500 text-sm leading-relaxed">Stop guessing what skills you need. Our AI infrastructure provides a measurable, data-driven approach to technical interview preparation.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Real-time Skill Gap Analysis', desc: 'Identify exactly what you are missing for your target role.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'text-blue-600', bg: 'bg-blue-50' },
              { title: 'AI-Generated Roadmaps', desc: 'Step-by-step, milestone-driven learning paths dynamically built for you.', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'text-amber-500', bg: 'bg-amber-50' },
              { title: 'Interactive Mock Interviews', desc: 'Practice with text-based technical screenings to sharpen your communication.', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', color: 'text-purple-600', bg: 'bg-purple-50' },
              { title: 'Resume ATS Scanner', desc: 'Audit your resume against strict job descriptions and keywords.', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'text-emerald-600', bg: 'bg-emerald-50' }
            ].map((feat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl flex flex-shrink-0 items-center justify-center mb-6 ${feat.bg}`}>
                  <svg className={`w-6 h-6 ${feat.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={feat.icon} />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-gray-900 mb-2">{feat.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works pipeline */}
      <section id="how" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-gray-200">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-[#111111] tracking-tight">The 4-Step Process</h2>
          <p className="text-gray-500 text-sm mt-3">From configuration to validation in four continuous phases.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Create Target Profile', desc: 'Define your target engineering role and study schedule.', color: 'border-blue-500' },
            { step: '02', title: 'Execute Skill Audit', desc: 'Scan current skills to find knowledge gaps compared to job listings.', color: 'border-blue-600' },
            { step: '03', title: 'Scale Roadmap', desc: 'Follow structured, interactive milestone nodes and references.', color: 'border-[#0f172a]' },
            { step: '04', title: 'Confirm Placement Fit', desc: 'Track your placement readiness score and pass mock interviews.', color: 'border-green-500' }
          ].map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.08 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 relative hover:shadow-md transition-all text-left"
            >
              <div className="absolute top-4 right-4 font-mono font-black text-4xl text-gray-100 select-none">
                {item.step}
              </div>
              <div className={`w-8 h-8 rounded-lg border-l-[3px] ${item.color} flex items-center justify-center font-bold text-gray-700 bg-gray-50 text-xs font-mono mb-6 shadow-sm`}>
                S{item.step}
              </div>
              <h4 className="text-sm font-extrabold text-gray-900 mb-2 tracking-tight">{item.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed relative z-10">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA Strip */}
      <section className="bg-white border-t border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-[#f8fafc] border border-gray-200 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0f172a 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="relative z-10 max-w-xl">
              <h3 className="text-2xl font-extrabold text-gray-900">Ready to secure your next role?</h3>
              <p className="text-sm text-gray-500 mt-2">Get instant analysis of your skills, gap roadmaps, and resume ATS compatibility.</p>
            </div>
            <Link to="/signup" className="relative z-10 flex-shrink-0 bg-[#0f172a] hover:bg-[#1e293b] text-white text-sm font-bold px-8 py-4 rounded-xl shadow-md transition-all flex items-center gap-2 hover:-translate-y-0.5 active:scale-95">
              Create Your Free Account
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">PATH.</span>
            <span>© 2026 Placement And Talent Hub</span>
          </div>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-gray-900">Privacy</Link>
            <Link to="/terms" className="hover:text-gray-900">Terms</Link>
            <Link to="/contact" className="hover:text-gray-900">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
