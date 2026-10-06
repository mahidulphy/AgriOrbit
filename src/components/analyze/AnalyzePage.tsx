// Placeholder — the full Analyze screen is built in the next milestone.
import { ArrowLeft, Wrench } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { goHome } from '../../lib/nav.ts';
import { LangToggle, Wordmark } from '../ui/ui.tsx';

export function AnalyzePage() {
  const { t } = useLang();
  return (
    <div className="relative isolate min-h-screen">
      <div className="stars absolute inset-0 -z-10 opacity-60" />
      <div className="horizon absolute inset-x-0 bottom-0 -z-10 h-1/2" />
      <header className="container-x flex h-20 items-center justify-between">
        <Wordmark />
        <LangToggle />
      </header>
      <main className="container-x grid min-h-[70vh] place-items-center">
        <div className="glass max-w-lg p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
            <Wrench className="h-7 w-7" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-semibold text-white">{t.analyze.soon}</h1>
          <p className="mt-3 leading-relaxed text-slate-400">{t.analyze.soonSub}</p>
          <button onClick={goHome} className="btn btn-ghost mt-8">
            <ArrowLeft className="h-4 w-4" />
            {t.analyze.back}
          </button>
        </div>
      </main>
    </div>
  );
}
