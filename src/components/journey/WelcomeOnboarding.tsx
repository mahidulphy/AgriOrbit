import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Language } from '../../types';
import { Eyebrow, PrimaryButton } from '../ui';

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
      titleEn: 'Locate your farm',
      titleBn: 'খামার চিহ্নিত করুন',
      descEn: 'District, upazila, and an exact pin on the real map.',
      descBn: 'জেলা, উপজেলা এবং আসল মানচিত্রে সঠিক পিন।',
    },
    {
      num: '02',
      titleEn: 'Set your priority',
      titleBn: 'অগ্রাধিকার দিন',
      descEn: 'Water, soil, profit, yield, cost, or climate risk.',
      descBn: 'পানি, মাটি, লাভ, ফলন, খরচ বা জলবায়ু ঝুঁকি।',
    },
    {
      num: '03',
      titleEn: 'Get your rotation',
      titleBn: 'পরিক্রমা নিন',
      descEn: 'Three seasons of crops, every rule explained.',
      descBn: 'তিন মৌসুমের ফসল, প্রতিটি নিয়ম ব্যাখ্যাসহ।',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center px-4 sm:px-6 py-10 selection:bg-[#B8FF3D] selection:text-[#050B14]">
      <div className="w-full max-w-2xl mt-6 sm:mt-14">
        <Eyebrow tone="lime">{language === 'en' ? `Welcome, ${userName}` : `স্বাগতম, ${userName}`}</Eyebrow>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3">
          {language === 'en' ? 'Three steps to your crop plan.' : 'ফসল পরিকল্পনার তিনটি ধাপ।'}
        </h1>

        <ol className="mt-10 border-t border-white/10">
          {steps.map((step) => (
            <li key={step.num} className="flex gap-5 py-5 border-b border-white/10">
              <span className="tnum text-sm font-semibold text-[#B8FF3D] pt-0.5">{step.num}</span>
              <div>
                <h2 className="font-bold text-white">
                  {language === 'en' ? step.titleEn : step.titleBn}
                </h2>
                <p className="text-sm text-[#8FA3B8] mt-0.5">
                  {language === 'en' ? step.descEn : step.descBn}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <PrimaryButton onClick={onGetStarted} className="w-full sm:w-auto px-10 py-3.5 text-base mt-8">
          <span>{language === 'en' ? 'Get Started' : 'শুরু করুন'}</span>
          <ArrowRight className="w-4 h-4" />
        </PrimaryButton>
      </div>
    </div>
  );
};
