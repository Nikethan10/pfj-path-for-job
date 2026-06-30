import API from './api';

export const getAvailableSkills = (role) => API.get(role ? `/skills/available?role=${encodeURIComponent(role)}` : '/skills/available');
export const getStudentSkills = () => API.get('/skills');
export const addSkill = (data) => API.post('/skills', data);
export const updateSkill = (skillId, data) => API.put(`/skills/${skillId}`, data);
export const getAvailableRoles = () => API.get('/skills/roles');
export const deleteSkill = (skillId) => API.delete(`/skills/${skillId}`);
export const bulkAddSkills = (skillsList) => API.post('/skills/bulk', { skills: skillsList });

