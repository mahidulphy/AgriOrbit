import React from 'react';
import { ArrowRight, Printer, Share2, ShieldCheck } from 'lucide-react';
import { CropData, DistrictId, FarmerPriorityId, Language } from '../types';
import { ROTATION_PLANS } from '../data/agriData';
import { getDistrictAdmin } from '../data/bdAdmin';
import { Eyebrow, PrimaryButton } from './ui';

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
      alert(language === 'en' ? 'Link copied to clipboard!' : 'লিংকটি কপি করা হয়েছে!');
    }
  };

  return (
    <section id="rotation-section">
      <Eyebrow tone="lime">
        Step 5 · {language === 'en' ? 'Annual rotation' : 'বার্ষিক আবর্তন'}
      </Eyebrow>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mt-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {language === 'en' ? 'Your three-season plan' : 'আপনার তিন মৌসুমের পরিকল্পনা'}
        </h2>
        <p className="tnum text-sm text-[#8FA3B8]">
          <span className="text-[#00E5FF] font-bold">~{rotationPlan.estimatedWaterSavingPct}%</span>{' '}
          {language === 'en' ? 'less irrigation water' : 'কম সেচ পানি'} ·{' '}
          <span className="text-[#B8FF3D] font-bold">+{rotationPlan.soilHealthGainPct}%</span>{' '}
          {language === 'en' ? 'soil fertility' : 'মাটির উর্বরতা'}
        </p>
      </div>

      {/* Timeline */}
      <ol className="mt-8 ml-1 border-l border-white/15">
        {rotationPlan.seasons.map((season, index) => {
          const crop = season.crop;
          return (
            <li key={season.seasonEn} className="relative pl-8 pb-8 last:pb-0">
              <span className="tnum absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#050B14] border border-[#B8FF3D]/50 text-[11px] font-bold text-[#B8FF3D]">
                {index + 1}
              </span>
              <p className="text-[11px] uppercase tracking-wider text-[#8FA3B8]">
                {language === 'en' ? season.seasonEn : season.seasonBn} ·{' '}
                <span className="tnum">{language === 'en' ? season.monthsEn : season.monthsBn}</span>
              </p>
              <h3 className="text-xl font-bold text-white mt-1">
                {language === 'en' ? crop.nameEn : crop.nameBn}
                <span className="tnum ml-2 text-xs font-medium text-[#8FA3B8]">
                  {crop.durationDays} {language === 'en' ? 'days' : 'দিন'} ·{' '}
                  {language === 'en' ? crop.waterRequirementEn : crop.waterRequirementBn}{' '}
                  {language === 'en' ? 'water' : 'পানি'}
                </span>
              </h3>
              <p className="text-sm text-[#8FA3B8] mt-1 leading-relaxed max-w-2xl">
                <strong className="text-white font-semibold">
                  {language === 'en' ? 'Role in rotation: ' : 'আবর্তনে ভূমিকা: '}
                </strong>
                {language === 'en' ? season.agronomicRoleEn : season.agronomicRoleBn}
              </p>
              <button
                onClick={() => onExplainCrop(crop)}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#00E5FF] hover:text-white transition cursor-pointer"
              >
                {language === 'en' ? 'Explain why' : 'ব্যাখ্যা দেখুন'}
                <ArrowRight className="w-3 h-3" />
              </button>
            </li>
          );
        })}
      </ol>

      {/* Final advisory */}
      <div className="mt-10 border-l-2 border-[#B8FF3D] bg-[#0B1626] rounded-r-lg p-6 sm:p-8">
        <Eyebrow tone="lime">
          {language === 'en' ? 'AgriOrbit advisory' : 'এগ্রিঅরবিট পরামর্শ'}
        </Eyebrow>
        <p className="text-lg sm:text-xl font-bold leading-snug mt-2 max-w-3xl">
          {language === 'en' ? (
            <>
              For {district.nameEn}, with a {selectedPriority.replace('_', ' ')} priority, consider{' '}
              <span className="text-[#B8FF3D]">
                {rotationPlan.seasons.map((s) => s.crop.nameEn.split(' ')[0]).join(' → ')}
              </span>{' '}
              for the coming year.
            </>
          ) : (
            <>
              {district.nameBn} জেলায়,{' '}
              {selectedPriority === 'save_water' && 'পানি সাশ্রয়'}
              {selectedPriority === 'improve_soil' && 'মাটির উর্বরতা বৃদ্ধি'}
              {selectedPriority === 'maximize_profit' && 'সর্বোচ্চ লাভ'}
              {selectedPriority === 'maximize_yield' && 'সর্বোচ্চ ফলন'}
              {selectedPriority === 'lower_cost' && 'কম খরচ'}
              {selectedPriority === 'reduce_risk' && 'জলবায়ু ঝুঁকি হ্রাস'}{' '}
              অগ্রাধিকারে, আসন্ন বছরে{' '}
              <span className="text-[#B8FF3D]">
                {rotationPlan.seasons.map((s) => s.crop.nameBn).join(' → ')}
              </span>{' '}
              বিবেচনা করুন।
            </>
          )}
        </p>
        <p className="text-sm text-[#8FA3B8] leading-relaxed mt-3 max-w-3xl">
          {language === 'en' ? rotationPlan.summaryEn : rotationPlan.summaryBn}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-6 pt-5 border-t border-white/10">
          <p className="flex items-center gap-1.5 text-xs text-[#8FA3B8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B8FF3D] shrink-0" />
            <span>
              {language === 'en'
                ? 'Decision support only — you make the final call.'
                : 'শুধু সিদ্ধান্ত সহায়তা — চূড়ান্ত সিদ্ধান্ত আপনার।'}
            </span>
          </p>
          <div className="flex gap-2 sm:ml-auto">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Print' : 'প্রিন্ট'}</span>
            </button>
            <PrimaryButton onClick={handleShare} className="px-4 py-2 text-xs">
              <Share2 className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Share Plan' : 'শেয়ার করুন'}</span>
            </PrimaryButton>
          </div>
        </div>
      </div>
    </section>
  );
};
