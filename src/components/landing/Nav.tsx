import { useEffect, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { goAnalyze } from '../../lib/nav.ts';
import { LangToggle, Wordmark } from '../ui/ui.tsx';

export function Nav() {
  const { t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '#field-shift', label: t.nav.fieldShift },
    { href: '#how', label: t.nav.how },
    { href: '#data', label: t.nav.data },
    { href: '#rotation', label: t.nav.rotation },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open ? 'border-b border-white/[0.06] bg-ink-950/75 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <nav className="container-x flex h-16 items-center justify-between gap-4 md:h-20">
        <Wordmark />

        <ul className="hidden items-center gap-8 text-sm text-slate-300 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="transition hover:text-white">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <LangToggle />
          <button onClick={goAnalyze} className="btn btn-primary hidden py-2.5! sm:inline-flex">
            {t.nav.analyze}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={() => setOpen(!open)} className="rounded-full p-2 text-slate-300 hover:text-white lg:hidden" aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="container-x pb-5 lg:hidden">
          <ul className="flex flex-col gap-1 text-slate-200">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 hover:bg-white/5">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <button onClick={goAnalyze} className="btn btn-primary mt-3 w-full sm:hidden">
            {t.nav.analyze}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </header>
  );
}
