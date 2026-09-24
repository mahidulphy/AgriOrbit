import React from 'react';
import { Check, X } from 'lucide-react';
import { CropData, FarmerPriorityId, Language } from '../types';
import { priorityInfluenceText } from '../lib/cropSuitability';
import { Eyebrow, TierBadge } from './ui';

interface ExplainWhyModalProps {
  crop: CropData | null;
  selectedPriority: FarmerPriorityId;
  secondaryPriority?: FarmerPriorityId | null;
  language: Language;
  onClose: () => void;
}

export const ExplainWhyModal: React.FC<ExplainWhyModalProps> = ({
  crop,
  selectedPriority,
  secondaryPriority = null,
  language,
  onClose,
}) => {
  if (!crop) return null;

  const observations =
    language === 'en' ? crop.explanation.observationsTriggered : crop.explanation.observationsTriggeredBn;
  const rules = language === 'en' ? crop.explanation.rulesSatisfied : crop.explanation.rulesSatisfiedBn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="bg-[#0B1626] border border-white/10 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-white relative">
        <div className="sticky top-0 bg-[#0B1626]/95 backdrop-blur-md px-6 sm:px-8 py-5 border-b border-white/10 flex items-start justify-between gap-4 z-10">
          <div>
            <Eyebrow>{language === 'en' ? 'Rule audit' : 'নিয়ম নিরীক্ষা'}</Eyebrow>
            <h3 className="text-xl sm:text-2xl font-bold mt-1 flex flex-wrap items-center gap-2">
              <span>{language === 'en' ? `Why ${crop.nameEn}?` : `কেন ${crop.nameBn}?`}</span>
              <TierBadge tier={crop.suitabilityTier} language={language} />
              <span className="tnum text-sm font-semibold text-[#8FA3B8]">
                {crop.suitabilityScore}%
              </span>
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#8FA3B8] hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ol className="px-6 sm:px-8 py-2">
          {/* 01 Observation */}
          <li className="flex gap-4 py-5 border-b border-white/10">
            <span className="tnum text-sm font-semibold text-[#00E5FF] pt-0.5">01</span>
            <div className="min-w-0">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA3B8]">
                {language === 'en' ? 'Observation — what the satellites measured' : 'পর্যবেক্ষণ — উপগ্রহ যা মেপেছে'}
              </h4>
              <ul className="mt-2 space-y-2">
                {observations.map((obs, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-white/90 leading-relaxed">
                    <Check className="w-3.5 h-3.5 text-[#00E5FF] shrink-0 mt-1" />
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>

          {/* 02 Rule */}
          <li className="flex gap-4 py-5 border-b border-white/10">
            <span className="tnum text-sm font-semibold text-[#00E5FF] pt-0.5">02</span>
            <div className="min-w-0">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA3B8]">
                {language === 'en' ? 'Rule — BARI agronomy applied' : 'নিয়ম — প্রযুক্ত কৃষি নির্দেশিকা'}
              </h4>
              <ul className="mt-2 space-y-2">
                {rules.map((rule, idx) => (
                  <li key={idx} className="tnum font-mono text-xs text-white/90 leading-relaxed bg-white/5 border border-white/10 rounded-md px-3 py-2">
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </li>

          {/* 03 Effect */}
          <li className="flex gap-4 py-5 border-b border-white/10">
            <span className="tnum text-sm font-semibold text-[#B8FF3D] pt-0.5">03</span>
            <div className="min-w-0">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA3B8]">
                {language === 'en' ? 'Effect — how your priority moved the score' : 'প্রভাব — অগ্রাধিকার স্কোরে যেভাবে নাড়া দিল'}
              </h4>
              <p className="text-sm text-white/90 leading-relaxed mt-2">
                {language === 'en' ? crop.explanation.priorityAlignment : crop.explanation.priorityAlignmentBn}
              </p>
              <p className="text-sm text-[#8FA3B8] leading-relaxed mt-2">
                {priorityInfluenceText(selectedPriority, secondaryPriority, language)}
              </p>
            </div>
          </li>

          {/* 04 Recommendation */}
          <li className="flex gap-4 py-5">
            <span className="tnum text-sm font-semibold text-[#B8FF3D] pt-0.5">04</span>
            <div className="min-w-0">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA3B8]">
                {language === 'en' ? 'Recommendation' : 'সুপারিশ'}
              </h4>
              <p className="text-sm font-bold text-white leading-relaxed mt-2">
                {language === 'en'
                  ? `Consider ${crop.nameEn} for ${crop.seasonEn} (${crop.durationDays} days, ${crop.waterRequirementEn.toLowerCase()} water).`
                  : `${crop.seasonBn} মৌসুমে ${crop.nameBn} বিবেচনা করুন (${crop.durationDays} দিন, ${crop.waterRequirementBn} পানি)।`}
              </p>
              {(language === 'en'
                ? crop.explanation.waterSavingsVsAlternative
                : crop.explanation.waterSavingsVsAlternativeBn) && (
                <p className="text-sm text-[#00E5FF] leading-relaxed mt-1">
                  {language === 'en'
                    ? crop.explanation.waterSavingsVsAlternative
                    : crop.explanation.waterSavingsVsAlternativeBn}
                </p>
              )}
              <p className="text-xs text-[#8FA3B8] leading-relaxed mt-3">
                {language === 'en'
                  ? 'Deterministic BARI/BRRI rules on verified NASA metrics — no generative black box.'
                  : 'যাচাইকৃত নাসা পরিমাপে বারি/ব্রি নিয়ম — কোনো অনুমান-ইঞ্জিন নয়।'}
              </p>
            </div>
          </li>
        </ol>

        <div className="px-6 sm:px-8 py-4 border-t border-white/10 flex justify-end sticky bottom-0 bg-[#0B1626]/95 backdrop-blur-md">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-[#B8FF3D] hover:bg-[#B8FF3D]/85 text-[#050B14] font-bold text-sm transition cursor-pointer"
          >
            {language === 'en' ? 'Close' : 'বন্ধ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};
