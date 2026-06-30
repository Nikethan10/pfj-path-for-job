import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getProfile, updateProfile } from '../services/profileService';
import { getAvailableRoles } from '../services/skillService';
import Loader from '../components/Loader';

// Branch options mapping
const BRANCH_OPTIONS = {
  'B.Tech': [
    'CSE',
    'AI ML',
    'Electronics Communication Engineering',
    'Mechanical Engineering',
    'Cyber Security'
  ],
  'M.Tech': [
    'Computer Science & Engineering (CSE)',
    'Data Science',
    'Artificial Intelligence',
    'VLSI & Embedded Systems',
    'Cyber Security',
    'Software Engineering'
  ]
};

// Recommended career trajectories per branch
const BRANCH_RECOMMENDED_ROLES = {
  // B.Tech Branches
  'CSE': ['Software Engineer', 'Full Stack Developer', 'Data Scientist', 'ML Engineer', 'Data Analyst', 'Cyber Security Specialist'],
  'AI ML': ['ML Engineer', 'Data Scientist', 'Software Engineer', 'Data Analyst'],
  'Electronics Communication Engineering': ['Embedded Systems Engineer', 'VLSI Design Engineer', 'Robotics Engineer', 'Software Engineer', 'ML Engineer'],
  'Mechanical Engineering': ['Mechanical Engineer', 'Robotics Engineer'],
  'Cyber Security': ['Cyber Security Specialist', 'Software Engineer'],

  // M.Tech Branches
  'Computer Science & Engineering (CSE)': ['Software Engineer', 'Full Stack Developer', 'Data Scientist', 'ML Engineer', 'Data Analyst', 'Cyber Security Specialist'],
  'Data Science': ['Data Scientist', 'Data Analyst', 'ML Engineer'],
  'Artificial Intelligence': ['ML Engineer', 'Data Scientist', 'Software Engineer'],
  'VLSI & Embedded Systems': ['VLSI Design Engineer', 'Embedded Systems Engineer', 'Robotics Engineer'],
  'Software Engineering': ['Software Engineer', 'Full Stack Developer']
};

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    degree: '',
    branch: '',
    year: 1,
    target_role: '',
    weekly_hours: 10,
  });

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, rolesRes] = await Promise.all([
          getProfile(),
          getAvailableRoles().catch(() => ({ data: ['Software Engineer', 'Data Scientist', 'Data Analyst', 'Full Stack Developer', 'ML Engineer'] }))
        ]);
        setProfile(profileRes.data);
        setRoles(rolesRes.data);
        let degree = profileRes.data.degree;
        if (degree !== 'B.Tech' && degree !== 'M.Tech') {
          degree = 'B.Tech';
        }
        let branch = profileRes.data.branch;
        const validBranches = BRANCH_OPTIONS[degree] || [];
        if (!validBranches.includes(branch)) {
          branch = validBranches[0] || '';
        }
        setFormData({
          degree: degree,
          branch: branch,
          year: profileRes.data.year || 3,
          target_role: profileRes.data.target_role || 'Software Engineer',
          weekly_hours: profileRes.data.weekly_hours || 10,
        });
      } catch (err) {
        console.error("Failed to load profile", err);
      }
      setLoading(false);
    })();
  }, []);

  const handleDegreeChange = (degree) => {
    const branches = BRANCH_OPTIONS[degree] || [];
    const newBranch = branches[0] || '';
    const recommendedRoles = BRANCH_RECOMMENDED_ROLES[newBranch] || [];
    const newTargetRole = recommendedRoles[0] || roles[0] || 'Software Engineer';
    setFormData(prev => ({
      ...prev,
      degree,
      branch: newBranch,
      target_role: newTargetRole
    }));
  };

  const handleBranchChange = (branch) => {
    const recommendedRoles = BRANCH_RECOMMENDED_ROLES[branch] || [];
    const newTargetRole = recommendedRoles[0] || roles[0] || 'Software Engineer';
    setFormData(prev => ({
      ...prev,
      branch,
      target_role: newTargetRole
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(formData);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update profile');
    }
    setSaving(false);
  };

  if (loading) return <Loader />;

  if (!profile) return (
    <div className="glass-card text-center py-16">
      <p className="text-slate-500">Profile not found. Please setup your profile on the Dashboard first.</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <h1 className="section-title text-3xl mb-2"> Profile Settings</h1>
      <p className="text-slate-500 mb-8">Update your academic details and target career path to receive accurate roadmaps.</p>

      <div className="glass-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-slate-600 mb-1 block font-medium">Degree</label>
              <select className="input-field" value={formData.degree} onChange={e => handleDegreeChange(e.target.value)}>
                {['B.Tech', 'M.Tech'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block font-medium">Branch</label>
              <select className="input-field" value={formData.branch} onChange={e => handleBranchChange(e.target.value)}>
                {(BRANCH_OPTIONS[formData.degree] || []).map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-slate-600 mb-1 block font-medium">Year of Study</label>
              <select className="input-field" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}>
                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block font-medium">Study Hours / Week</label>
              <input type="number" className="input-field" min={1} max={40} value={formData.weekly_hours}
                onChange={e => setFormData({...formData, weekly_hours: parseInt(e.target.value)})} required />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block font-medium">Target Role</label>
            <select className="input-field" value={formData.target_role} onChange={e => setFormData({...formData, target_role: e.target.value})}>
              {(() => {
                const recommendedNames = BRANCH_RECOMMENDED_ROLES[formData.branch] || [];
                const recommended = roles.filter(r => recommendedNames.includes(r));
                const others = roles.filter(r => !recommendedNames.includes(r));
                return (
                  <>
                    {recommended.length > 0 && (
                      <optgroup label="Recommended Paths">
                        {recommended.map(r => <option key={r} value={r}>{r}</option>)}
                      </optgroup>
                    )}
                    {others.length > 0 && (
                      <optgroup label="Other Trajectories">
                        {others.map(r => <option key={r} value={r}>{r}</option>)}
                      </optgroup>
                    )}
                  </>
                );
              })()}
            </select>
            <p className="text-xs text-slate-500 mt-2">Changing your target role will affect your Readiness Score and Roadmap.</p>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-50 mt-4">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
