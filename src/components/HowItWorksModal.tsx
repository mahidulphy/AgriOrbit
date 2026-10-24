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
      <div className="bg-[#141414] border border-[#262626] rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl text-[#FAFAFA] relative p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#262626]">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-[#737373] mb-1">
              {language === 'en' ? 'ARCHITECTURE' : 'কাঠামো'}
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#FAFAFA]">
              {language === 'en' ? 'How AgriOrbit Works' : 'এগ্রিঅরবিট কীভাবে কাজ করে'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0A0A0A] border border-[#262626] flex items-center justify-center text-[#737373] hover:text-[#FAFAFA] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs sm:text-sm text-[#A3A3A3]">
          <div className="p-4 rounded-lg bg-[#0A0A0A] border border-[#262626] flex gap-3.5">
            <div className="w-8 h-8 rounded-md bg-[#141414] border border-[#262626] text-[#22C55E] flex items-center justify-center shrink-0 font-mono font-medium text-xs">
              01
            </div>
            <div>
              <h4 className="font-semibold text-[#FAFAFA] text-sm mb-1">
                {language === 'en' ? '1. NASA Observes' : '১. নাসা নজর রাখে'}
              </h4>
              <p className="leading-relaxed text-xs text-[#737373]">
                {language === 'en'
                  ? 'Continuous satellite observations track precipitation (POWER), soil moisture (SMAP), and surface heat/vegetation (MODIS) across Bangladesh.'
                  : 'নাসা পাওয়ার, স্ম্যাপ এবং মডিস উপগ্রহ প্রতিনিয়ত বৃষ্টিপাত, মাটির আর্দ্রতা ও উদ্ভিদের স্বাস্থ্য পর্যবেক্ষণ করে।'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#0A0A0A] border border-[#262626] flex gap-3.5">
            <div className="w-8 h-8 rounded-md bg-[#141414] border border-[#262626] text-[#22C55E] flex items-center justify-center shrink-0 font-mono font-medium text-xs">
              02
            </div>
            <div>
              <h4 className="font-semibold text-[#FAFAFA] text-sm mb-1">
                {language === 'en' ? '2. AgriOrbit Explains' : '২. অ্যাগ্রিঅরবিট বুঝিয়ে বলে'}
              </h4>
              <p className="leading-relaxed text-xs text-[#737373]">
                {language === 'en'
                  ? 'A deterministic agronomic rule engine pairs observation metrics with local soil types and farmer objectives (water savings, soil health). No black-box AI.'
                  : 'আমাদের নিয়মগুলো এই স্যাটেলাইট তথ্যকে আপনার চাহিদা ও মাটির বৈশিষ্ট্যের সাথে মিলিয়ে উপযুক্ত ফসল খুঁজে বের করে। কোনো মনগড়া হিসাব নয়।'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#0A0A0A] border border-[#262626] flex gap-3.5">
            <div className="w-8 h-8 rounded-md bg-[#141414] border border-[#262626] text-[#22C55E] flex items-center justify-center shrink-0 font-mono font-medium text-xs">
              03
            </div>
            <div>
              <h4 className="font-semibold text-[#FAFAFA] text-sm mb-1">
                {language === 'en' ? '3. The Farmer Decides' : '৩. কৃষক সিদ্ধান্ত নেন'}
              </h4>
              <p className="leading-relaxed text-xs text-[#737373]">
                {language === 'en'
                  ? 'Actionable advisory with seasonal 3-crop rotations and alerts delivered directly to farmers with complete transparency.'
                  : 'সম্পূর্ণ স্বচ্ছ হিসাব ও ৩ মৌসুমের ফসল চক্রের পরামর্শ দেখে শেষ পর্যন্ত সিদ্ধান্ত নেন কৃষক নিজে।'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
