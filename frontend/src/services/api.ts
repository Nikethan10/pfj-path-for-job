import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { auth } from '../firebase';

// Base URL is environment-driven so the same build works in dev and prod.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the stored Firebase ID token to every request.
API.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('pfj_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// On 401, try ONCE to silently refresh the Firebase ID token before logging out.
// This fixes the "silent logout after ~1 hour" issue when the token expires.
API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const current = auth.currentUser;
        if (current) {
          const fresh = await current.getIdToken(true);
          localStorage.setItem('pfj_token', fresh);
          original.headers.Authorization = `Bearer ${fresh}`;
          return API(original);
        }
      } catch {
        // refresh failed — fall through to sign-out
      }

      const isAuthPage = ['/login', '/signup'].includes(window.location.pathname);
      localStorage.removeItem('pfj_token');
      localStorage.removeItem('pfj_user');
      if (!isAuthPage) window.location.replace('/login');
    }

    return Promise.reject(error);
  },
);

export default API;
