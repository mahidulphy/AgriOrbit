import React, { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isGuest: boolean;
  displayName: string;
  avatarUrl: string | null;
  provider: 'google' | 'email' | 'guest' | null;
  setAsGuest: () => void;
  clearGuest: () => void;
  signInWithGoogle: () => Promise<{ error: AuthError | Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ error: AuthError | Error | null; user: User | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const GUEST_STORAGE_KEY = 'agriorbit_guest_mode';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem(GUEST_STORAGE_KEY) === 'true';
  });

  const configured = isSupabaseConfigured();

  // Initialize session & listen to auth state changes
  useEffect(() => {
    let mounted = true;

    if (!configured) {
      setLoading(false);
      return;
    }

    // 1. Fetch initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setIsGuest(false);
          localStorage.removeItem(GUEST_STORAGE_KEY);
        }
      })
      .catch((err) => {
        console.warn('AgriOrbit Auth: Unable to fetch initial session', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    // 2. Subscribe to auth events (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED, USER_UPDATED)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        setIsGuest(false);
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  // Guest helpers
  const setAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem(GUEST_STORAGE_KEY, 'true');
  };

  const clearGuest = () => {
    setIsGuest(false);
    localStorage.removeItem(GUEST_STORAGE_KEY);
  };

  // Google OAuth flow
  const signInWithGoogle = async () => {
    if (!configured) {
      return {
        error: new Error(
          'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not configured yet.'
        ),
      };
    }

    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}#/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      return { error };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  // Email/Password sign-in
  const signInWithEmail = async (email: string, password: string) => {
    if (!configured) {
      return {
        error: new Error(
          'Supabase credentials are not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
        ),
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!error && data.user) {
        clearGuest();
      }

      return { error };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  // Email/Password sign-up with display name
  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    if (!configured) {
      return {
        error: new Error(
          'Supabase credentials are not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
        ),
        user: null,
      };
    }

    try {
      const emailRedirectTo = `${window.location.origin}${window.location.pathname}#/auth/callback`;
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo,
          data: displayName ? { full_name: displayName.trim(), name: displayName.trim() } : undefined,
        },
      });

      if (!error && data.user) {
        clearGuest();
      }

      return { error, user: data.user };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)), user: null };
    }
  };

  // Forgot password reset link dispatch
  const resetPassword = async (email: string) => {
    if (!configured) {
      return {
        error: new Error(
          'Supabase credentials are not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
        ),
      };
    }

    try {
      const redirectTo = `${window.location.origin}${window.location.pathname}#/auth/callback?type=recovery`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      return { error };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  // Update password (used when returning from password reset link)
  const updatePassword = async (password: string) => {
    if (!configured) {
      return {
        error: new Error('Supabase credentials are not configured.'),
      };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      return { error };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  // Sign out
  const signOut = async () => {
    clearGuest();
    if (configured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Error during Supabase signOut', err);
      }
    }
    setUser(null);
    setSession(null);
  };

  // User metadata resolution
  const displayName = useMemo(() => {
    if (user?.user_metadata?.full_name) return String(user.user_metadata.full_name);
    if (user?.user_metadata?.name) return String(user.user_metadata.name);
    if (user?.email) return user.email.split('@')[0];
    if (isGuest) return 'Guest Farmer';
    return '';
  }, [user, isGuest]);

  const avatarUrl = useMemo(() => {
    if (user?.user_metadata?.avatar_url) return String(user.user_metadata.avatar_url);
    if (user?.user_metadata?.picture) return String(user.user_metadata.picture);
    return null;
  }, [user]);

  const provider = useMemo((): 'google' | 'email' | 'guest' | null => {
    if (isGuest && !user) return 'guest';
    if (!user) return null;
    const p = user.app_metadata?.provider;
    if (p === 'google') return 'google';
    return 'email';
  }, [user, isGuest]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    isConfigured: configured,
    isGuest,
    displayName,
    avatarUrl,
    provider,
    setAsGuest,
    clearGuest,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    updatePassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
