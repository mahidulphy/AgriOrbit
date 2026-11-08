import { useState } from 'react';
import {
  ChevronDown,
  BookOpen,
  Sparkles,
  HelpCircle,
  Droplets,
  Leaf,
  Layers,
  Scale,
  ThermometerSun,
  Satellite,
  Compass,
} from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { SectionHeader } from '../ui/ui.tsx';

export function StudyMaterialsSection() {
  const { t, lang } = useLang();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'field-accuracy': true,
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
      case 'field-accuracy':
        return isBn ? 'মাঠের নির্ভুলতা' : 'Field Accuracy';
      case 'simulator':
        return isBn ? 'সিমুলেটর' : 'Simulator';
      case 'data-sources':
      case 'obs-vs-forecast':
        return isBn ? 'স্যাটেলাইট তথ্য' : 'Satellite Telemetry';
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

  const getGlossaryIcon = (id: string) => {
    switch (id) {
      case 'et0':
        return <Droplets className="w-5 h-5 text-blue-400" />;
      case 'ndvi':
        return <Leaf className="w-5 h-5 text-emerald-400" />;
      case 'soil_moisture':
        return <Layers className="w-5 h-5 text-amber-400" />;
      case 'water_balance':
        return <Scale className="w-5 h-5 text-cyan-400" />;
      case 'temp_stress':
        return <ThermometerSun className="w-5 h-5 text-rose-400" />;
      case 'sat_vs_ground':
      default:
        return <Satellite className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <section id="materials" className="relative py-20 md:py-28 border-b border-[#262626] scroll-mt-16 bg-[#0A0A0A]">
      <div className="container-x">
        <SectionHeader
          eyebrow={lang === 'bn' ? 'শিক্ষা উপকরণ ও পরিভাষা' : 'Study Materials & Glossary'}
          title={lang === 'bn' ? 'বিজ্ঞানসম্মত কৃষি সহায়িকা ও প্রশ্নোত্তর' : 'Scientific Agronomy Guide & FAQ'}
          sub={
            lang === 'bn'
              ? 'নাসার উপগ্রহ তথ্যের মূল পরিভাষা এবং কৃষকদের জন্য স্বচ্ছ নির্দেশিকা।'
              : 'Clear, farmer-friendly explanations of satellite telemetry metrics and platform principles.'
          }
          center
        />

        {/* ────────────────────────────────────────────────────────────────────────── */}
        {/* 1. FARMER SCIENCE GLOSSARY GRID (Requirement 5) */}
        {/* ────────────────────────────────────────────────────────────────────────── */}
        <div className="mt-12 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#22C55E]" />
              <h3 className="font-mono text-xs uppercase tracking-wider font-bold text-[#FAFAFA]">
                {t.glossary.heading}
              </h3>
            </div>
            <span className="text-xs text-[#737373] font-mono hidden sm:inline">
              {t.glossary.subheading}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.glossary.items.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-xl bg-[#141414] border border-[#262626] hover:border-[#404040] transition-colors flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#0A0A0A] border border-[#262626] text-[#22C55E]">
                      {item.code}
                    </span>
                    <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider">
                      {item.tag}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <div className="p-2 rounded-lg bg-[#0A0A0A] border border-[#262626] shrink-0">
                      {getGlossaryIcon(item.id)}
                    </div>
                    <div>
                      <h4 className="font-display text-base font-bold text-[#FAFAFA] leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#A3A3A3] mt-1.5 leading-relaxed font-sans">
                        {item.meaning}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#262626]/70 space-y-1.5 text-[11px]">
                  <p className="text-[#FAFAFA] font-sans leading-relaxed">
                    <strong className="text-[#22C55E] font-mono">
                      {lang === 'bn' ? 'চাষে কেন দরকার: ' : 'Why it matters: '}
                    </strong>
                    {item.importance}
                  </p>
                  <p className="text-[10px] font-mono text-[#737373] pt-1">
                    <span className="text-[#A3A3A3] font-medium">{lang === 'bn' ? 'উৎস: ' : 'Source: '}</span>
                    {item.source}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────────────────── */}
        {/* 2. FREQUENTLY ASKED QUESTIONS ACCORDION (Requirement 6) */}
        {/* ────────────────────────────────────────────────────────────────────────── */}
        <div className="mt-16 max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
            <HelpCircle className="w-4 h-4 text-[#22C55E]" />
            <h3 className="font-mono text-xs uppercase tracking-wider font-bold text-[#FAFAFA]">
              {t.faq.heading}
            </h3>
          </div>

          <div className="space-y-3.5">
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
                      <h4 className="font-display text-base sm:text-lg font-semibold text-[#FAFAFA] leading-snug">
                        {item.question}
                      </h4>
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
      </div>
    </section>
  );
}
