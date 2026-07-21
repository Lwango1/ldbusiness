import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser, getCurrentUserRole, onAuthChange, signOut as authSignOut, UserRole } from '../services/auth';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  isAuthenticated: false,
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const u = await getCurrentUser();
    setUser(u);
    if (u) {
      const r = await getCurrentUserRole();
      setRole(r);
    } else {
      setRole(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const { data: { subscription } } = onAuthChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        refresh();
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  const signOut = async () => {
    await authSignOut();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, isAuthenticated: !!user, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
