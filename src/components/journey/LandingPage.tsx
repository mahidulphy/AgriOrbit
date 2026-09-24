import React, { useState } from 'react';
import { ArrowRight, LogIn, Menu, X } from 'lucide-react';
import { Language } from '../../types';
import { getNasaContext } from '../../lib/nasaContext';
import { BrandLogo } from '../common/BrandLogo';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { AppFooter, AGRIORBIT_TAGLINE } from '../common/AppFooter';
import { Eyebrow, Rule, PrimaryButton, GhostButton } from '../ui';
import { MiniMap } from '../map/MiniMap';

interface LandingPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onStartAnalysis: () => void;
  onOpenLogin: () => void;
  onOpenHowItWorks: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  language,
  onLanguageChange,
  onStartAnalysis,
  onOpenLogin,
  onOpenHowItWorks,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const demo = getNasaContext('rangpur');

  const links = [
    { href: '#about', en: 'What is AgriOrbit?', bn: 'এগ্রিঅরবিট কী?' },
    { href: '#nasa-data', en: 'Earth Observations', bn: 'নাসা উপগ্রহ পর্যবেক্ষণ' },
    { href: '#rotation', en: 'Crop Rotation', bn: 'শস্য পরিক্রমা' },
  ];

  return (
    <div className="min-h-screen bg-[#050B14] text-white font-sans selection:bg-[#B8FF3D] selection:text-[#050B14]">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#050B14]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-2 sm:gap-4">
          <BrandLogo />

          <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-[#8FA3B8] whitespace-nowrap">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-white transition whitespace-nowrap shrink-0">
                {language === 'en' ? l.en : l.bn}
              </a>
            ))}
            <button
              onClick={onOpenHowItWorks}
              className="hover:text-white transition cursor-pointer whitespace-nowrap shrink-0"
            >
              {language === 'en' ? 'How It Works' : 'এটি কীভাবে কাজ করে'}
            </button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSwitcher language={language} onLanguageChange={onLanguageChange} />
            <button
              onClick={onOpenLogin}
              className="hidden sm:flex px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{language === 'en' ? 'Login' : 'লগইন'}</span>
            </button>
            <button
              onClick={onStartAnalysis}
              className="hidden md:flex px-5 py-2 rounded-lg bg-[#B8FF3D] hover:bg-[#B8FF3D]/85 text-[#050B14] font-bold text-sm transition items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="whitespace-nowrap">{language === 'en' ? 'Analyze My Field' : 'জমি বিশ্লেষণ করুন'}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              className="xl:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition cursor-pointer"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile / tablet menu */}
        {menuOpen && (
          <nav className="xl:hidden border-t border-white/10 px-4 sm:px-6 py-2">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block py-3 border-b border-white/5 text-sm font-medium text-[#8FA3B8] hover:text-white transition last:border-0"
              >
                {language === 'en' ? l.en : l.bn}
              </a>
            ))}
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenHowItWorks();
              }}
              className="block w-full text-left py-3 border-b border-white/5 text-sm font-medium text-[#8FA3B8] hover:text-white transition cursor-pointer"
            >
              {language === 'en' ? 'How It Works' : 'এটি কীভাবে কাজ করে'}
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenLogin();
              }}
              className="block w-full text-left py-3 text-sm font-semibold text-white cursor-pointer sm:hidden"
            >
              {language === 'en' ? 'Login' : 'লগইন'}
            </button>
          </nav>
        )}
      </header>

      {/* ── Hero: editorial two-column ─────────────────────── */}
      <section className="px-4 sm:px-6 pt-14 pb-16 lg:pt-20 lg:pb-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-start">
          <div>
            <Eyebrow>
              {language === 'en' ? 'Bangladesh · NASA Earth observations' : 'বাংলাদেশ · নাসার পৃথিবী পর্যবেক্ষণ'}
            </Eyebrow>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight leading-[1.08] mt-4 text-white">
              {language === 'en' ? (
                <>
                  Know your field <span className="text-[#B8FF3D]">before</span> you plant.
                </>
              ) : (
                <>
                  বপনের <span className="text-[#B8FF3D]">আগেই</span> জমিকে চিনুন।
                </>
              )}
            </h1>
            <p className="text-base sm:text-lg text-[#8FA3B8] leading-relaxed mt-5 max-w-xl">
              {language === 'en'
                ? 'AgriOrbit reads NASA satellite observations over your field, explains what they mean in plain language, and helps you plan three seasons of crops. You make the final call.'
                : 'এগ্রিঅরবিট আপনার জমির উপর নাসার উপগ্রহ পর্যবেক্ষণ পড়ে, সহজ ভাষায় ব্যাখ্যা করে এবং তিন মৌসুমের ফসল পরিকল্পনায় সাহায্য করে। চূড়ান্ত সিদ্ধান্ত আপনার।'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <PrimaryButton onClick={onStartAnalysis} className="px-8 py-3.5 text-base">
                <span>{language === 'en' ? 'Analyze My Field' : 'আমার জমি বিশ্লেষণ করুন'}</span>
                <ArrowRight className="w-4 h-4" />
              </PrimaryButton>
              <GhostButton onClick={onOpenLogin} className="px-8 py-3.5 text-base">
                <LogIn className="w-4 h-4 text-[#00E5FF]" />
                <span>{language === 'en' ? 'Login' : 'লগইন'}</span>
              </GhostButton>
            </div>
            <p className="text-xs text-[#8FA3B8] mt-4">
              {language === 'en' ? 'New to AgriOrbit? ' : 'এগ্রিঅরবিটে নতুন? '}
              <button
                onClick={onOpenLogin}
                className="text-white underline underline-offset-2 hover:text-[#B8FF3D] transition cursor-pointer"
              >
                {language === 'en' ? 'Create an account' : 'অ্যাকাউন্ট তৈরি করুন'}
              </button>
            </p>

            {/* Live field readout — real demo telemetry */}
            <dl className="mt-10 border-t border-white/10 max-w-xl">
              {[
                {
                  k: language === 'en' ? 'Rainfall, Rangpur (30-day)' : 'বৃষ্টিপাত, রংপুর (৩০ দিন)',
                  v: `${demo.power.rainfallMm} mm · ${demo.power.rainfallAnomalyPct}%`,
                  src: 'NASA POWER',
                },
                {
                  k: language === 'en' ? 'Surface soil moisture' : 'মাটির উপরিভাগের আর্দ্রতা',
                  v: `${demo.smap.surfaceMoisture} m³/m³`,
                  src: 'NASA SMAP',
                },
                {
                  k: language === 'en' ? 'Vegetation health (NDVI)' : 'উদ্ভিদ সজীবতা (এনডিভিআই)',
                  v: `${demo.modis.ndvi} / 1.0`,
                  src: 'NASA MODIS',
                },
              ].map((row) => (
                <div key={row.k} className="flex items-baseline justify-between gap-4 py-3 border-b border-white/10">
                  <dt className="text-sm text-[#8FA3B8]">{row.k}</dt>
                  <dd className="text-sm text-white font-semibold tnum whitespace-nowrap">
                    {row.v} <span className="text-[11px] font-medium text-[#00E5FF] ml-1">{row.src}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:pt-2">
            <MiniMap />
            <div className="flex items-center justify-between mt-3 text-xs text-[#8FA3B8]">
              <span className="tnum">Rangpur demo field · 25.7439°N 89.2752°E</span>
              <span>{language === 'en' ? 'Live map tiles' : 'সরাসরি মানচিত্র'}</span>
            </div>
            <ol className="mt-6 border-t border-white/10">
              {[
                { n: '01', en: 'NASA observes rainfall, soil moisture and vegetation.', bn: 'নাসা বৃষ্টিপাত, মাটির আর্দ্রতা ও উদ্ভিদ পর্যবেক্ষণ করে।' },
                { n: '02', en: 'AgriOrbit explains it against local agronomy.', bn: 'এগ্রিঅরবিট স্থানীয় কৃষিবিদ্যার আলোকে ব্যাখ্যা করে।' },
                { n: '03', en: 'You decide what to plant.', bn: 'কী চাষ করবেন, সিদ্ধান্ত আপনার।' },
              ].map((s) => (
                <li key={s.n} className="flex gap-4 py-3 border-b border-white/10 text-sm">
                  <span className="tnum text-[#B8FF3D] font-semibold">{s.n}</span>
                  <span className="text-[#8FA3B8]">{language === 'en' ? s.en : s.bn}</span>
                </li>
              ))}
            </ol>
            <p className="text-[11px] text-[#8FA3B8]/70 mt-3 italic">{AGRIORBIT_TAGLINE}</p>
          </div>
        </div>
      </section>

      {/* ── Why AgriOrbit exists ───────────────────────────── */}
      <section id="about" className="px-4 sm:px-6 py-14 lg:py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-10">
          <div>
            <Eyebrow>{language === 'en' ? 'Purpose' : 'উদ্দেশ্য'}</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-3 text-white">
              {language === 'en' ? 'Why does AgriOrbit exist?' : 'এগ্রিঅরবিটের প্রয়োজনীয়তা কী?'}
            </h2>
            <p className="text-sm sm:text-base text-[#8FA3B8] mt-4 leading-relaxed">
              {language === 'en'
                ? 'Rainfall is erratic, winter groundwater is depleting, and seasons are shifting. Satellite data exists — but raw telemetry means little on its own. AgriOrbit translates it into planting advice a farmer can audit.'
                : 'অনিয়মিত বৃষ্টিপাত, কমতে থাকা ভূগর্ভস্থ পানি, বদলে যাওয়া মৌসুম। উপগ্রহ তথ্য আছে — কিন্তু কাঁচা তথ্য একা অর্থহীন। এগ্রিঅরবিট একে যাচাইযোগ্য বপন পরামর্শে রূপান্তর করে।'}
            </p>
          </div>
          <ol>
            {[
              {
                n: '01',
                tEn: 'NASA observes',
                tBn: 'নাসা পর্যবেক্ষণ করে',
                dEn: 'Precipitation (POWER), root-zone soil moisture (SMAP), and surface heat and greenness (MODIS), tracked continuously over Bangladesh.',
                dBn: 'বাংলাদেশের উপর বৃষ্টিপাত (পাওয়ার), মূলস্তরের আর্দ্রতা (স্ম্যাপ) এবং তাপ ও সবুজ (মডিস) প্রতিনিয়ত পর্যবেক্ষণ করা হয়।',
              },
              {
                n: '02',
                tEn: 'AgriOrbit explains',
                tBn: 'এগ্রিঅরবিট ব্যাখ্যা করে',
                dEn: 'A transparent rule engine combines observations with BARI agronomy and your own farming priority. No black-box AI.',
                dBn: 'একটি স্বচ্ছ নিয়ম-ইঞ্জিন পর্যবেক্ষণকে বারি কৃষিবিদ্যা ও আপনার অগ্রাধিকারের সাথে মিলিয়ে সিদ্ধান্ত দেয়। কোনো ব্ল্যাক-বক্স নেই।',
              },
              {
                n: '03',
                tEn: 'Farmer decides',
                tBn: 'সিদ্ধান্ত কৃষকের',
                dEn: 'Review the three-season rotation, open “Explain Why” on any crop, and plant with the reasoning in front of you.',
                dBn: 'তিন মৌসুমের পরিক্রমা দেখুন, যেকোনো ফসলের “কেন” যাচাই করুন এবং যুক্তি হাতে নিয়ে বপন করুন।',
              },
            ].map((s) => (
              <li key={s.n} className="flex gap-5 py-5 border-t border-white/10 first:border-t-0 first:pt-0">
                <span className="tnum text-sm font-semibold text-[#00E5FF] pt-0.5">{s.n}</span>
                <div>
                  <h3 className="font-bold text-white">{language === 'en' ? s.tEn : s.tBn}</h3>
                  <p className="text-sm text-[#8FA3B8] mt-1 leading-relaxed">
                    {language === 'en' ? s.dEn : s.dBn}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── NASA data sources ──────────────────────────────── */}
      <section id="nasa-data" className="px-4 sm:px-6 py-14 lg:py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <Eyebrow>{language === 'en' ? 'Earth observation telemetry' : 'উপগ্রহ পর্যবেক্ষণ মাধ্যম'}</Eyebrow>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-3 text-white max-w-2xl">
            {language === 'en' ? 'Three NASA sources, one field reading' : 'তিনটি নাসা উৎস, একটি মাঠ-পাঠ'}
          </h2>
          <dl className="mt-8 border-t border-white/10">
            {[
              {
                src: 'NASA POWER',
                tagEn: 'Atmosphere',
                tagBn: 'বায়ুমণ্ডল',
                rowsEn: 'Rainfall vs 10-year normal · 2 m air temperature · relative humidity',
                rowsBn: '১০ বছরের গড়ের তুলনায় বৃষ্টি · ২ মিটার তাপমাত্রা · আপেক্ষিক আর্দ্রতা',
              },
              {
                src: 'NASA SMAP',
                tagEn: 'Soil moisture',
                tagBn: 'মাটির আর্দ্রতা',
                rowsEn: 'Surface (0–5 cm) and root-zone moisture · deficit / optimal / surplus states',
                rowsBn: 'উপরিভাগ (০–৫ সেমি) ও মূলস্তরের আর্দ্রতা · ঘাটতি / অনুকূল / উদ্বৃত্ত অবস্থা',
              },
              {
                src: 'NASA MODIS',
                tagEn: 'Vegetation & heat',
                tagBn: 'উদ্ভিদ ও তাপ',
                rowsEn: 'NDVI greenness · land surface temperature · 250 m resolution',
                rowsBn: 'এনডিভিআই সবুজ · ভূপৃষ্ঠ তাপমাত্রা · ২৫০ মি রেজোলিউশন',
              },
            ].map((s) => (
              <div key={s.src} className="grid sm:grid-cols-[180px_1fr] gap-1 sm:gap-6 py-5 border-b border-white/10">
                <div>
                  <p className="text-sm font-bold text-white tnum">{s.src}</p>
                  <p className="text-xs text-[#00E5FF] mt-0.5">{language === 'en' ? s.tagEn : s.tagBn}</p>
                </div>
                <p className="text-sm text-[#8FA3B8] leading-relaxed">
                  {language === 'en' ? s.rowsEn : s.rowsBn}
                </p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Rotation preview ───────────────────────────────── */}
      <section id="rotation" className="px-4 sm:px-6 py-14 lg:py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1fr] gap-10 items-start">
          <div>
            <Eyebrow tone="lime">{language === 'en' ? 'Annual planning' : 'বার্ষিক পরিকল্পনা'}</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-3 text-white">
              {language === 'en' ? 'One year, three seasons, no depleted soil' : 'এক বছর, তিন মৌসুম, অনুর্বর মাটি নয়'}
            </h2>
            <ol className="mt-8 border-t border-white/10">
              {[
                { s: 'Rabi · Nov–Feb', c: 'Lentil / Mustard', dEn: 'Low-water winter crop. Rests the aquifer.', dBn: 'স্বল্প পানির শীতকালীন ফসল। ভূগর্ভস্থ পানির বিশ্রাম।' },
                { s: 'Kharif-1 · Mar–Jun', c: 'Mungbean / Jute', dEn: 'Fixes nitrogen, vacates land in ~65 days.', dBn: 'নাইট্রোজেন জমা করে, ~৬৫ দিনে জমি খালি করে।' },
                { s: 'Kharif-2 · Jul–Oct', c: 'T. Aman Rice', dEn: 'Rainfed staple on free monsoon water.', dBn: 'বিনামূল্যের বর্ষার পানিতে প্রধান ধান।' },
              ].map((r, i) => (
                <li key={r.s} className="flex gap-5 py-4 border-b border-white/10">
                  <span className="tnum text-sm font-semibold text-[#B8FF3D]">0{i + 1}</span>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[#8FA3B8]">{r.s}</p>
                    <p className="font-bold text-white mt-0.5">{r.c}</p>
                    <p className="text-sm text-[#8FA3B8] mt-0.5">{language === 'en' ? r.dEn : r.dBn}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:sticky lg:top-24 rounded-lg border border-[#B8FF3D]/25 bg-[#0B1626] p-7 sm:p-9">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {language === 'en' ? 'Ready to read your field?' : 'জমির পাঠ নিতে প্রস্তুত?'}
            </h3>
            <p className="text-sm text-[#8FA3B8] mt-3 leading-relaxed">
              {language === 'en'
                ? 'Pin your plot, set one priority, and get a rotation you can audit rule by rule.'
                : 'জমি চিহ্নিত করুন, একটি অগ্রাধিকার দিন, এবং নিয়ম-ধরে-ধরে যাচাইযোগ্য পরিক্রমা পান।'}
            </p>
            <PrimaryButton onClick={onStartAnalysis} className="w-full mt-6 py-3.5 text-base">
              <span>{language === 'en' ? 'Get Started: Analyze My Field' : 'শুরু করুন: জমি বিশ্লেষণ'}</span>
              <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
          </div>
        </div>
      </section>

      <AppFooter
        language={language}
        onOpenHowItWorks={onOpenHowItWorks}
        onOpenLogin={onOpenLogin}
      />
    </div>
  );
};
