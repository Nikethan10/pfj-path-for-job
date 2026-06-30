import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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

  useEffect(() => {
    const token = localStorage.getItem('pfj_token');
    const userData = localStorage.getItem('pfj_user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData) as AuthUser);
      } catch {
        localStorage.removeItem('pfj_user');
      }
    }
    setLoading(false);
  }, []);

  const loginUser = (data: AuthUser, firebaseToken: string) => {
    localStorage.setItem('pfj_token', firebaseToken);
    const u: AuthUser = { uid: data.uid, name: data.name, email: data.email };
    localStorage.setItem('pfj_user', JSON.stringify(u));
    setUser(u);
  };

  const logoutUser = () => {
    localStorage.removeItem('pfj_token');
    localStorage.removeItem('pfj_user');
    setUser(null);
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
