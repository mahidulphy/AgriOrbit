import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

export interface OnboardingStatusResult {
  isOnboarded: boolean;
  profileExists: boolean;
  error?: any;
}

/**
 * Checks the user's onboarding completion status from the database.
 * 
 * Rules:
 * - Uses the onboarding_completed boolean flag, not whether a profile row exists.
 * - If profiles query fails (for example, column does not exist or table missing),
 *   logs the error and treats the user as NOT onboarded. Never treats an error as "completed".
 * - Checks public.profiles first, falling back to public.farmer_profiles.
 */
export async function getOnboardingStatus(userId: string): Promise<OnboardingStatusResult> {
  if (!isSupabaseConfigured() || !userId) {
    return { isOnboarded: false, profileExists: false };
  }

  try {
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, onboarding_completed')
      .eq('id', userId)
      .maybeSingle();

    // If profiles table or column does not exist, try fallback table
    if (error && (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema cache'))) {
      const fallback = await supabase
        .from('farmer_profiles')
        .select('id, full_name, onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      if (!fallback.error) {
        profile = fallback.data;
        error = null;
      }
    }

    if (error) {
      console.error('AgriOrbit: Error querying profiles table for onboarding status:', error.message);
      return { isOnboarded: false, profileExists: false, error };
    }

    if (!profile) {
      return { isOnboarded: false, profileExists: false };
    }

    // Supabase is source of truth
    const isOnboarded = profile.onboarding_completed === true;

    // Requirement 3: If it differs from the localStorage cache, trust Supabase and update the cache
    try {
      const cacheKey = `agriorbit_farmer_profile_v2_${userId}`;
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.onboardingCompleted !== isOnboarded) {
          parsed.onboardingCompleted = isOnboarded;
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
        }
      }
    } catch {}

    return { isOnboarded, profileExists: true };
  } catch (err: any) {
    console.error('AgriOrbit: Unexpected error checking onboarding status:', err?.message || 'Check error');
    return { isOnboarded: false, profileExists: false, error: err };
  }
}

/**
 * Executes post-login profile verification, auto-creation of missing profile row,
 * and smart navigation to #/onboarding or #/dashboard.
 * 
 * Rules:
 * 1. Only redirect right after a fresh sign-in (event SIGNED_IN coming from the OAuth return).
 * 2. If no profiles row exists for a new user, create one using upsert
 *    (id = user.id, full_name from user_metadata, onboarding_completed = false).
 * 3. Make the guard use the onboarding_completed flag, not "a profile row exists".
 * 4. If the profiles query fails, log the error and treat user as NOT onboarded. Never treat error as "completed".
 * 5. Redirect: if no profile row exists, or onboarding_completed is not true, go to #/onboarding; otherwise go to #/dashboard.
 */
export async function checkAndRedirectPostLogin(user: User): Promise<void> {
  if (!user) return;

  const status = await getOnboardingStatus(user.id);

  // Requirement 2: If no profiles row exists for a new user, create one using upsert
  if (!status.profileExists) {
    const meta = user.user_metadata || {};
    const fullName = meta.full_name || meta.name || user.email?.split('@')[0] || 'Farmer';
    const avatarUrl = meta.avatar_url || meta.picture || null;

    try {
      const { error: upsertErr } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          full_name: fullName,
          avatar_url: avatarUrl,
          onboarding_completed: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (upsertErr) {
        console.error('AgriOrbit: Error creating initial profile row in profiles table:', upsertErr);
      }
    } catch (e) {
      console.error('AgriOrbit: Exception creating initial profile row in profiles:', e);
    }

    // Also try farmer_profiles for schema compatibility
    try {
      await supabase.from('farmer_profiles').upsert(
        {
          id: user.id,
          full_name: fullName,
          avatar_url: avatarUrl,
          onboarding_completed: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch {
      // ignore fallback error
    }
  }

  // Clean the token hash from address bar without page reload
  if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
    window.history.replaceState(null, '', window.location.pathname);
  }

  // Navigate:
  // "if no profile row exists, or onboarding_completed is not true, go to #/onboarding; otherwise go to #/dashboard."
  if (status.isOnboarded) {
    window.location.hash = '#/dashboard';
  } else {
    window.location.hash = '#/onboarding';
  }
}
