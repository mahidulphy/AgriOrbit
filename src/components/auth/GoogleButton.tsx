import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../lang';
import { supabase } from '../../lib/supabase';
import { checkAndRedirectPostLogin } from '../../lib/onboardingGuard';

interface GoogleButtonProps {
  onError?: (message: string) => void;
  onSuccess?: () => void;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({ onError, onSuccess }) => {
  const { signInWithGoogle, signInWithGoogleIdToken } = useAuth();
  const { lang } = useLang();
  const [loading, setLoading] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const googleClientId = (
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    (import.meta.env as any).NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    ''
  ).trim();

  useEffect(() => {
    if (!googleClientId) return;

    let isMounted = true;

    const initializeGsi = () => {
      if (!isMounted) return;
      const google = (window as any).google;
      if (google?.accounts?.id && googleBtnContainerRef.current) {
        try {
          google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: any) => {
              if (!response?.credential) return;
              setLoading(true);
              try {
                const { error } = await signInWithGoogleIdToken(response.credential);
                if (error) {
                  onError?.(error.message);
                } else {
                  onSuccess?.();
                  const { data: s } = await supabase.auth.getSession();
                  if (s?.session?.user) {
                    await checkAndRedirectPostLogin(s.session.user);
                  } else {
                    window.location.hash = '#/onboarding';
                  }
                }
              } catch (err: any) {
                onError?.(err?.message || 'Failed to authenticate with Google ID token');
              } finally {
                setLoading(false);
              }
            },
          });

          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: googleBtnContainerRef.current.clientWidth || 340,
            });
            setGisReady(true);
          }
        } catch (e) {
          console.warn('AgriOrbit Google GSI initialization note:', e);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initializeGsi();
    } else {
      const existingScript = document.getElementById('google-gsi-client');
      if (existingScript) {
        existingScript.addEventListener('load', initializeGsi);
      } else {
        const script = document.createElement('script');
        script.id = 'google-gsi-client';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGsi;
        document.head.appendChild(script);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [googleClientId]);

  // Standard redirect fallback
  const handleClick = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        onError?.(error.message);
      }
    } catch (err: any) {
      onError?.(err?.message || 'Failed to initialize Google Sign In');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full relative">
      {/* If Google Identity Services (GIS) Client ID is configured, render Google's official iframe button */}
      {googleClientId && (
        <div
          ref={googleBtnContainerRef}
          className={`w-full flex justify-center [&>iframe]:!w-full [&>div]:!w-full ${
            gisReady ? 'block' : 'hidden'
          }`}
        />
      )}

      {/* Fallback button when GIS is not configured or still loading */}
      {(!googleClientId || !gisReady) && (
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-md shadow-black/20 hover:shadow-lg disabled:opacity-60 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{lang === 'en' ? 'Continue with Google' : 'গুগল দিয়ে এগিয়ে যান'}</span>
        </button>
      )}

      {/* Loading overlay for GIS token verification */}
      {loading && gisReady && (
        <div className="absolute inset-0 bg-[#141414]/90 rounded-xl flex items-center justify-center gap-2 text-white text-xs font-mono">
          <Loader2 className="w-4 h-4 animate-spin text-[#22C55E]" />
          <span>{lang === 'en' ? 'Verifying with Google...' : 'যাচাই করা হচ্ছে...'}</span>
        </div>
      )}
    </div>
  );
};
