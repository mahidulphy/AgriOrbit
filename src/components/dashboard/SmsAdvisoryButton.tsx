import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Smartphone, Copy, Check, Send, X, ExternalLink } from 'lucide-react';
import type { Language } from '../../types';

export interface SmsAdvisoryButtonProps {
  district?: string;
  upazila?: string;
  language?: Language;
  previewMessage?: string;
  className?: string;
}

/**
 * 4. "Send via SMS" Button with Hover Preview
 * A button for the bottom action bar (sits next to "Print Advisory" and "Share Plan").
 * Displays a 160-character SMS advisory preview on hover or click.
 */
export const SmsAdvisoryButton: React.FC<SmsAdvisoryButtonProps> = ({
  district = 'Rangpur',
  upazila = 'Mithapukur',
  language = 'en',
  previewMessage,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentStatus, setSentStatus] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('01712-345678');
  const containerRef = useRef<HTMLDivElement>(null);

  const isEn = language === 'en';

  // Sample exact 160-character text requested by the user:
  const defaultTextEn =
    'AgriOrbit SMS: Rangpur monsoon delayed 7 days. Delay Aman rice seedbeds to June 15 to avoid drought risk. Data: NASA POWER.';
  const defaultTextBn =
    'এগ্রিঅরবিট বার্তা: রংপুরে বর্ষা ৭ দিন বিলম্বিত। খরা এড়াতে আমনের বীজতলা ১৫ জুনে পিছান। তথ্য: নাসা পাওয়ার।';

  const smsText = previewMessage || (isEn ? defaultTextEn : defaultTextBn);
  const charCount = smsText.length;
  const maxChars = 160;

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(smsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSendSimulated = (e: React.FormEvent) => {
    e.preventDefault();
    setSentStatus('sent');
    setTimeout(() => {
      setSentStatus(null);
      setIsOpen(false);
    }, 2000);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        // Keep open if user clicked or interacting with input
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-4 py-2.5 rounded-lg bg-[#0A0A0A] hover:bg-[#1a1a1a] border border-[#262626] text-[#FAFAFA] font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer group whitespace-nowrap"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <MessageSquare className="w-3.5 h-3.5 text-[#22C55E]" />
        <span>{isEn ? 'Send via SMS' : 'এসএমএস পাঠান'}</span>
      </button>

      {/* Floating Popup / Hover Preview Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={isEn ? 'SMS Advisory Preview' : 'এসএমএস পরামর্শ প্রাকদর্শন'}
          className="absolute bottom-full mb-3 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-50 w-80 max-w-[92vw] rounded-xl border border-[#262626] bg-[#141414] p-4 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#262626]">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <Smartphone className="w-4 h-4 text-[#FAFAFA]" />
              <span>{isEn ? 'CELLULAR DISPATCH (SMS)' : 'সেলুলার এসএমএস বার্তা'}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-[#A3A3A3] hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* SMS Body Bubble (Mock Mobile Phone Screen Preview) */}
          <div className="relative rounded-lg bg-[#0A0A0A] p-3 border border-[#262626] text-xs font-mono text-[#FAFAFA] leading-relaxed">
            <div className="flex items-center justify-between text-[10px] text-[#A3A3A3] mb-1.5 pb-1 border-b border-[#262626]">
              <span className="text-[#22C55E] font-bold">AgriOrbit Advisory</span>
              <span>12:00 PM</span>
            </div>

            <p className="font-editorial text-xs text-white selection:bg-[#22C55E]/20">
              "{smsText}"
            </p>

            {/* Character counter bar */}
            <div className="mt-2.5 pt-1.5 border-t border-[#262626] flex items-center justify-between text-[10px] text-[#A3A3A3]">
              <span className="text-[#FAFAFA]">
                {charCount}/{maxChars} chars
              </span>
              <span className="text-emerald-400 font-bold">
                {isEn ? '1 SMS Credit' : '১টি এসএমএস ক্রেডিট'}
              </span>
            </div>
          </div>

          {/* Phone target input & action controls */}
          <form onSubmit={handleSendSimulated} className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+8801XXXXXXXXX"
                className="flex-1 bg-[#0A0A0A] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono placeholder:text-[#737373] focus:outline-none focus:border-[#404040]"
              />
              <button
                type="submit"
                disabled={sentStatus === 'sent'}
                className="px-3 py-1.5 rounded-lg bg-[#22C55E] hover:bg-[#16a34a] text-black font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                {sentStatus === 'sent' ? (
                  <>
                    <Check className="w-3 h-3 text-black" />
                    <span>{isEn ? 'Sent!' : 'প্রেরিত!'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>{isEn ? 'Send' : 'পাঠান'}</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-[#262626] text-xs text-[#A3A3A3] hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-mono"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span className="text-[#22C55E]">{isEn ? 'Copied to Clipboard!' : 'কপি সম্পন্ন!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Copy SMS Text' : 'এসএমএস টেক্সট কপি করুন'}</span>
                </>
              )}
            </button>
          </form>

          {/* Pointer tail for popup */}
          <div className="absolute -bottom-2 sm:left-1/2 right-6 sm:-translate-x-1/2 w-3 h-3 bg-[#141414] border-r border-b border-[#262626] rotate-45" />
        </div>
      )}
    </div>
  );
};
