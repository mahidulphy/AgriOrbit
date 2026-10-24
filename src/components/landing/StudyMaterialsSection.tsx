import { useState } from 'react';
import { ChevronDown, BookOpen, Sparkles, HelpCircle } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { SectionHeader } from '../ui/ui.tsx';

export function StudyMaterialsSection() {
  const { t, lang } = useLang();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'simulator': true,
    'data-sources': true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getTopicBadge = (id: string) => {
    const isBn = lang === 'bn';
    switch (id) {
      case 'simulator':
        return isBn ? 'সিমুলেটর' : 'Simulator';
      case 'data-sources':
      case 'obs-vs-forecast':
        return isBn ? 'স্যাটেলাইট উপাত্ত' : 'Satellite Telemetry';
      case 'nasa-recommend':
      case 'expert-replacement':
        return isBn ? 'কৃষি নীতি' : 'Policy & Ethics';
      case 'how-choose':
      case 'explain-why':
        return isBn ? 'সিদ্ধান্ত ইঞ্জিন' : 'Decision Logic';
      case 'change-priorities':
        return isBn ? 'চাষির অগ্রাধিকার' : 'Farmer Priority';
      case 'guaranteed':
      case 'live-unavailable':
      default:
        return isBn ? 'সতর্কতা ও নির্ভরযোগ্যতা' : 'Reliability & Safety';
    }
  };

  return (
    <section id="materials" className="relative py-20 md:py-28 border-b border-[#262626] scroll-mt-16 bg-[#0A0A0A]">
      <div className="container-x">
        <SectionHeader
          eyebrow={lang === 'bn' ? 'শিক্ষা উপকরণ ও প্রশ্নোত্তর' : 'Study Materials & FAQ'}
          title={t.faq.heading}
          sub={t.faq.subheading}
          center
        />

        <div className="mt-12 max-w-4xl mx-auto space-y-3.5">
          {t.faq.items.map((item) => {
            const isOpen = Boolean(openItems[item.id]);
            const badge = getTopicBadge(item.id);

            return (
              <article
                key={item.id}
                className="rounded-xl border border-[#262626] bg-[#141414] transition-colors duration-150 hover:border-[#404040] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1.5 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-[#262626] bg-[#0A0A0A] text-[#22C55E]">
                        <BookOpen className="w-3 h-3 text-[#22C55E]" />
                        <span>{badge}</span>
                      </span>
                    </div>
                    <h3 className="font-display text-base sm:text-lg font-semibold text-[#FAFAFA] leading-snug">
                      {item.question}
                    </h3>
                  </div>

                  <div className="pt-1 shrink-0">
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-lg border border-[#262626] bg-[#0A0A0A] text-[#A3A3A3] transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#FAFAFA]' : ''
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 border-t border-[#262626]/60 text-sm leading-relaxed text-[#A3A3A3]">
                    <p className="mt-3.5 whitespace-pre-line">{item.answer}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
