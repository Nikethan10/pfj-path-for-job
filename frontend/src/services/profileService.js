import API from './api';

export const getProfile = () => API.get('/profile');
export const createProfile = (data) => API.post('/profile', data);
export const updateProfile = (data) => API.put('/profile', data);
