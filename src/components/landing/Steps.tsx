import { useLang } from '../../lang.tsx';
import { IMAGES } from '../../data/assets.ts';
import { HeroMap } from '../HeroMap.tsx';
import { CROPS } from '../../data/crops.ts';

export function Steps() {
  const { lang } = useLang();
  const isBn = lang === 'bn';
  const cropCount = CROPS.filter(c => c.recommendable).length;

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
                ? 'বাংলাদেশের ৬৪টি জেলার মাটির বৈশিষ্ট্য ও ভূগর্ভস্থ পানির অবস্থা আলাদা। এগ্রিঅরবিট আপনার জমি চিহ্নিত করে পারিপার্শ্বিক ৫ কিমি এলাকা প্রাসঙ্গিক হিসেবে দেখায়; স্যাটেলাইট তথ্য বৃহত্তর গ্রিডজুড়ে গড় করা হয়।'
                : 'Across Bangladesh’s 64 districts, soil permeability and groundwater response differ dramatically. AgriOrbit pins your field and shows a 5 km area for context. Satellite data is averaged over a larger grid.'}
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0B1626] shadow-2xl relative">
              <HeroMap>
                <div className="absolute top-4 left-4 z-10 bg-[#050B14]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-mono text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#B8FF3D] animate-pulse" />
                  <span>25.75° N, 89.25° E · Rangpur</span>
                </div>
                <div className="absolute bottom-4 right-4 z-10 bg-[#050B14]/90 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-[11px] font-mono text-[#8FA3B8]">
                  5 km Context Area
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
                  {isBn ? 'দুই দশকের পরিমাপকৃত জলবায়ু পরিবর্তন' : 'Two Decades of Measured Climate Shift'}
                </h4>
                <p className="text-xs sm:text-sm text-[#8FA3B8] leading-relaxed max-w-lg">
                  {isBn
                    ? 'বৃষ্টির সময় পরিবর্তিত হয়েছে: খরিফ-১ মৌসুমে বৃষ্টিপাত ৩৫% থেকে বেড়ে ৪২% হয়েছে এবং খরিফ-২ এ ৬৪% থেকে কমে ৫৭% হয়েছে, আর রবি মৌসুম ০.৬°সে বেশি উষ্ণ হয়েছে।'
                    : 'Rain timing moved: Kharif-1 now receives 42% of the year’s rain (up from 35%), Kharif-2 decreased from 64% to 57%, and Rabi winters warmed by +0.6°C.'}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4 order-1 lg:order-2">
            <a href="#field-shift" className="group block space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00E5FF] uppercase">
                <span>02</span>
                <span aria-hidden="true">·</span>
                <span>UNDERSTAND THE SHIFT</span>
              </div>
              <h3 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight group-hover:text-[#00E5FF] transition-colors">
                {isBn ? 'আপনার এলাকার পরিবেশ কীভাবে বদলেছে বুঝুন।' : 'Understand how the conditions around your field are changing.'}
              </h3>
            </a>
            <p className="text-sm sm:text-base text-[#8FA3B8] leading-relaxed">
              {isBn
                ? 'নাসা পাওয়ার-এর দুই দশকের তথ্য পর্যালোচনা করলে দেখা যায় জেলাভেদে মৌসুমভিত্তিক বৃষ্টিপাতের সময় ও তাপমাত্রায় সুনির্দিষ্ট পরিবর্তন এসেছে।'
                : 'NASA POWER historical observations show how seasonal rain timing and temperatures have drifted across districts over the past two decades. Rather than uniform warming, rain distribution has shifted between seasons.'}
            </p>
          </div>
        </div>

        {/* CHAPTER 03 — CHOOSE THE CROP */}
        <div className="py-16 border-t border-white/10 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <a href="#crops" className="group block space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B8FF3D] uppercase">
                <span>03</span>
                <span aria-hidden="true">·</span>
                <span>CHOOSE THE CROP</span>
              </div>
              <h3 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight group-hover:text-[#B8FF3D] transition-colors">
                {isBn ? 'বর্তমান অবস্থার সাথে ফসলের চাহিদা মেলান।' : 'Match current conditions with crop needs.'}
              </h3>
            </a>
            <p className="text-sm sm:text-base text-[#8FA3B8] leading-relaxed">
              {isBn
                ? `মাটির আর্দ্রতা কম থাকলে বেশি পানির ফসলে সেচের খরচ বেড়ে যায়। এগ্রিঅরবিট বারি ও ব্রি নির্দেশিকা অনুযায়ী ${cropCount}টি যাচাইকৃত ফসলের উপযুক্ততা মূল্যায়ন করে।`
                : `When surface soil moisture is low, high-water crops face heavy irrigation costs. AgriOrbit ranks ${cropCount} verified crops using BARI & BRRI agronomic rules.`}
            </p>
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
                {/* TODO: source needed - original text claimed "saving up to ৳16,000 per acre" */}
                <p className="text-xs sm:text-sm text-[#8FA3B8] leading-relaxed max-w-lg">
                  {isBn
                    ? 'সরিষা ও মসুর ডালে সীমিত সেচ প্রয়োজন হওয়ায় বোরো ধানের তুলনায় ডিজেল পাম্পিং খরচ উল্লেখযোগ্যভাবে কমে আসে।'
                    : 'Mustard and lentil require fewer irrigations, substantially reducing diesel pumping expenses compared to high-water Boro rice.'}
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
                  {isBn ? 'ধারাবাহিক শস্যচক্র' : 'Continuous Crop Stewardship'}
                </span>
                <h4 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                  {isBn ? 'মাটির স্বাস্থ্য ও পানি সুরক্ষা' : 'Restoring Soil & Aquifers Year-Round'}
                </h4>
                <p className="text-xs sm:text-sm text-[#8FA3B8] leading-relaxed max-w-lg">
                  {isBn
                    ? 'এক মৌসুমের ফসল পরের মৌসুমের মাটিকে সমৃদ্ধ করে। নিচে আমাদের ইন্টারেক্টিভ শস্য পর্যায় দেখুন।'
                    : 'Each harvest leaves the soil replenished for the next season. Explore the full 3-season rotation below.'}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4 order-1 lg:order-2">
            <a href="#rotation" className="group block space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00E5FF] uppercase">
                <span>04</span>
                <span aria-hidden="true">·</span>
                <span>PLAN THE ROTATION</span>
              </div>
              <h3 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight group-hover:text-[#00E5FF] transition-colors">
                {isBn ? 'একটি ফসল সিদ্ধান্তকে মৌসুমি কৌশলে রূপান্তর করুন।' : 'Turn one crop decision into a seasonal strategy.'}
              </h3>
            </a>
            <p className="text-sm sm:text-base text-[#8FA3B8] leading-relaxed">
              {isBn
                ? 'একক ফসল মাটির পুষ্টি শেষ করে। এগ্রিঅরবিট তিন মৌসুমের ধারাবাহিক পরিকল্পনা তৈরি করে যাতে প্রতিটি ফসল পরের মৌসুমের জন্য জমি প্রস্তুত রাখে।'
                : 'Monoculture depletes soil nutrients. AgriOrbit arranges a 3-season cycle so each harvest naturally enriches the ground for what comes next.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
