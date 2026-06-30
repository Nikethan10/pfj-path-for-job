import API from './api';

export const generateRoadmap = (data) => API.post('/roadmap/generate', data);
export const getRoadmap = () => API.get('/roadmap');
export const updateRoadmapStatus = (id, data) => API.put(`/roadmap/${id}`, data);
export const generateQuiz = (data) => API.post('/roadmap/quiz/generate', data);
export const submitQuiz = (data) => API.post('/roadmap/quiz/submit', data);
