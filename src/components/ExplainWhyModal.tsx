import React from 'react';
import { X, Check, Database, ShieldCheck, Droplet, Layers, Cpu, Compass } from 'lucide-react';
import { CropData, Language } from '../types';

interface ExplainWhyModalProps {
  crop: CropData | null;
  language: Language;
  onClose: () => void;
}

export const ExplainWhyModal: React.FC<ExplainWhyModalProps> = ({
  crop,
  language,
  onClose,
}) => {
  if (!crop) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0B1626] border-2 border-[#00E5FF]/30 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-white relative">
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#0B1626]/95 backdrop-blur-md p-6 border-b border-white/10 flex items-start justify-between z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00E5FF] mb-1">
              <Cpu className="w-4 h-4 text-[#00E5FF]" />
              <span>{language === 'en' ? 'Transparent Rule Audit' : 'স্বচ্ছ নিয়ম ও উপগ্রহ ডাটা নিরীক্ষা'}</span>
            </div>
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              <span>{language === 'en' ? `Why ${crop.nameEn}?` : `কেন ${crop.nameBn}?`}</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#B8FF3D]/10 text-[#B8FF3D] border border-[#B8FF3D]/30">
                {crop.suitabilityScore}% Match
              </span>
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8FA3B8] hover:text-white transition cursor-pointer border border-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Section 1: Earth Observations Evaluated */}
          <div className="p-4 rounded-2xl bg-[#050B14] border border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white mb-3">
              <Database className="w-4 h-4 text-[#00E5FF]" />
              <span>{language === 'en' ? '1. NASA Observations Evaluated' : '১. মূল্যায়িত নাসা উপগ্রহ ডাটা'}</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#8FA3B8]">
              {(language === 'en'
                ? crop.explanation.observationsTriggered
                : crop.explanation.observationsTriggeredBn
              ).map((obs, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="leading-relaxed">{obs}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2: Farmer Priority Alignment */}
          <div className="p-4 rounded-2xl bg-[#050B14] border border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white mb-3">
              <Compass className="w-4 h-4 text-[#B8FF3D]" />
              <span>{language === 'en' ? '2. Farmer Priority Influence' : '২. কৃষকের পছন্দের প্রতিফলন'}</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#8FA3B8]">
              <div className="w-5 h-5 rounded-full bg-[#B8FF3D]/10 text-[#B8FF3D] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <p className="leading-relaxed">
                {language === 'en'
                  ? crop.explanation.priorityAlignment
                  : crop.explanation.priorityAlignmentBn}
              </p>
            </div>
          </div>

          {/* Section 3: Agronomic Rules Triggered */}
          <div className="p-4 rounded-2xl bg-[#050B14] border border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white mb-3">
              <Layers className="w-4 h-4 text-[#B8FF3D]" />
              <span>{language === 'en' ? '3. Bangladesh Agronomic Rules Satisfied' : '৩. প্রযুক্ত কৃষি নিয়মের কার্যকারিতা'}</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#8FA3B8]">
              {(language === 'en'
                ? crop.explanation.rulesSatisfied
                : crop.explanation.rulesSatisfiedBn
              ).map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#B8FF3D]/10 text-[#B8FF3D] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="leading-relaxed">{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Water Savings Comparison if applicable */}
          {crop.explanation.waterSavingsVsAlternative && (
            <div className="p-4 rounded-2xl bg-[#00E5FF]/5 border border-[#00E5FF]/30 text-xs sm:text-sm text-[#8FA3B8] flex items-center gap-3">
              <Droplet className="w-5 h-5 text-[#00E5FF] shrink-0" />
              <span>
                <strong className="text-white">Water Impact: </strong>
                {language === 'en'
                  ? crop.explanation.waterSavingsVsAlternative
                  : crop.explanation.waterSavingsVsAlternativeBn}
              </span>
            </div>
          )}

          {/* Trust & Non-Black-Box Guarantee Note */}
          <div className="pt-3 border-t border-white/10 flex items-start gap-2.5 text-xs text-[#8FA3B8]">
            <ShieldCheck className="w-4 h-4 text-[#B8FF3D] shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">Why you can trust this: </strong>
              {language === 'en'
                ? 'AgriOrbit executes explicit conditional agronomic logic (BARI/BRRI guidelines) against verified NASA observation metrics. There is no generative AI black box or unpredictability.'
                : 'এগ্রিঅরবিট বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউটের নির্দেশিকা ও নাসার উপগ্রহ তথ্যের সরাসরি গাণিতিক নিয়মে কাজ করে। এটি কোনো অনুমানের উপর ভিত্তি করে তৈরি নয়।'}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/85 text-[#050B14] font-bold text-sm shadow-md transition cursor-pointer"
          >
            {language === 'en' ? 'Close Explanation' : 'ঠিক আছে'}
          </button>
        </div>
      </div>
    </div>
  );
};
