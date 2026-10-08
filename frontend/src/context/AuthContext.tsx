import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  quickLogin: (
    demoRole: 'Admin' | 'Receptionist' | 'Staff-Alex' | 'Staff-Ben' | 'Staff-Usman' | 'Staff-Elena'
  ) => Promise<User>;
  logout: () => void;
  isAdmin: boolean;
  isReceptionist: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('bitnox_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      // 1. If token stored, attempt restore
      if (token) {
        try {
          const res = await api.auth.me();
          if (res?.user && isMounted) {
            setUser(res.user);
            setLoading(false);
            return;
          }
        } catch {
          localStorage.removeItem('bitnox_token');
          if (isMounted) setToken(null);
        }
      }

      // 2. If user explicitly clicked logout in this tab, show login page
      const isExplicitLogout = sessionStorage.getItem('bitnox_explicit_logout') === 'true';
      if (isExplicitLogout) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // 3. Auto-initialize demo session as Receptionist (or Admin if requested via URL)
      // This ensures portfolio live demo opens the actual working VMS interface directly!
      try {
        const isDashboard = window.location.hash.includes('dashboard') || window.location.search.includes('admin');
        const defaultRole = isDashboard ? 'Admin' : 'Receptionist';
        const guestUser = await quickLogin(defaultRole);
        if (isMounted) setUser(guestUser);
      } catch (err) {
        console.error('Failed to auto-login demo role:', err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();
    return () => { isMounted = false; };
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    sessionStorage.removeItem('bitnox_explicit_logout');
    const res = await api.auth.login(email, password);
    localStorage.setItem('bitnox_token', res.token);
    setToken(res.token);
    setUser(res.user as User);
    return res.user as User;
  };

  const quickLogin = async (
    demoRole: 'Admin' | 'Receptionist' | 'Staff-Alex' | 'Staff-Ben' | 'Staff-Usman' | 'Staff-Elena'
  ): Promise<User> => {
    sessionStorage.removeItem('bitnox_explicit_logout');
    let email = 'admin@bitnox.com';
    let password = 'admin123';

    if (demoRole === 'Receptionist') {
      email = 'receptionist@bitnox.com';
      password = 'recep123';
    } else if (demoRole === 'Staff-Alex' || demoRole === 'Staff-Ben') {
      email = 'ben.sam@bitnox.com';
      password = 'staff123';
      try {
        return await login(email, password);
      } catch {
        email = 'alex.vance@bitnox.com';
      }
    } else if (demoRole === 'Staff-Usman') {
      email = 'usman.oyeboade@bitnox.com';
      password = 'staff123';
    } else if (demoRole === 'Staff-Elena') {
      email = 'elena.gomez@bitnox.com';
      password = 'staff123';
    }

    return login(email, password);
  };

  const logout = () => {
    sessionStorage.setItem('bitnox_explicit_logout', 'true');
    localStorage.removeItem('bitnox_token');
    setToken(null);
    setUser(null);
  };

  const role = user?.role || null;
  const isAdmin = role === 'Admin';
  const isReceptionist = role === 'Receptionist';
  const isStaff = role === 'Staff';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        login,
        quickLogin,
        logout,
        isAdmin,
        isReceptionist,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};