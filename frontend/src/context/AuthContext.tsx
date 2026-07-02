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
    const token = localStorage.getItem('PATH_token');
    const userData = localStorage.getItem('PATH_user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData) as AuthUser);
      } catch {
        localStorage.removeItem('PATH_user');
      }
    }
    setLoading(false);
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
