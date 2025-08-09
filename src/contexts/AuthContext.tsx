
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

interface UserProfile {
  role: 'admin' | 'doctor' | 'staff' | 'radiologist';
  name: string;
  email: string;
}

interface AuthContextType {
  currentUser: any | null; // Supabase user object
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // currentUser and userProfile will be set by the onAuthStateChange listener
  };

  const register = async (email: string, password: string, name?: string, role?: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // Optionally, insert into users table
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        name: name || email.split('@')[0],
        role: role || 'doctor',
      });
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      // Ensure local state is cleared even if Supabase returns session_not_found
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Helper to fetch user profile from users table
    const fetchUserProfile = async (user: any) => {
      if (!user) {
        setUserProfile(null);
        return;
      }
      const { data } = await supabase
        .from('users')
        .select('role, name, email')
        .eq('id', user.id)
        .single();
      if (data) {
        setUserProfile(data as UserProfile);
      } else {
        // Fallback if no profile exists
        setUserProfile({
          role: 'doctor',
          name: user.email?.split('@')[0] || 'User',
          email: user.email || '',
        });
      }
    };

    // Listen FIRST, then check for existing session
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setCurrentUser(user);
      // Avoid supabase calls directly inside the callback; defer if needed
      if (user) {
        setTimeout(() => fetchUserProfile(user), 0);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    // THEN get the current session
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user || null;
      setCurrentUser(user);
      if (user) {
        fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
