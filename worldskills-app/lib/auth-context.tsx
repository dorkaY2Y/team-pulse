import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, UserProfile, UserRole } from './supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    setProfile(data as UserProfile | null);
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signUp(email: string, password: string, fullName: string, role: UserRole = 'competitor') {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (!error && data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
      });
    }

    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      role: profile?.role || null,
      loading,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
