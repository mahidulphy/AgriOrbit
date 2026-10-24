import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle2, RotateCcw, MessageCircle, Heart, Info } from 'lucide-react';
import type { Language, FarmerPriorityId } from '../../types';

export interface FarmerFeedbackLoopProps {
  language?: Language;
  district?: string;
  upazila?: string;
  selectedPriority?: FarmerPriorityId;
  onFeedbackSubmit?: (response: 'yes' | 'no', detail?: string) => void;
  className?: string;
}

/**
 * 5. Farmer Feedback Loop (Data Collection)
 * Clean, minimal section at the very bottom of the page for community validation.
 * Features: "Will you follow this suggested plan?" with "[Yes, looks good]" & "[No, I have other plans]".
 */
export const FarmerFeedbackLoop: React.FC<FarmerFeedbackLoopProps> = ({
  language = 'en',
  district = 'Rangpur',
  upazila = 'Mithapukur',
  selectedPriority,
  onFeedbackSubmit,
  className = '',
}) => {
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [submittedDetail, setSubmittedDetail] = useState(false);

  const isEn = language === 'en';

  const reasons = isEn
    ? [
        'Prefer traditional local seed variety',
        'Market price uncertainty for pulses',
        'Shallow tubewell irrigation constraints',
        'Pre-committed contract farming agreement',
      ]
    : [
        'স্থানীয় জাত চাষ করার ইচ্ছা',
        'ডাল ফসলের বাজার দর সংক্রান্ত অনিশ্চয়তা',
        'সেচ বা পাম্প সুবিধার অপ্রতুলতা',
        'পূর্ব নির্ধারিত চুক্তিবদ্ধ চাষাবাদ',
      ];

  const handleSelectYes = () => {
    setFeedback('yes');
    if (onFeedbackSubmit) {
      onFeedbackSubmit('yes');
    }
  };

  const handleSelectNo = () => {
    setFeedback('no');
    if (onFeedbackSubmit) {
      onFeedbackSubmit('no');
    }
  };

  const handleReasonSubmit = (reason: string) => {
    setSelectedReason(reason);
    setSubmittedDetail(true);
    if (onFeedbackSubmit) {
      onFeedbackSubmit('no', reason);
    }
  };

  const handleReset = () => {
    setFeedback(null);
    setSelectedReason(null);
    setSubmittedDetail(false);
  };

  return (
    <section
      aria-label="Farmer Decision Feedback"
      className={`rounded-xl border border-[#262626] bg-[#141414] p-6 sm:p-8 relative overflow-hidden ${className}`}
    >
      {/* Decorative subtle ambient light */}
      

      {/* STATE 0: INITIAL QUESTION */}
      {feedback === null && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#A3A3A3] font-mono font-semibold mb-2">
              
              <span>{isEn ? 'COMMUNITY CALIBRATION · FARMER DATA LOOP' : 'মাঠ পর্যায়ের মতামত সংগ্রহ'}</span>
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              {isEn ? 'Will you follow this suggested plan?' : 'আপনি কি এই প্রস্তাবিত পরিকল্পনা অনুসরণ করবেন?'}
            </h3>

            <p className="text-xs sm:text-sm text-[#A3A3A3] mt-1.5 leading-relaxed">
              {isEn
                ? 'Your feedback helps us improve recommendations with practical ground-truth farming in Bangladesh.'
                : 'আপনার বাস্তব মতামত মাঠপর্যায়ের অভিজ্ঞতার ভিত্তিতে আমাদের সুপারিশসমূহকে আরও নিখুঁত করতে সহায়তা করে।'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            {/* [Yes, looks good] */}
            <button
              type="button"
              onClick={handleSelectYes}
              className="px-5 py-2.5 rounded-lg bg-[#22C55E] hover:bg-[#16a34a] text-black font-semibold text-xs sm:text-sm tracking-tight transition-colors flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-none"
            >
              <ThumbsUp className="w-4 h-4 text-black" />
              <span>{isEn ? 'Yes, looks good' : 'হ্যাঁ, ভালো লেগেছে'}</span>
            </button>

            {/* [No, I have other plans] */}
            <button
              type="button"
              onClick={handleSelectNo}
              className="px-5 py-2.5 rounded-lg bg-[#0A0A0A] hover:bg-[#1a1a1a] border border-[#262626] text-[#FAFAFA] font-medium text-xs sm:text-sm tracking-tight transition-colors flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-none"
            >
              <ThumbsDown className="w-4 h-4 text-[#A3A3A3]" />
              <span>{isEn ? 'No, I have other plans' : 'না, আমার ভিন্ন পরিকল্পনা আছে'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 1: POSITIVE FEEDBACK CONFIRMATION */}
      {feedback === 'yes' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <span>{isEn ? 'Thank you! Plan confirmed.' : 'ধন্যবাদ! পরিকল্পনাটি গৃহীত হয়েছে।'}</span>
                <Heart className="w-4 h-4 text-[#FF5C5C] fill-[#FF5C5C]" />
              </h4>
              <p className="text-xs sm:text-sm text-[#A3A3A3] mt-1">
                {isEn
                  ? `Your confirmation logs 1 validation point for ${upazila}, ${district}. 92% of farmers in this cluster adopted drought-resilient rotations this season.`
                  : `${upazila}, ${district}-এর জন্য আপনার মতামত সংরক্ষিত হয়েছে। এই মৌসুমে ৯২% কৃষক খরা-সহনশীল ফসল পরিকল্পনা গ্রহণ করেছেন।`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-[#A3A3A3] hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-[#262626] cursor-pointer self-end sm:self-center shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isEn ? 'Change Response' : 'মতামত পরিবর্তন'}</span>
          </button>
        </div>
      )}

      {/* STATE 2: NEGATIVE / ALTERNATIVE FEEDBACK LOOP */}
      {feedback === 'no' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#22C55E]" />
                <span>
                  {isEn
                    ? 'What factors influenced your decision?'
                    : 'কোন বিষয়টি আপনার সিদ্ধান্তকে প্রভাবিত করেছে?'}
                </span>
              </h4>
              <p className="text-xs text-[#A3A3A3] mt-0.5">
                {isEn
                  ? 'Tap a reason below to help adapt satellite advisories to real field realities:'
                  : 'স্যাটেলাইট পরামর্শকে আরও বাস্তবমুখী করতে নিচের প্রাসঙ্গিক কারণটি নির্বাচন করুন:'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[#A3A3A3] hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 cursor-pointer self-start sm:self-center"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isEn ? 'Reset' : 'পুনরায় শুরু'}</span>
            </button>
          </div>

          {/* Quick Choice Reason Chips */}
          {!submittedDetail ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {reasons.map((reason, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleReasonSubmit(reason)}
                  className="p-3 text-left rounded-xl bg-[#0A0A0A] hover:bg-[#141414] border border-[#262626] hover:border-[#404040] text-xs text-slate-200 transition-all flex items-center justify-between gap-2 group cursor-pointer"
                >
                  <span className="group-hover:text-white">{reason}</span>
                  <span className="text-[#22C55E] opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[10px]">
                    Select →
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#22C55E]/30 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0" />
              <div className="text-xs">
                <span className="text-white font-medium block">
                  {isEn ? 'Feedback recorded: ' : 'মতামত গৃহীত: '}
                  <span className="text-[#22C55E]">{selectedReason}</span>
                </span>
                <span className="text-[#A3A3A3]">
                  {isEn
                    ? 'Our agronomic team incorporates local constraints into future recommendation weighting.'
                    : 'আমাদের কৃষি বিশেষজ্ঞ দল পরবর্তী শস্য সুপারিশে এই বিষয়টি বিবেচনায় রাখবে।'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Constructive Feedback Disclaimer */}
      <div className="mt-6 pt-4 border-t border-[#262626] text-xs text-slate-400 leading-relaxed flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-[#737373] shrink-0 mt-0.5" />
        <p>
          {isEn
            ? "Your feedback helps us improve AgriOrbit's recommendations. Recommendations are advisory based on NASA Earth observations and BARI/BRRI guidelines. Always verify with your local Upazila Agriculture Officer."
            : "আপনার মতামত আমাদের পরামর্শ আরও ভালো করতে সাহায্য করে। এই পরামর্শগুলো নাসার স্যাটেলাইট তথ্য আর বারি ও ব্রি-এর নিয়ম মিলিয়ে তৈরি। শেষ সিদ্ধান্তের আগে স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন।"}
        </p>
      </div>
    </section>
  );
};
