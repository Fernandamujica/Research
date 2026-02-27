import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const ALLOWED_DOMAIN = 'nubank.com.br';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  domainError: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [domainError, setDomainError] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && !u.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        // Force sign-out if domain doesn't match
        signOut(auth);
        setDomainError(true);
        setUser(null);
      } else {
        setUser(u);
        setDomainError(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async () => {
    setDomainError(false);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!result.user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        await signOut(auth);
        setDomainError(true);
      }
    } catch (err) {
      console.error('Login error', err);
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, domainError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
