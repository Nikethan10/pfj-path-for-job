import API from './api';

export const getInterviewQuestion = (data) => API.post('/interview/question', data);
export const evaluateInterviewAnswer = (data) => API.post('/interview/evaluate', data);
