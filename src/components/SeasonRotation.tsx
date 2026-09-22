import React from 'react';
import { ArrowDown, HelpCircle, Droplet, Sparkles, CheckCircle2, ShieldCheck, Printer, Share2, Compass } from 'lucide-react';
import { CropData, DistrictId, FarmerPriorityId, Language } from '../types';
import { DISTRICTS, ROTATION_PLANS } from '../data/agriData';

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
  const district = DISTRICTS[selectedDistrict];
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
    <section id="rotation-section" className="py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A855F7] mb-1">
              <Compass className="w-4 h-4" />
              <span>Step 5 • {language === 'en' ? 'Annual Agro-Cycle' : 'বার্ষিক শস্য পরিক্রমা'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {language === 'en' ? 'Recommended 3-Season Rotation' : '৩-মৌসুমী টেকসই শস্য পরিক্রমা'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-[#3B0764] border border-[#6D28D9]/50 text-xs text-[#E9D5FF]">
              <span className="text-[#E9D5FF]/60">{language === 'en' ? 'Active Goal: ' : 'উদ্দেশ্য: '}</span>
              <strong className="text-white capitalize">
                {selectedPriority.replace('_', ' ')}
              </strong>
            </div>
          </div>
        </div>

        {/* Rotation Performance Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#3B0764] to-[#2E1065] border border-[#6D28D9]/40 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
              <Droplet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-[#E9D5FF]/70 block">
                {language === 'en' ? 'Estimated Irrigation Water Saved' : 'আনুমানিক ভূগর্ভস্থ পানি সাশ্রয়'}
              </span>
              <div className="text-2xl font-black text-white font-mono">
                ~{rotationPlan.estimatedWaterSavingPct}%
                <span className="text-xs text-cyan-300 font-normal ml-2">vs traditional Boro-Fallow-Aman</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-[#3B0764] to-[#2E1065] border border-[#6D28D9]/40 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-[#E9D5FF]/70 block">
                {language === 'en' ? 'Biological Soil Fertility Gain' : 'প্রাকৃতিক মাটির উর্বরতা বৃদ্ধি'}
              </span>
              <div className="text-2xl font-black text-white font-mono">
                +{rotationPlan.soilHealthGainPct}%
                <span className="text-xs text-emerald-300 font-normal ml-2">Rhizobium Nitrogen restoration</span>
              </div>
            </div>
          </div>
        </div>

        {/* 
          3-SEASON ROTATION VISUAL CHAIN:
          RABI (Nov–Feb)
             ↓
          KHARIF-1 (Mar–Jun)
             ↓
          KHARIF-2 (Jul–Oct)
        */}
        <div className="space-y-4 mb-10">
          {rotationPlan.seasons.map((season, index) => {
            const crop = season.crop;
            const isLast = index === rotationPlan.seasons.length - 1;

            return (
              <React.Fragment key={season.seasonEn}>
                <div className="bg-[#3B0764]/70 border border-[#6D28D9]/60 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Season Tag & Crop Name */}
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#6D28D9] flex items-center justify-center font-black text-white text-sm shadow-md shrink-0">
                        0{index + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#A855F7]">
                            {language === 'en' ? season.seasonEn : season.seasonBn}
                          </span>
                          <span className="text-xs text-[#E9D5FF]/60">•</span>
                          <span className="text-xs text-[#E9D5FF]/70 font-mono">
                            {language === 'en' ? season.monthsEn : season.monthsBn}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-3 mt-1">
                          <h3 className="text-2xl font-black text-white">
                            {language === 'en' ? crop.nameEn : crop.nameBn}
                          </h3>
                          <span className="text-xs font-mono text-[#E9D5FF]/80">
                            ({crop.durationDays} {language === 'en' ? 'Days' : 'দিন'})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Agronomic Role & Explain Button */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#2E1065] border border-[#6D28D9]/40 text-xs text-[#E9D5FF]/90 max-w-md">
                        <strong className="text-white block mb-0.5">
                          {language === 'en' ? 'Agronomic Function in Rotation:' : 'শস্য আবর্তনে ভূমিকা:'}
                        </strong>
                        {language === 'en' ? season.agronomicRoleEn : season.agronomicRoleBn}
                      </div>

                      <button
                        onClick={() => onExplainCrop(crop)}
                        className="px-4 py-2.5 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Explain Why' : 'ব্যাখ্যা দেখুন'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Connecting Arrow */}
                {!isLast && (
                  <div className="flex items-center justify-center my-1">
                    <div className="w-8 h-8 rounded-full bg-[#6D28D9] border border-[#A855F7]/40 flex items-center justify-center shadow-lg text-white">
                      <ArrowDown className="w-4 h-4 animate-bounce" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* 
          FINAL ACTIONABLE ADVISORY:
          "The product must ultimately end with a clear actionable sentence rather than leaving the farmer with only charts."
        */}
        <div className="rounded-2xl bg-gradient-to-br from-[#3B0764] via-[#2E1065] to-[#3B0764] border-2 border-[#A855F7] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-[#A855F7] mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#A855F7]" />
            <span>{language === 'en' ? 'AgriOrbit Decision Support Advisory' : 'এগ্রিঅরবিট চূড়ান্ত কৃষি পরামর্শ'}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white mb-3 leading-snug">
            {language === 'en' ? (
              <>
                "Based on current field conditions in{' '}
                <span className="text-[#E9D5FF] underline decoration-[#A855F7]">{district.nameEn}</span>,
                your selected priority to{' '}
                <span className="text-[#E9D5FF] underline decoration-[#A855F7]">
                  {selectedPriority.replace('_', ' ')}
                </span>
                , and NASA Earth observations, AgriOrbit suggests considering{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E9D5FF] to-[#A855F7] font-black">
                  {rotationPlan.seasons.map((s) => s.crop.nameEn.split(' ')[0]).join(' → ')}
                </span>{' '}
                for the upcoming annual crop cycle."
              </>
            ) : (
              <>
                "বর্তমান{' '}
                <span className="text-[#E9D5FF] underline decoration-[#A855F7]">{district.nameBn}</span>{' '}
                জেলার মাটির অবস্থা, আপনার নির্বাচিত{' '}
                <span className="text-[#E9D5FF] underline decoration-[#A855F7]">
                  {selectedPriority === 'save_water' && 'পানি সাশ্রয়'}
                  {selectedPriority === 'improve_soil' && 'মাটির উর্বরতা বৃদ্ধি'}
                  {selectedPriority === 'lower_cost' && 'কম খরচ'}
                  {selectedPriority === 'reduce_risk' && 'জলবায়ু ঝুঁকি হ্রাস'}
                </span>{' '}
                অগ্রাধিকার এবং নাসার উপগ্রহ তথ্যের ভিত্তিতে, এগ্রিঅরবিট আসন্ন মৌসুমে{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E9D5FF] to-[#A855F7] font-black">
                  {rotationPlan.seasons.map((s) => s.crop.nameBn).join(' → ')}
                </span>{' '}
                শস্য পরিক্রমা বিবেচনা করার পরামর্শ দিচ্ছে।"
              </>
            )}
          </h3>

          <p className="text-xs sm:text-sm text-[#E9D5FF]/80 leading-relaxed mb-6">
            {language === 'en' ? rotationPlan.summaryEn : rotationPlan.summaryBn}
          </p>

          {/* Farmer Decision Notice & Actions */}
          <div className="pt-4 border-t border-[#6D28D9]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[#E9D5FF]/70">
              <ShieldCheck className="w-4 h-4 text-[#A855F7] shrink-0" />
              <span>
                {language === 'en'
                  ? 'AgriOrbit provides explainable decision support. The farmer makes the final decision.'
                  : 'এগ্রিঅরবিট যুক্তিনির্ভর সিদ্ধান্ত সহায়তা প্রদান করে। চূড়ান্ত সিদ্ধান্ত কৃষকের নিজের।'}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#2E1065] hover:bg-[#3B0764] border border-[#6D28D9] text-[#E9D5FF] font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Print Advisory' : 'প্রিন্ট করুন'}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Share Plan' : 'শেয়ার করুন'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
