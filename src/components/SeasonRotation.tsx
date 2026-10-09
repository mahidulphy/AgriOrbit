import React from 'react';
import { ArrowDown, HelpCircle, Droplet, Sparkles, CheckCircle2, ShieldCheck, Printer, Share2, Compass, ArrowRight } from 'lucide-react';
import { CropData, DistrictId, FarmerPriorityId, Language } from '../types';
import { ROTATION_PLANS } from '../data/agriData';
import { getDistrictAdmin } from '../data/bdAdmin';
import { IMAGES } from '../data/assets';
import { SmsAdvisoryButton } from './dashboard/SmsAdvisoryButton';

interface SeasonRotationProps {
  selectedDistrict: DistrictId;
  selectedPriority: FarmerPriorityId;
  language: Language;
  onExplainCrop: (crop: CropData) => void;
}

export const SeasonRotation: React.FC<SeasonRotationProps> = ({
  selectedDistrict,
  selectedPriority,
  language,
  onExplainCrop,
}) => {
  const district = getDistrictAdmin(selectedDistrict) ?? {
    nameEn: selectedDistrict,
    nameBn: selectedDistrict,
  };
  const rotationPlan = ROTATION_PLANS[selectedPriority];

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'AgriOrbit Crop Rotation Advisory',
        text: `AgriOrbit Recommendation for ${district.nameEn}: ${rotationPlan.summaryEn}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert(language === 'en' ? 'Link copied to clipboard!' : 'লিংকটি কপি করা হয়েছে!');
    }
  };

  return (
    <section id="rotation-section" className="py-6 sm:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Editorial Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#00E5FF] font-mono font-semibold mb-2">
              <span>04</span>
              <span aria-hidden="true">·</span>
              <span>{language === 'en' ? 'ANNUAL AGRO-CYCLE' : 'বার্ষিক শস্য পরিক্রমা'}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {language === 'en' ? 'Recommended 3-Season Rotation' : '৩-মৌসুমী টেকসই শস্য পরিক্রমা'}
            </h2>
            <p className="text-xs sm:text-sm text-[#8FA3B8] mt-1 max-w-xl">
              {language === 'en'
                ? 'An aligned annual strategy replacing high-draw monoculture with moisture-efficient pulse rotations.'
                : 'একক ফসলের ক্ষতি রোধ করে ৩টি মৌসুমের একটি ধারাবাহিক ও সুষম খাদ্য-শস্য চক্র।'}
            </p>
          </div>

          {/* Strategy Impact Badges */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#0B1626] border border-white/10 flex items-center gap-3">
              <span className="font-mono text-xl font-bold text-[#00E5FF]">~{rotationPlan.estimatedWaterSavingPct}%</span>
              <span className="text-[11px] text-[#8FA3B8] font-mono uppercase">Water Saved</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0B1626] border border-white/10 flex items-center gap-3">
              <span className="font-mono text-xl font-bold text-[#B8FF3D]">+{rotationPlan.soilHealthGainPct}%</span>
              <span className="text-[11px] text-[#8FA3B8] font-mono uppercase">Soil Gain</span>
            </div>
          </div>
        </div>

        {/* 3-Season Journey Cards with Visual Connector Rails */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative">
          {rotationPlan.seasons.map((season, index) => {
            const crop = season.crop;
            const isLast = index === rotationPlan.seasons.length - 1;

            return (
              <div
                key={season.seasonEn}
                className="p-6 sm:p-8 rounded-2xl bg-[#0B1626] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between relative group"
              >
                <div>
                  {/* Top Season Number & Months */}
                  <div className="flex items-center justify-between text-xs font-mono text-[#8FA3B8] mb-4">
                    <span className="text-[#B8FF3D] font-bold uppercase">
                      0{index + 1} · {language === 'en' ? season.seasonEn : season.seasonBn}
                    </span>
                    <span>{language === 'en' ? season.monthsEn : season.monthsBn}</span>
                  </div>

                  {/* Crop Name */}
                  <h3 className="font-display text-2xl font-bold text-white mb-1">
                    {language === 'en' ? crop.nameEn : crop.nameBn}
                  </h3>
                  <span className="text-xs text-[#8FA3B8] font-mono block mb-4">
                    {crop.durationDays} {language === 'en' ? 'Days growth duration' : 'দিন সময়কাল'}
                  </span>

                  {/* Agronomic Role in Cycle */}
                  <div className="p-4 rounded-xl bg-[#050B14] border border-white/5 text-xs text-[#8FA3B8] leading-relaxed mb-6">
                    <span className="text-[10px] uppercase font-mono text-white block mb-1">
                      {language === 'en' ? 'Agronomic Function' : 'পরিক্রমায় ভূমিকা'}:
                    </span>
                    {language === 'en' ? season.agronomicRoleEn : season.agronomicRoleBn}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono text-[#00E5FF]">
                    {language === 'en' ? crop.waterRequirementEn : crop.waterRequirementBn} Water
                  </span>

                  <button
                    onClick={() => onExplainCrop(crop)}
                    className="text-xs font-semibold text-[#B8FF3D] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{language === 'en' ? 'Explain Why' : 'কারণ দেখুন'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actionable Editorial Decision Support Certificate */}
        <div className="rounded-3xl bg-[#0B1626] border border-[#B8FF3D]/40 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#B8FF3D] font-mono font-semibold mb-3">
              <CheckCircle2 className="w-4 h-4 text-[#B8FF3D]" />
              <span>{language === 'en' ? 'AgriOrbit Decision Support Advisory' : 'এগ্রিঅরবিট চূড়ান্ত কৃষি পরামর্শ'}</span>
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-4 leading-snug">
              {language === 'en' ? (
                <>
                  "Based on field observations in{' '}
                  <span className="text-[#00E5FF]">{district.nameEn}</span>, your priority to{' '}
                  <span className="text-[#B8FF3D]">{selectedPriority.replace('_', ' ')}</span>, and NASA Earth observations, AgriOrbit recommends considering the sequence{' '}
                  <span className="text-white underline decoration-[#B8FF3D]">
                    {rotationPlan.seasons.map((s) => s.crop.nameEn.split(' ')[0]).join(' → ')}
                  </span>{' '}
                  for the upcoming annual cycle."
                </>
              ) : (
                <>
                  "বর্তমান{' '}
                  <span className="text-[#00E5FF]">{district.nameBn}</span>{' '}
                  জেলার উপগ্রহ পরিস্থিতি, আপনার{' '}
                  <span className="text-[#B8FF3D]">
                    {selectedPriority === 'save_water' && 'পানি সাশ্রয়'}
                    {selectedPriority === 'improve_soil' && 'মাটির উর্বরতা বৃদ্ধি'}
                    {selectedPriority === 'maximize_profit' && 'সর্বোচ্চ লাভ'}
                    {selectedPriority === 'maximize_yield' && 'সর্বোচ্চ ফলন'}
                    {selectedPriority === 'lower_cost' && 'কম খরচ'}
                    {selectedPriority === 'reduce_risk' && 'জলবায়ু ঝুঁকি হ্রাস'}
                  </span>{' '}
                  অগ্রাধিকার এবং নাসার পর্যবেক্ষণ অনুযায়ী, এগ্রিঅরবিট{' '}
                  <span className="text-white underline decoration-[#B8FF3D]">
                    {rotationPlan.seasons.map((s) => s.crop.nameBn).join(' → ')}
                  </span>{' '}
                  শস্য আবর্তন বিবেচনা করার পরামর্শ দিচ্ছে।"
                </>
              )}
            </h3>

            <p className="text-xs sm:text-sm text-[#8FA3B8] leading-relaxed mb-8">
              {language === 'en' ? rotationPlan.summaryEn : rotationPlan.summaryBn}
            </p>

            {/* Print & Share Actions */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#8FA3B8]">
                <ShieldCheck className="w-4 h-4 text-[#B8FF3D] shrink-0" />
                <span>
                  {language === 'en'
                    ? 'AgriOrbit provides explainable decision support. Farmers make the final decision.'
                    : 'এগ্রিঅরবিট তথ্যভিত্তিক সিদ্ধান্ত সহায়তা দেয়। চূড়ান্ত সিদ্ধান্ত কৃষকের নিজের।'}
                </span>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
                <SmsAdvisoryButton
                  district={district.nameEn}
                  language={language}
                />
                <button
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-none"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Print Advisory' : 'প্রিন্ট'}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="px-5 py-2.5 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/90 text-[#050B14] font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-none shadow-md"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Share Plan' : 'শেয়ার'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
