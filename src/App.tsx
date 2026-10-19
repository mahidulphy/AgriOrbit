// AgriOrbit App Routing with Authentication Guards and Hash-Routing Preservation
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { LandingPage } from './components/landing/LandingPage.tsx';
import { AnalyzePage } from './components/analyze/AnalyzePage.tsx';
import { LoginPage, SignUpPage, ForgotPasswordPage, AuthCallbackPage } from './components/auth';
import { useAuth } from './contexts/AuthContext.tsx';

export type AppRoute = 'landing' | 'analyze' | 'login' | 'signup' | 'forgot-password' | 'callback';

export function resolveCurrentRoute(): AppRoute {
  if (typeof window === 'undefined') return 'landing';

  const hash = window.location.hash || '';
  const path = window.location.pathname || '';

  // Auth callback handler
  if (hash.startsWith('#/auth/callback') || path.startsWith('/auth/callback')) return 'callback';

  // Auth pages
  if (hash.startsWith('#/login') || path === '/login' || path.startsWith('/login')) return 'login';
  if (hash.startsWith('#/signup') || path === '/signup' || path.startsWith('/signup')) return 'signup';
  if (hash.startsWith('#/forgot-password') || path === '/forgot-password' || path.startsWith('/forgot-password')) return 'forgot-password';

  // Protected workspace routes
  if (hash.startsWith('#/analyze') || path === '/analyze' || path.startsWith('/analyze')) return 'analyze';

  // Public landing page (including in-page anchors: #field-shift, #crops, #data...)
  return 'landing';
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(resolveCurrentRoute);
  const { user, isGuest, loading } = useAuth();

  useEffect(() => {
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
      window.removeEventListener('hashchange', onRouteSync);
      window.removeEventListener('popstate', onRouteSync);
    };
  }, []);

  // Protected route guard for field analysis workspace
  if (route === 'analyze') {
    if (loading) {
      return (
        <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center justify-center p-4">
          <div className="w-12 h-12 rounded-2xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 flex items-center justify-center text-[#00E5FF] mb-3">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <p className="font-mono text-xs text-slate-400">Verifying satellite session...</p>
        </div>
      );
    }

    // If unauthenticated and not in guest mode, redirect to login while preserving target
    if (!user && !isGuest) {
      const target = window.location.hash || '#/analyze/dashboard';
      window.location.hash = `#/login?redirect=${encodeURIComponent(target)}`;
      return null;
    }

    return <AnalyzePage />;
  }

  // Public authentication routes
  if (route === 'login') {
    if (!loading && (user || isGuest)) {
      window.location.hash = '#/analyze/dashboard';
      return null;
    }
    return <LoginPage />;
  }

  if (route === 'signup') {
    if (!loading && user) {
      window.location.hash = '#/analyze/dashboard';
      return null;
    }
    return <SignUpPage />;
  }

  if (route === 'forgot-password') {
    return <ForgotPasswordPage />;
  }

  if (route === 'callback') {
    return <AuthCallbackPage />;
  }

  return <LandingPage />;
}
