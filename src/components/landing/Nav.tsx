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
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${
        scrolled || open
          ? 'border-b border-[#262626] bg-[#0A0A0A]/95 backdrop-blur-md'
          : 'border-b border-transparent bg-[#0A0A0A]/80 backdrop-blur-sm'
      }`}
    >
      <nav className="container-x flex h-16 items-center justify-between gap-4 md:h-18">
        <Wordmark />

        {/* Desktop Navigation Links */}
        <ul className="hidden items-center gap-7 text-sm font-medium text-[#A3A3A3] lg:flex">
          {links.map((l) => (
            <li key={l.href + l.label}>
              <a
                href={l.href}
                className="transition-colors hover:text-[#FAFAFA] whitespace-nowrap"
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

        {/* Mobile Header: Logo, LangToggle, and Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          <LangToggle />
          <button
            onClick={() => setOpen(!open)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg p-2.5 bg-[#141414] border border-[#262626] text-[#FAFAFA] hover:border-[#404040] cursor-pointer transition-colors"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {open && (
        <div className="container-x pb-6 pt-3 lg:hidden bg-[#0A0A0A] border-b border-[#262626] max-h-[calc(100vh-4rem)] overflow-y-auto">
          <ul className="flex flex-col gap-1 text-[#A3A3A3]">
            {links.map((l) => (
              <li key={l.href + l.label}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-4 py-3 text-base font-medium hover:bg-[#141414] hover:text-[#FAFAFA] transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-[#262626] mt-3 flex flex-col gap-3">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-mono text-[#737373]">
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
