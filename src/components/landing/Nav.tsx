import { useEffect, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { goAnalyze } from '../../lib/nav.ts';
import { LangToggle, Wordmark } from '../ui/ui.tsx';
import { UserMenu } from '../auth/UserMenu.tsx';

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
    { href: '#crops', label: t.nav.crops },
    { href: '#how', label: t.nav.how },
    { href: '#data', label: t.nav.data },
    { href: '#rotation', label: t.nav.rotation },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? 'border-b border-white/15 bg-[#050B14]/95 backdrop-blur-xl shadow-xl shadow-black/40'
          : 'border-b border-white/10 bg-[#050B14]/85 backdrop-blur-md shadow-md shadow-black/30'
      }`}
    >
      <nav className="container-x flex h-16 items-center justify-between gap-4 md:h-20">
        <Wordmark />

        <ul className="hidden items-center gap-8 text-sm font-medium text-slate-100 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="transition-colors hover:text-[#B8FF3D] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <LangToggle />
          <UserMenu />
          <button onClick={goAnalyze} className="btn btn-primary hidden py-2.5! sm:inline-flex">
            {t.nav.analyze}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="rounded-xl p-2 bg-white/10 border border-white/15 text-slate-100 hover:text-white lg:hidden cursor-pointer"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="container-x pb-5 pt-2 lg:hidden bg-[#070D18]/95 backdrop-blur-2xl border-b border-white/10 rounded-b-2xl shadow-2xl">
          <ul className="flex flex-col gap-1 text-slate-100">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3.5 py-2.5 text-sm font-medium hover:bg-white/10 hover:text-[#B8FF3D] transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="pt-3 border-t border-white/10 mt-3 flex items-center justify-between gap-2">
            <UserMenu />
            <button onClick={goAnalyze} className="btn btn-primary py-2! sm:hidden">
              {t.nav.analyze}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
