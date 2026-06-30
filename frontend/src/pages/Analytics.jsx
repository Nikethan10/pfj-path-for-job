import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSummary, getActivityHeatmap } from '../services/analyticsService';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import Loader from '../components/Loader';

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 1, prefix = "", suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.round(parseFloat(value));
    if (isNaN(end) || start === end) {
      setCount(end || 0);
      return;
    }
    
    const incrementTime = (duration * 1000) / end;
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{prefix}{count}{suffix}</span>;
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'skills'

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [summaryRes, heatmapRes] = await Promise.all([
        getSummary(),
        getActivityHeatmap()
      ]);
      setData(summaryRes.data);
      setHeatmapData(heatmapRes.data);
    } catch (err) {
      console.error("Failed to load analytics summary:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (!data) return (
    <div className="glass-card text-center py-16">
      <p className="text-5xl mb-4"></p>
      <p className="text-gray-400">No performance data available.</p>
      <p className="text-sm text-gray-500 mt-2">Initialize your profile to begin tracking.</p>
    </div>
  );

  const breakdown = data.readiness?.breakdown || {};
  const score = data.readiness?.total_score || 0;

  // ── Radar Chart Vectors ─────────────────────────────────────────
  const radarData = [
    { subject: 'Technical Skills', score: Math.round(breakdown.skill_score || 0), fullMark: 100 },
    { subject: 'Project Portfolio', score: Math.round(breakdown.project_score || 0), fullMark: 100 },
    { subject: 'Resume Impact', score: Math.round(breakdown.resume_score || 0), fullMark: 100 },
    { subject: 'Consistency', score: Math.round(breakdown.consistency_score || 0), fullMark: 100 },
    { subject: 'Problem Solving', score: Math.round(data.total_skills ? Math.min(60 + (data.completed_projects * 10), 100) : 0), fullMark: 100 },
  ];

  // ── Bar Chart Progress ──────────────────────────────────────────
  const barData = (data.skill_progress || []).map(s => ({
    name: s.skill_name.length > 15 ? s.skill_name.slice(0, 15) + '…' : s.skill_name,
    fullName: s.skill_name,
    progress: s.progress ?? s.progress_percent ?? 0,
    level: s.level || 'Beginner'
  }));

  // ── Score Styling composition ──────────────────────────────────
  const getScoreDetails = (val) => {
    if (val >= 80) return { color: 'text-emerald-400', stroke: '#10b981', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    if (val >= 60) return { color: 'text-neon-cyan', stroke: '#06b6d4', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.35)]', bg: 'bg-cyan-500/10 border-cyan-500/20' };
    if (val >= 35) return { color: 'text-amber-400', stroke: '#f59e0b', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]', bg: 'bg-amber-500/10 border-amber-500/20' };
    return { color: 'text-rose-400', stroke: '#f43f5e', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.35)]', bg: 'bg-rose-500/10 border-rose-500/20' };
  };

  const scoreDetails = getScoreDetails(score);

  // ── Dynamic AI Insights generator ──────────────────────────────
  const generateInsights = () => {
    const insights = [];
    if ((breakdown.skill_score || 0) < 60) {
      insights.push({
        priority: 'High',
        text: 'Your Technical Skills weight is currently bottlenecking your readiness score.',
        action: 'Navigate to the Roadmap tab and complete 2+ new skill branches to unlock progression nodes.'
      });
    }
    if ((breakdown.project_score || 0) < 50) {
      insights.push({
        priority: 'High',
        text: 'Portfolio complexity needs reinforcement. Industry standards mandate functional code artifacts.',
        action: 'Select a job-aligned match project in Career Labs and mark it as Ongoing/Completed.'
      });
    }
    if ((breakdown.resume_score || 0) < 70) {
      insights.push({
        priority: 'Medium',
        text: 'Your resume impact score indicates low keyword alignment for placement ATS filters.',
        action: 'Head over to the Resume Lab, upload your latest PDF, and implement key skill corrections.'
      });
    }
    if ((breakdown.consistency_score || 0) < 50) {
      insights.push({
        priority: 'Medium',
        text: 'Irregular study patterns detected. Learning consistency directly increases retention.',
        action: 'Maintain a 3-day active streak by launching a Mock Interview session or completing roadmap exercises.'
      });
    }

    if (insights.length === 0) {
      insights.push({
        priority: 'Optimized',
        text: 'All core indicators are in the green. Your profile indicates robust placement readiness.',
        action: 'Simulate high-stakes environments in the Mock Interview console to lock in active offers.'
      });
    }
    return insights;
  };

  const insightsList = generateInsights();

  // ── Heatmap Data Generation ────────────────────────────────────
  const generateHeatmapGrid = () => {
    if (!heatmapData || !heatmapData.heatmap) return [];
    
    const start = new Date(heatmapData.start_date);
    const end = new Date(heatmapData.end_date);
    const grid = [];
    
    // Create copy to iterate
    let current = new Date(start);
    
    // Backtrack to Sunday of that week to align columns
    const dayOffset = current.getDay();
    current.setDate(current.getDate() - dayOffset);
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const count = heatmapData.heatmap[dateStr] || 0;
      grid.push({
        dateStr,
        count,
        dayOfWeek: current.getDay(),
        dateObj: new Date(current)
      });
      // Increment 1 day
      current.setDate(current.getDate() + 1);
    }
    return grid;
  };

  const heatmapGrid = generateHeatmapGrid();

  const getHeatmapColor = (count) => {
    if (count === 0) return 'bg-slate-100 border border-dark-700 hover:border-dark-600';
    if (count === 1) return 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20';
    if (count === 2) return 'bg-emerald-500/30 text-emerald-800 border border-emerald-500/40';
    return 'bg-gradient-to-br from-neon-cyan to-neon-purple border border-dark-700 shadow-sm';
  };

  // Extract month headers based on week starts (Sunday index)
  const getMonthHeaders = () => {
    if (heatmapGrid.length === 0) return [];
    const headers = [];
    let lastMonth = '';
    
    for (let i = 0; i < heatmapGrid.length; i += 7) { // check every week
      const date = heatmapGrid[i].dateObj;
      const monthName = date.toLocaleDateString(undefined, { month: 'short' });
      if (monthName !== lastMonth) {
        headers.push({ name: monthName, colIndex: i / 7 });
        lastMonth = monthName;
      }
    }
    return headers;
  };

  const monthHeaders = getMonthHeaders();

  // Circular Gauge Calculations
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * score) / 100;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12 text-left">
      
      {/* ─── TITLE HEADER ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
           Performance Analytics
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Detailed insights and progress analysis tracking your skill and roadmap development.
        </p>
      </div>

      {/* ─── TABS DECK ──────────────────────────────────────────────── */}
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            activeTab === 'summary'
              ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-lg shadow-neon-cyan/15'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
           Performance Summary
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            activeTab === 'skills'
              ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-lg shadow-neon-purple/15'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
           Skill Analytics ({data.total_skills})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'summary' ? (
          <motion.div
            key="summary-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* ─── ZONE A: TELEMETRY CENTRE & GAUGE ────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Circular Gauge Card */}
              <div className="glass-card flex flex-col items-center justify-center p-8 min-h-[300px]">

                <span className="text-xs text-gray-500 uppercase tracking-widest font-extrabold mb-6">
                  Readiness Score
                </span>

                <div className="relative flex items-center justify-center">
                  {/* SVG Circle Gauge */}
                  <svg className="w-40 h-40 transform -rotate-90">
                    {/* Background Circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      className="stroke-white/5"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />
                    {/* Progress Circle with Glow */}
                    <motion.circle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke={scoreDetails.stroke}
                      strokeWidth={strokeWidth}
                      fill="transparent"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  
                  {/* Inside Center Value */}
                  <div className="absolute text-center">
                    <p className={`text-4xl font-black tracking-tighter ${scoreDetails.color}`}>
                      <AnimatedCounter value={score} duration={1.2} />%
                    </p>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mt-0.5">
                      Ready
                    </span>
                  </div>
                </div>

                <div className={`mt-6 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${scoreDetails.bg}`}>
                  Status: {data.readiness?.level || 'Calibrating'}
                </div>
              </div>

              {/* Insights and Recommendations List */}
              <div className="lg:col-span-2 glass-card flex flex-col justify-between p-6 md:p-8">
                <div>
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-neon-purple animate-pulse" /> AI Career Insights
                  </h3>
                  <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2">
                    {insightsList.map((ins, idx) => (
                      <div key={idx} className="flex gap-4 items-start p-3 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          ins.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                          ins.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {ins.priority}
                        </span>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-300 font-medium leading-relaxed">{ins.text}</p>
                          <p className="text-[11px] text-neon-cyan italic"> Recommended: {ins.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Micro metrics row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-dark-700 pt-6 mt-6">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Skills Cataloged</span>
                    <span className="text-lg font-bold text-slate-800 mt-1 block">{data.total_skills} Active</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Shipped Projects</span>
                    <span className="text-lg font-bold text-emerald-700 mt-1 block">
                      {data.completed_projects}/{data.total_projects || 0}
                    </span>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Active Career Path</span>
                    <span className="text-xs text-neon-purple mt-1.5 font-bold block truncate max-w-[150px]">
                      {data.readiness?.level === 'Not Ready' ? 'None Selected' : 'Aligned Target'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* ─── ZONE B: VECTOR RADAR DIAGNOSTICS ───────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Radar spider chart */}
              <div className="lg:col-span-7 glass-card relative overflow-hidden min-h-[460px] flex flex-col justify-between bg-white border border-dark-700">
                
                <div className="p-6 pb-0">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-pulse" /> Skill Profile Radar
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Overview of preparation progress across key career criteria.</p>
                </div>

                <div className="flex-1 flex items-center justify-center py-4">
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <PolarGrid stroke="#e8e6e1" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar 
                        name="Student Score" 
                        dataKey="score" 
                        stroke="#166534" 
                        strokeWidth={2} 
                        fill="url(#radarGradient)" 
                        fillOpacity={0.45} 
                      />
                      <defs>
                        <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#be123c" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#166534" stopOpacity={0.2} />
                        </radialGradient>
                      </defs>
                      <Tooltip 
                        contentStyle={{
                          background: '#ffffff',
                          border: '1px solid #e8e6e1',
                          borderRadius: '16px', 
                          color: '#1e293b',
                          backdropFilter: 'blur(12px)',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                          fontSize: '11px'
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Progress telemetries */}
              <div className="lg:col-span-5 glass-card p-6 flex flex-col justify-center bg-white border border-dark-700">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">Key Metrics</h3>
                <div className="space-y-5">
                  {radarData.map(v => (
                    <div key={v.subject} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">{v.subject}</span>
                        <span className="text-neon-cyan font-bold">{v.score}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-dark-700">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${v.score}%` }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          className="bg-gradient-to-r from-neon-purple to-neon-cyan h-full rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ─── ZONE C: ACTIVITY CALENDAR ───────────────────────────── */}
            {heatmapData && heatmapData.heatmap && (
              <div className="glass-card p-6 md:p-8 relative overflow-hidden bg-white border border-dark-700">
                
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" /> Consistency Heatmap
                </h3>
                <p className="text-xs text-slate-500 mb-6">Visual timeline documenting daily prep interactions over the last 90 days.</p>

                {/* Heatmap Grid Wrapper */}
                <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  <div className="min-w-[640px] flex flex-col">
                    
                    {/* Month headers row */}
                    <div className="flex text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 relative h-4">
                      {monthHeaders.map(m => (
                        <div 
                          key={m.name} 
                          className="absolute"
                          style={{ left: `${m.colIndex * 15.5}px` }}
                        >
                          {m.name}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {/* Weekday labels */}
                      <div className="flex flex-col justify-between text-[9px] text-slate-500 font-extrabold pr-1 h-[98px] pt-1">
                        <span>Sun</span>
                        <span>Tue</span>
                        <span>Thu</span>
                        <span>Sat</span>
                      </div>

                      {/* Day Cells Grid */}
                      <div className="grid grid-flow-col grid-rows-7 gap-1 h-[98px] flex-1">
                        {heatmapGrid.map((d, index) => (
                          <div key={index} className="relative group">
                            <div className={`w-3 h-3 rounded-sm transition-all duration-300 ${getHeatmapColor(d.count)}`} />
                            {/* Rich Floating Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-white border border-dark-700 text-[9px] text-slate-800 px-2 py-1.5 rounded-md shadow-lg whitespace-nowrap z-50 pointer-events-none">
                              <span className="font-extrabold text-neon-cyan mr-1">{d.count} Activities</span>
                              on {new Date(d.dateStr).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Legend bar */}
                <div className="flex items-center gap-1.5 justify-end text-[9px] text-slate-500 mt-2 font-bold uppercase tracking-wider">
                  <span>Less</span>
                  <div className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-dark-700" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-50 border border-emerald-500/20" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-200 border border-emerald-500/20" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-neon-cyan to-neon-purple border border-dark-700" />
                  <span>More</span>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="skills-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* ─── SKILL PROFICIENCY BAR CHART ────────────────────────── */}
            {barData.length > 0 ? (
              <div className="glass-card p-6 md:p-8 relative overflow-hidden bg-white border border-dark-700">
                
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" /> Skill Proficiency Analytics
                </h3>
                <p className="text-xs text-slate-500 mb-8">Detailed tracking of all active skills logged in your profile.</p>

                <div className="w-full">
                  <ResponsiveContainer width="100%" height={Math.max(340, barData.length * 45)}>
                    <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 30, top: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#be123c" />
                          <stop offset="100%" stopColor="#166534" />
                        </linearGradient>
                      </defs>
                      
                      <XAxis 
                        type="number" 
                        domain={[0, 100]} 
                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }} 
                        stroke="#e8e6e1" 
                        axisLine={false}
                      />
                      
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{ fill: '#1a1f16', fontSize: 11, fontWeight: 600 }} 
                        width={120} 
                        stroke="none"
                      />
                      
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 8 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-white border border-dark-700 p-3 rounded-2xl shadow-lg z-50 text-slate-800">
                                <p className="text-xs font-bold text-slate-900 mb-1.5">{d.fullName}</p>
                                <div className="space-y-1">
                                  <p className="text-[10px] text-neon-cyan">Proficiency: <span className="font-extrabold">{d.progress}%</span></p>
                                  <p className="text-[10px] text-neon-purple">Level: <span className="font-extrabold">{d.level}</span></p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      
                      <Bar 
                        dataKey="progress" 
                        fill="url(#barGradient)" 
                        radius={[0, 6, 6, 0]} 
                        barSize={16}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="glass-card text-center py-16 rounded-3xl border border-dark-700 bg-white">
                <p className="text-4xl mb-4"></p>
                <p className="text-slate-500 font-medium">No skills registered on your profile.</p>
                <p className="text-xs text-slate-400 mt-2">Go to the Skills tab and add your current technologies to begin tracking.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
