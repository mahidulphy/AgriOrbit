import React from 'react';
import { Shield, Lock, Eye, Database, Globe, UserCheck, AlertCircle } from 'lucide-react';
import { LegalLayout } from './LegalLayout';
import { useLang } from '../../lang';

export const PrivacyPolicyPage: React.FC = () => {
  const { lang } = useLang();
  const isBn = lang === 'bn';

  return (
    <LegalLayout
      activeDoc="privacy"
      titleEn="Privacy Policy"
      titleBn="গোপনীয়তা নীতি"
      subtitleEn="How AgriOrbit collects, uses, and safeguards farmer, field, and environmental observation data."
      subtitleBn="এগ্রিঅরবিট কীভাবে কৃষক, খামার ও পরিবেশ পর্যবেক্ষণ তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত রাখে।"
      lastUpdated={isBn ? 'সর্বশেষ আপডেট: অক্টোবর ২০২৬' : 'Last Updated: October 2026'}
    >
      {/* 1. Introduction */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-base font-bold text-white">
          <Shield className="w-4 h-4 text-[#00E5FF]" />
          <h2>{isBn ? '১. পরিচিতি ও উদ্দেশ্য' : '1. Overview & Commitment'}</h2>
        </div>
        <p>
          {isBn
            ? 'এগ্রিঅরবিট (AgriOrbit) একটি মুক্ত ও স্বাধীন কৃষি সিদ্ধান্ত-সহায়তা প্ল্যাটফর্ম, যা নাসা স্পেস অ্যাপস চ্যালেঞ্জ ২০২৬-এর জন্য টিম "বে অব অরবিটস" (Team Bay of Orbits) দ্বারা উদ্ভাবিত। আমাদের মূল লক্ষ্য হলো বাংলাদেশের কৃষকদের নাসা আর্থ অবজারভেশন এবং স্থানীয় কৃষি তথ্যের সমন্বয়ে নির্ভরযোগ্য ফসল আবর্তন পরিকল্পনা প্রদান করা।'
            : 'AgriOrbit is an independent agricultural decision-support platform created by Team Bay of Orbits for the NASA Space Apps Challenge 2026. Our mission is to empower Bangladeshi farmers by synthesizing NASA Earth observations, local agronomic research, and farmer priorities to plan resilient 3-season crop rotations.'}
        </p>
        <p>
          {isBn
            ? 'আমরা ব্যবহারকারীর ব্যক্তিগত তথ্যের সর্বোচ্চ গোপনীয়তা ও নিরাপত্তায় অঙ্গীকারাবদ্ধ। আমরা কখনো বাণিজ্যিক উদ্দেশ্যে বা বিজ্ঞাপনের জন্য ব্যবহারকারীর ব্যক্তিগত তথ্য বিক্রয় বা অপব্যবহার করি না।'
            : 'We respect your privacy and are committed to protecting any personal and farm information you share with us. We do not sell personal data, nor do we use farmer information for third-party advertising.'}
        </p>
      </section>

      {/* 2. Information We Collect */}
      <section className="space-y-3 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 text-base font-bold text-white">
          <Database className="w-4 h-4 text-[#B8FF3D]" />
          <h2>{isBn ? '২. আমরা যেসব তথ্য সংগ্রহ করি' : '2. Information We Collect'}</h2>
        </div>
        
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <h3 className="font-bold text-white text-xs font-mono uppercase mb-1">
              {isBn ? 'ক. অ্যাকাউন্ট ও পরিচয় সংক্রান্ত তথ্য' : 'A. Account & Identification Information'}
            </h3>
            <p className="text-xs text-slate-300">
              {isBn
                ? 'যখন আপনি গুগল সাইন-ইন বা ইমেইলের মাধ্যমে একাউন্ট তৈরি করেন, আমরা আপনার নাম, ইমেইল ঠিকানা এবং প্রোফাইল ছবি গ্রহণ করি। এছাড়া কৃষকের যোগাযোগের জন্য ঐচ্ছিক মোবাইল নম্বর সংরক্ষিত হতে পারে।'
                : 'When you sign in using Google OAuth or create an email account, we collect your display name, email address, profile avatar, and optional contact phone number.'}
            </p>
            <p className="text-xs text-[#00E5FF] mt-2 font-mono">
              {isBn
                ? 'আপনার ইমেইল কেবলমাত্র আবহাওয়া ও মাঠ সতর্কতার জন্য ব্যবহৃত হয় এবং প্রোফাইল সেটিংস থেকে যেকোনো সময় এটি বন্ধ করা যায়।'
                : 'Your email is used only for field alerts and can be turned off anytime in your profile settings.'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <h3 className="font-bold text-white text-xs font-mono uppercase mb-1">
              {isBn ? 'খ. খামার ও কৃষি প্রোফাইল তথ্য' : 'B. Field & Agronomic Specifications'}
            </h3>
            <p className="text-xs text-slate-300">
              {isBn
                ? 'আপনার খামারের অবস্থান (জেলা, উপজেলা, গ্রাম), জমির আকার, জমির উচ্চতা, মাটির ধরন, প্রধান সেচ সুবিধা, অতীতে চাষকৃত ফসলের তালিকা এবং অতীতের প্রাকৃতিক দুর্যোগজনিত ক্ষতির বিবরণ।'
                : 'Geographic location (district, upazila, village), land size and elevation, soil classification, primary irrigation source, historically cultivated crops, and past natural disaster loss experiences.'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <h3 className="font-bold text-white text-xs font-mono uppercase mb-1">
              {isBn ? 'গ. স্যাটেলাইট পর্যবেক্ষণ ও কৃত্রিম দৃশ্যকল্প প্যারামিটার' : 'C. Environmental Simulation Parameters'}
            </h3>
            <p className="text-xs text-slate-300">
              {isBn
                ? 'কৃষক যখন "What-If" এনভায়রনমেন্টাল সিমুলেটরে তাপমাত্রা, বৃষ্টিপাত বা মাটির আর্দ্রতার মান পরিবর্তন করেন, সেই প্যারামিটারগুলো সাময়িকভাবে রিয়েল-টাইম হিসাবের জন্য ব্রাউজারে ব্যবহৃত হয়।'
                : 'Any hypothetical overrides you apply in the Environmental Simulator (e.g. rainfall deficits, temperature shifts) are computed locally to evaluate crop scoring sensitivity.'}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Google API User Data Policy Compliance */}
      <section className="space-y-3 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 text-base font-bold text-white">
          <Lock className="w-4 h-4 text-[#00E5FF]" />
          <h2>{isBn ? '৩. গুগল ইউজার ডেটা ও নিরাপত্তা মানদণ্ড' : '3. Google User Data Policy Compliance'}</h2>
        </div>
        <p>
          {isBn
            ? 'এগ্রিঅরবিটের গুগল সাইন-ইন ও গুগল এপিআই ব্যবহার সম্পূর্ণরূপে "Google API Services User Data Policy" (Limited Use requirements সহ) মেনে চলে:'
            : 'AgriOrbit’s use of information received from Google APIs adheres strictly to the Google API Services User Data Policy, including the Limited Use requirements:'}
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
          <li>
            {isBn
              ? 'আমরা গুগল অ্যাকাউন্ট থেকে কেবলমাত্র মৌলিক পরিচয় (ইমেইল ও নাম) গ্রহণ করি যাতে কৃষক নিরাপদে লগইন করতে পারেন।'
              : 'We only access basic profile data (name, email address, profile picture) strictly to authenticate farmer accounts.'}
          </li>
          <li>
            {isBn
              ? 'গুগল ব্যবহারকারীর কোনো ডেটা কখনো বিজ্ঞাপন সংস্থা বা কৃত্রিম বুদ্ধিমত্তা মডেল প্রশিক্ষণে বাণিজ্যিক উদ্দেশ্যে শেয়ার করা হয় না।'
              : 'Google user data is never transferred to data brokers or used to serve targeted advertisements.'}
          </li>
          <li>
            {isBn
              ? 'কৃষক যেকোনো সময় একাউন্ট থেকে সাইন-আউট করতে পারেন বা ব্রাউজারের ডেটা মুছে ফেলতে পারেন।'
              : 'Farmers can revoke access, sign out, or delete their profile data at any time.'}
          </li>
        </ul>
      </section>

      {/* 4. How We Use and Share Information */}
      <section className="space-y-3 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 text-base font-bold text-white">
          <Eye className="w-4 h-4 text-[#B8FF3D]" />
          <h2>{isBn ? '৪. তথ্যের ব্যবহার ও বাহ্যিক সেবা' : '4. How Data Is Processed & Shared'}</h2>
        </div>
        <p>
          {isBn
            ? 'আপনার তথ্য কেবলমাত্র নিম্নোক্ত প্রয়োজনীয় উদ্দেশ্যে ব্যবহৃত হয়:'
            : 'Your data is solely processed for the following functional purposes:'}
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <strong className="text-white block mb-1">
              {isBn ? '১. নাসা আর্থ অবজারভেশন পর্যবেক্ষণ' : '1. NASA Telemetry Fetching'}
            </strong>
            <p className="text-slate-400">
              {isBn
                ? 'নাসা পাওয়ার (POWER) এপিআইতে কেবল আপনার নির্বাচিত এলাকার অক্ষাংশ ও দ্রাঘিমাংশ পাঠানো হয়। কোনো ব্যক্তিগত তথ্য নাসায় পাঠানো হয় না।'
                : 'Only geographic coordinates (latitude and longitude) are queried against NASA POWER APIs. No personally identifiable information is transmitted to NASA.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <strong className="text-white block mb-1">
              {isBn ? '২. ৩-মৌসুমী বৈজ্ঞানিক ফসল সুপারিশ' : '2. Explainable Crop Recommendations'}
            </strong>
            <p className="text-slate-400">
              {isBn
                ? 'আপনার মাটির ধরন ও অতীত ফসলের তথ্যের ওপর ভিত্তি করে বিএআরআই ও বিআরআরআই নির্দেশিকা অনুযায়ী নাইট্রোজেন ভারসাম্য রক্ষা করা হয়।'
                : 'Crop rotation algorithms cross-reference your soil type and previous crops to prevent consecutive monoculture and replenish soil nutrients.'}
            </p>
          </div>
        </div>
      </section>

      {/* 5. Data Storage and Retention */}
      <section className="space-y-3 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 text-base font-bold text-white">
          <UserCheck className="w-4 h-4 text-purple-400" />
          <h2>{isBn ? '৫. সংরক্ষণ ও কৃষকের নিয়ন্ত্রণ অধিকার' : '5. Storage & Farmer Rights'}</h2>
        </div>
        <p>
          {isBn
            ? 'আমাদের সিস্টেমে আপনার তথ্যের ওপর আপনার পূর্ণ নিয়ন্ত্রণ রয়েছে:'
            : 'You retain full ownership and control over your information:'}
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
          <li>
            <strong>{isBn ? 'সংশোধন ও হালনাগাদ:' : 'Modification:'}</strong>{' '}
            {isBn
              ? 'আপনি যেকোনো সময় ন্যাভবারের "কৃষক প্রোফাইল" বাটনে ক্লিক করে নাম, জেলা ও অতীত ফসলের বিবরণ পরিবর্তন করতে পারেন।'
              : 'You can update your land details, previous crops, and contact information at any time via the Farmer Profile modal.'}
          </li>
          <li>
            <strong>{isBn ? 'অফলাইন ও লোকাল সংরক্ষণ:' : 'Offline & Local Resilience:'}</strong>{' '}
            {isBn
              ? 'কৃষকের সুবিধার্থে তথ্য ব্রাউজারের লোকাল স্টোরেজে জমা থাকে, যাতে ইন্টারনেট দুর্বল হলেও জমি যাচাইয়ের কাজ চালানো যায়।'
              : 'Data is securely cached in local browser storage so that farmers can review advisories even in low-connectivity rural fields.'}
          </li>
          <li>
            <strong>{isBn ? 'মুছে ফেলা:' : 'Deletion:'}</strong>{' '}
            {isBn
              ? 'আপনি ব্রাউজার ক্যাশ মুছে দিয়ে অথবা সাইন আউট করে সব স্থানীয় ডেটা এক ক্লিকে মুছে ফেলতে পারেন।'
              : 'You can clear all local profile data by signing out or resetting your browser storage.'}
          </li>
        </ul>
      </section>

      {/* 6. Contact Information */}
      <section className="p-4 rounded-2xl bg-[#050B14] border border-[#00E5FF]/20 space-y-2 text-xs">
        <strong className="text-[#00E5FF] font-mono uppercase block">
          {isBn ? 'যোগাযোগ ও প্রশ্ন' : 'Contact & Privacy Inquiries'}
        </strong>
        <p className="text-slate-300">
          {isBn
            ? 'এই গোপনীয়তা নীতি সম্পর্কে যেকোনো প্রশ্ন থাকলে যোগাযোগ করুন: team@agriorbit.space অথবা আমাদের গিটহাব রিপোজিটরিতে ইস্যু তৈরি করুন।'
            : 'If you have any questions or requests regarding this Privacy Policy, please contact Team Bay of Orbits at team@agriorbit.space or open an issue on our GitHub repository.'}
        </p>
      </section>
    </LegalLayout>
  );
};
