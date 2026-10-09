import React from 'react';
import { ArrowRight, MapPin, Sliders, LineChart, Sparkles } from 'lucide-react';
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
      titleEn: 'Farm Location',
      titleBn: 'খামারের অবস্থান',
      descEn: 'District, Upazila & 5 km Grid Pin',
      descBn: 'জেলা, উপজেলা ও ৫ কিমি গ্রিড পিন',
      icon: <MapPin className="w-5 h-5 text-[#00E5FF]" />,
    },
    {
      num: '02',
      titleEn: 'Decision Priority',
      titleBn: 'কৃষকের লক্ষ্য',
      descEn: 'Set Water, Soil, Cost or Yield Goal',
      descBn: 'পানি, মাটি বা ব্যয়ের অগ্রাধিকার',
      icon: <Sliders className="w-5 h-5 text-[#B8FF3D]" />,
    },
    {
      num: '03',
      titleEn: 'Field Advisory',
      titleBn: 'শস্য উপদেষ্টা',
      descEn: 'Deterministic 3-Season Strategy',
      descBn: '৩-মৌসুমী পূর্ণাঙ্গ শস্য পরিক্রমা',
      icon: <LineChart className="w-5 h-5 text-[#00E5FF]" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative font-editorial selection:bg-[#B8FF3D]/30 selection:text-[#B8FF3D]">
      <div className="w-full max-w-2xl bg-[#0B1626] border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl relative z-10 text-center">
        {/* Welcome Eyebrow */}
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#B8FF3D] font-mono font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#B8FF3D]" />
          <span>{language === 'en' ? `Welcome, ${userName}` : `স্বাগতম, ${userName}`}</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
          {language === 'en' ? 'Welcome to AgriOrbit' : 'এগ্রিঅরবিটে আপনাকে স্বাগতম'}
        </h1>

        <p className="text-sm sm:text-base text-[#8FA3B8] max-w-lg mx-auto mb-10 leading-relaxed">
          {language === 'en'
            ? "Let's inspect your field's NASA satellite observations before designing your 3-season crop cycle."
            : 'ফসল পরিক্রমা তৈরির পূর্বে নাসার উপগ্রহ তথ্যের সাহায্যে আপনার জমির অবস্থা বিশ্লেষণ করা যাক।'}
        </p>

        {/* 3-Step Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-5 rounded-2xl bg-[#050B14] border border-white/10 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold text-[#00E5FF]">
                  {step.num}
                </span>
                {step.icon}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  {language === 'en' ? step.titleEn : step.titleBn}
                </h4>
                <p className="text-xs text-[#8FA3B8] mt-1 leading-snug">
                  {language === 'en' ? step.descEn : step.descBn}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={onGetStarted}
          className="w-full sm:w-auto px-10 py-4 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/90 text-[#050B14] font-bold text-base tracking-tight transition-all duration-150 transform hover:-translate-y-0.5 shadow-xl shadow-[#B8FF3D]/20 inline-flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <span>{language === 'en' ? 'Get Started' : 'শুরু করুন'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
