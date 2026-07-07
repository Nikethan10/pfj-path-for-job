import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  loginUser: (data: AuthUser, firebaseToken: string) => void;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Firebase is the source of truth for the session. localStorage is only a
  // cache — trusting it alone meant a stale "logged in" state after the
  // Firebase session ended, and expired tokens couldn't refresh on reload.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          localStorage.setItem('PATH_token', token);
        } catch {
          // Token fetch failed; API interceptor will retry on demand.
        }
        // Prefer the backend-verified identity cached at login (it may hold a
        // nicer display name); fall back to what Firebase knows.
        let cached: AuthUser | null = null;
        try {
          const raw = localStorage.getItem('PATH_user');
          cached = raw ? (JSON.parse(raw) as AuthUser) : null;
        } catch {
          cached = null;
        }
        const u: AuthUser =
          cached && cached.uid === fbUser.uid
            ? cached
            : {
                uid: fbUser.uid,
                name: fbUser.displayName || 'User',
                email: fbUser.email || '',
              };
        localStorage.setItem('PATH_user', JSON.stringify(u));
        setUser(u);
      } else {
        localStorage.removeItem('PATH_token');
        localStorage.removeItem('PATH_user');
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginUser = (data: AuthUser, firebaseToken: string) => {
    localStorage.setItem('PATH_token', firebaseToken);
    const u: AuthUser = { uid: data.uid, name: data.name, email: data.email };
    localStorage.setItem('PATH_user', JSON.stringify(u));
    setUser(u);
  };

  const logoutUser = () => {
    localStorage.removeItem('PATH_token');
    localStorage.removeItem('PATH_user');
    setUser(null);
    // End the Firebase session too, otherwise onAuthStateChanged would
    // immediately sign the user back in on the next page load.
    signOut(auth).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
