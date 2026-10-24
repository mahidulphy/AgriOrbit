import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Lock, ArrowRight } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../lang';
import { checkAndRedirectPostLogin } from '../../lib/onboardingGuard';

export const AuthCallbackPage: React.FC = () => {
  const { updatePassword, user } = useAuth();
  const { lang } = useLang();

  const [status, setStatus] = useState<'verifying' | 'recovery' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recovery password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      try {
        // Check hash fragments or query parameters for recovery or error
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        const combined = `${hash}&${search}`;

        // Error detection from OAuth redirect
        if (combined.includes('error=') || combined.includes('error_description=')) {
          const match = combined.match(/error_description=([^&]+)/);
          const desc = match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : 'Authentication was canceled or failed.';
          if (mounted) {
            setStatus('error');
            setErrorMessage(desc);
          }
          return;
        }

        // Check if this is a password reset recovery session
        if (combined.includes('type=recovery') || hash.includes('type=recovery')) {
          if (mounted) {
            setStatus('recovery');
          }
          return;
        }

        // Check for PKCE authorization code in query parameters or hash
        const urlParams = new URLSearchParams(window.location.search);
        const hashStr = window.location.hash || '';
        const hashParams = hashStr.includes('?')
          ? new URLSearchParams(hashStr.substring(hashStr.indexOf('?')))
          : hashStr.includes('&') || hashStr.includes('=')
            ? new URLSearchParams(hashStr.replace(/^#\/?(auth\/callback)?\??/, ''))
            : new URLSearchParams();

        const code = urlParams.get('code') || hashParams.get('code');
        if (code) {
          try {
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (!exchangeError && exchangeData.session) {
              if (mounted) {
                setStatus('success');
                setTimeout(async () => {
                  await checkAndRedirectPostLogin(exchangeData.session.user);
                }, 800);
                return;
              }
            }
          } catch {
            // If already exchanged or handled by auto-detect, fallback to getSession
          }
        }

        // Standard OAuth or email verification confirmation
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session) {
          if (mounted) {
            setStatus('success');
            setTimeout(async () => {
              await checkAndRedirectPostLogin(data.session.user);
            }, 800);
          }
        } else {
          // Listen briefly for session event if still initializing
          const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
            if (session && mounted) {
              setStatus('success');
              sub.subscription.unsubscribe();
              setTimeout(async () => {
                await checkAndRedirectPostLogin(session.user);
              }, 800);
            }
          });

          // Timeout fallback
          setTimeout(async () => {
            if (mounted && status === 'verifying') {
              const { data: s } = await supabase.auth.getSession();
              if (s?.session?.user) {
                await checkAndRedirectPostLogin(s.session.user);
              } else {
                window.location.hash = '#/onboarding';
              }
            }
          }, 3000);
        }
      } catch (err: any) {
        if (mounted) {
          setStatus('error');
          setErrorMessage(err?.message || 'Failed to complete authentication handshake.');
        }
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage(
        lang === 'en'
          ? 'Password must be at least 6 characters long.'
          : 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage(
        lang === 'en' ? 'Passwords do not match.' : 'উভয় পাসওয়ার্ড একই হতে হবে।'
      );
      return;
    }

    setUpdating(true);
    setErrorMessage(null);

    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setErrorMessage(error.message);
      } else {
        setUpdateSuccess(true);
        setTimeout(() => {
          window.location.hash = '#/dashboard';
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update password.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AuthLayout
      title={
        status === 'recovery'
          ? lang === 'en'
            ? 'Set New Password'
            : 'নতুন পাসওয়ার্ড নির্ধারণ'
          : lang === 'en'
          ? 'Security Verification'
          : 'নিরাপত্তা যাচাইকরণ'
      }
      subtitle={
        status === 'recovery'
          ? lang === 'en'
            ? 'Choose a secure password for your AgriOrbit account.'
            : 'আপনার এগ্রিঅরবিট অ্যাকাউন্টের জন্য নতুন পাসওয়ার্ড লিখুন।'
          : lang === 'en'
          ? 'Verifying cryptographic security token with satellite auth servers...'
          : 'উপগ্রহ অথেনটিকেশন সার্ভারের সাথে টোকেন যাচাই করা হচ্ছে...'
      }
      error={errorMessage}
    >
      {status === 'verifying' && (
        <div className="py-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-lg bg-[#141414] border border-[#262626] flex items-center justify-center mx-auto text-[#22C55E]">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <h3 className="font-display font-bold text-lg text-white">
            {lang === 'en' ? 'Authenticating Session...' : 'সেশন যাচাই হচ্ছে...'}
          </h3>
          <p className="text-xs text-slate-300 font-mono">
            {lang === 'en'
              ? 'Handshaking credentials. You will be redirected momentarily.'
              : 'তথ্য যাচাই করা হচ্ছে। কিছুক্ষণের মধ্যে আপনার অ্যাকাউন্টে প্রবেশ করবেন।'}
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="py-8 text-center space-y-4 animate-fadeIn">
          <div className="w-14 h-14 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center mx-auto text-[#22C55E]">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-display font-bold text-lg text-white">
            {lang === 'en' ? 'Authentication Complete' : 'লগইন সফল হয়েছে'}
          </h3>
          <p className="text-xs text-slate-300 font-mono">
            {lang === 'en' ? 'Checking farm profile...' : 'খামার প্রোফাইল যাচাই করা হচ্ছে...'}
          </p>
        </div>
      )}

      {status === 'recovery' && (
        <div className="space-y-5 animate-fadeIn">
          {updateSuccess ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#22C55E] mx-auto" />
              <h4 className="font-display font-bold text-white text-base">
                {lang === 'en' ? 'Password Updated Successfully' : 'পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে'}
              </h4>
              <p className="text-xs text-slate-300 font-mono">
                {lang === 'en' ? 'Proceeding to your dashboard...' : 'ড্যাশবোর্ডে প্রবেশ করানো হচ্ছে...'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="callback-new-password"
                  className="block text-xs font-mono text-slate-300 font-medium mb-1.5"
                >
                  {lang === 'en' ? 'New Password' : 'নতুন পাসওয়ার্ড'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="callback-new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#262626] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#404040]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="callback-confirm-new-password"
                  className="block text-xs font-mono text-slate-300 font-medium mb-1.5"
                >
                  {lang === 'en' ? 'Confirm New Password' : 'নতুন পাসওয়ার্ড নিশ্চিত করুন'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="callback-confirm-new-password"
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#262626] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#404040]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full py-3 px-4 rounded-lg bg-[#22C55E] hover:bg-[#16a34a] text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {updating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <>
                    <span>{lang === 'en' ? 'Save New Password & Continue' : 'পাসওয়ার্ড সংরক্ষণ করুন'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="py-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-lg bg-[#FF5C5C]/15 border border-[#FF5C5C]/40 flex items-center justify-center mx-auto text-[#FF5C5C]">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="font-display font-bold text-lg text-white">
            {lang === 'en' ? 'Verification Problem' : 'যাচাইকরণে ত্রুটি'}
          </h3>
          <p className="text-xs text-slate-300 max-w-xs mx-auto">
            {errorMessage || (lang === 'en' ? 'An unexpected error occurred.' : 'একটি অপ্রত্যাশিত সমস্যা দেখা দিয়েছে।')}
          </p>
          <div className="pt-2">
            <a
              href="#/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-[#262626] text-white font-mono text-xs cursor-pointer"
            >
              <span>{lang === 'en' ? 'Return to Sign In' : 'লগইনে ফিরে যান'}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};
