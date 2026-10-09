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
        className="px-4 py-2.5 rounded-xl bg-[#0B1626] hover:bg-[#00E5FF]/10 border border-[#00E5FF]/40 hover:border-[#00E5FF] text-[#00E5FF] hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md group whitespace-nowrap"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <MessageSquare className="w-3.5 h-3.5 text-[#00E5FF] group-hover:scale-110 transition-transform" />
        <span>{isEn ? 'Send via SMS' : 'এসএমএস পাঠান'}</span>
      </button>

      {/* Floating Popup / Hover Preview Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={isEn ? 'SMS Advisory Preview' : 'এসএমএস পরামর্শ প্রাকদর্শন'}
          className="absolute bottom-full mb-3 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-50 w-80 max-w-[92vw] rounded-2xl border border-white/20 bg-[#0B1626]/95 backdrop-blur-xl p-4 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <Smartphone className="w-4 h-4 text-[#00E5FF]" />
              <span>{isEn ? 'CELLULAR DISPATCH (SMS)' : 'সেলুলার এসএমএস বার্তা'}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-[#8FA3B8] hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* SMS Body Bubble (Mock Mobile Phone Screen Preview) */}
          <div className="relative rounded-xl bg-[#050B14] p-3.5 border border-white/10 text-xs font-mono text-slate-200 leading-relaxed shadow-inner">
            <div className="flex items-center justify-between text-[10px] text-[#8FA3B8] mb-1.5 pb-1 border-b border-white/5">
              <span className="text-[#B8FF3D] font-bold">AgriOrbit Advisory</span>
              <span>12:00 PM</span>
            </div>

            <p className="font-editorial text-xs text-white selection:bg-[#B8FF3D]/40">
              "{smsText}"
            </p>

            {/* Character counter bar */}
            <div className="mt-2.5 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-[#8FA3B8]">
              <span className="text-[#00E5FF]">
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
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono placeholder:text-[#8FA3B8]/60 focus:outline-none focus:border-[#00E5FF]"
              />
              <button
                type="submit"
                disabled={sentStatus === 'sent'}
                className="px-3 py-1.5 rounded-lg bg-[#00E5FF] hover:bg-[#00E5FF]/80 text-[#050B14] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                {sentStatus === 'sent' ? (
                  <>
                    <Check className="w-3 h-3 text-[#050B14]" />
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
              className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#8FA3B8] hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-mono"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#B8FF3D]" />
                  <span className="text-[#B8FF3D]">{isEn ? 'Copied to Clipboard!' : 'কপি সম্পন্ন!'}</span>
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
          <div className="absolute -bottom-2 sm:left-1/2 right-6 sm:-translate-x-1/2 w-3 h-3 bg-[#0B1626] border-r border-b border-white/20 rotate-45" />
        </div>
      )}
    </div>
  );
};
