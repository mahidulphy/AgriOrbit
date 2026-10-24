import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { Language } from '../../types';

interface AuthScreenProps {
  language: Language;
  onSuccess: (userName: string) => void;
  onBackToLanding: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  language,
  onSuccess,
  onBackToLanding,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [identifier, setIdentifier] = useState('farmer.rafiqul@agriorbit.org');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('••••••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess(name || 'Farmer Rafiqul');
  };

  const handleQuickDemo = () => {
    onSuccess('Demo Farmer (Rangpur)');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative font-editorial selection:bg-[#22C55E]/20 selection:text-[#22C55E]">
      {/* Back button */}
      <button
        onClick={onBackToLanding}
        className="absolute top-8 left-8 text-xs font-semibold text-[#A3A3A3] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{language === 'en' ? 'Back to Overview' : 'মূল পাতায় ফিরে যান'}</span>
      </button>

      {/* Auth Card Container */}
      <div className="w-full max-w-md bg-[#141414] border border-[#262626] rounded-lg p-8 sm:p-10 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <a href="#" aria-label="AgriOrbit" className="inline-block mx-auto mb-3">
            <picture className="block mx-auto">
              <source srcSet="/logo.webp" type="image/webp" />
              <source srcSet="/agriorbit-logo.webp" type="image/webp" />
              <img
                src="/logo.png"
                alt="AgriOrbit"
                className="h-10 sm:h-12 w-auto object-contain mix-blend-screen mx-auto"
                draggable={false}
              />
            </picture>
          </a>
          <h2 className="font-display text-2xl font-bold text-white">
            {language === 'en' ? 'Field Advisory Engine' : 'ফিল্ড অ্যাডভাইজরি ইঞ্জিন'}
          </h2>
          <p className="text-xs text-[#A3A3A3] mt-1">
            {language === 'en'
              ? 'Access your farm field analysis & rotation engine'
              : 'আপনার জমির উপগ্রহ তথ্য ও শস্য পরিকল্পনা ব্যবস্থা'}
          </p>
        </div>

        {/* Tab Toggle: Login vs Create Account */}
        <div className="grid grid-cols-2 p-1 bg-[#0A0A0A] rounded-lg border border-[#262626] mb-6">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              !isSignUp
                ? 'bg-[#22C55E] text-black font-semibold'
                : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            {language === 'en' ? 'Sign In' : 'লগইন'}
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              isSignUp
                ? 'bg-[#22C55E] text-black font-semibold'
                : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            {language === 'en' ? 'New Account' : 'নতুন অ্যাকাউন্ট'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-mono font-bold text-white mb-1.5 uppercase tracking-wider">
                {language === 'en' ? 'Farmer Name' : 'কৃষকের নাম'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#737373] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Farmer Name"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0A0A0A] border border-[#262626] text-white text-sm focus:outline-none focus:border-[#404040]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-bold text-white mb-1.5 uppercase tracking-wider">
              {language === 'en' ? 'Email or Mobile Number' : 'ইমেইল অথবা মোবাইল নম্বর'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#737373] absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="017XXXXXXXX or email@domain.com"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0A0A0A] border border-[#262626] text-white text-sm focus:outline-none focus:border-[#404040] font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-white mb-1.5 uppercase tracking-wider">
              {language === 'en' ? 'Password' : 'পাসওয়ার্ড'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#737373] absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0A0A0A] border border-[#262626] text-white text-sm focus:outline-none focus:border-[#404040]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-lg bg-[#22C55E] hover:bg-[#16a34a] text-black font-semibold text-sm transition-colors cursor-pointer"
          >
            {isSignUp
              ? language === 'en'
                ? 'Create Account & Continue'
                : 'অ্যাকাউন্ট তৈরি করে এগিয়ে যান'
              : language === 'en'
              ? 'Sign In to AgriOrbit'
              : 'লগইন করুন'}
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="mt-8 pt-6 border-t border-[#262626] text-center">
          <p className="text-[11px] text-[#A3A3A3] mb-3">
            {language === 'en' ? 'Instant access with preloaded demo profile:' : 'ডেমো প্রোফাইলে অবিলম্বে প্রবেশ করুন:'}
          </p>
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-[#262626] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            
            <span>
              {language === 'en'
                ? '1-Click Demo Login as Farmer Rafiqul'
                : '১-ক্লিকে ডেমো কৃষক হিসেবে লগইন'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
