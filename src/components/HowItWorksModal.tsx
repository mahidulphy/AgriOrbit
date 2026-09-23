import React from 'react';
import { X } from 'lucide-react';
import { Language } from '../types';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0B1626] border-2 border-[#00E5FF]/30 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl text-white relative p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img
              src="/assets/agriorbit-logo.png"
              alt="AgriOrbit"
              className="h-8 w-auto object-contain mix-blend-screen shrink-0"
              draggable={false}
            />
            <h3 className="text-xl font-black text-white">
              {language === 'en' ? 'How AgriOrbit Works' : 'এগ্রিঅরবিট কীভাবে কাজ করে'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8FA3B8] hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-[#8FA3B8]">
          <div className="p-4 rounded-xl bg-[#050B14] border border-white/10 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 flex items-center justify-center shrink-0 font-bold">
              1
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">
                {language === 'en' ? '1. NASA Observes' : '১. নাসা উপগ্রহ পর্যবেক্ষণ'}
              </h4>
              <p className="leading-relaxed">
                {language === 'en'
                  ? 'Continuous satellite telemetry tracks precipitation (POWER), soil moisture (SMAP), and surface heat/vegetation (MODIS) across Bangladesh.'
                  : 'নাসা পাওয়ার, স্ম্যাপ এবং মডিস উপগ্রহ প্রতিনিয়ত বৃষ্টিপাত, মাটির আর্দ্রতা ও উদ্ভিদের স্বাস্থ্য পর্যবেক্ষণ করে।'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#050B14] border border-white/10 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 flex items-center justify-center shrink-0 font-bold">
              2
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">
                {language === 'en' ? '2. AgriOrbit Explains' : '২. এগ্রিঅরবিট যৌক্তিক ব্যাখ্যা দেয়'}
              </h4>
              <p className="leading-relaxed">
                {language === 'en'
                  ? 'A deterministic agronomic rule engine pairs observation metrics with local soil types and farmer objectives (water savings, soil health). No black-box AI.'
                  : 'একটি স্বচ্ছ কৃষি নিয়মাবলী ব্যবস্থা এই উপগ্রহ তথ্যকে কৃষকের অগ্রাধিকার ও মাটির বৈশিষ্ট্যের সাথে মিলিয়ে উপযোগী ফসল নির্ধারণ করে।'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#050B14] border border-white/10 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#B8FF3D]/10 text-[#B8FF3D] border border-[#B8FF3D]/30 flex items-center justify-center shrink-0 font-bold">
              3
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">
                {language === 'en' ? '3. Farmer Decides' : '৩. চূড়ান্ত সিদ্ধান্ত কৃষকের'}
              </h4>
              <p className="leading-relaxed">
                {language === 'en'
                  ? 'The farmer reviews the transparent 3-season crop rotation (Rabi → Kharif-1 → Kharif-2), checks "Explain Why", and makes the informed choice for their field.'
                  : 'কৃষক প্রতিটি সুপারিশের পেছনের কারণ যাচাই করেন এবং নিজের জমিতে রবি, খরিফ-১ ও খরিফ-২ এর জন্য সিদ্ধান্ত নেন।'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/85 text-[#050B14] font-bold text-xs shadow-md transition cursor-pointer"
          >
            {language === 'en' ? 'Got It' : 'বুঝেছি'}
          </button>
        </div>
      </div>
    </div>
  );
};
