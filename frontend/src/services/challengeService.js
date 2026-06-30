import API from './api';

export const getChallenges = () => API.get('/challenges');
export const getChallengeDetails = (id) => API.get(`/challenges/${id}`);
export const markChallengeComplete = (id) => API.post(`/challenges/${id}/complete`);
export const generateChallenge = () => API.post('/challenges/generate');

