import { ArrowRight } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { goAnalyze } from '../../lib/nav.ts';
import { Wordmark } from '../ui/ui.tsx';

const TEAM = ['Mahidul', 'Udoy', 'Tripty', 'Andalib', 'Parvez', 'Marshia'];

export function FinalCta() {
  const { t } = useLang();
  return (
    <section className="py-20 md:py-28 border-b border-[#262626]">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-xl border border-[#262626] bg-[#141414] px-6 py-14 text-center md:px-14 md:py-18">
          <h2 className="section-title mx-auto max-w-2xl">{t.cta.title}</h2>
          <p className="section-sub mx-auto mt-4">{t.cta.sub}</p>
          <button
            onClick={goAnalyze}
            className="btn btn-primary mt-8 w-full sm:w-auto justify-center min-h-[44px] px-8 py-3 text-sm cursor-pointer"
          >
            {t.cta.button}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { t, lang } = useLang();
  return (
    <footer className="py-12 bg-[#0A0A0A]">
      <div className="container-x grid gap-8 text-sm text-[#737373] md:grid-cols-[1.2fr_1fr] text-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <Wordmark />
          <p className="mt-4 max-w-md leading-relaxed text-[#A3A3A3]">{t.footer.built}</p>
          <p className="mt-1 text-xs text-[#737373]">{t.footer.challenge}</p>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start items-center gap-4 text-xs font-mono text-[#737373]">
            <a href="#/privacy" className="hover:text-[#FAFAFA] transition-colors underline underline-offset-4">
              {lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
            </a>
            <span>·</span>
            <a href="#/terms" className="hover:text-[#FAFAFA] transition-colors underline underline-offset-4">
              {lang === 'bn' ? 'শর্তাবলী ও নিয়মাবলী' : 'Terms & Conditions'}
            </a>
          </div>
        </div>
        <div className="text-center md:text-right">
          <div className="text-xs font-mono font-medium uppercase tracking-wider text-[#737373]">{t.footer.team}</div>
          <p className="mt-2 text-[#A3A3A3] flex flex-wrap justify-center md:justify-end gap-x-2 gap-y-1 text-xs">
            {TEAM.map((member, i) => (
              <span key={member}>
                {member}{i < TEAM.length - 1 && <span className="text-[#404040] ml-2">·</span>}
              </span>
            ))}
          </p>
          <p className="mt-4 leading-relaxed text-xs text-[#737373]">{t.footer.credits}</p>
          <p className="mt-1 text-[11px] text-[#737373]">{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
