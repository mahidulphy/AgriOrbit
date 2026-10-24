import React from 'react';
import { ArrowRight, ArrowLeft, Check, Sliders, Target } from 'lucide-react';
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
    icon: string;
    titleEn: string;
    titleBn: string;
    descEn: string;
    descBn: string;
    ruleImpactEn: string;
    ruleImpactBn: string;
  }[] = [
    {
      id: 'save_water',
      icon: '',
      titleEn: 'Save Water',
      titleBn: 'পানি বাঁচানো',
      descEn: 'Prioritizes drought-tolerant legumes and pulses requiring 1-2 irrigations instead of continuous groundwater pumping.',
      descBn: 'ঘন ঘন গভীর সেচ দেওয়ার বদলে কম পানিতে হওয়া ডাল ও তেলবীজ ফসলকে প্রাধান্য দেয়, ফলে সেচের খরচ ও পানি দুটোই বাঁচে।',
      ruleImpactEn: 'Penalizes water-heavy winter Boro rice; boosts Lentil & Mustard match scores.',
      ruleImpactBn: 'বেশি সেচ লাগা বোরো ধানের স্কোর কমিয়ে মসুর ও সরিষাকে এগিয়ে রাখে।',
    },
    {
      id: 'improve_soil',
      icon: '',
      titleEn: 'Improve Soil Health',
      titleBn: 'মাটির শক্তি ফেরানো',
      descEn: 'Selects nitrogen-fixing pulses and organic biomass crops to naturally regenerate degraded plow layers.',
      descBn: 'মাটিতে প্রাকৃতিকভাবে নাইট্রোজেন ও উর্বরতা ফেরাতে ডাল জাতীয় ফসল ও সবুজ সারকে এগিয়ে রাখে।',
      ruleImpactEn: 'Boosts Mungbean & Jute for biological Rhizobium nitrogen fixation.',
      ruleImpactBn: 'মাটিতে নাইট্রোজেন যোগ করে এমন মুগ ডাল ও পাটকে এগিয়ে রাখে।',
    },
    {
      id: 'maximize_profit',
      icon: '',
      titleEn: 'Maximize Profit',
      titleBn: 'বেশি লাভ',
      descEn: 'Favors crops combining strong local suitability with modest input cost. Indicative only — not a market price forecast.',
      descBn: 'কম খরচে বেশি আয়ের সম্ভাবনা থাকা ফসলকে এগিয়ে রাখে। এটি সাধারণ হিসাব, বাজারের ওঠানামা করা দর নয়।',
      ruleImpactEn: 'Boosts proven low-cost performers (Mustard, Lentil); penalizes marginal high-input options.',
      ruleImpactBn: 'প্রমাণিত কম খরচের ফসলকে এগিয়ে রাখে; অতিরিক্ত খরচের ফসলকে পিছিয়ে দেয়।',
    },
    {
      id: 'maximize_yield',
      icon: '',
      titleEn: 'Maximize Yield',
      titleBn: 'ভালো ফলন',
      descEn: 'Favors proven high performers matched to your field climate and season. Suitability, not guaranteed harvest.',
      descBn: 'আপনার এলাকার আবহাওয়ায় সবচেয়ে বেশি ফলন দেয় এমন পরীক্ষিত ফসলগুলোকে বেছে নেয়।',
      ruleImpactEn: 'Boosts 85%+ suitability crops; penalizes marginal crops needing ideal conditions.',
      ruleImpactBn: 'উচ্চফলনশীল ও নির্ভরযোগ্য জাতগুলোকে তালিকায় উপরে রাখে।',
    },
    {
      id: 'lower_cost',
      icon: '',
      titleEn: 'Lower Cost',
      titleBn: 'কম খরচ',
      descEn: 'Minimizes costly diesel pumping and chemical fertilizers; balances high margin cash crops with low input.',
      descBn: 'ডিজেল, সেচ আর রাসায়নিক সারের খরচ কমিয়ে স্বল্প পুঁজিতে নিরাপদে চাষ করার সুযোগ দেয়।',
      ruleImpactEn: 'Favors low-input Mustard & Lentils over high-capex Potato and Boro.',
      ruleImpactBn: 'বেশি খরচের আলুর চেয়ে কম খরচের সরিষা ও ডালকে এগিয়ে রাখে।',
    },
    {
      id: 'reduce_risk',
      icon: '',
      titleEn: 'Reduce Climate Risk',
      titleBn: 'আবহাওয়ার ঝুঁকি কমানো',
      descEn: 'Avoids vulnerable growth windows; picks hardy varieties resilient against sudden dry spells or early flooding.',
      descBn: 'হঠাৎ খরা, আগাম বন্যা বা দুর্যোগের ক্ষতি এড়াতে যেসব ফসল দ্রুত ওঠে ও দুর্যোগ সইতে পারে, সেগুলো বেছে নেয়।',
      ruleImpactEn: 'Selects short-duration crops (<90 days) to escape pre-monsoon flash floods.',
      ruleImpactBn: 'আগাম দুর্যোগ আসার আগেই তোলা যায় এমন স্বল্পমেয়াদী ফসলকে এগিয়ে রাখে।',
    },
  ];

  const handlePriorityClick = (id: FarmerPriorityId) => {
    if (selectedPriority === id) return;
    if (secondaryPriority === id) {
      onSelectSecondaryPriority(null);
    } else {
      onSelectPrimaryPriority(id);
    }
  };

  const handleSecondaryToggle = (id: FarmerPriorityId, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPriority === id) return;
    onSelectSecondaryPriority(secondaryPriority === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 selection:bg-[#22C55E]/20 selection:text-[#22C55E] font-editorial relative">
      <div className="w-full max-w-5xl bg-[#141414] border border-[#262626] rounded-xl p-6 sm:p-10 shadow-2xl relative z-10">
        {/* Navigation & Progress */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#262626]">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-[#A3A3A3] hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'en' ? 'Back to Location' : 'পূর্ববর্তী ধাপ'}</span>
          </button>

          <div className="flex items-center gap-2 font-mono text-xs text-[#FAFAFA]">
            <span className="font-semibold text-black bg-[#22C55E] px-2 py-0.5 rounded text-xs">02</span>
            <span className="text-[#A3A3A3]">/ 03</span>
            <span className="font-sans font-semibold text-white ml-1">
              {language === 'en' ? 'Farmer Priority' : 'কৃষকের লক্ষ্য'}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#22C55E] font-mono font-semibold mb-2">
            <Target className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>{language === 'en' ? 'DECISION OBJECTIVE' : 'উদ্দেশ্য নির্ধারণ'}</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {language === 'en' ? 'What is your primary farming priority?' : 'এই মৌসুমে আপনার প্রধান চাহিদা কী?'}
          </h2>
          <p className="text-xs sm:text-sm text-[#A3A3A3] mt-1 max-w-2xl leading-relaxed">
            {language === 'en'
              ? 'Select your primary objective for this cycle. The deterministic agronomic engine weights crop suitability and rotation sequences accordingly.'
              : 'আপনার যা দরকার তা বেছে নিন। সেই অনুযায়ী আমাদের নিয়মগুলো সেরা ফসল খুঁজে দেবে।'}
          </p>
        </div>

        {/* Priority Choice Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {priorities.map((item) => {
            const isPrimary = selectedPriority === item.id;
            const isSecondary = secondaryPriority === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handlePriorityClick(item.id)}
                className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isPrimary
                    ? 'bg-[#0A0A0A] border-[#22C55E] bg-[#141414]'
                    : isSecondary
                    ? 'bg-[#0A0A0A] border-[#A3A3A3] bg-[#141414]'
                    : 'bg-[#0A0A0A] border-[#262626] hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    

                    <div className="flex items-center gap-2">
                      {isPrimary ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#22C55E] text-black font-bold text-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>{language === 'en' ? 'Primary' : 'প্রধান'}</span>
                        </span>
                      ) : isSecondary ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-[#A3A3A3] text-black font-bold text-xs">
                          {language === 'en' ? 'Secondary' : 'সহায়ক'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleSecondaryToggle(item.id, e)}
                          className="text-[11px] px-2.5 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-white border border-[#262626] cursor-pointer"
                        >
                          {language === 'en' ? '+ Secondary' : '+ সহায়ক'}
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-bold text-white mb-2">
                    {language === 'en' ? item.titleEn : item.titleBn}
                  </h3>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed mb-4">
                    {language === 'en' ? item.descEn : item.descBn}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#262626] text-[11px] font-mono text-[#A3A3A3]">
                  {language === 'en' ? item.ruleImpactEn : item.ruleImpactBn}
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex items-center justify-end pt-2">
          <button
            onClick={onContinue}
            className="w-full sm:w-auto px-8 py-3 rounded-lg bg-[#22C55E] hover:bg-[#16a34a] text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{language === 'en' ? 'Run Field Analysis' : 'আমার জমি যাচাই করুন'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
