import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageSquareQuote, CheckCircle2 } from 'lucide-react';
import { Language } from '../../types';
import { STRINGS } from '../../i18n';

export interface FaqSectionProps {
  language: Language;
  className?: string;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ language, className = '' }) => {
  const strings = STRINGS[language].faq;
  // Initialize with the first item open for instant affordance/discoverability
  const [openIds, setOpenIds] = useState<string[]>(['simulator']);

  const toggleItem = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const expandAll = () => {
    setOpenIds(strings.items.map((item) => item.id));
  };

  const collapseAll = () => {
    setOpenIds([]);
  };

  const allOpen = openIds.length === strings.items.length;

  return (
    <section
      id="faq-section"
      aria-labelledby="faq-heading"
      className={`rounded-xl bg-[#141414] border border-[#262626] p-6 sm:p-8 lg:p-10 relative overflow-hidden font-editorial ${className}`}
    >
      {/* Background Ambient Glow */}
      
      

      {/* Header Row */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#262626]">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#A3A3A3] mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>{strings.eyebrow}</span>
          </div>
          <h3
            id="faq-heading"
            className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight"
          >
            {strings.heading}
          </h3>
          <p className="text-sm sm:text-base text-[#A3A3A3] mt-1 max-w-2xl">
            {strings.subheading}
          </p>
        </div>

        {/* Quick Bulk Expand/Collapse Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={allOpen ? collapseAll : expandAll}
            className="px-3.5 py-1.5 rounded-lg bg-[#0A0A0A] hover:bg-[#1a1a1a] border border-[#262626] text-xs font-mono text-[#A3A3A3] hover:text-[#FAFAFA] transition-colors cursor-pointer"
          >
            {allOpen
              ? language === 'en'
                ? 'Collapse All'
                : 'সব বন্ধ করুন'
              : language === 'en'
              ? 'Expand All (10)'
              : 'সব দেখুন (১০)'}
          </button>
        </div>
      </div>

      {/* Accordion Questions List */}
      <div className="relative z-10 mt-6 space-y-3">
        {strings.items.map((item, index) => {
          const isOpen = openIds.includes(item.id);
          const indexFormatted = String(index + 1).padStart(2, '0');
          const panelId = `faq-panel-${item.id}`;
          const buttonId = `faq-btn-${item.id}`;

          return (
            <div
              key={item.id}
              className={`rounded-xl border transition-all duration-150 overflow-hidden ${
                isOpen ? 'bg-[#0A0A0A] border-[#404040]' : 'bg-[#0A0A0A] border-[#262626] hover:border-[#404040]'
              }`}
            >
              {/* Question Trigger Button */}
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(item.id)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22C55E] transition-colors"
              >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <span
                    className={`font-mono text-xs sm:text-sm font-bold shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border transition-colors ${
                      isOpen ? 'bg-[#141414] text-[#22C55E] border-[#22C55E]/40' : 'bg-[#141414] text-[#A3A3A3] border-[#262626]'
                    }`}
                  >
                    {indexFormatted}
                  </span>
                  <span
                    className={`font-display text-sm sm:text-base font-semibold leading-snug transition-colors ${
                      isOpen ? 'text-white' : 'text-[#FAFAFA] hover:text-white'
                    }`}
                  >
                    {item.question}
                  </span>
                </div>

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-transform duration-200 ${
                    isOpen ? 'bg-[#141414] text-[#22C55E] border-[#22C55E]/30 rotate-180' : 'bg-[#141414] text-[#737373] border-[#262626]'
                  }`}
                  aria-hidden="true"
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* Answer Panel */}
              {isOpen && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="px-4 pb-4 sm:px-6 sm:pb-5 pt-1 text-[#A3A3A3] border-t border-[#262626] animate-fadeIn"
                >
                  <div className="pl-10 sm:pl-12">
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-200">
                      {item.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Trust Callout */}
      <div className="relative z-10 mt-8 pt-6 border-t border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          <span>
            {language === 'en'
              ? '100% Rule-Based & Transparent Agronomic Logic'
              : '১০০% নিয়ম-ভিত্তিক ও স্বচ্ছ কৃষি সিদ্ধান্ত কাঠামো'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <MessageSquareQuote className="w-4 h-4 text-[#FAFAFA]" />
          <span>
            {language === 'en'
              ? 'Have questions? Connect with your Upazila Agriculture Officer (DAE).'
              : 'আরও জানতে যোগাযোগ করুন আপনার উপজেলা কৃষি কর্মকর্তা (ডিএই)।'}
          </span>
        </div>
      </div>
    </section>
  );
};
