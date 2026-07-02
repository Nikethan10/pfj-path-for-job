import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { motion, AnimatePresence } from 'framer-motion';

const links = [
  { 
    to: '/dashboard', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
      </svg>
    ), 
    label: 'Dashboard' 
  },
  { 
    to: '/skills', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ), 
    label: 'Skills' 
  },
  { 
    to: '/roadmap', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L16 4m0 13V4m0 4L9 7" />
      </svg>
    ), 
    label: 'Roadmap' 
  },
  { 
    to: '/certifications', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    ), 
    label: 'Certifications' 
  },
  { 
    to: '/projects', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ), 
    label: 'Projects' 
  },
  { 
    to: '/analytics', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ), 
    label: 'Analytics' 
  },
  { 
    to: '/resume', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ), 
    label: 'Resume' 
  },
  { 
    to: '/compare', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ), 
    label: 'Compare'
  },
  {
    to: '/badges',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8a3 3 0 100 6 3 3 0 000-6zm-3.6 5.4L7 21l5-2.6L17 21l-1.4-7.6" />
      </svg>
    ),
    label: 'Badges'
  },
  { 
    to: '/jobs', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ), 
    label: 'Jobs' 
  },
  { 
    to: '/interview', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ), 
    label: 'Interview' 
  },
  { 
    to: '/challenges', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ), 
    label: 'Challenges' 
  },
  { 
    to: '/settings', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ), 
    label: 'Settings' 
  },
];

export default function Sidebar({ isExpanded, setIsExpanded, mobileOpen = false, onLinkClick }) {
  const { user, logoutUser } = useAuth();
  const { config, isFeatureEnabled } = useConfig();
  const navigate = useNavigate();

  // Apply admin-controlled feature flags + navigation (labels / order / visibility).
  const navCfg = {};
  (config?.nav || []).forEach((n) => { navCfg[n.path] = n; });
  const displayedLinks = links
    .filter((l) => {
      const key = l.to.replace('/', '');
      const alwaysOn = key === 'dashboard' || key === 'settings';
      const featureOn = alwaysOn || isFeatureEnabled(key);
      return featureOn && navCfg[l.to]?.enabled !== false;
    })
    .map((l) => ({ ...l, label: navCfg[l.to]?.label || l.label, order: navCfg[l.to]?.order ?? 999 }))
    .sort((a, b) => a.order - b.order);

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <motion.aside
      initial={{ width: 80 }}
      animate={{ width: isExpanded ? 256 : 80 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`fixed left-0 top-0 h-screen glass-sidebar z-50 flex flex-col overflow-hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      style={{ boxShadow: '4px 0 25px rgba(0,0,0,0.02), 1px 0 0 rgba(0,0,0,0.04)' }}
    >
      {/* Logo Area */}
      <div className="p-5 border-b border-dark-700 flex items-center justify-start h-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-[#166534] flex items-center justify-center font-black text-white text-base shadow-sm flex-shrink-0 select-none">
            P
          </span>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col whitespace-nowrap overflow-hidden text-left"
              >
                <h1 className="text-sm font-extrabold tracking-wider leading-none text-[#1a1f16]">PATH</h1>
                <span className="text-[8px] text-[#166534] font-bold uppercase tracking-widest leading-none block mt-0.5">Placement And Talent Hub</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav Links List */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {displayedLinks.map((link, idx) => (
          <motion.div
            key={link.to}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.02, duration: 0.25 }}
          >
            <NavLink
              to={link.to}
              onClick={onLinkClick}
              className={({ isActive }) =>
                `group flex items-center px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 relative ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 border border-dark-605 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center w-full">
                    <span className={`text-lg flex-shrink-0 w-6 h-6 flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${isActive ? 'scale-105' : ''}`}>
                      {link.icon}
                    </span>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15 }}
                          className="ml-3 text-[13px] font-bold whitespace-nowrap overflow-hidden text-left"
                        >
                          {link.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Slim Solid Active Indicator Line */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute right-2.5 w-1 h-4 rounded-full bg-[#166534]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* Profile Section & Logout */}
      <div className="p-4 border-t border-dark-700 bg-dark-900/10 flex-shrink-0">
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-dark-700 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-[#166534] flex items-center justify-center text-xs font-bold text-white flex-shrink-0 select-none">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col whitespace-nowrap overflow-hidden text-left"
              >
                <p className="text-[13px] font-bold text-slate-800 leading-tight">{user?.name || 'User'}</p>
                <span className="text-[9px] text-[#166534] font-black tracking-widest uppercase mt-0.5">Online</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full mt-2.5 flex items-center justify-center gap-2.5 text-xs text-gray-400 hover:text-red-500 py-2.5 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all font-bold overflow-hidden"
        >
          <span className="flex-shrink-0 text-sm">←</span>
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
