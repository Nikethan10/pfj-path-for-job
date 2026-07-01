import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BotAssistant from '../components/BotAssistant';
import Logo from '../components/Logo';
import { motion } from 'framer-motion';

export default function DashboardLayout() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const openMobile = () => { setMobileOpen(true); setIsExpanded(true); };
  const closeMobile = () => { setMobileOpen(false); setIsExpanded(false); };

  return (
    <div className="min-h-screen bg-dark-900 bg-grid relative overflow-hidden">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-40 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-4">
        <button aria-label="Open menu" onClick={openMobile} className="p-2 -ml-2 text-slate-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Logo size={28} withWordmark />
        <span className="w-6" />
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={closeMobile} aria-hidden="true" />
      )}

      {/* Desktop sidebar (hover rail) */}
      <div className="hidden md:block">
        <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      </div>

      {/* Mobile sidebar (slide-over drawer) */}
      <div className="md:hidden">
        <Sidebar
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          mobileOpen={mobileOpen}
          onLinkClick={closeMobile}
        />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 min-h-screen p-5 sm:p-6 md:p-8 pt-20 md:pt-8 ml-0 md:ml-20"
      >
        <Outlet />
      </motion.main>

      <BotAssistant />
    </div>
  );
}
