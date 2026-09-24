import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  Coins,
  Droplet,
  ShieldAlert,
  Sprout,
  Wheat,
} from 'lucide-react';
import { FarmerPriorityId, Language } from '../../types';
import { Eyebrow, PrimaryButton, Rule } from '../ui';

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
      icon: <Droplet className="w-4 h-4 text-[#00E5FF]" />,
      titleEn: 'Save Water',
      titleBn: 'পানি সাশ্রয়',
      descEn: 'Drought-tolerant legumes and pulses needing 1–2 irrigations instead of continuous pumping.',
      descBn: 'ক্রমাগত সেচের বদলে ১–২ সেচের ডাল ও তেলবীজকে প্রাধান্য দেয়।',
      ruleImpactEn: 'Penalizes water-heavy Boro rice; boosts Lentil and Mustard scores.',
      ruleImpactBn: 'বোরো ধানকে পিছিয়ে দেয়; মসুর ও সরিষাকে এগিয়ে দেয়।',
    },
    {
      id: 'improve_soil',
      icon: <Sprout className="w-4 h-4 text-[#B8FF3D]" />,
      titleEn: 'Improve Soil Health',
      titleBn: 'মাটির উর্বরতা বৃদ্ধি',
      descEn: 'Nitrogen-fixing pulses and biomass crops that regenerate degraded layers.',
      descBn: 'নাইট্রোজেনবর্ধক ডাল ও জৈব ফসল মাটির উর্বরতা ফেরায়।',
      ruleImpactEn: 'Boosts Mungbean and Jute for biological nitrogen fixation.',
      ruleImpactBn: 'মুগ ও পাটকে প্রাধান্য দেয়।',
    },
    {
      id: 'maximize_profit',
      icon: <Banknote className="w-4 h-4 text-[#B8FF3D]" />,
      titleEn: 'Maximize Profit',
      titleBn: 'সর্বোচ্চ লাভ',
      descEn: 'Profit-oriented: strong local suitability with modest input cost. Indicative, not a price forecast.',
      descBn: 'লাভ-ভিত্তিক: ভালো উপযোগিতা ও সাশ্রয়ী খরচ। নির্দেশক মাত্র।',
      ruleImpactEn: 'Boosts proven low-cost performers; penalizes marginal high-input options.',
      ruleImpactBn: 'প্রমাণিত সাশ্রয়ী ফসল এগিয়ে; ব্যয়বহুল প্রান্তিক ফসল পিছিয়ে।',
    },
    {
      id: 'maximize_yield',
      icon: <Wheat className="w-4 h-4 text-[#B8FF3D]" />,
      titleEn: 'Maximize Yield',
      titleBn: 'সর্বোচ্চ ফলন',
      descEn: 'Yield-oriented: proven high performers for your field climate. Suitability, not guaranteed harvest.',
      descBn: 'ফলন-ভিত্তিক: জমির উপযোগী প্রমাণিত ফসল। সম্ভাবনা, নিশ্চয়তা নয়।',
      ruleImpactEn: 'Boosts 85%+ suitability crops; penalizes crops needing ideal conditions.',
      ruleImpactBn: '৮৫%+ উপযোগী ফসল এগিয়ে; আদর্শ-নির্ভর ফসল পিছিয়ে।',
    },
    {
      id: 'lower_cost',
      icon: <Coins className="w-4 h-4 text-[#8FA3B8]" />,
      titleEn: 'Lower Cost',
      titleBn: 'কম খরচ',
      descEn: 'Minimizes diesel pumping and fertilizer bills; balances cash crops with low input.',
      descBn: 'সেচ-সারের খরচ কমিয়ে স্বল্প পুঁজিতে লাভের সুযোগ।',
      ruleImpactEn: 'Favors low-input Mustard and Lentils over Potato and Boro.',
      ruleImpactBn: 'আলু-বোরোর চেয়ে সরিষা-ডাল এগিয়ে।',
    },
    {
      id: 'reduce_risk',
      icon: <ShieldAlert className="w-4 h-4 text-[#FF5C5C]" />,
      titleEn: 'Reduce Climate Risk',
      titleBn: 'জলবায়ু ঝুঁকি হ্রাস',
      descEn: 'Hardy varieties resilient against dry spells or early flooding.',
      descBn: 'খরা বা আগাম বন্যা সহনশীল নিরাপদ ফসল।',
      ruleImpactEn: 'Selects short-duration crops (under 90 days).',
      ruleImpactBn: 'স্বল্পমেয়াদী (৯০ দিনের কম) ফসল বাছাই করে।',
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

  const activeRule = priorities.find((p) => p.id === selectedPriority);

  return (
    <div className="min-h-screen bg-[#050B14] text-white px-4 sm:px-6 py-8 selection:bg-[#B8FF3D] selection:text-[#050B14]">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="text-xs text-[#8FA3B8] hover:text-white flex items-center gap-1.5 cursor-pointer transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Back' : 'পূর্ববর্তী'}</span>
          </button>
          <p className="tnum text-xs text-[#8FA3B8]">
            <span className="text-[#B8FF3D] font-semibold">02</span> / 03 ·{' '}
            {language === 'en' ? 'Farmer Priority' : 'কৃষকের অগ্রাধিকার'}
          </p>
        </div>

        <div className="mt-6 mb-2 max-w-2xl">
          <Eyebrow tone="lime">{language === 'en' ? 'Step 02 — Priority' : 'ধাপ ০২ — অগ্রাধিকার'}</Eyebrow>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">
            {language === 'en' ? 'What matters most this season?' : 'এই মৌসুমে প্রধান লক্ষ্য কী?'}
          </h1>
          <p className="text-sm sm:text-base text-[#8FA3B8] mt-2 leading-relaxed">
            {language === 'en'
              ? 'Your primary goal programs the recommendation engine. A secondary goal can refine it at half weight.'
              : 'প্রধান লক্ষ্য সুপারিশ-ইঞ্জিন চালায়। সহায়ক লক্ষ্য অর্ধেক মাত্রায় পরিমার্জন করে।'}
          </p>
        </div>

        <div role="radiogroup" aria-label={language === 'en' ? 'Farming priority' : 'কৃষি অগ্রাধিকার'}>
          {priorities.map((item) => {
            const isPrimary = selectedPriority === item.id;
            const isSecondary = secondaryPriority === item.id;
            return (
              <div
                key={item.id}
                role="radio"
                aria-checked={isPrimary}
                tabIndex={0}
                onClick={() => handlePriorityClick(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePriorityClick(item.id);
                  }
                }}
                className={`flex gap-4 py-4 border-b border-white/10 cursor-pointer transition first:border-t first:mt-6 ${
                  isPrimary ? 'border-l-2 border-l-[#B8FF3D] pl-4' : 'pl-[18px]'
                }`}
              >
                <span
                  className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    isPrimary ? 'border-[#B8FF3D] bg-[#B8FF3D]' : 'border-[#8FA3B8]/50'
                  }`}
                >
                  {isPrimary && <Check className="h-2.5 w-2.5 text-[#050B14] stroke-[4]" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 font-bold text-white">
                      {item.icon}
                      <span>{language === 'en' ? item.titleEn : item.titleBn}</span>
                    </h2>
                    {isPrimary ? (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8FF3D] shrink-0">
                        {language === 'en' ? 'Primary' : 'প্রধান'}
                      </span>
                    ) : isSecondary ? (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#00E5FF] shrink-0">
                        {language === 'en' ? 'Secondary' : 'সহায়ক'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleSecondaryToggle(item.id, e)}
                        className="text-[11px] text-[#8FA3B8] hover:text-white underline underline-offset-2 transition shrink-0 cursor-pointer"
                      >
                        {language === 'en' ? '+ Secondary' : '+ সহায়ক'}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-[#8FA3B8] mt-1 leading-relaxed">
                    {language === 'en' ? item.descEn : item.descBn}
                  </p>
                  <p className="text-[11px] text-[#8FA3B8]/70 mt-1 tnum">
                    ⚡ {language === 'en' ? item.ruleImpactEn : item.ruleImpactBn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {activeRule && (
          <p className="text-xs text-[#8FA3B8] mt-5 leading-relaxed border-l-2 border-[#00E5FF]/40 pl-3">
            <strong className="text-white">
              {language === 'en' ? 'Engine now favors: ' : 'ইঞ্জিন এখন প্রাধান্য দেবে: '}
            </strong>
            {language === 'en' ? activeRule.ruleImpactEn : activeRule.ruleImpactBn}
          </p>
        )}

        <PrimaryButton onClick={onContinue} className="w-full py-3.5 text-base mt-6">
          <span>{language === 'en' ? 'Continue' : 'পরবর্তী ধাপে যান'}</span>
          <ArrowRight className="w-4 h-4" />
        </PrimaryButton>
        <Rule className="mt-8" />
      </div>
    </div>
  );
};
