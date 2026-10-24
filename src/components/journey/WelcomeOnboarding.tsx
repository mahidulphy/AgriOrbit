import React from 'react';
import { ArrowRight, MapPin, Sliders, LineChart } from 'lucide-react';
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
      icon: <MapPin className="w-5 h-5 text-[#22C55E]" />,
    },
    {
      num: '02',
      titleEn: 'Decision Priority',
      titleBn: 'কৃষকের লক্ষ্য',
      descEn: 'Set Water, Soil, Cost or Yield Goal',
      descBn: 'পানি বাঁচানো, মাটির শক্তি বা কম খরচের চাহিদা',
      icon: <Sliders className="w-5 h-5 text-[#22C55E]" />,
    },
    {
      num: '03',
      titleEn: 'Field Advisory',
      titleBn: 'শস্য উপদেষ্টা',
      descEn: 'Deterministic 3-Season Strategy',
      descBn: '৩-মৌসুমী পূর্ণাঙ্গ শস্য পরিক্রমা',
      icon: <LineChart className="w-5 h-5 text-[#22C55E]" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative font-editorial selection:bg-[#22C55E]/20 selection:text-[#22C55E]">
      <div className="w-full max-w-2xl bg-[#141414] border border-[#262626] rounded-xl p-8 sm:p-12 shadow-2xl relative z-10 text-center">
        {/* Welcome Eyebrow */}
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#22C55E] font-mono font-semibold mb-4">
          
          <span>{language === 'en' ? `Welcome, ${userName}` : `স্বাগতম, ${userName}`}</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
          {language === 'en' ? 'Welcome to AgriOrbit' : 'এগ্রিঅরবিটে আপনাকে স্বাগতম'}
        </h1>

        <p className="text-sm sm:text-base text-[#A3A3A3] max-w-lg mx-auto mb-10 leading-relaxed">
          {language === 'en'
            ? "Let's inspect your field's NASA satellite observations before designing your 3-season crop cycle."
            : 'ফসল পরিকল্পনা করার আগে নাসার স্যাটেলাইট তথ্য দেখে আপনার জমি যাচাই করা যাক।'} 
        </p>

        {/* 3-Step Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-5 rounded-lg bg-[#0A0A0A] border border-[#262626] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold text-[#22C55E]">
                  {step.num}
                </span>
                {step.icon}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  {language === 'en' ? step.titleEn : step.titleBn}
                </h4>
                <p className="text-xs text-[#A3A3A3] mt-1 leading-snug">
                  {language === 'en' ? step.descEn : step.descBn}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={onGetStarted}
          className="w-full sm:w-auto px-8 py-3 rounded-lg bg-[#22C55E] hover:bg-[#16a34a] text-black font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{language === 'en' ? 'Get Started' : 'শুরু করুন'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
