import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BotAssistant from '../components/BotAssistant';
import { motion } from 'framer-motion';

export default function DashboardLayout() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-dark-900 bg-grid relative overflow-hidden">
      <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, marginLeft: isExpanded ? 256 : 80 }}
        transition={{ 
          opacity: { duration: 0.4 },
          y: { duration: 0.4 },
          marginLeft: { type: 'spring', stiffness: 350, damping: 30 } 
        }}
        className="p-8 relative z-10 min-h-screen"
      >
        <Outlet />
      </motion.main>
      
      <BotAssistant />
    </div>
  );
}
