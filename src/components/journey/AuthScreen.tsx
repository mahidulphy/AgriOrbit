import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, Sparkles } from 'lucide-react';
import { Language } from '../../types';
import { Eyebrow, PrimaryButton } from '../ui';

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

  const inputClass =
    'w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#050B14] border border-white/10 text-white text-sm focus:outline-none focus:border-[#00E5FF]/60 placeholder:text-[#8FA3B8]/50';

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center px-4 sm:px-6 py-10 selection:bg-[#B8FF3D] selection:text-[#050B14] relative">
      <div className="w-full max-w-md">
        <button
          onClick={onBackToLanding}
          className="text-xs sm:text-sm text-[#8FA3B8] hover:text-white flex items-center gap-1.5 transition cursor-pointer mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'en' ? 'Back to Landing' : 'মূল পাতায় ফিরে যান'}</span>
        </button>

        <img
          src="/assets/agriorbit-logo.png"
          alt="AgriOrbit"
          className="h-14 w-auto object-contain mix-blend-screen mb-5"
          draggable={false}
        />
        <Eyebrow>{language === 'en' ? 'Field access' : 'মাঠে প্রবেশ'}</Eyebrow>
        <h1 className="text-3xl font-bold tracking-tight mt-2">
          {isSignUp
            ? language === 'en'
              ? 'Create your account'
              : 'অ্যাকাউন্ট তৈরি করুন'
            : language === 'en'
              ? 'Welcome back'
              : 'ফিরে আসায় স্বাগতম'}
        </h1>
        <p className="text-sm text-[#8FA3B8] mt-2">
          {language === 'en'
            ? 'Your fields, priorities and rotation plans are kept here.'
            : 'আপনার জমি, অগ্রাধিকার ও পরিক্রমা পরিকল্পনা এখানে থাকে।'}
        </p>

        <div className="flex gap-6 mt-8 pb-3 border-b border-white/10 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`pb-3 -mb-[13px] transition cursor-pointer ${
              !isSignUp ? 'text-white border-b-2 border-[#B8FF3D]' : 'text-[#8FA3B8] hover:text-white'
            }`}
          >
            {language === 'en' ? 'Login' : 'লগইন'}
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`pb-3 -mb-[13px] transition cursor-pointer ${
              isSignUp ? 'text-white border-b-2 border-[#B8FF3D]' : 'text-[#8FA3B8] hover:text-white'
            }`}
          >
            {language === 'en' ? 'Create Account' : 'নতুন অ্যাকাউন্ট'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                {language === 'en' ? 'Farmer / User Name' : 'কৃষক / ব্যবহারকারীর নাম'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8FA3B8] absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Md. Rafiqul Islam"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              {language === 'en' ? 'Email or Mobile Number' : 'ইমেইল অথবা মোবাইল নম্বর'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8FA3B8] absolute left-3 top-3.5" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="017XXXXXXXX or email@domain.com"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              {language === 'en' ? 'Password' : 'পাসওয়ার্ড'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8FA3B8] absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>

          <PrimaryButton type="submit" className="w-full py-3">
            {isSignUp
              ? language === 'en'
                ? 'Create Account & Continue'
                : 'অ্যাকাউন্ট তৈরি করে এগিয়ে যান'
              : language === 'en'
                ? 'Login to AgriOrbit'
                : 'লগইন করুন'}
          </PrimaryButton>
        </form>

        <div className="mt-8 pt-5 border-t border-white/10">
          <p className="text-[11px] text-[#8FA3B8] mb-2.5">
            {language === 'en' ? 'Evaluating for the Space Apps Challenge:' : 'স্পেস অ্যাপস মূল্যায়নের জন্য:'}
          </p>
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-2.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B8FF3D]" />
            <span>
              {language === 'en' ? '1-Click Demo Login as Farmer Rafiqul' : '১-ক্লিকে ডেমো কৃষক হিসেবে লগইন'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
