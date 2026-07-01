import { useState, useEffect } from 'react';
import { toast } from '../lib/toast';
import { motion } from 'framer-motion';
import { getStudentSkills, getAvailableSkills, addSkill, updateSkill, deleteSkill, bulkAddSkills } from '../services/skillService';
import { getProfile } from '../services/profileService';
import Loader from '../components/Loader';



export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [aimSkills, setAimSkills] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [filterByAim, setFilterByAim] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [adding, setAdding] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);



  useEffect(() => {
    loadData(filterByAim);

    const handleRefresh = () => {
      loadData(filterByAim);
    };
    window.addEventListener('pfj_refresh_data', handleRefresh);
    return () => window.removeEventListener('pfj_refresh_data', handleRefresh);
  }, [filterByAim]);

  const loadData = async (aimOnly = true) => {
    try {
      let targetRole = null;
      let currentProfile = userProfile;
      if (!currentProfile) {
        try {
          const profileRes = await getProfile();
          currentProfile = profileRes.data;
          setUserProfile(currentProfile);
        } catch (e) {
          console.error("Failed to load student profile", e);
        }
      }
      
      if (currentProfile) {
        targetRole = currentProfile.target_role;
      }

      // availableRes is filtered based on the current toggle (Aim Skills vs Show All)
      // aimSkillsRes is always filtered by the student's target role to drive progress stats and cards
      const [skillsRes, availableRes, aimSkillsRes] = await Promise.all([
        getStudentSkills(),
        getAvailableSkills(aimOnly ? targetRole : null),
        targetRole ? getAvailableSkills(targetRole) : getAvailableSkills()
      ]);
      
      setSkills(skillsRes.data);
      setAvailableSkills(availableRes.data);
      setAimSkills(aimSkillsRes.data || []);

      
    } catch (err) {
      console.error("Failed to load skills", err);
    }
    setLoading(false);
  };

  const handleToggleFilter = async (val) => {
    setFilterByAim(val);
    setLoading(true);
    await loadData(val);
  };

  const handleAddSkill = async (skillName) => {
    setAdding(skillName);
    try {
      await addSkill({ skill_name: skillName, level: 'Beginner', progress_percent: 10 });
      await loadData(filterByAim);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add skill');
    }
    setAdding(false);
  };

  const handleBulkAddAimSkills = async () => {
    if (!userProfile?.target_role) return;
    const toAdd = aimSkills.filter(as => !skills.some(s => s.skill_name === as.skill_name));
    if (toAdd.length === 0) {
      toast.info("All skills for your target role are already added!");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to add all ${toAdd.length} outstanding aim skills for ${userProfile.target_role}?`)) {
      return;
    }
    
    setBulkAdding(true);
    try {
      const skillsToSubmit = toAdd.map(s => ({
        skill_name: s.skill_name,
        level: 'Beginner',
        progress_percent: 10
      }));
      await bulkAddSkills(skillsToSubmit);
      await loadData(filterByAim);
      toast.success(`Successfully added ${toAdd.length} skills to your profile!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to bulk add skills');
    } finally {
      setBulkAdding(false);
    }
  };



  const handleDelete = async (skillId) => {
    if (!window.confirm("Are you sure you want to delete this skill?")) return;
    try {
      await deleteSkill(skillId);
      await loadData(filterByAim);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete skill');
    }
  };

  if (loading) return <Loader />;

  // Filter out already added skills from the available list
  const availableToAdd = availableSkills.filter(as => !skills.some(s => s.skill_name === as.skill_name));

  // Filter available skills based on search term
  const filteredAvailable = availableToAdd.filter(as =>
    as.skill_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    as.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group available skills by category
  const groupedSkills = {};
  filteredAvailable.forEach(s => {
    if (!groupedSkills[s.category]) {
      groupedSkills[s.category] = [];
    }
    groupedSkills[s.category].push(s);
  });

  // Calculate pathway matching/unlock statistics
  const targetRoleSkills = aimSkills;
  const totalAimSkillsCount = targetRoleSkills.length;
  const addedAimSkills = skills.filter(s => targetRoleSkills.some(ts => ts.skill_name === s.skill_name));
  const addedAimSkillsCount = addedAimSkills.length;
  const pathReadinessPercent = totalAimSkillsCount > 0 ? Math.round((addedAimSkillsCount / totalAimSkillsCount) * 100) : 0;
  
  const avgProficiency = addedAimSkillsCount > 0 
    ? Math.round(addedAimSkills.reduce((sum, s) => sum + s.progress_percent, 0) / addedAimSkillsCount)
    : 0;

  // Process user's skills alphabetically
  const processedSkills = [...skills].sort((a, b) => a.skill_name.localeCompare(b.skill_name));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto px-2">
      <h1 className="section-title text-3xl mb-2 font-black tracking-tight"> Skills Management</h1>
      <p className="text-slate-500 mb-6">Track your proficiency and progress across different technologies.</p>

      {/* Target Pathway Unlock Progress Bar */}
      {userProfile && totalAimSkillsCount > 0 && (
        <div className="glass-card mb-8 p-5 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-neon-cyan/5 blur-2xl rounded-full pointer-events-none" />
          
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-2">
            <span className="flex items-center gap-2 text-slate-700 font-sans text-sm font-extrabold">
              <span>🎯</span> {userProfile.target_role} Pathway Unlock Progress
            </span>
            <span className="text-neon-cyan font-mono text-sm">{addedAimSkillsCount} / {totalAimSkillsCount} Skills ({pathReadinessPercent}%)</span>
          </div>
          
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${pathReadinessPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="bg-gradient-to-r from-neon-cyan to-blue-500 h-full rounded-full shadow-[0_0_8px_rgba(6,182,212,0.3)]"
            />
          </div>
        </div>
      )}

      {/* Add New Skill Section */}
      <div className="glass-card mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 font-sans">Quick Add Skills</h2>
            {userProfile && (
              <p className="text-xs text-slate-500 mt-1">
                Your Aim: <span className="text-neon-cyan font-semibold">{userProfile.target_role}</span>
              </p>
            )}
          </div>
          
          {userProfile && (
            <div className="flex items-center bg-slate-100 border border-dark-700 rounded-xl p-1 shrink-0">
              <button
                onClick={() => handleToggleFilter(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${filterByAim ? 'bg-white border border-neon-cyan/30 text-neon-cyan shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                🎯 Aim Skills
              </button>
              <button
                onClick={() => handleToggleFilter(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${!filterByAim ? 'bg-white border border-neon-cyan/30 text-neon-cyan shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                🌐 Show All
              </button>
            </div>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search available skills by name or category (e.g. React, ML, VLSI)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
        </div>

        {/* Categorized Chips */}
        {Object.keys(groupedSkills).length === 0 ? (
          <p className="text-slate-500 text-center py-4 text-sm">
            {searchTerm ? 'No matching available skills found.' : 'All available skills have been added! '}
          </p>
        ) : (
          <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(groupedSkills).map(([category, items]) => (
              <div key={category} className="border-b border-dark-700 pb-4 last:border-b-0 last:pb-0">
                <h3 className="text-xs uppercase font-bold tracking-wider text-neon-cyan mb-3">{category}</h3>
                <div className="flex flex-wrap gap-2">
                  {items.map(s => {
                    const isBeingAdded = adding === s.skill_name;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleAddSkill(s.skill_name)}
                        disabled={adding !== false}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-dark-700 text-sm bg-slate-50 hover:bg-neon-cyan/10 hover:border-neon-cyan/30 hover:text-neon-cyan transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-slate-700`}
                        title={`Click to add ${s.skill_name} (${category})`}
                      >
                        <span>{s.skill_name}</span>
                        <span className="text-neon-cyan font-bold">{isBeingAdded ? '⏳' : '＋'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Skills Header */}
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
           My Active Skills
        </h2>
      </div>

      {/* Skills Grid */}
      {processedSkills.length === 0 ? (
        <div className="glass-card text-center py-16">
          <p className="text-5xl mb-4"></p>
          <p className="text-slate-500">
            {skills.length === 0 ? 'No skills added yet.' : 'No active skills match the selected filters.'}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            {skills.length === 0 ? 'Start adding skills from the catalog above!' : 'Try adjusting your search or category filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedSkills.map((s, i) => {
            const isAimSkill = aimSkills.some(as => as.skill_name === s.skill_name);
            return (
              <motion.div 
                key={s.id} 
                className="glass-card p-4"
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.03 }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-slate-800">{s.skill_name}</h3>
                      {isAimSkill && (
                        <span 
                          className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan flex items-center gap-1 shadow-sm select-none"
                          title="Required/recommended for your target role"
                        >
                          🎯 Aim
                        </span>
                      )}
                      <button 
                        onClick={() => handleDelete(s.skill_id)}
                        className="text-slate-400 hover:text-red-500 transition-colors opacity-50 hover:opacity-100 cursor-pointer text-xs ml-auto p-1"
                        title="Remove Skill"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{s.category}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
