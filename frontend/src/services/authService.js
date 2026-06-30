import API from './api';

export const verifyFirebaseToken = (idToken, email, name) => 
  API.post('/auth/verify', { id_token: idToken, email, name });

