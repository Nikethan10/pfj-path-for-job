import API from './api';

export const getProjects = () => API.get('/projects');
export const updateProjectStatus = (id, data) => API.put(`/projects/${id}`, data);
