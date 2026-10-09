import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, Sparkles } from 'lucide-react';
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
  const [name, setName] = useState('Md. Rafiqul Islam');
  const [password, setPassword] = useState('••••••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess(name || 'Farmer Rafiqul');
  };

  const handleQuickDemo = () => {
    onSuccess('Md. Rafiqul Islam (Mithapukur, Rangpur)');
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative font-editorial selection:bg-[#B8FF3D]/30 selection:text-[#B8FF3D]">
      {/* Back button */}
      <button
        onClick={onBackToLanding}
        className="absolute top-8 left-8 text-xs font-semibold text-[#8FA3B8] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{language === 'en' ? 'Back to Overview' : 'মূল পাতায় ফিরে যান'}</span>
      </button>

      {/* Auth Card Container */}
      <div className="w-full max-w-md bg-[#0B1626] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <img
            src="/assets/agriorbit-logo.png"
            alt="AgriOrbit"
            className="h-12 w-auto object-contain mix-blend-screen mx-auto mb-3"
            draggable={false}
          />
          <h2 className="font-display text-2xl font-bold text-white">
            {language === 'en' ? 'Field Advisory Engine' : 'ফিল্ড অ্যাডভাইজরি ইঞ্জিন'}
          </h2>
          <p className="text-xs text-[#8FA3B8] mt-1">
            {language === 'en'
              ? 'Access your farm field analysis & rotation engine'
              : 'আপনার জমির উপগ্রহ তথ্য ও শস্য পরিকল্পনা ব্যবস্থা'}
          </p>
        </div>

        {/* Tab Toggle: Login vs Create Account */}
        <div className="grid grid-cols-2 p-1 bg-[#050B14] rounded-xl border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              !isSignUp
                ? 'bg-[#B8FF3D] text-[#050B14] font-bold shadow-sm'
                : 'text-[#8FA3B8] hover:text-white'
            }`}
          >
            {language === 'en' ? 'Sign In' : 'লগইন'}
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              isSignUp
                ? 'bg-[#B8FF3D] text-[#050B14] font-bold shadow-sm'
                : 'text-[#8FA3B8] hover:text-white'
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
                <User className="w-4 h-4 text-[#00E5FF] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Md. Rafiqul Islam"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#050B14] border border-white/10 text-white text-sm focus:outline-none focus:border-[#B8FF3D]/60"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-bold text-white mb-1.5 uppercase tracking-wider">
              {language === 'en' ? 'Email or Mobile Number' : 'ইমেইল অথবা মোবাইল নম্বর'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#00E5FF] absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="017XXXXXXXX or email@domain.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#050B14] border border-white/10 text-white text-sm focus:outline-none focus:border-[#B8FF3D]/60 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-white mb-1.5 uppercase tracking-wider">
              {language === 'en' ? 'Password' : 'পাসওয়ার্ড'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#00E5FF] absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#050B14] border border-white/10 text-white text-sm focus:outline-none focus:border-[#B8FF3D]/60"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/90 text-[#050B14] font-bold text-sm tracking-tight transition-all duration-150 transform hover:-translate-y-0.5 shadow-xl shadow-[#B8FF3D]/20 cursor-pointer"
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
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-[11px] text-[#8FA3B8] mb-3">
            {language === 'en' ? 'Instant access with preloaded demo profile:' : 'ডেমো প্রোফাইলে অবিলম্বে প্রবেশ করুন:'}
          </p>
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-[#00E5FF]/30 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B8FF3D]" />
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
