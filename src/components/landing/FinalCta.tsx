import { ArrowRight } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { goAnalyze } from '../../lib/nav.ts';
import { Wordmark } from '../ui/ui.tsx';

const TEAM = ['Mahidul', 'Udoy', 'Tripty', 'Andalib', 'Parvez', 'Marshia'];

export function FinalCta() {
  const { t } = useLang();
  return (
    <section className="py-20 md:py-28">
      <div className="container-x">
        <div className="glass relative isolate overflow-hidden px-6 py-16 text-center md:px-16 md:py-20">
          <div className="horizon absolute inset-0 -z-10" />
          <div className="stars absolute inset-0 -z-10 opacity-50" />
          <h2 className="section-title mx-auto max-w-2xl">{t.cta.title}</h2>
          <p className="section-sub mx-auto mt-4">{t.cta.sub}</p>
          <button onClick={goAnalyze} className="btn btn-primary mt-9 w-full sm:w-auto justify-center min-h-[48px] px-8! py-4! text-base!">
            {t.cta.button}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { t, lang } = useLang();
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="container-x grid gap-8 text-sm text-slate-400 md:grid-cols-[1.2fr_1fr] text-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <Wordmark />
          <p className="mt-4 max-w-md leading-relaxed">{t.footer.built}</p>
          <p className="mt-1 text-slate-500">{t.footer.challenge}</p>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start items-center gap-4 text-xs font-mono text-slate-400">
            <a href="#/privacy" className="hover:text-[#00E5FF] transition-colors underline underline-offset-4">
              {lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
            </a>
            <span>·</span>
            <a href="#/terms" className="hover:text-[#B8FF3D] transition-colors underline underline-offset-4">
              {lang === 'bn' ? 'শর্তাবলী ও নিয়মাবলী' : 'Terms & Conditions'}
            </a>
          </div>
        </div>
        <div className="text-center md:text-right">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.footer.team}</div>
          <p className="mt-2 text-slate-300 flex flex-wrap justify-center md:justify-end gap-x-2 gap-y-1">
            {TEAM.map((member, i) => (
              <span key={member}>
                {member}{i < TEAM.length - 1 && <span className="text-slate-600 ml-2">·</span>}
              </span>
            ))}
          </p>
          <p className="mt-4 leading-relaxed">{t.footer.credits}</p>
          <p className="mt-1 text-xs text-slate-500">{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}