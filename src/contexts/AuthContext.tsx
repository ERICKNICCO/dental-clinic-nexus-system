
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
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  useEffect(() => {
    // Helper to fetch user profile from users table
    const fetchUserProfile = async (user: any) => {
      if (!user) {
        setUserProfile(null);
        return;
      }
      const { data, error } = await supabase
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

    // Initial check
    const session = supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user || null;
      setCurrentUser(user);
      fetchUserProfile(user);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setCurrentUser(user);
      fetchUserProfile(user);
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
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
