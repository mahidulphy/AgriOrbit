import React, { useState } from 'react';
import {
  Satellite,
  Orbit,
  ArrowRight,
  Sprout,
  LogIn,
  Globe,
} from 'lucide-react';
import { Language } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { AppFooter, AGRIORBIT_TAGLINE } from '../common/AppFooter';

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
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#2E1065] text-[#E9D5FF] flex flex-col font-sans selection:bg-[#A855F7] selection:text-white">
      {/* 1. Public Landing Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#2E1065]/95 backdrop-blur-md border-b border-[#6D28D9]/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo & Space Apps Badge */}
          <BrandLogo badge="NASA Space Apps" />

          {/* Navigation Links Before Login */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#E9D5FF]/80">
            <a href="#about" className="hover:text-white transition">
              {language === 'en' ? 'What is AgriOrbit?' : 'এগ্রিঅরবিট কী?'}
            </a>
            <button
              onClick={onOpenHowItWorks}
              className="hover:text-white transition cursor-pointer"
            >
              {language === 'en' ? 'How It Works' : 'এটি কীভাবে কাজ করে'}
            </button>
            <a href="#nasa-data" className="hover:text-white transition">
              {language === 'en' ? 'Earth Observations' : 'নাসা উপগ্রহ পর্যবেক্ষণ'}
            </a>
            <a href="#rotation" className="hover:text-white transition">
              {language === 'en' ? 'Crop Rotation' : 'শস্য পরিক্রমা'}
            </a>
          </nav>

          {/* Auth & Language Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher language={language} onLanguageChange={onLanguageChange} />

            {/* Login CTA */}
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-xl bg-[#3B0764] hover:bg-[#6D28D9] border border-[#6D28D9] text-[#E9D5FF] hover:text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Login' : 'লগইন'}</span>
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onStartAnalysis}
              className="hidden sm:flex px-5 py-2 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#A855F7]/30 transition items-center gap-1.5 cursor-pointer"
            >
              <span>{language === 'en' ? 'Analyze My Field' : 'জমি বিশ্লেষণ করুন'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section: Product Identity & Core Message */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Subtle cosmic illumination background orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#6D28D9]/25 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-28 right-12 w-80 h-80 bg-[#A855F7]/15 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Mission Capsule */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3B0764]/90 border border-[#A855F7]/40 text-[#E9D5FF] text-xs sm:text-sm font-semibold mb-6 shadow-inner">
            <Orbit className="w-4 h-4 text-[#A855F7]" />
            <span>
              {language === 'en'
                ? AGRIORBIT_TAGLINE
                : 'নাসা পর্যবেক্ষণ করে → এগ্রিঅরবিট ব্যাখ্যা করে → সিদ্ধান্ত নেন কৃষক'}
            </span>
          </div>

          {/* Hero Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6">
            AGRIORBIT
            <span className="block text-2xl sm:text-4xl lg:text-5xl font-extrabold mt-3 text-transparent bg-clip-text bg-gradient-to-r from-[#E9D5FF] via-[#C084FC] to-[#A855F7]">
              {language === 'en'
                ? 'From Earth observations to smarter farm decisions.'
                : 'উপগ্রহ পর্যবেক্ষণ থেকে ফসলের সঠিক ও টেকসই সিদ্ধান্ত।'}
            </span>
          </h1>

          {/* Supporting Message */}
          <p className="text-base sm:text-xl text-[#E9D5FF]/85 max-w-3xl mx-auto leading-relaxed mb-10">
            {language === 'en'
              ? 'Understand your field, adapt to changing climate, and plan your next crop with explainable insights powered by NASA Earth observations and local Bangladesh agricultural intelligence.'
              : 'নাসার উপগ্রহ পর্যবেক্ষণ ও বাংলাদেশের কৃষি তথ্যের সাহায্যে আপনার জমির পরিবেশ বুঝুন, পরিবর্তনশীল আবহাওয়ার সাথে খাপ খাইয়ে নিন এবং পরবর্তী ৩টি মৌসুমের শস্য পরিক্রমা যৌক্তিকভাবে নির্ধারণ করুন।'}
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <button
              onClick={onStartAnalysis}
              className="w-full sm:w-auto px-9 py-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] text-white font-extrabold text-lg shadow-xl shadow-[#7C3AED]/40 hover:shadow-[#A855F7]/50 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{language === 'en' ? 'Analyze My Field' : 'আমার জমি বিশ্লেষণ করুন'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#3B0764]/80 hover:bg-[#3B0764] text-[#E9D5FF] border border-[#6D28D9]/70 font-bold text-base transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#A855F7]" />
              <span>{language === 'en' ? 'Login' : 'লগইন'}</span>
            </button>
          </div>

          {/* Small subtext link */}
          <p className="text-xs text-[#E9D5FF]/70 mb-12">
            {language === 'en' ? 'New to AgriOrbit? ' : 'এগ্রিঅরবিটে নতুন? '}
            <button
              onClick={onOpenLogin}
              className="text-[#E9D5FF] underline font-bold hover:text-white transition cursor-pointer"
            >
              {language === 'en' ? 'Create an account' : 'অ্যাকাউন্ট তৈরি করুন'}
            </button>
          </p>

          {/* Visual Concept: Satellite Orbit → Bangladesh → Field Plot */}
          <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-[#3B0764]/50 border border-[#6D28D9]/50 shadow-2xl backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#6D28D9] flex items-center justify-center shadow-lg shadow-[#6D28D9]/50 shrink-0">
                  <Satellite className="w-7 h-7 text-white" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#A855F7] block">
                    STEP 1 • ORBIT
                  </span>
                  <h4 className="font-extrabold text-white text-base">NASA Satellites</h4>
                  <p className="text-xs text-[#E9D5FF]/70">POWER, SMAP & MODIS telemetry</p>
                </div>
              </div>

              <div className="hidden md:block text-[#A855F7]">
                <ArrowRight className="w-6 h-6 animate-pulse" />
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#7C3AED] flex items-center justify-center shadow-lg shadow-[#7C3AED]/50 shrink-0">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#A855F7] block">
                    STEP 2 • REGION
                  </span>
                  <h4 className="font-extrabold text-white text-base">Bangladesh AEZ</h4>
                  <p className="text-xs text-[#E9D5FF]/70">Rangpur, Rajshahi, Khulna, Dhaka</p>
                </div>
              </div>

              <div className="hidden md:block text-[#A855F7]">
                <ArrowRight className="w-6 h-6 animate-pulse" />
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#A855F7] flex items-center justify-center shadow-lg shadow-[#A855F7]/50 shrink-0">
                  <Sprout className="w-7 h-7 text-white" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#E9D5FF] block">
                    STEP 3 • FIELD
                  </span>
                  <h4 className="font-extrabold text-white text-base">Farmer's Plot</h4>
                  <p className="text-xs text-[#E9D5FF]/70">3-Season Explainable Plan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "What is AgriOrbit?" & "Why Does It Exist?" */}
      <section id="about" className="py-16 px-4 sm:px-6 bg-[#250D52] border-t border-[#6D28D9]/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A855F7] block mb-2">
              {language === 'en' ? 'Purpose & Philosophy' : 'উদ্দেশ্য ও দর্শন'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              {language === 'en' ? 'Why does AgriOrbit exist?' : 'এগ্রিঅরবিটের প্রয়োজনীয়তা কী?'}
            </h2>
            <p className="text-sm text-[#E9D5FF]/80 mt-3 leading-relaxed">
              {language === 'en'
                ? 'Farmers in Bangladesh face increasingly erratic rainfall, depleting winter groundwater, and shifting seasons. AgriOrbit translates complex satellite data into plain, actionable advice.'
                : 'অনিয়মিত বৃষ্টিপাত ও ভূগর্ভস্থ পানির সংকট মোকাবেলায় নাসার উপগ্রহ তথ্যের সাহায্যে কৃষকদের যুক্তিনির্ভর ফসল পরিক্রমা গড়ে তোলাই এগ্রিঅরবিটের লক্ষ্য।'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#3B0764]/70 border border-[#6D28D9]/40 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl mb-4">
                01
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {language === 'en' ? 'NASA Observes' : '১. নাসা পর্যবেক্ষণ করে'}
              </h3>
              <p className="text-xs sm:text-sm text-[#E9D5FF]/80 leading-relaxed">
                {language === 'en'
                  ? 'Continuous satellite telemetry tracks precipitation (POWER), root-zone soil moisture (SMAP), and surface heat & greenness (MODIS) across Bangladesh.'
                  : 'নাসার উপগ্রহগুলো প্রতিনিয়ত বৃষ্টিপাত, মাটির আর্দ্রতা এবং উদ্ভিদের সজীবতা পর্যবেক্ষণ করে।'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#3B0764]/70 border border-[#A855F7]/40 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-[#A855F7]/20 text-[#A855F7] flex items-center justify-center font-bold text-xl mb-4">
                02
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {language === 'en' ? 'AgriOrbit Explains' : '২. এগ্রিঅরবিট ব্যাখ্যা করে'}
              </h3>
              <p className="text-xs sm:text-sm text-[#E9D5FF]/80 leading-relaxed">
                {language === 'en'
                  ? 'A transparent rule engine applies Bangladesh Agricultural Research Institute (BARI) agronomic logic and your farm priority. No black-box AI.'
                  : 'কৃষি গবেষণা নির্দেশিকা ও কৃষকের নিজস্ব পছন্দের ভিত্তিতে নিয়মমাফিক যৌক্তিক ফলাফল তৈরি করা হয়। কোনো অনুমাননির্ভরতা নেই।'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#3B0764]/70 border border-[#6D28D9]/40 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl mb-4">
                03
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {language === 'en' ? 'Farmer Decides' : '৩. সিদ্ধান্ত নেন কৃষক'}
              </h3>
              <p className="text-xs sm:text-sm text-[#E9D5FF]/80 leading-relaxed">
                {language === 'en'
                  ? 'You review the 3-season crop rotation plan, open "Explain Why" to audit every rule, and make the ultimate informed planting decision for your land.'
                  : 'কৃষক ৩টি মৌসুমের শস্য পরিক্রমা যাচাই করেন, "কেন এই ফসল?" দেখে নিশ্চিত হন এবং চূড়ান্ত সিদ্ধান্ত গ্রহণ করেন।'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NASA Data Sources Section */}
      <section id="nasa-data" className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#A855F7] block mb-1">
                {language === 'en' ? 'Earth Observation Telemetry' : 'উপগ্রহ পর্যবেক্ষণ মাধ্যম'}
              </span>
              <h2 className="text-3xl font-extrabold text-white">
                {language === 'en' ? 'NASA Data Sources Powering AgriOrbit' : 'এগ্রিঅরবিটে ব্যবহৃত নাসার ৩টি প্রধান উপগ্রহ তথ্য'}
              </h2>
            </div>
            <p className="text-xs text-[#E9D5FF]/70 max-w-sm">
              {language === 'en'
                ? 'Compact, lightweight, and calibrated specifically for Bangladesh agro-climatic conditions.'
                : 'বাংলাদেশের কৃষি-আবহাওয়া অঞ্চলের জন্য বিশেষভাবে বিন্যস্ত।'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* POWER Card */}
            <div className="p-6 rounded-2xl bg-white text-slate-900 border border-[#E9D5FF] shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <span className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
                  NASA POWER
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Atmospheric
                </span>
              </div>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="text-lg">🌧</span>
                  <div>
                    <strong className="block text-slate-900">Rainfall Precipitation</strong>
                    <span className="text-slate-500">Historical normal vs current deficit</span>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">🌡</span>
                  <div>
                    <strong className="block text-slate-900">Air Temperature</strong>
                    <span className="text-slate-500">Mean 2m thermal profile for germination</span>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">💧</span>
                  <div>
                    <strong className="block text-slate-900">Relative Humidity</strong>
                    <span className="text-slate-500">Dew point & moisture retention index</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* SMAP Card */}
            <div className="p-6 rounded-2xl bg-white text-slate-900 border border-[#E9D5FF] shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <span className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
                  NASA SMAP
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Subsurface
                </span>
              </div>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="text-lg">💧</span>
                  <div>
                    <strong className="block text-slate-900">Surface Soil Moisture</strong>
                    <span className="text-slate-500">0–5cm topsoil water volumetric fraction</span>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">🌱</span>
                  <div>
                    <strong className="block text-slate-900">Root-Zone Moisture</strong>
                    <span className="text-slate-500">Depletion tracking for irrigation timing</span>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <div>
                    <strong className="block text-slate-900">Moisture Thresholds</strong>
                    <span className="text-slate-500">Deficit, optimal, or saturated states</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* MODIS Card */}
            <div className="p-6 rounded-2xl bg-white text-slate-900 border border-[#E9D5FF] shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <span className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
                  NASA MODIS
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  Biosphere
                </span>
              </div>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="text-lg">🌱</span>
                  <div>
                    <strong className="block text-slate-900">Vegetation Health (NDVI)</strong>
                    <span className="text-slate-500">Canopy greenness & biomass vigour</span>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">🌡</span>
                  <div>
                    <strong className="block text-slate-900">Land Surface Temp (LST)</strong>
                    <span className="text-slate-500">Thermal heat stress on crop canopies</span>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">🛰</span>
                  <div>
                    <strong className="block text-slate-900">250m Spatial Resolution</strong>
                    <span className="text-slate-500">Regional monitoring with daily passes</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 3-Season Rotation Preview */}
      <section id="rotation" className="py-16 px-4 sm:px-6 bg-[#250D52] border-t border-[#6D28D9]/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A855F7] block mb-1">
              {language === 'en' ? 'Multi-Season Agro-Planning' : 'বহু-মৌসুমী শস্য আবর্তন'}
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              {language === 'en' ? 'Plan a Climate-Resilient 3-Season Cycle' : '৩টি পূর্ণাঙ্গ মৌসুমের টেকসই পরিকল্পনা'}
            </h2>
            <p className="text-xs sm:text-sm text-[#E9D5FF]/80 mt-2">
              {language === 'en'
                ? 'AgriOrbit avoids monoculture depletion by generating a synchronized annual sequence.'
                : 'একক ফসলের ক্ষতি রোধ করে রবি, খরিফ-১ ও খরিফ-২ এর পূর্ণাঙ্গ আবর্তন তৈরি করে।'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="p-5 rounded-2xl bg-[#3B0764]/70 border border-[#6D28D9]/40 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A855F7]">
                RABI (রবি)
              </span>
              <p className="text-xs text-[#E9D5FF]/70 mb-2">November – February</p>
              <h4 className="text-xl font-black text-white">Lentil / Mustard</h4>
              <p className="text-xs text-[#E9D5FF]/80 mt-2">
                {language === 'en'
                  ? 'Low-water winter pulse or oilseed; avoids heavy groundwater extraction.'
                  : 'স্বল্প পানির ডাল বা সরিষা; গভীর সেচের অপচয় রোধ করে।'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#3B0764]/70 border border-[#6D28D9]/40 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A855F7]">
                KHARIF-1 (খরিফ-১)
              </span>
              <p className="text-xs text-[#E9D5FF]/70 mb-2">March – June</p>
              <h4 className="text-xl font-black text-white">Mungbean / Jute</h4>
              <p className="text-xs text-[#E9D5FF]/80 mt-2">
                {language === 'en'
                  ? 'Fixes 35-40kg biological nitrogen into soil, vacating field in 65 days.'
                  : 'মাটিতে প্রাকৃতিক নাইট্রোজেন জমা করে এবং ৬৫ দিনে আমনের জন্য জমি প্রস্তুত করে।'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#3B0764]/70 border border-[#6D28D9]/40 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A855F7]">
                KHARIF-2 (খরিফ-২)
              </span>
              <p className="text-xs text-[#E9D5FF]/70 mb-2">July – October</p>
              <h4 className="text-xl font-black text-white">T. Aman Rice</h4>
              <p className="text-xs text-[#E9D5FF]/80 mt-2">
                {language === 'en'
                  ? 'Rainfed monsoon staple utilizes natural rainwater without diesel pumping.'
                  : 'বৃষ্টি নির্ভর প্রধান ধান, যা আগের ডালের নাইট্রোজেন ব্যবহার করে ভালো ফলন দেয়।'}
              </p>
            </div>
          </div>

          {/* CTA Box */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-[#6D28D9] to-[#A855F7] text-white text-center shadow-2xl">
            <h3 className="text-2xl sm:text-3xl font-black mb-3">
              {language === 'en' ? 'Ready to analyze your farm?' : 'আপনার জমির উপগ্রহ বিশ্লেষণ করতে প্রস্তুত?'}
            </h3>
            <p className="text-sm text-[#E9D5FF] max-w-xl mx-auto mb-6">
              {language === 'en'
                ? 'Join AgriOrbit to inspect satellite observations for your district, set your farming priority, and receive explainable rotation advice.'
                : 'এগ্রিঅরবিটে প্রবেশ করে আপনার জেলার উপগ্রহ তথ্য পর্যবেক্ষণ করুন এবং আপনার জন্য সঠিক শস্য পরিক্রমা জেনে নিন।'}
            </p>
            <button
              onClick={onStartAnalysis}
              className="px-8 py-3.5 rounded-xl bg-[#2E1065] hover:bg-[#3B0764] text-white font-extrabold text-base shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-2"
            >
              <span>{language === 'en' ? 'Get Started: Analyze My Field' : 'শুরু করুন: জমি বিশ্লেষণ'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Landing Footer */}
      <AppFooter
        language={language}
        onOpenHowItWorks={onOpenHowItWorks}
        onOpenLogin={onOpenLogin}
      />
    </div>
  );
};
