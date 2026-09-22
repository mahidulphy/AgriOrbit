import React from 'react';
import { ArrowRight, MapPin, Crosshair, Sliders, LineChart, Sparkles } from 'lucide-react';
import { Language } from '../../types';

interface WelcomeOnboardingProps {
  userName: string;
  language: Language;
  onGetStarted: () => void;
}

export const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({
  userName,
  language,
  onGetStarted,
}) => {
  const steps = [
    {
      num: '01',
      titleEn: 'Location',
      titleBn: 'অবস্থান',
      descEn: 'Select District & Upazila',
      descBn: 'জেলা ও উপজেলা নির্বাচন',
      icon: <MapPin className="w-5 h-5 text-cyan-400" />,
    },
    {
      num: '02',
      titleEn: 'Field',
      titleBn: 'জমি',
      descEn: 'Pin Your Agricultural Plot',
      descBn: 'মানচিত্রে নির্দিষ্ট জমি চিহ্নিত করুন',
      icon: <Crosshair className="w-5 h-5 text-amber-400" />,
    },
    {
      num: '03',
      titleEn: 'Priority',
      titleBn: 'লক্ষ্য',
      descEn: 'Set Water, Soil, or Cost Goal',
      descBn: 'পানি, মাটি বা ব্যয়ের অগ্রাধিকার',
      icon: <Sliders className="w-5 h-5 text-emerald-400" />,
    },
    {
      num: '04',
      titleEn: 'Analysis',
      titleBn: 'বিশ্লেষণ',
      descEn: 'Run NASA Observation Engine',
      descBn: 'নাসার উপগ্রহ বিশ্লেষণ চালু করুন',
      icon: <LineChart className="w-5 h-5 text-purple-300" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#2E1065] text-[#E9D5FF] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#A855F7] selection:text-white relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#6D28D9]/25 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-2xl bg-[#3B0764]/80 border border-[#6D28D9]/70 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md relative z-10 text-center">
        {/* Welcome Header */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2E1065] border border-[#A855F7]/40 text-[#E9D5FF] text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{language === 'en' ? `Welcome, ${userName}` : `স্বাগতম, ${userName}`}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          {language === 'en' ? 'Welcome to AgriOrbit' : 'এগ্রিঅরবিটে আপনাকে স্বাগতম'}
        </h1>

        <p className="text-base sm:text-lg text-[#E9D5FF]/85 max-w-lg mx-auto mb-10 leading-relaxed">
          {language === 'en'
            ? "Let's understand your field before creating a crop plan."
            : 'ফসল পরিক্রমা তৈরির পূর্বে আসুন আপনার জমির অবস্থা বিশ্লেষণ করি।'}
        </p>

        {/* 4-Step Progress Indicator */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10 text-left">
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-4 rounded-2xl bg-[#2E1065]/80 border border-[#6D28D9]/50 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-black text-[#A855F7] bg-[#3B0764] px-2 py-0.5 rounded border border-[#6D28D9]/50">
                  {step.num}
                </span>
                {step.icon}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  {language === 'en' ? step.titleEn : step.titleBn}
                </h4>
                <p className="text-[11px] text-[#E9D5FF]/70 mt-0.5 leading-tight">
                  {language === 'en' ? step.descEn : step.descBn}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={onGetStarted}
          className="w-full sm:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] text-white font-extrabold text-base shadow-xl shadow-[#7C3AED]/40 transition transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center justify-center gap-2"
        >
          <span>{language === 'en' ? 'Get Started' : 'শুরু করুন'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
