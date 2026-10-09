import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle2, RotateCcw, Sparkles, MessageCircle, Heart } from 'lucide-react';
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
        'স্থানীয় ঐতিহ্যবাহী জাত চাষের অগ্রাধিকার',
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
      className={`rounded-3xl border border-white/10 bg-[#0B1626]/90 backdrop-blur-md p-6 sm:p-10 shadow-xl relative overflow-hidden ${className}`}
    >
      {/* Decorative subtle ambient light */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 rounded-full bg-[#B8FF3D]/5 blur-3xl pointer-events-none" />

      {/* STATE 0: INITIAL QUESTION */}
      {feedback === null && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#B8FF3D] font-mono font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEn ? 'COMMUNITY CALIBRATION · FARMER DATA LOOP' : 'মাঠ পর্যায়ের মতামত সংগ্রহ'}</span>
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              {isEn ? 'Will you follow this suggested plan?' : 'আপনি কি এই প্রস্তাবিত পরিকল্পনা অনুসরণ করবেন?'}
            </h3>

            <p className="text-xs sm:text-sm text-[#8FA3B8] mt-1.5 leading-relaxed">
              {isEn
                ? 'Your feedback helps calibrate NASA Earth Observation crop models with practical ground-truth farming in Bangladesh.'
                : 'আপনার বাস্তব মতামত নাসার উপগ্রহভিত্তিক কৃষি মডেলসমূহকে মাঠের বাস্তবতার সাথে আরও নিখুঁত করতে সহায়তা করে।'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            {/* [Yes, looks good] */}
            <button
              type="button"
              onClick={handleSelectYes}
              className="px-5 py-3 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/90 text-[#050B14] font-bold text-xs sm:text-sm tracking-tight transition-all duration-200 shadow-lg shadow-[#B8FF3D]/20 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-none"
            >
              <ThumbsUp className="w-4 h-4 text-[#050B14]" />
              <span>{isEn ? 'Yes, looks good' : 'হ্যাঁ, ভালো লেগেছে'}</span>
            </button>

            {/* [No, I have other plans] */}
            <button
              type="button"
              onClick={handleSelectNo}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-white font-medium text-xs sm:text-sm tracking-tight transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-none"
            >
              <ThumbsDown className="w-4 h-4 text-[#8FA3B8]" />
              <span>{isEn ? 'No, I have other plans' : 'না, আমার ভিন্ন পরিকল্পনা আছে'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 1: POSITIVE FEEDBACK CONFIRMATION */}
      {feedback === 'yes' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#B8FF3D]/15 text-[#B8FF3D] border border-[#B8FF3D]/30 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <span>{isEn ? 'Thank you! Plan confirmed.' : 'ধন্যবাদ! পরিকল্পনাটি গৃহীত হয়েছে।'}</span>
                <Heart className="w-4 h-4 text-[#FF5C5C] fill-[#FF5C5C]" />
              </h4>
              <p className="text-xs sm:text-sm text-[#8FA3B8] mt-1">
                {isEn
                  ? `Your confirmation logs 1 validation point for ${upazila}, ${district}. 92% of farmers in this cluster adopted drought-resilient rotations this season.`
                  : `${upazila}, ${district}-এর জন্য আপনার মতামত সংরক্ষিত হয়েছে। এই মৌসুমে ৯২% কৃষক খরা-সহনশীল ফসল পরিকল্পনা গ্রহণ করেছেন।`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-[#8FA3B8] hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 cursor-pointer self-end sm:self-center shrink-0"
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
                <MessageCircle className="w-4 h-4 text-[#00E5FF]" />
                <span>
                  {isEn
                    ? 'What factors influenced your decision?'
                    : 'কোন বিষয়টি আপনার সিদ্ধান্তকে প্রভাবিত করেছে?'}
                </span>
              </h4>
              <p className="text-xs text-[#8FA3B8] mt-0.5">
                {isEn
                  ? 'Tap a reason below to help adapt satellite advisories to real field realities:'
                  : 'স্যাটেলাইট পরামর্শকে আরও বাস্তবমুখী করতে নিচের প্রাসঙ্গিক কারণটি নির্বাচন করুন:'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[#8FA3B8] hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 cursor-pointer self-start sm:self-center"
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
                  className="p-3 text-left rounded-xl bg-[#050B14] hover:bg-white/5 border border-white/10 hover:border-[#00E5FF]/50 text-xs text-slate-200 transition-all flex items-center justify-between gap-2 group cursor-pointer"
                >
                  <span className="group-hover:text-white">{reason}</span>
                  <span className="text-[#00E5FF] opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[10px]">
                    Select →
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#050B14] border border-[#00E5FF]/30 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#00E5FF] shrink-0" />
              <div className="text-xs">
                <span className="text-white font-medium block">
                  {isEn ? 'Feedback recorded: ' : 'মতামত গৃহীত: '}
                  <span className="text-[#00E5FF]">{selectedReason}</span>
                </span>
                <span className="text-[#8FA3B8]">
                  {isEn
                    ? 'Our agronomic team incorporates local constraints into future recommendation weighting.'
                    : 'আমাদের কৃষি বিশেষজ্ঞ দল পরবর্তী শস্য সুপারিশে এই বিষয়টি বিবেচনায় রাখবে।'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
