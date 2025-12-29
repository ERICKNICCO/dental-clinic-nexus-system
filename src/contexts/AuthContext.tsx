
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL && (import.meta as any).env.VITE_API_BASE_URL !== 'http://localhost:4000'
    ? (import.meta as any).env.VITE_API_BASE_URL
    : (typeof window !== 'undefined'
      ? new URL(window.location.href).protocol + '//' + new URL(window.location.href).hostname + ':4000'
      : 'http://localhost:4000');

type UserRole = 'admin' | 'dentist' | 'receptionist' | 'dental_assistant' | 'technician' | 'finance_manager';

interface UserProfile {
  role: UserRole;
  name: string;
  email: string;
  lastActivity?: Date;
  sessionTimeout?: number;
}

interface AuthUser {
  id: string;
  email: string;
  role?: UserRole | null;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  updateLastActivity: () => void;
  checkSessionValidity: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function normalizeRole(role?: string | null): UserRole {
  const validRoles: UserRole[] = ['admin', 'dentist', 'receptionist', 'dental_assistant', 'technician', 'finance_manager'];
  if (role && (validRoles as string[]).includes(role)) {
    return role as UserRole;
  }
  // Default to receptionist for unknown roles
  return 'receptionist';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout] = useState(30 * 60 * 1000); // 30 minutes

  const updateLastActivity = useCallback(() => {
    try {
      localStorage.setItem('lastActivity', new Date().toISOString());
    } catch {
      // ignore
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('lastActivity');
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
    } catch (error) {
      console.error('Logout error:', error);
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  }, []);

  const checkSessionValidity = useCallback(() => {
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return false;

    const lastActivityTime = new Date(lastActivity).getTime();
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastActivityTime;

    if (timeDiff > sessionTimeout) {
      void logout();
      return false;
    }

    return true;
  }, [logout, sessionTimeout]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Invalid email or password');
      }

      const data: {
        token: string;
        user: { id: string; email: string; fullName?: string | null; role?: string | null };
      } = await res.json();

      localStorage.setItem('authToken', data.token);

      const role = normalizeRole(data.user.role);
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        role,
      };

      setCurrentUser(authUser);

      const profile: UserProfile = {
        role,
        name: data.user.fullName || data.user.email.split('@')[0] || 'User',
        email: data.user.email,
        lastActivity: new Date(),
        sessionTimeout,
      };

      setUserProfile(profile);
      updateLastActivity();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name?: string, role?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName: name,
          role,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Registration failed');
      }

      await login(email, password);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    const initFromToken = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to load current user');
        }

        const data: {
          user: { id: string; email: string; fullName?: string | null; role?: string | null };
        } = await res.json();

        const role = normalizeRole(data.user.role);
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email,
          role,
        };

        setCurrentUser(authUser);
        setUserProfile({
          role,
          name: data.user.fullName || data.user.email.split('@')[0] || 'User',
          email: data.user.email,
          lastActivity: new Date(),
          sessionTimeout,
        });
        updateLastActivity();
      } catch (error) {
        console.error('Error initializing auth from token:', error);
        localStorage.removeItem('authToken');
        setCurrentUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    void initFromToken();
  }, [sessionTimeout, updateLastActivity]);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    login,
    register,
    logout,
    loading,
    updateLastActivity,
    checkSessionValidity,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

