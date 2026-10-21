// AgriOrbit App Routing with Authentication Guards and Hash-Routing Preservation
import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { LandingPage } from './components/landing/LandingPage.tsx';
import { AnalyzePage } from './components/analyze/AnalyzePage.tsx';
import { LoginPage, SignUpPage, ForgotPasswordPage, AuthCallbackPage } from './components/auth';
import { PrivacyPolicyPage, TermsPage } from './components/legal';
import { FarmerProfilePage } from './components/profile/FarmerProfilePage.tsx';
import { OnboardingWizardPage } from './components/onboarding/OnboardingWizardPage.tsx';
import { useAuth } from './contexts/AuthContext.tsx';
import { supabase } from './lib/supabase.ts';
import { checkAndRedirectPostLogin } from './lib/onboardingGuard.ts';

export type AppRoute =
  | 'landing'
  | 'dashboard'
  | 'onboarding'
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'callback'
  | 'privacy'
  | 'terms'
  | 'profile';

export function resolveCurrentRoute(): AppRoute {
  if (typeof window === 'undefined') return 'landing';

  const hash = window.location.hash || '';
  const path = window.location.pathname || '';

  // Farmer Profile page
  if (hash.startsWith('#/profile') || path === '/profile' || path.startsWith('/profile')) return 'profile';

  // Legal pages
  if (hash.startsWith('#/privacy') || path === '/privacy' || path.startsWith('/privacy')) return 'privacy';
  if (hash.startsWith('#/terms') || path === '/terms' || path.startsWith('/terms')) return 'terms';

  // Auth callback / token processing (ensures #access_token=... is NEVER treated as a 404 or random route)
  const isAuthCallback =
    hash.startsWith('#/auth/callback') ||
    path.startsWith('/auth/callback') ||
    hash.includes('access_token=') ||
    hash.includes('refresh_token=') ||
    hash.includes('error_description=') ||
    (typeof window !== 'undefined' && (
      window.location.search.includes('code=') ||
      window.location.search.includes('error=')
    ));

  if (isAuthCallback) return 'callback';

  // Auth pages
  if (hash.startsWith('#/login') || path === '/login' || path.startsWith('/login')) return 'login';
  if (hash.startsWith('#/signup') || path === '/signup' || path.startsWith('/signup')) return 'signup';
  if (hash.startsWith('#/forgot-password') || path === '/forgot-password' || path.startsWith('/forgot-password')) return 'forgot-password';

  // Onboarding route
  if (hash.startsWith('#/onboarding') || path === '/onboarding' || path.startsWith('/onboarding')) {
    return 'onboarding';
  }

  // Dashboard & Workspace routes (#/dashboard, #/analyze, /dashboard, /analyze)
  if (
    hash.startsWith('#/dashboard') ||
    path === '/dashboard' ||
    path.startsWith('/dashboard') ||
    hash.startsWith('#/analyze') ||
    path === '/analyze' ||
    path.startsWith('/analyze')
  ) {
    return 'dashboard';
  }

  // Public landing page (including in-page anchors: #field-shift, #crops, #data...)
  return 'landing';
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(resolveCurrentRoute);
  const { user, isGuest, loading, onboardingCompleted } = useAuth();

  // Detect whether the app was loaded directly from an OAuth callback or explicit signin
  const incomingIsOAuth = typeof window !== 'undefined' && (
    window.location.hash.includes('access_token=') ||
    window.location.hash.includes('refresh_token=') ||
    window.location.search.includes('code=') ||
    window.location.hash.includes('code=') ||
    window.location.pathname.startsWith('/auth/callback') ||
    window.location.hash.startsWith('#/auth/callback') ||
    sessionStorage.getItem('agriorbit_fresh_signin') === 'true'
  );
  const wasFreshSignIn = useRef(incomingIsOAuth);

  useEffect(() => {
    // 1. Supabase OAuth & Auth State Listener at App Startup
    // When Google OAuth or sign-in succeeds with a fresh signin:
    // Fetch profile for session.user.id and redirect:
    // if no profile row exists, or onboarding_completed is not true -> go to #/onboarding
    // otherwise -> go to #/dashboard
    // Only redirect right after a fresh sign-in (event SIGNED_IN from OAuth return),
    // not on every page load or token refresh, so signed-in users can still browse the landing page.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        const isRecovery = hash.includes('type=recovery') || search.includes('type=recovery');

        if (!isRecovery && (wasFreshSignIn.current || sessionStorage.getItem('agriorbit_fresh_signin') === 'true')) {
          wasFreshSignIn.current = false;
          sessionStorage.removeItem('agriorbit_fresh_signin');
          await checkAndRedirectPostLogin(session.user);
        }
      }
    });

    // 2. Hash and History Route Synchronization
    const onRouteSync = () => {
      const next = resolveCurrentRoute();
      setRoute((prev) => {
        if (prev !== next) window.scrollTo(0, 0);
        return next;
      });
    };

    window.addEventListener('hashchange', onRouteSync);
    window.addEventListener('popstate', onRouteSync);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hashchange', onRouteSync);
      window.removeEventListener('popstate', onRouteSync);
    };
  }, []);

  // Protected route guard for field dashboard & analyze workspace (#/dashboard, #/analyze)
  if (route === 'dashboard') {
    if (loading) {
      return (
        <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center justify-center p-4">
          <div className="w-12 h-12 rounded-2xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 flex items-center justify-center text-[#00E5FF] mb-3">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <p className="font-mono text-xs text-slate-400">Loading AgriOrbit dashboard...</p>
        </div>
      );
    }

    // If unauthenticated and not in guest mode, redirect to login while preserving target
    if (!user && !isGuest) {
      const target = window.location.hash || '#/dashboard';
      window.location.hash = `#/login?redirect=${encodeURIComponent(target)}`;
      return null;
    }

    // Guest mode: skips onboarding and enters workspace directly
    if (isGuest) {
      return <AnalyzePage />;
    }

    // Signed-in user: guard #/dashboard and #/analyze
    if (user) {
      if (onboardingCompleted === null) {
        
        return (
          <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center justify-center p-4">
            <div className="w-12 h-12 rounded-2xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 flex items-center justify-center text-[#00E5FF] mb-3">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <p className="font-mono text-xs text-slate-400">Verifying farm registration status...</p>
          </div>
        );
      }

      // Requirement 3 & 5: Guard uses the onboarding_completed flag.
      // Redirect to #/onboarding if onboarding is not completed.
      if (onboardingCompleted !== true) {
        
        window.location.hash = '#/onboarding';
        return null;
      }

      
    }

    return <AnalyzePage />;
  }

  // Onboarding Wizard route
  if (route === 'onboarding') {
    return <OnboardingWizardPage />;
  }

  // Public authentication routes
  if (route === 'login') {
    if (!loading && (user || isGuest)) {
      if (isGuest || onboardingCompleted === true) {
        window.location.hash = '#/dashboard';
        return null;
      }
      if (onboardingCompleted === false) {
        window.location.hash = '#/onboarding';
        return null;
      }
    }
    return <LoginPage />;
  }

  if (route === 'signup') {
    if (!loading && user) {
      if (onboardingCompleted === true) {
        window.location.hash = '#/dashboard';
        return null;
      }
      if (onboardingCompleted === false) {
        window.location.hash = '#/onboarding';
        return null;
      }
    }
    return <SignUpPage />;
  }

  if (route === 'forgot-password') {
    return <ForgotPasswordPage />;
  }

  if (route === 'callback') {
    return <AuthCallbackPage />;
  }

  if (route === 'privacy') {
    return <PrivacyPolicyPage />;
  }

  if (route === 'terms') {
    return <TermsPage />;
  }

  if (route === 'profile') {
    return <FarmerProfilePage />;
  }

  return <LandingPage />;
}
