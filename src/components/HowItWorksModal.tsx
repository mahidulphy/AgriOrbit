import React from 'react';
import { X } from 'lucide-react';
import { Language } from '../types';
import { Eyebrow } from './ui';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="bg-[#0B1626] border border-white/10 rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl text-white relative p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="/assets/agriorbit-logo.png"
              alt="AgriOrbit"
              className="h-9 w-auto object-contain mix-blend-screen shrink-0"
              draggable={false}
            />
            <div>
              <Eyebrow>{language === 'en' ? 'How it works' : 'যেভাবে কাজ করে'}</Eyebrow>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {language === 'en' ? 'Three steps, fully auditable' : 'তিনটি ধাপ, সম্পূর্ণ যাচাইযোগ্য'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#8FA3B8] hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ol className="mt-2">
          {[
            {
              n: '01',
              tEn: 'NASA observes',
              tBn: 'নাসা পর্যবেক্ষণ করে',
              dEn: 'Rainfall (POWER), soil moisture (SMAP), vegetation and heat (MODIS) over Bangladesh.',
              dBn: 'বাংলাদেশের উপর বৃষ্টি, মাটির আর্দ্রতা, উদ্ভিদ ও তাপ পর্যবেক্ষণ করা হয়।',
            },
            {
              n: '02',
              tEn: 'AgriOrbit explains',
              tBn: 'এগ্রিঅরবিট ব্যাখ্যা করে',
              dEn: 'A deterministic rule engine pairs observations with BARI agronomy and your priority. No black box.',
              dBn: 'স্বচ্ছ নিয়ম-ইঞ্জিন পর্যবেক্ষণকে কৃষিবিদ্যা ও অগ্রাধিকারের সাথে মেলায়। কোনো ব্ল্যাক-বক্স নেই।',
            },
            {
              n: '03',
              tEn: 'Farmer decides',
              tBn: 'সিদ্ধান্ত কৃষকের',
              dEn: 'Review the rotation, open “Explain Why” on any crop, and plant with the reasoning in hand.',
              dBn: 'পরিক্রমা দেখুন, “কেন” যাচাই করুন, যুক্তি হাতে বপন করুন।',
            },
          ].map((s) => (
            <li key={s.n} className="flex gap-4 py-4 border-b border-white/10 last:border-0">
              <span className="tnum text-sm font-semibold text-[#00E5FF] pt-0.5">{s.n}</span>
              <div>
                <h4 className="font-bold text-white text-sm">{language === 'en' ? s.tEn : s.tBn}</h4>
                <p className="text-sm text-[#8FA3B8] mt-1 leading-relaxed">
                  {language === 'en' ? s.dEn : s.dBn}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-[#B8FF3D] hover:bg-[#B8FF3D]/85 text-[#050B14] font-bold text-xs transition cursor-pointer"
          >
            {language === 'en' ? 'Got It' : 'বুঝেছি'}
          </button>
        </div>
      </div>
    </div>
  );
};
