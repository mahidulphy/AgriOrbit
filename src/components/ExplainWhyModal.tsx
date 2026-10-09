import React from 'react';
import { X, Check, Database, ShieldCheck, Droplet, Layers, Cpu, Compass } from 'lucide-react';
import { CropData, FarmerPriorityId, Language } from '../types';
import { priorityInfluenceText } from '../lib/cropSuitability';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0B1626] border border-white/15 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-white relative font-editorial">
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#0B1626]/95 backdrop-blur-md p-6 sm:p-8 border-b border-white/10 flex items-start justify-between z-10">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#00E5FF] font-mono font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>{language === 'en' ? 'TRANSPARENT SCIENTIFIC REASONING' : 'স্বচ্ছ বৈজ্ঞানিক ভিত্তি'}</span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white flex items-baseline gap-3">
              <span>{language === 'en' ? `Why ${crop.nameEn}?` : `কেন ${crop.nameBn}?`}</span>
              <span className="font-mono text-base font-bold text-[#B8FF3D]">
                {crop.suitabilityScore}% Match
              </span>
            </h3>
            <p className="text-xs text-[#8FA3B8] italic font-serif mt-1">
              {crop.scientificName} · {language === 'en' ? crop.seasonEn : crop.seasonBn} season
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8FA3B8] hover:text-white transition-colors cursor-pointer border border-white/10"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* 01: NASA Observations Evaluated */}
          <div className="p-6 rounded-2xl bg-[#050B14] border border-white/10">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#00E5FF] font-mono font-semibold mb-3">
              <Database className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>{language === 'en' ? '01 · NASA Observations Evaluated' : '০১ · উপগ্রহ তথ্য নিরীক্ষা'}</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-[#8FA3B8]">
              {(language === 'en'
                ? crop.explanation.observationsTriggered
                : crop.explanation.observationsTriggeredBn
              ).map((obs, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <span className="leading-relaxed text-white/90">{obs}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 02: Farmer Priority Alignment */}
          <div className="p-6 rounded-2xl bg-[#050B14] border border-white/10">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#B8FF3D] font-mono font-semibold mb-3">
              <Compass className="w-3.5 h-3.5 text-[#B8FF3D]" />
              <span>{language === 'en' ? '02 · Farmer Priority Alignment' : '০২ · কৃষকের লক্ষ্যের সাথে সামঞ্জস্য'}</span>
            </div>
            <div className="flex items-start gap-3 text-xs sm:text-sm text-[#8FA3B8] mb-3">
              <div className="w-4 h-4 rounded-full bg-[#B8FF3D]/10 text-[#B8FF3D] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>
              <p className="leading-relaxed text-white/90">
                {language === 'en'
                  ? crop.explanation.priorityAlignment
                  : crop.explanation.priorityAlignmentBn}
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 text-xs text-[#8FA3B8] leading-relaxed">
              <strong className="text-white block font-mono text-[11px] uppercase mb-1">
                {language === 'en' ? 'Engine Rule Influence:' : 'নিয়ম প্রভাব:'}
              </strong>
              {priorityInfluenceText(selectedPriority, secondaryPriority, language)}
            </div>
          </div>

          {/* 03: Agronomic Rules Satisfied */}
          <div className="p-6 rounded-2xl bg-[#050B14] border border-white/10">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white font-mono font-semibold mb-3">
              <Layers className="w-3.5 h-3.5 text-white" />
              <span>{language === 'en' ? '03 · BARI Agronomic Rules Satisfied' : '০৩ · কৃষি গবেষণা মানদণ্ড'}</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-[#8FA3B8]">
              {(language === 'en'
                ? crop.explanation.rulesSatisfied
                : crop.explanation.rulesSatisfiedBn
              ).map((rule, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <span className="leading-relaxed text-white/90">{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Water Savings Note if present */}
          {(crop.explanation.waterSavingsVsAlternative || crop.explanation.waterSavingsVsAlternativeBn) && (
            <div className="p-4 rounded-xl bg-[#00E5FF]/5 border border-[#00E5FF]/20 text-xs text-[#00E5FF] leading-relaxed flex items-start gap-2.5">
              <Droplet className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {language === 'en'
                  ? crop.explanation.waterSavingsVsAlternative
                  : crop.explanation.waterSavingsVsAlternativeBn}
              </span>
            </div>
          )}

          {/* Transparent Trust Declaration */}
          <div className="text-[11px] font-mono text-[#8FA3B8] pt-2 text-center">
            Derived from NASA POWER (surface meteorology), NASA SMAP (soil moisture), NASA MODIS (NDVI), and BARI/BRRI agronomic models.
          </div>
        </div>
      </div>
    </div>
  );
};
