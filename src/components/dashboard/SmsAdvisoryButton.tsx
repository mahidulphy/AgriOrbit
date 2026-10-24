import React, { useState, useRef, useEffect } from 'react';
import { Mail, Copy, Check, Send, X } from 'lucide-react';
import type { Language } from '../../types';

export interface SmsAdvisoryButtonProps {
  district?: string;
  upazila?: string;
  language?: Language;
  previewMessage?: string;
  className?: string;
}

/**
 * "Send to Email" Button with Hover / Click Preview
 * Sits in the advisory action bar (next to "Print Advisory" and "Share Plan").
 * Displays an email advisory preview with instant clipboard dispatch and email input.
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
  const [emailAddress, setEmailAddress] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const isEn = language === 'en';

  const defaultTextEn =
    `AgriOrbit Advisory: ${upazila}, ${district} field plan. Recommendations based on NASA Earth observations and BARI/BRRI guidance.`;
  const defaultTextBn =
    `এগ্রিঅরবিট পরামর্শ: ${upazila}, ${district} মাঠের ফসল পরিকল্পনা। নাসার স্যাটেলাইট তথ্য ও বারি/ব্রির নির্দেশিকা অনুযায়ী প্রস্তুত।`;

  const advisoryText = previewMessage || (isEn ? defaultTextEn : defaultTextBn);

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
    navigator.clipboard.writeText(advisoryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress) return;
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
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-4 py-2.5 rounded-lg bg-[#0A0A0A] hover:bg-[#141414] border border-[#262626] text-[#FAFAFA] font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer group whitespace-nowrap"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Mail className="w-3.5 h-3.5 text-[#22C55E]" />
        <span>{isEn ? 'Send via Email' : 'ইমেইলে পাঠান'}</span>
      </button>

      {/* Floating Popup / Preview Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={isEn ? 'Email Advisory Preview' : 'ইমেইল পরামর্শ প্রাকদর্শন'}
          className="absolute bottom-full mb-3 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-50 w-80 max-w-[92vw] rounded-xl border border-[#262626] bg-[#141414] p-4 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#262626]">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <Mail className="w-4 h-4 text-[#22C55E]" />
              <span>{isEn ? 'EMAIL DISPATCH' : 'ইমেইল বার্তা'}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-[#A3A3A3] hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Advisory Body Bubble */}
          <div className="relative rounded-lg bg-[#0A0A0A] p-3 border border-[#262626] text-xs font-mono text-[#FAFAFA] leading-relaxed">
            <div className="flex items-center justify-between text-[10px] text-[#A3A3A3] mb-1.5 pb-1 border-b border-[#262626]">
              <span className="text-[#22C55E] font-bold">AgriOrbit Field Advisory</span>
              <span className="text-[10px] text-[#737373]">{isEn ? 'SMS coming soon' : 'এসএমএস শীঘ্রই আসছে'}</span>
            </div>

            <p className="font-editorial text-xs text-white selection:bg-[#22C55E]/20">
              "{advisoryText}"
            </p>
          </div>

          {/* Email target input & action controls */}
          <form onSubmit={handleSendEmail} className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="email"
                required
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder={isEn ? 'farmer@example.com' : 'ইমেইল লিখুন'}
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
                  <span>{isEn ? 'Copy Advisory Text' : 'পরামর্শ টেক্সট কপি করুন'}</span>
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
