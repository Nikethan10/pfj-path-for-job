import API from './api';

export const getReadiness = () => API.get('/analytics/readiness');
export const getSummary = () => API.get('/analytics/summary');
export const compareCareers = (data) => API.post('/analytics/compare', data);
export const submitFeedback = (data) => API.post('/feedback', data);
export const getActivityHeatmap = () => API.get('/analytics/activity');
