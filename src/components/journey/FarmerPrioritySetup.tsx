import React from 'react';
import { ArrowRight, ArrowLeft, Check, Sliders } from 'lucide-react';
import { FarmerPriorityId, Language } from '../../types';

interface FarmerPrioritySetupProps {
  selectedPriority: FarmerPriorityId;
  secondaryPriority?: FarmerPriorityId | null;
  onSelectPrimaryPriority: (priority: FarmerPriorityId) => void;
  onSelectSecondaryPriority: (priority: FarmerPriorityId | null) => void;
  language: Language;
  onContinue: () => void;
  onBack: () => void;
}

export const FarmerPrioritySetup: React.FC<FarmerPrioritySetupProps> = ({
  selectedPriority,
  secondaryPriority,
  onSelectPrimaryPriority,
  onSelectSecondaryPriority,
  language,
  onContinue,
  onBack,
}) => {
  const priorities: {
    id: FarmerPriorityId;
    icon: React.ReactNode;
    titleEn: string;
    titleBn: string;
    descEn: string;
    descBn: string;
    ruleImpactEn: string;
    ruleImpactBn: string;
  }[] = [
    {
      id: 'save_water',
      icon: <span className="text-2xl">💧</span>,
      titleEn: 'Save Water',
      titleBn: 'পানি সাশ্রয়',
      descEn: 'Prioritizes drought-tolerant legumes and pulses requiring 1-2 irrigations instead of continuous groundwater pumping.',
      descBn: 'গভীর সেচের পরিবর্তে কম পানির ডাল ও তেলবীজকে প্রাধান্য দেয়, ফলে ভূগর্ভস্থ পানির অপচয় রোধ হয়।',
      ruleImpactEn: 'Penalizes water-heavy winter Boro rice; boosts Lentil & Mustard match scores.',
      ruleImpactBn: 'অতিরিক্ত সেচের বোরো ধান কমিয়ে মসুর ও সরিষার গ্রহণযোগ্যতা বাড়ায়।',
    },
    {
      id: 'improve_soil',
      icon: <span className="text-2xl">🌱</span>,
      titleEn: 'Improve Soil Health',
      titleBn: 'মাটির উর্বরতা বৃদ্ধি',
      descEn: 'Selects nitrogen-fixing pulses and organic biomass crops to naturally regenerate degraded plow layers.',
      descBn: 'মাটিতে প্রাকৃতিক নাইট্রোজেন ও জৈব পদার্থ বৃদ্ধিকারী ফসল নির্বাচন করে জমির উর্বরতা বাড়ায়।',
      ruleImpactEn: 'Boosts Mungbean & Jute for biological Rhizobium nitrogen fixation.',
      ruleImpactBn: 'রাইজোবিয়াম নাইট্রোজেন সংবন্ধনকারী মুগডাল ও পাটকে অগ্রাধিকার দেয়।',
    },
    {
      id: 'maximize_profit',
      icon: <span className="text-2xl">💰</span>,
      titleEn: 'Maximize Profit',
      titleBn: 'সর্বোচ্চ লাভ',
      descEn: 'Profit-oriented: favors crops combining strong local suitability with modest input cost. Indicative only — not a market price forecast.',
      descBn: 'লাভ-ভিত্তিক: ভালো উপযোগিতা ও সাশ্রয়ী খরচের ফসলকে প্রাধান্য দেয়। এটি নির্দেশক মাত্র, বাজারদরের পূর্বাভাস নয়।',
      ruleImpactEn: 'Boosts proven low-cost performers (Mustard, Lentil); penalizes marginal high-input options.',
      ruleImpactBn: 'প্রমাণিত সাশ্রয়ী ফসলকে এগিয়ে রাখে; ব্যয়বহুল প্রান্তিক ফসলকে পিছিয়ে দেয়।',
    },
    {
      id: 'maximize_yield',
      icon: <span className="text-2xl">🌾</span>,
      titleEn: 'Maximize Yield',
      titleBn: 'সর্বোচ্চ ফলন',
      descEn: 'Yield-oriented: favors proven high performers matched to your field climate and season. Suitability, not guaranteed harvest.',
      descBn: 'ফলন-ভিত্তিক: আপনার জমির উপযোগী প্রমাণিত উচ্চফলনশীল ফসলকে প্রাধান্য দেয়। সম্ভাবনা নির্দেশ করে, নিশ্চিত ফলন নয়।',
      ruleImpactEn: 'Boosts 85%+ suitability crops; penalizes marginal crops needing ideal conditions.',
      ruleImpactBn: '৮৫%+ উপযোগী ফসলকে এগিয়ে রাখে; আদর্শ পরিবেশ নির্ভর প্রান্তিক ফসলকে পিছিয়ে দেয়।',
    },
    {
      id: 'lower_cost',
      icon: <span className="text-2xl">৳</span>,
      titleEn: 'Lower Cost',
      titleBn: 'কম খরচ',
      descEn: 'Minimizes costly diesel pumping and chemical fertilizers; balances high margin cash crops with low input.',
      descBn: 'সেচের জন্য ডিজেল ও রাসায়নিক সারের বাড়তি খরচ কমিয়ে স্বল্প পুঁজিতে বেশি লাভের সুযোগ তৈরি করে।',
      ruleImpactEn: 'Favors low-input Mustard & Lentils over high-capex Potato and Boro.',
      ruleImpactBn: 'ব্যয়বহুল আলুর চেয়ে সাশ্রয়ী সরিষা ও ডালকে এগিয়ে রাখে।',
    },
    {
      id: 'reduce_risk',
      icon: <span className="text-2xl">⚠</span>,
      titleEn: 'Reduce Climate Risk',
      titleBn: 'জলবায়ু ঝুঁকি হ্রাস',
      descEn: 'Avoids vulnerable growth windows; picks hardy varieties resilient against sudden dry spells or early flooding.',
      descBn: 'আকস্মিক খরা বা আগাম বন্যার মতো চরম আবহাওয়ার ক্ষতি এড়াতে নিরাপদ ও সহনশীল ফসল নিশ্চিত করে।',
      ruleImpactEn: 'Selects short-duration crops (<90 days) to escape pre-monsoon flash floods.',
      ruleImpactBn: 'আগাম কালবৈশাখী বা বন্যার হাত থেকে বাঁচতে স্বল্পমেয়াদী ফসল বাছাই করে।',
    },
  ];

  const handlePriorityClick = (id: FarmerPriorityId) => {
    if (selectedPriority === id) return; // already primary
    if (secondaryPriority === id) {
      onSelectSecondaryPriority(null);
    } else {
      onSelectPrimaryPriority(id);
    }
  };

  const handleSecondaryToggle = (id: FarmerPriorityId, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPriority === id) return;
    if (secondaryPriority === id) {
      onSelectSecondaryPriority(null);
    } else {
      onSelectSecondaryPriority(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#B8FF3D] selection:text-[#050B14] relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#B8FF3D]/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Main Container */}
      <div className="w-full max-w-4xl bg-[#0B1626] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Progress Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
          <button
            onClick={onBack}
            className="text-xs text-[#8FA3B8] hover:text-white flex items-center gap-1 cursor-pointer transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Back' : 'পূর্ববর্তী'}</span>
          </button>

          <div className="flex items-center gap-1.5 font-mono text-xs text-[#B8FF3D]">
            <span className="font-bold text-[#050B14] bg-[#B8FF3D] px-2 py-0.5 rounded text-[11px]">02</span>
            <span className="text-[#8FA3B8]">/ 03</span>
            <span className="font-sans font-semibold text-[#8FA3B8] ml-1">
              {language === 'en' ? 'Farmer Priority' : 'কৃষকের অগ্রাধিকার'}
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#B8FF3D]/10 border border-[#B8FF3D]/30 flex items-center justify-center mb-2 shadow-md">
            <Sliders className="w-5 h-5 text-[#B8FF3D]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'en' ? 'What matters most to you?' : 'আপনার প্রধান লক্ষ্য বা অগ্রাধিকার কী?'}
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA3B8] mt-1">
            {language === 'en'
              ? 'Select your primary goal for this season. Your choice directly programs the deterministic suitability engine.'
              : 'এই মৌসুমের প্রধান লক্ষ্য নির্বাচন করুন। এটি সরাসরি শস্য নির্বাচন নিয়মে প্রভাব ফেলবে।'}
          </p>
        </div>

        {/* 6 Visual Choice Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
          {priorities.map((item) => {
            const isPrimary = selectedPriority === item.id;
            const isSecondary = secondaryPriority === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handlePriorityClick(item.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isPrimary
                    ? 'bg-[#B8FF3D]/10 border-[#B8FF3D] shadow-lg shadow-black/40 ring-1 ring-[#B8FF3D]/50 text-white'
                    : isSecondary
                    ? 'bg-[#0B1626] border-[#00E5FF]/60 text-white ring-1 ring-[#00E5FF]/40'
                    : 'bg-[#050B14] border-white/10 hover:bg-white/5 text-white hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                      {item.icon}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isPrimary ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#B8FF3D] text-[#050B14] font-extrabold text-[11px] shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>{language === 'en' ? 'Primary' : 'প্রধান'}</span>
                        </span>
                      ) : isSecondary ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#00E5FF] text-[#050B14] font-bold text-[10px]">
                          {language === 'en' ? 'Secondary' : 'সহায়ক'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleSecondaryToggle(item.id, e)}
                          className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[#8FA3B8] hover:text-white border border-white/10"
                        >
                          {language === 'en' ? '+ Add Secondary' : '+ সহায়ক করুন'}
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">
                    {language === 'en' ? item.titleEn : item.titleBn}
                  </h3>
                  <p className="text-xs text-[#8FA3B8] leading-relaxed mb-3">
                    {language === 'en' ? item.descEn : item.descBn}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 text-[10px] font-mono text-[#8FA3B8]">
                  ⚡ {language === 'en' ? item.ruleImpactEn : item.ruleImpactBn}
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full py-3.5 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/85 text-[#050B14] font-black text-sm shadow-lg shadow-black/40 transition cursor-pointer flex items-center justify-center gap-2"
        >
          <span>{language === 'en' ? 'Continue' : 'পরবর্তী ধাপে যান'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
