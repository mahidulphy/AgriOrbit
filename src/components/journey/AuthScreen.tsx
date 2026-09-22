import React, { useState } from 'react';
import { Satellite, ArrowLeft, Mail, Lock, User, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-[#2E1065] text-[#E9D5FF] flex flex-col justify-center items-center p-4 sm:p-6 relative selection:bg-[#A855F7] selection:text-white">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-[#6D28D9]/20 blur-[120px] pointer-events-none rounded-full" />

      {/* Back button */}
      <button
        onClick={onBackToLanding}
        className="absolute top-6 left-6 text-xs sm:text-sm text-[#E9D5FF]/80 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{language === 'en' ? 'Back to Landing' : 'মূল পাতায় ফিরে যান'}</span>
      </button>

      {/* Auth Card Container */}
      <div className="w-full max-w-md bg-[#3B0764]/80 border border-[#6D28D9]/70 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#6D28D9] mx-auto flex items-center justify-center shadow-lg shadow-[#6D28D9]/40 mb-3 border border-[#A855F7]/30">
            <Satellite className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">AGRIORBIT</h2>
          <p className="text-xs text-[#E9D5FF]/70 mt-1">
            {language === 'en'
              ? 'Access your farm field analysis & rotation engine'
              : 'আপনার জমির উপগ্রহ তথ্য ও শস্য পরিকল্পনা ব্যবস্থা'}
          </p>
        </div>

        {/* Tab Toggle: Login vs Create Account */}
        <div className="grid grid-cols-2 p-1 bg-[#2E1065] rounded-xl border border-[#6D28D9]/50 mb-6">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`py-2 text-xs font-extrabold rounded-lg transition cursor-pointer ${
              !isSignUp
                ? 'bg-[#A855F7] text-white shadow-md'
                : 'text-[#E9D5FF]/70 hover:text-white'
            }`}
          >
            {language === 'en' ? 'Login' : 'লগইন'}
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`py-2 text-xs font-extrabold rounded-lg transition cursor-pointer ${
              isSignUp
                ? 'bg-[#A855F7] text-white shadow-md'
                : 'text-[#E9D5FF]/70 hover:text-white'
            }`}
          >
            {language === 'en' ? 'Create Account' : 'নতুন অ্যাকাউন্ট'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-white mb-1">
                {language === 'en' ? 'Farmer / User Name' : 'কৃষক / ব্যবহারকারীর নাম'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#A855F7] absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Md. Rafiqul Islam"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#2E1065] border border-[#6D28D9]/60 text-white text-sm focus:outline-none focus:border-[#A855F7]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-white mb-1">
              {language === 'en' ? 'Email or Mobile Number' : 'ইমেইল অথবা মোবাইল নম্বর'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A855F7] absolute left-3 top-3.5" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="017XXXXXXXX or email@domain.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#2E1065] border border-[#6D28D9]/60 text-white text-sm focus:outline-none focus:border-[#A855F7]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white mb-1">
              {language === 'en' ? 'Password' : 'পাসওয়ার্ড'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A855F7] absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#2E1065] border border-[#6D28D9]/60 text-white text-sm focus:outline-none focus:border-[#A855F7]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] text-white font-black text-sm shadow-lg shadow-[#7C3AED]/40 transition cursor-pointer"
          >
            {isSignUp
              ? language === 'en'
                ? 'Create Account & Continue'
                : 'অ্যাকাউন্ট তৈরি করে এগিয়ে যান'
              : language === 'en'
              ? 'Login to AgriOrbit'
              : 'লগইন করুন'}
          </button>
        </form>

        {/* Quick Demo Access for Space Apps Reviewers */}
        <div className="mt-6 pt-5 border-t border-[#6D28D9]/40 text-center">
          <p className="text-[11px] text-[#E9D5FF]/70 mb-2.5">
            {language === 'en' ? 'For Space Apps Challenge Reviewers:' : 'স্পেস অ্যাপস পরীক্ষকদের জন্য:'}
          </p>
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-2.5 px-3 rounded-xl bg-[#2E1065] hover:bg-[#6D28D9]/50 border border-[#A855F7]/40 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
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
