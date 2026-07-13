import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { auth } from '../firebase';

// Base URL is environment-driven so the same build works in dev and prod.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30s normal timeout; a cold-start retry (below) uses longer.
});

// Free-tier hosts (Render) sleep after inactivity and take ~30-60s to wake, so the
// FIRST request after idle would otherwise time out and look broken. Fire a
// non-blocking warm-up ping as soon as the app loads (while the user is still on the
// landing/login screen) so the server is usually awake by the time it's needed.
export function warmUpBackend() {
  axios.get(`${API_BASE_URL}/api/health`, { timeout: 70000 }).catch(() => {});
}
warmUpBackend();

// Attach a Firebase ID token to every request. Ask the SDK first — it caches the
// token and silently refreshes it when it's about to expire, so requests almost
// never go out with a stale token. localStorage is only the fallback for the
// brief window before Firebase restores the session on page load.
API.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  let token: string | null = null;
  const current = auth.currentUser;
  if (current) {
    try {
      token = await current.getIdToken();
      localStorage.setItem('PATH_token', token);
    } catch {
      token = null;
    }
  }
  if (!token) {
    token = localStorage.getItem('PATH_token');
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean; _coldRetry?: boolean };

API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    // Cold-start: if the request timed out (or the server was unreachable while waking),
    // retry ONCE with a longer timeout before surfacing an error — a sleeping instance
    // usually answers within ~60s.
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
    if (isTimeout && original && !original._coldRetry) {
      original._coldRetry = true;
      original.timeout = Math.max(original.timeout || 0, 70000);
      return API(original);
    }

    // On 401, try ONCE to silently refresh the Firebase ID token before logging out.
    // This fixes the "silent logout after ~1 hour" issue when the token expires.
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const current = auth.currentUser;
        if (current) {
          const fresh = await current.getIdToken(true);
          localStorage.setItem('PATH_token', fresh);
          original.headers.Authorization = `Bearer ${fresh}`;
          return API(original);
        }
      } catch {
        // refresh failed — fall through to sign-out
      }

      const isAuthPage = ['/login', '/signup'].includes(window.location.pathname);
      localStorage.removeItem('PATH_token');
      localStorage.removeItem('PATH_user');
      if (!isAuthPage) window.location.replace('/login');
    }

    return Promise.reject(error);
  },
);

export default API;
