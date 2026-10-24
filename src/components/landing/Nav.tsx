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
    { href: '#data', label: t.nav.materials },
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

        {/* Desktop Navigation Links */}
        <ul className="hidden items-center gap-7 text-sm font-medium text-slate-100 lg:flex">
          {links.map((l) => (
            <li key={l.href + l.label}>
              <a
                href={l.href}
                className="transition-colors hover:text-[#B8FF3D] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] whitespace-nowrap"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right Desktop Cluster */}
        <div className="hidden lg:flex items-center gap-3">
          <LangToggle />
          <UserMenu />
          <button onClick={goAnalyze} className="btn btn-primary py-2.5! inline-flex">
            {t.nav.analyze}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile Header: ONLY Logo, LangToggle, and Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          <LangToggle />
          <button
            onClick={() => setOpen(!open)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl p-2.5 bg-white/10 border border-white/15 text-slate-100 hover:text-white cursor-pointer transition-colors"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {open && (
        <div className="container-x pb-6 pt-3 lg:hidden bg-[#070D18]/98 backdrop-blur-2xl border-b border-white/10 rounded-b-2xl shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <ul className="flex flex-col gap-1 text-slate-100">
            {links.map((l) => (
              <li key={l.href + l.label}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-base font-medium hover:bg-white/10 hover:text-[#B8FF3D] transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-white/10 mt-3 flex flex-col gap-3">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-mono text-slate-400">
                {t.nav.signIn}:
              </span>
              <div onClick={() => setOpen(false)}>
                <UserMenu />
              </div>
            </div>

            <button
              onClick={() => {
                setOpen(false);
                goAnalyze();
              }}
              className="btn btn-primary w-full justify-center min-h-[48px] py-3 text-base!"
            >
              <span>{t.nav.analyze}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
