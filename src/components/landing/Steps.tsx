import { ArrowRight, MapPin, Satellite, Sprout, Compass, ArrowDown } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { goAnalyze } from '../../lib/nav.ts';
import { IMAGES } from '../../data/assets.ts';
import { HeroMap } from '../HeroMap.tsx';

export function Steps() {
  const { lang } = useLang();
  const isBn = lang === 'bn';

  return (
    <section id="story" className="relative py-24 md:py-32 border-b border-white/10 bg-[#050B14]">
      <div className="container-x">
        {/* Narrative Section Header */}
        <div className="max-w-3xl mb-16 md:mb-24">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-[#00E5FF] uppercase mb-3">
            <span>THE DECISION JOURNEY</span>
            <span aria-hidden="true">·</span>
            <span>01 TO 04</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
            {isBn ? 'কৃষকের জমির দৃশ্যকাব্য' : 'From Orbit to the Farmer’s Field'}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#8FA3B8] leading-relaxed">
            {isBn
              ? 'একটি জমি, চারটি সুনির্দিষ্ট ধাপ। মহাকাশ পর্যবেক্ষণ থেকে মাটির উর্বরতা ও লাভজনক ফসল নির্বাচনের সম্পাদকীয় পরিক্রমা।'
              : 'A continuous four-stage narrative turning raw Earth observations into an actionable, seasonal planting strategy.'}
          </p>
        </div>

        {/* CHAPTER 01 — SEE THE FIELD */}
        <div className="py-12 border-t border-white/10 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B8FF3D] uppercase">
              <span>01</span>
              <span aria-hidden="true">·</span>
              <span>SEE THE FIELD</span>
            </div>
            <h3 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
              {isBn ? 'প্রতিটি সিদ্ধান্তের সূচনা অবস্থান দিয়ে।' : 'Every decision starts with a location.'}
            </h3>
            <p className="text-sm sm:text-base text-[#8FA3B8] leading-relaxed">
              {isBn
                ? 'বাংলাদেশের ৬৪টি জেলার প্রতিটি মাটির ধরন এবং ভূগর্ভস্থ পানির স্থিতি আলাদা। ৫ কিমি বৈজ্ঞানিক গ্রিডে আপনার জমির সুনির্দিষ্ট অবস্থান নির্ধারণ করা হয়।'
                : 'Across Bangladesh’s 64 districts, soil permeability and groundwater response differ dramatically. AgriOrbit pins your field coordinates and computes a 5 km scientific observation circle.'}
            </p>
            <div className="pt-2">
              <button
                onClick={goAnalyze}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#B8FF3D] hover:underline uppercase font-mono cursor-pointer"
              >
                <span>{isBn ? 'মানচিত্রে আপনার জেলা নির্বাচন করুন' : 'Locate your field on the map'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0B1626] shadow-2xl relative">
              <HeroMap>
                <div className="absolute top-4 left-4 z-10 bg-[#050B14]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-mono text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#B8FF3D] animate-pulse" />
                  <span>25.75° N, 89.25° E · Rangpur</span>
                </div>
                <div className="absolute bottom-4 right-4 z-10 bg-[#050B14]/90 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-[11px] font-mono text-[#8FA3B8]">
                  5 km Context Circle
                </div>
              </HeroMap>
            </div>
          </div>
        </div>

        {/* CHAPTER 02 — UNDERSTAND THE SHIFT */}
        <div className="py-16 border-t border-white/10 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0B1626] min-h-[360px] flex flex-col justify-end p-6 sm:p-8">
              <img
                src={IMAGES.satelliteOrbit}
                alt="NASA Satellite Earth Observation of Bangladesh"
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 scrim-editorial-card" />
              <div className="relative z-10">
                <span className="text-xs uppercase font-mono text-[#00E5FF] font-bold block mb-1">
                  NASA POWER · 2001 → Today
                </span>
                <h4 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                  {isBn ? '৩০ বছরের জলবায়ু স্থানান্তর' : 'Three Decades of Measured Climate Shift'}
                </h4>
                <p className="text-xs sm:text-sm text-[#8FA3B8] leading-relaxed max-w-lg">
                  {isBn
                    ? 'শীতের তাপমাত্রা বেড়েছে এবং বর্ষার শুরুর বৃষ্টি পিছিয়ে গেছে। ঐতিহাসিকভাবে নির্ধারিত সময়ে বীজ বপন করলে ফসল তাপপ্রবাহের ঝুঁকিতে পড়ে।'
                    : 'Winter temperatures have climbed and rainfall distributions have drifted. Historical planting calendars expose crops to heat stress and water deficits.'}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4 order-1 lg:order-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00E5FF] uppercase">
              <span>02</span>
              <span aria-hidden="true">·</span>
              <span>UNDERSTAND THE SHIFT</span>
            </div>
            <h3 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
              {isBn ? 'আপনার এলাকার পরিবেশ কীভাবে বদলেছে বুঝুন।' : 'Understand how the conditions around your field are changing.'}
            </h3>
            <p className="text-sm sm:text-base text-[#8FA3B8] leading-relaxed">
              {isBn
                ? 'নাসা পাওয়ার-এর ৩০ বছরের তথ্য দিয়ে আপনার জেলার রবি, খরিফ-১ ও খরিফ-২ মৌসুমের তাপ এবং বৃষ্টির পরিবর্তন তাৎক্ষণিকভাবে দেখা যায়।'
                : 'NASA POWER historical telemetry reveals whether your district’s dry season is warming and when rainfall actually arrives.'}
            </p>
            <div className="pt-2">
              <a
                href="#field-shift"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#00E5FF] hover:underline uppercase font-mono"
              >
                <span>{isBn ? 'ফিল্ড শিফট বিস্তারিত দেখুন' : 'Explore the Field Shift analysis'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* CHAPTER 03 — CHOOSE THE CROP */}
        <div className="py-16 border-t border-white/10 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B8FF3D] uppercase">
              <span>03</span>
              <span aria-hidden="true">·</span>
              <span>CHOOSE THE CROP</span>
            </div>
            <h3 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
              {isBn ? 'বর্তমান অবস্থার সাথে ফসলের চাহিদা মেলান।' : 'Match current conditions with crop needs.'}
            </h3>
            <p className="text-sm sm:text-base text-[#8FA3B8] leading-relaxed">
              {isBn
                ? 'অতিরিক্ত সেচ নির্ভর বোরো ধান চাষের বদলে কম পানির সরিষা বা মসুর ডাল নির্বাচন করলে সেচ খরচ বাঁচে এবং মাটির স্বাস্থ্য ভালো থাকে।'
                : 'When surface soil moisture is low, high-water crops face heavy irrigation costs. AgriOrbit ranks 10 verified crops using BARI/BRRI agronomic rules.'}
            </p>
            <div className="pt-2">
              <button
                onClick={goAnalyze}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#B8FF3D] hover:underline uppercase font-mono cursor-pointer"
              >
                <span>{isBn ? '১০টি ফসলের উপযোগিতা মূল্যায়ন দেখুন' : 'Evaluate crop suitability for your field'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0B1626] min-h-[360px] flex flex-col justify-end p-6 sm:p-8">
              <img
                src={IMAGES.farmerField}
                alt="Bangladeshi farmer in mustard field"
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 scrim-editorial-card" />
              <div className="relative z-10">
                <span className="text-xs uppercase font-mono text-[#B8FF3D] font-bold block mb-1">
                  Agronomic Match
                </span>
                <h4 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                  {isBn ? 'সরিষা ও ডাল ফসলের সুবিধা' : 'Low-Water Legume & Oilseed Advantage'}
                </h4>
                <p className="text-xs sm:text-sm text-[#8FA3B8] leading-relaxed max-w-lg">
                  {isBn
                    ? 'স্বল্প সেচে উৎপাদিত সরিষা ও মসুর ডাল মাটির গভীর থেকে রস টানে এবং অতিরিক্ত ডিজেল পাম্পিং খরচ সাশ্রয় করে।'
                    : 'Mustard and lentil require only 1–2 light irrigations, saving up to ৳16,000 per acre in pumping bills compared to Boro rice.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CHAPTER 04 — PLAN THE ROTATION */}
        <div className="py-16 border-t border-white/10 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0B1626] min-h-[360px] flex flex-col justify-end p-6 sm:p-8">
              <img
                src={IMAGES.seasonalMonsoon}
                alt="Bangladesh riverine monsoon countryside"
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 scrim-editorial-card" />
              <div className="relative z-10">
                <span className="text-xs uppercase font-mono text-[#00E5FF] font-bold block mb-1">
                  Annual Cycle Strategy
                </span>
                <h4 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                  Rabi → Kharif-1 → Kharif-2
                </h4>
                <p className="text-xs sm:text-sm text-[#8FA3B8] leading-relaxed max-w-lg">
                  {isBn
                    ? 'রবি মৌসুমে সরিষা, খরিফ-১ এ মুগ ডাল এবং খরিফ-২ এ রোপা আমন ধান—মাটি ও পানির সর্বোত্তম ব্যবহার।'
                    : 'Mustard in Rabi, green-manure Mungbean in Kharif-1, and rainfed T. Aman rice in Kharif-2 preserves aquifers and restores soil nitrogen.'}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4 order-1 lg:order-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00E5FF] uppercase">
              <span>04</span>
              <span aria-hidden="true">·</span>
              <span>PLAN THE ROTATION</span>
            </div>
            <h3 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
              {isBn ? 'একটি ফসল সিদ্ধান্তকে মৌসুমি কৌশলে রূপান্তর করুন।' : 'Turn one crop decision into a seasonal strategy.'}
            </h3>
            <p className="text-sm sm:text-base text-[#8FA3B8] leading-relaxed">
              {isBn
                ? 'একক ফসল মাটির পুষ্টি শেষ করে। এগ্রিঅরবিট তিন মৌসুমের ধারাবাহিক পরিকল্পনা তৈরি করে যাতে প্রতিটি ফসল পরের মৌসুমের জন্য জমি প্রস্তুত রাখে।'
                : 'Monoculture depletes soil nutrients. AgriOrbit arranges a 3-season cycle so each harvest naturally enriches the ground for what comes next.'}
            </p>
            <div className="pt-2">
              <a
                href="#rotation"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#00E5FF] hover:underline uppercase font-mono"
              >
                <span>{isBn ? 'শস্য পর্যায় বিস্তারিত জানুন' : 'Learn about the 3-season rotation'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
