import React, { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getAppOrigin } from '../lib/authUrl';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isGuest: boolean;
  displayName: string;
  avatarUrl: string | null;
  provider: 'google' | 'email' | 'guest' | null;
  onboardingCompleted: boolean | null;
  setOnboardingCompleted?: (completed: boolean | null) => void;
  setAsGuest: () => void;
  clearGuest: () => void;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: AuthError | Error | null }>;
  signInWithGoogleIdToken: (idToken: string) => Promise<{ error: AuthError | Error | null }>;
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

  const [profileFullName, setProfileFullName] = useState<string>('');
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const configured = isSupabaseConfigured();

      const fetchProfileDetails = async (userId: string) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('full_name, onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      if (error && (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema cache'))) {
        const fallback = await supabase
          .from('farmer_profiles')
          .select('full_name, onboarding_completed')
          .eq('id', userId)
          .maybeSingle();
        if (!fallback.error) {
          data = fallback.data;
          error = null;
        }
      }

      if (error) {
        console.error('AgriOrbit Auth: Error querying profile from database:', error.message);
        // Supabase is source of truth: if query errors, treat as not completed
        setOnboardingCompleted(false);
      } else if (data) {
        if (data.full_name && data.full_name.trim()) {
          setProfileFullName(data.full_name.trim());
        }
        const dbCompleted = data.onboarding_completed === true;
        setOnboardingCompleted(dbCompleted);

        // Requirement 3: If it differs from the localStorage cache, trust Supabase and update the cache
        try {
          const cacheKey = `agriorbit_farmer_profile_v2_${userId}`;
          const raw = localStorage.getItem(cacheKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.onboardingCompleted !== dbCompleted) {
              parsed.onboardingCompleted = dbCompleted;
              localStorage.setItem(cacheKey, JSON.stringify(parsed));
            }
          }
        } catch {
          // ignore storage error
        }
      } else {
        // No profile row exists yet in Supabase
        setOnboardingCompleted(false);
        try {
          const cacheKey = `agriorbit_farmer_profile_v2_${userId}`;
          const raw = localStorage.getItem(cacheKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.onboardingCompleted === true) {
              parsed.onboardingCompleted = false;
              localStorage.setItem(cacheKey, JSON.stringify(parsed));
            }
          }
        } catch {}
      }
    } catch (err: any) {
      console.error('AgriOrbit Auth: Exception querying profile from database:', err?.message || 'Query error');
      setOnboardingCompleted(false);
    }
  };

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
          fetchProfileDetails(session.user.id);
        } else {
          setProfileFullName('');
          setOnboardingCompleted(null);
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
        fetchProfileDetails(currentSession.user.id);
      } else {
        setProfileFullName('');
        setOnboardingCompleted(null);
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

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfileDetails(user.id);
    }
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
      // Mark fresh sign-in to trigger post-login onboarding check upon redirect return
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('agriorbit_fresh_signin', 'true');
      }

      // Use window.location.origin directly (e.g. https://agri-orbit.vercel.app or http://localhost:5173)
      const redirectUrl = getAppOrigin();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      return { error };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  // Google Sign-In with ID Token (Client-Side Google Identity Services flow)
  const signInWithGoogleIdToken = async (idToken: string) => {
    if (!configured) {
      return {
        error: new Error(
          'Supabase credentials are not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
        ),
      };
    }

    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('agriorbit_fresh_signin', 'true');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (!error && data.session) {
        clearGuest();
        setSession(data.session);
        setUser(data.user);
        if (data.user) {
          await fetchProfileDetails(data.user.id);
        }
      }

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
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('agriorbit_fresh_signin', 'true');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!error && data.user) {
        clearGuest();
        await fetchProfileDetails(data.user.id);
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
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('agriorbit_fresh_signin', 'true');
      }

      const emailRedirectTo = getAppOrigin();

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
      const redirectTo = getAppOrigin();

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
    // Clear all session/local storage for AgriOrbit (tokens, fields, preferences)
    try {
      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('agriorbit_') || k.startsWith('sb-') || k.includes('supabase'))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        sessionStorage.clear();
      }
    } catch (e) {
      console.warn('Error clearing storage on sign out', e);
    }
    setUser(null);
    setSession(null);
    setProfileFullName('');
    setOnboardingCompleted(null);
    setIsGuest(false);
    if (typeof window !== 'undefined') {
      window.location.hash = '';
    }
  };

  // User metadata resolution
  // Profile table full_name -> user_metadata full_name / name -> email prefix -> Guest
  const displayName = useMemo(() => {
    if (profileFullName) return profileFullName;
    if (user?.user_metadata?.full_name) return String(user.user_metadata.full_name);
    if (user?.user_metadata?.name) return String(user.user_metadata.name);
    if (user?.email) return user.email.split('@')[0];
    if (isGuest) return 'Guest';
    return '';
  }, [profileFullName, user, isGuest]);

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
    onboardingCompleted,
    setAsGuest,
    clearGuest,
    refreshProfile,
    signInWithGoogle,
    signInWithGoogleIdToken,
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
