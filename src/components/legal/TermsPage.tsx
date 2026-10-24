import React from 'react';
import { FileText, AlertTriangle, ShieldCheck, Scale, CheckCircle2, Info } from 'lucide-react';
import { LegalLayout } from './LegalLayout';
import { useLang } from '../../lang';

export const TermsPage: React.FC = () => {
  const { lang } = useLang();
  const isBn = lang === 'bn';

  return (
    <LegalLayout
      activeDoc="terms"
      titleEn="Terms & Conditions"
      titleBn="শর্তাবলী ও ব্যবহারবিধি"
      subtitleEn="Terms of service, scientific provenance, and agronomic decision-support disclaimers for AgriOrbit."
      subtitleBn="এগ্রিঅরবিটের ব্যবহারের নিয়মাবলী, বৈজ্ঞানিক তথ্যের উৎস এবং কৃষি সিদ্ধান্ত-সহায়তা সংক্রান্ত সুস্পষ্ট ঘোষণা।"
      lastUpdated={isBn ? 'সর্বশেষ আপডেট: অক্টোবর ২০২৬' : 'Last Updated: October 2026'}
    >
      {/* 1. Acceptance of Terms */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-base font-bold text-white">
          <Scale className="w-4 h-4 text-[#22C55E]" />
          <h2>{isBn ? '১. শর্তাবলীর গ্রহণযোগ্যতা' : '1. Acceptance of Terms'}</h2>
        </div>
        <p>
          {isBn
            ? 'এগ্রিঅরবিট (AgriOrbit) ওয়েবসাইট (agri-orbit.vercel.app) বা অ্যাপ্লিকেশন ব্যবহারের মাধ্যমে আপনি এই শর্তাবলী ও নিয়মনীতির সাথে সম্পূর্ণরূপে একমত প্রকাশ করছেন। আপনি যদি এই শর্তাবলীর কোনো অংশে একমত না হন, তবে অনুগ্রহ করে প্ল্যাটফর্মটি ব্যবহার করা থেকে বিরত থাকুন।'
            : 'By accessing, browsing, or using AgriOrbit (hosted at agri-orbit.vercel.app), you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions. If you do not agree to these terms, please discontinue using the service.'}
        </p>
      </section>

      {/* 2. Platform Nature & Agricultural Disclaimer */}
      <section className="space-y-4 pt-4 border-t border-[#262626]">
        <div className="flex items-center gap-2 text-base font-bold text-white">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h2>{isBn ? '২. কৃষি সিদ্ধান্ত-সহায়তা ও সতর্কবার্তা (গুরুত্বপূর্ণ)' : '2. Agronomic Decision-Support Disclaimer (Important)'}</h2>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-100 text-xs space-y-2">
          <div className="flex items-center gap-2 font-mono font-bold text-amber-300 uppercase">
            <Info className="w-4 h-4 text-amber-400" />
            <span>{isBn ? 'পরামর্শমূলক চরিত্র — ফলনের নিশ্চয়তা নয়' : 'Advisory Nature — No Harvest Guarantee'}</span>
          </div>
          <p>
            {isBn
              ? 'এগ্রিঅরবিট কোনো আর্থিক নিশ্চয়তা বা ফসল বীমা প্রদানকারী প্রতিষ্ঠান নয়। আমাদের প্রস্তাবনাগুলো ঐতিহাসিক স্যাটেলাইট আবহাওয়া তথ্য, ৩০ বছরের জলবায়ু স্থানান্তর এবং বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউট (BARI) ও বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (BRRI)-এর কৃষি নির্দেশিকার ওপর ভিত্তি করে তৈরি।'
              : 'AgriOrbit is a decision-support and planning platform, not an agricultural insurance provider or commercial warranty. Recommendations are generated from historical NASA Earth observations, 30-year climate shift baselines, and established agronomic rules from BARI and BRRI.'}
          </p>
          <p>
            {isBn
              ? 'প্রকৃত ফসল উৎপাদন সবসময় অনির্দিষ্ট চরম আবহাওয়া, আকস্মিক শিলাবৃষ্টি বা সাইক্লোন, বীজের গুণমান, স্থানীয় সেচ প্রাচুর্য এবং সঠিক সার প্রয়োগের ওপর নির্ভর করে। কৃষককে তার নিজস্ব অভিজ্ঞতা ও মাঠের বাস্তবিক অবস্থা বিবেচনা করে চূড়ান্ত সিদ্ধান্ত গ্রহণের অনুরোধ করা হয়।'
              : 'Actual crop performance depends on unpredictable microclimates, flash floods, localized pest outbreaks, seed vitality, and on-the-ground soil management. Farmers are strongly encouraged to combine AgriOrbit advisories with their practical wisdom and local agricultural extension guidance.'}
          </p>
        </div>
      </section>

      {/* 3. NASA Data Provenance & Attribution */}
      <section className="space-y-3 pt-4 border-t border-[#262626]">
        <div className="flex items-center gap-2 text-base font-bold text-white">
          <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
          <h2>{isBn ? '৩. নাসা ডেটা ও অনুমোদন সংক্রান্ত স্পষ্টীকরণ' : '3. NASA Earth Observations & Endorsement Notice'}</h2>
        </div>
        <p>
          {isBn
            ? 'এগ্রিঅরবিট নাসা পাওয়ার (NASA POWER), এসএমএপি (SMAP) এবং মডিস (MODIS)-এর উন্মুক্ত বৈজ্ঞানিক আর্থ অবজারভেশন ডেটাসেট ব্যবহার করে। তবে:'
            : 'AgriOrbit relies on publicly accessible scientific datasets provided by NASA Earth science programs (including NASA POWER, SMAP soil moisture, and MODIS):'}
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#A3A3A3]">
          <li>
            {isBn
              ? 'নাসা কেবল উন্মুক্ত বৈজ্ঞানিক উপগ্রহ ডেটা সরবরাহ করে। নাসা কোনো নির্দিষ্ট ফসল, সার বা ব্র্যান্ড সুপারিশ বা অনুমোদন করে না।'
              : 'NASA provides open scientific Earth observation telemetry. NASA does not sponsor, endorse, or recommend any specific commercial crop varieties or farming practices.'}
          </li>
          <li>
            {isBn
              ? 'উপগ্রহ ডেটা প্রক্রিয়াজাতকরণ এবং বাংলাদেশে প্রয়োগের দায়িত্ব টিম "বে অব অরবিটস"-এর উদ্ভাবিত অ্যালগরিদমের।'
              : 'The aggregation, rule-based suitability scoring, and Bangladesh-specific rotational modeling are solely engineered by Team Bay of Orbits.'}
          </li>
        </ul>
      </section>

      {/* 4. User Accounts and Fair Use */}
      <section className="space-y-3 pt-4 border-t border-[#262626]">
        <div className="flex items-center gap-2 text-base font-bold text-white">
          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          <h2>{isBn ? '৪. কৃষকের অ্যাকাউন্টের দায়িত্বশীল ব্যবহার' : '4. User Accounts & Responsibilities'}</h2>
        </div>
        <p>
          {isBn
            ? 'প্ল্যাটফর্মটি ব্যবহারের সময় আপনি সম্মত হচ্ছেন যে:'
            : 'When using AgriOrbit, you agree to the following responsibilities:'}
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#262626]">
            <strong className="text-white block mb-1">
              {isBn ? 'সঠিক খামার তথ্য প্রদান' : 'Accurate Field Information'}
            </strong>
            <p className="text-[#737373]">
              {isBn
                ? 'সঠিক জেলা, মাটির ধরন ও অতীত ফসল নির্বাচন করুন যাতে অ্যালগরিদম বাস্তবসম্মত সুপারিশ দিতে পারে।'
                : 'Provide truthful geographic and field characteristics to ensure accurate mathematical rotation modeling.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#262626]">
            <strong className="text-white block mb-1">
              {isBn ? 'অ্যাকাউন্টের গোপনীয়তা' : 'Account Security'}
            </strong>
            <p className="text-[#737373]">
              {isBn
                ? 'আপনার গুগল অ্যাকাউন্ট বা লগইন ক্রেডেনশিয়াল সুরক্ষিত রাখা আপনার দায়িত্ব।'
                : 'You are responsible for keeping your credentials and connected Google authentication secure.'}
            </p>
          </div>
        </div>
      </section>

      {/* 5. Intellectual Property & Open Source */}
      <section className="space-y-3 pt-4 border-t border-[#262626]">
        <div className="flex items-center gap-2 text-base font-bold text-white">
          <FileText className="w-4 h-4 text-purple-400" />
          <h2>{isBn ? '৫. মেধাস্বত্ব ও ওপেন সায়েন্স' : '5. Intellectual Property & Open Science'}</h2>
        </div>
        <p>
          {isBn
            ? 'এগ্রিঅরবিটের ব্র্যান্ডিং, ডিজাইন এবং বৈজ্ঞানিক কোডবেস টিম "বে অব অরবিটস"-এর মেধাস্বত্ব। নাসা স্পেস অ্যাপস চ্যালেঞ্জের চেতনা অনুযায়ী আমাদের অ্যালগরিদমের পদ্ধতিসমূহ স্বচ্ছ ("Explain Why") এবং কৃষকের কাছে জবাবদিহিমূলক।'
            : 'The AgriOrbit code, interface design, and algorithmic architecture were created by Team Bay of Orbits for the NASA Space Apps Challenge. In the spirit of open science, our decision-making logic remains transparent and explainable to farmers.'}
        </p>
      </section>

      {/* 6. Limitation of Liability */}
      <section className="space-y-3 pt-4 border-t border-[#262626]">
        <div className="flex items-center gap-2 text-base font-bold text-white">
          <Scale className="w-4 h-4 text-[#737373]" />
          <h2>{isBn ? '৬. দায়বদ্ধতার সীমাবদ্ধতা' : '6. Limitation of Liability'}</h2>
        </div>
        <p className="text-xs text-[#737373]">
          {isBn
            ? 'আইনের অনুমোদিত সর্বোচ্চ সীমা পর্যন্ত, এগ্রিঅরবিট, এর ডেভেলপার বা টিম সদস্যরা কোনো প্রকার অপ্রত্যাশিত প্রাকৃতিক দুর্যোগ, ফসলের ক্ষতি, সেচ ব্যর্থতা বা আর্থিক ক্ষতির জন্য প্রত্যক্ষ বা পরোক্ষভাবে দায়ী থাকবে না। প্ল্যাটফর্মটি "যেমন আছে" (AS IS) ভিত্তিতে ব্যবহারের জন্য উন্মুক্ত।'
            : 'To the fullest extent permitted by applicable law, AgriOrbit, Team Bay of Orbits, and its contributors shall not be held liable for any direct, indirect, incidental, or consequential crop loss, financial deficits, or farming disruptions resulting from platform advisories or third-party satellite data latency. The service is provided on an "AS IS" and "AS AVAILABLE" basis.'}
        </p>
      </section>

      {/* 7. Contact */}
      <section className="p-4 rounded-xl bg-[#0A0A0A] border border-[#262626] space-y-2 text-xs">
        <strong className="text-[#22C55E] font-mono uppercase block">
          {isBn ? 'আইনগত যোগাযোগ' : 'Legal Contact'}
        </strong>
        <p className="text-[#A3A3A3]">
          {isBn
            ? 'ব্যবহারের নিয়মাবলী সংক্রান্ত অনুসন্ধানের জন্য আমাদের সাথে যোগাযোগ করুন: legal@agriorbit.space অথবা team@agriorbit.space।'
            : 'For legal or terms inquiries, contact Team Bay of Orbits at legal@agriorbit.space or team@agriorbit.space.'}
        </p>
      </section>
    </LegalLayout>
  );
};
