// Every piece of user-facing text, in English and Bangla, in ONE place.
// To change wording, edit here only. Bangla drafted by the dev team —
// please have a native speaker on the team review before the final demo.

import type { SeasonId } from './lib/fieldShift.ts';

const en = {
  nav: {
    fieldShift: 'Field Shift',
    crops: 'Crop Atlas',
    how: 'How it works',
    data: 'Data',
    rotation: 'Rotation',
    analyze: 'Analyze my field',
  },
  season: { rabi: 'Rabi', kharif1: 'Kharif-1', kharif2: 'Kharif-2' } as Record<SeasonId, string>,
  seasonMonths: { rabi: 'Nov – Feb', kharif1: 'Mar – Jun', kharif2: 'Jul – Oct' } as Record<SeasonId, string>,
  seasonHint: { rabi: 'dry winter', kharif1: 'hot pre-monsoon', kharif2: 'monsoon' } as Record<SeasonId, string>,

  hero: {
    badge: 'NASA Earth Observations × Bangladesh Agriculture',
    eyebrow: 'NASA EARTH OBSERVATIONS × BANGLADESH AGRICULTURE',
    title1: 'Know your field.',
    title2: 'Plan what comes next.',
    sub: 'AgriOrbit combines Earth observations, local agricultural information and farmer priorities to help plan better crop decisions for a changing climate.',
    cta: 'Analyze My Field',
    cta2: 'Explore How It Works',
    trust: ['Rule-based, no black box', 'Works offline', 'English & বাংলা'],
  },
  heroCard: {
    place: 'Rangpur',
    now: 'last 30 days',
    rain: 'Rainfall',
    heat: 'Hottest day',
    humidity: 'Humidity',
    et0: 'Crop water need',
    shift: (a: string, b: string) => `Field Shift · ${a} vs ${b}`,
    warmer: 'warmer',
    cooler: 'cooler',
    source: (date: string) => `NASA POWER · observed to ${date}`,
  },
  steps: [
    { k: 'Orbit', t: 'Satellites observe', d: 'NASA POWER, SMAP and MODIS measure rain, heat, soil moisture and crop health from space.' },
    { k: 'Region', t: 'We zoom to your district', d: 'Any of Bangladesh’s 64 districts, compared with its own climate history.' },
    { k: 'Field', t: 'You get a field plan', d: 'A 3-season rotation, risk alerts and one plain sentence of advice.' },
  ],

  fs: {
    eyebrow: 'The Field Shift',
    title: 'Your climate has already moved.',
    sub: (a: string, b: string) =>
      `Old planting calendars were made for a climate that has changed. Here is how Rangpur's seasons changed between ${a} and ${b}, measured by NASA.`,
    temp: 'Average temperature',
    heat: 'Average daily high',
    share: 'Share of the year’s rain',
    then: 'then',
    now: 'now',
    rainBarTitle: 'When does the rain fall?',
    headlineWarm: (s: string, d: string) => `${s} is now ${d}°C warmer`,
    headlineCool: (s: string, d: string) => `${s} is now ${d}°C cooler`,
    headlineRain: (s: string, now: string, then: string) => `${s} now gets ${now}% of the year’s rain (was ${then}%)`,
    noteTitle: 'Why start in 2001?',
    note: 'NASA POWER rainfall for Bangladesh has processing breaks in 1997 and 2016. So we compare from 2001 and look at when rain falls, not the totals. We would rather show honest data than dramatic data.',
    cta: 'See it for your district',
  },

  why: {
    eyebrow: 'Why AgriOrbit',
    title: 'Satellites observe. Rules explain. You decide.',
    cards: [
      { n: '01', t: 'NASA observes', d: 'Rain, temperature, humidity, soil moisture and vegetation health for your area, from free NASA data.' },
      { n: '02', t: 'AgriOrbit explains', d: 'Every score comes from a written rule you can read. No machine learning, no black box. For example:' },
      { n: '03', t: 'The farmer decides', d: 'We show options and reasons, not orders. Your knowledge of your own land has the final say.' },
    ],
    exampleLabel: 'Example rule',
    example: 'Rain 30d = 38 mm < 50  and  soil = 0.14 < 0.15\n→ high-water crops  −15',
  },

  data: {
    eyebrow: 'Data sources',
    title: 'Every number has a source.',
    sub: 'We only list sources we actually use. NASA data is observed and runs 2–3 days behind, so a separate forecast looks ahead.',
    live: 'Live',
    snapshot: 'Snapshot',
    guidance: 'Guidance',
    items: [
      { name: 'NASA POWER · daily', what: 'Rain, temperature, humidity', how: 'Also used to estimate crop water need (ET₀, Hargreaves method).', status: 'live' },
      { name: 'NASA POWER · monthly', what: 'Climate history, 2001 → today', how: 'Powers the Field Shift comparison.', status: 'live' },
      { name: 'NASA SMAP', what: 'Soil moisture (m³/m³)', how: 'A snapshot per district, refreshed before the demo.', status: 'snapshot' },
      { name: 'NASA MODIS', what: 'Vegetation (NDVI) and land temperature', how: 'A snapshot per district, refreshed before the demo.', status: 'snapshot' },
      { name: 'Open-Meteo', what: '7-day weather forecast', how: 'Not NASA, credited separately. Fills the 2–3 day gap and looks ahead.', status: 'live' },
      { name: 'BARI guidelines', what: 'Crop rules for Bangladesh', how: 'Published crop guidance from the Bangladesh Agricultural Research Institute (no partnership).', status: 'guidance' },
    ] as { name: string; what: string; how: string; status: 'live' | 'snapshot' | 'guidance' }[],
  },

  rot: {
    eyebrow: '3-season rotation',
    title: 'One field. Three seasons. A smarter order.',
    sub: 'AgriOrbit plans the whole year, not just the next crop, so each season leaves the soil ready for the next.',
    example: 'Example plan',
    crops: { rabi: 'Mustard', kharif1: 'Mungbean', kharif2: 'T. Aman rice' } as Record<SeasonId, string>,
    families: { rabi: 'Mustard family', kharif1: 'Legume · adds nitrogen', kharif2: 'Grass family' } as Record<SeasonId, string>,
    rules: [
      { t: 'No repeats', d: 'Never the same plant family twice in a row, which breaks pest and disease cycles.' },
      { t: 'Feed the soil', d: 'If soil nitrogen is running low, a legume (lentil, mungbean) comes next.' },
      { t: 'Your priority', d: 'Save water, soil health, lower cost or lower risk. You choose what matters most.' },
    ],
  },

  cta: {
    title: 'Ready to plan your next season?',
    sub: 'Pick your district and your priority. It takes about 30 seconds.',
    button: 'Analyze my field',
  },

  footer: {
    built: 'Built by Bay of Orbits for the NASA Space Apps Challenge 2026',
    challenge: 'Challenge: Field Shift: Adapting Farms with NASA Data',
    team: 'Team',
    credits: 'Data: NASA POWER, SMAP, MODIS · Forecast: Open-Meteo · Crop guidance: BARI',
    disclaimer: 'A student project. Not affiliated with or endorsed by NASA or BARI.',
  },

  analyze: {
    soon: 'The Analyze screen is being rebuilt.',
    soonSub: 'Next step: choose a district and priority, then see your conditions, Field Shift, rotation, alerts and Explain Why.',
    back: 'Back to home',
  },

  weatherAdvisory: {
    badges: {
      nasa: 'NASA GPM',
      forecast: 'Open-Meteo',
      agriorbit: 'AgriOrbit',
      live: 'LIVE',
      cached: 'CACHED',
      snapshot: 'SNAPSHOT',
    },
    actions: {
      avoidIrrigationDrainage: 'Avoid unnecessary irrigation and inspect drainage outlets.',
      delayPlannedIrrigation: 'Consider delaying planned irrigation until rainfall conditions become clearer.',
      holdOffIrrigationDelayFertilizer: 'Hold off on supplemental irrigation and delay fertilizer applications.',
      scheduleLightIrrigationMulch: 'Schedule light supplemental irrigation and apply organic mulching.',
      proceedRoutineOperations: 'Proceed with planned seasonal agronomic activities and intercultural operations.',
    },
    rationales: {
      saturatedRisk: (forecastMm: number, soilMoisture: string) =>
        `Open-Meteo forecasts ~${forecastMm} mm of rain while NASA SMAP detects topsoil near saturation (${soilMoisture} m³/m³). Any supplemental water will cause standing waterlogging and root hypoxia.`,
      naturalRecharge: (forecastMm: number, soilMoisture: string) =>
        `While topsoil is currently dry (${soilMoisture} m³/m³), the incoming ${forecastMm} mm forecast will naturally replenish root-zone moisture, saving diesel pumping expenses (৳1,200–৳2,500/bigha).`,
      heavyRainModerate: (forecastMm: number, peakMm: number, peakDate: string) =>
        `Open-Meteo forecasts ${forecastMm} mm over the next 7 days (peak ${peakMm} mm on ${peakDate}). Field conditions can quickly become saturated.`,
      drySpellDeficit: (forecastMm: number, gpmRecentMm: number, soilMoisture: string) =>
        `Forecast indicates only ~${forecastMm} mm over 7 days, compounded by NASA GPM observed deficit (${gpmRecentMm} mm recent). Root-zone soil moisture is ${soilMoisture} m³/m³.`,
      favorableBalance: (forecastMm: number, soilMoisture: string) =>
        `Precipitation forecast (~${forecastMm} mm) and NASA SMAP root-zone moisture (${soilMoisture} m³/m³) are within safe agronomic parameters.`,
    },
    cropNotes: {
      amanDelaySeedbeds: 'Consider delaying Aman rice seedbed sowing and seedling transplanting until intense rainfall subsides to prevent young seedling submergence.',
      amanReinforceBunds: 'Consider delaying Aman rice seedbeds or reinforce nursery bunds against flash runoff.',
      rabiDelayPotatoPulse: 'Delay potato and winter pulse sowing; saturated seedbeds trigger fungal damping-off and seed decay.',
      postponeFertilizerSprays: 'Postpone chemical fertilizer (urea) top-dressing and foliar sprays; surface runoff will wash active inputs away.',
      delayPesticideSprays: 'Delay planned pesticide sprays; rain will dilute active ingredients before pest uptake.',
      naturalRechargeTilling: 'Take advantage of natural precipitation for land tilling and seedbed preparation once rainfall moderates.',
      droughtSensitiveMicroIrrigation: 'Prioritize drought-sensitive crops (maize, vegetables, young seedlings) with evening micro-irrigation to prevent evapotranspiration shock.',
    },
  },
};

export type Dict = typeof en;

const bn: Dict = {
  nav: {
    fieldShift: 'ফিল্ড শিফট',
    crops: 'ফসল তথ্যভাণ্ডার',
    how: 'কীভাবে কাজ করে',
    data: 'তথ্যসূত্র',
    rotation: 'শস্য পর্যায়',
    analyze: 'আমার জমি বিশ্লেষণ',
  },
  season: { rabi: 'রবি', kharif1: 'খরিফ-১', kharif2: 'খরিফ-২' },
  seasonMonths: { rabi: 'নভেম্বর – ফেব্রুয়ারি', kharif1: 'মার্চ – জুন', kharif2: 'জুলাই – অক্টোবর' },
  seasonHint: { rabi: 'শুষ্ক শীত', kharif1: 'গরম, বর্ষার আগে', kharif2: 'বর্ষাকাল' },

  hero: {
    badge: 'নাসা উপগ্রহ পর্যবেক্ষণ × বাংলাদেশ কৃষি',
    eyebrow: 'নাসা উপগ্রহ পর্যবেক্ষণ × বাংলাদেশ কৃষি',
    title1: 'আপনার জমিকে জানুন।',
    title2: 'পরবর্তী পরিকল্পনা তৈরি করুন।',
    sub: 'নাসার উপগ্রহ পর্যবেক্ষণ, স্থানীয় কৃষি তথ্য ও কৃষকের অগ্রাধিকারের সমন্বয়ে জলবায়ু পরিবর্তনের সাথে খাপ খাইয়ে সঠিক ফসল নির্বাচন করুন।',
    cta: 'আমার জমি বিশ্লেষণ করুন',
    cta2: 'কার্যপ্রণালী জানুন',
    trust: ['নিয়মভিত্তিক, কোনো লুকানো হিসাব নেই', 'অফলাইনেও চলে', 'বাংলা ও English'],
  },
  heroCard: {
    place: 'রংপুর',
    now: 'গত ৩০ দিন',
    rain: 'বৃষ্টিপাত',
    heat: 'সবচেয়ে গরম দিন',
    humidity: 'আর্দ্রতা',
    et0: 'ফসলের পানির চাহিদা',
    shift: (a: string, b: string) => `ফিল্ড শিফট · ${a} বনাম ${b}`,
    warmer: 'বেশি গরম',
    cooler: 'বেশি ঠান্ডা',
    source: (date: string) => `নাসা পাওয়ার · ${date} পর্যন্ত পর্যবেক্ষণ`,
  },
  steps: [
    { k: 'কক্ষপথ', t: 'স্যাটেলাইট পর্যবেক্ষণ করে', d: 'নাসা পাওয়ার, স্ম্যাপ ও মোডিস মহাকাশ থেকে বৃষ্টি, তাপ, মাটির আর্দ্রতা ও ফসলের স্বাস্থ্য মাপে।' },
    { k: 'অঞ্চল', t: 'আপনার জেলায় যাই', d: 'বাংলাদেশের ৬৪ জেলার যেকোনোটি, তার নিজের জলবায়ু ইতিহাসের সাথে তুলনা করে।' },
    { k: 'জমি', t: 'জমির পরিকল্পনা পান', d: 'তিন মৌসুমের শস্য পর্যায়, ঝুঁকির সতর্কতা আর এক লাইনের সহজ পরামর্শ।' },
  ],

  fs: {
    eyebrow: 'ফিল্ড শিফট',
    title: 'আপনার জলবায়ু বদলে গেছে।',
    sub: (a: string, b: string) =>
      `পুরোনো চাষের পঞ্জিকা যে জলবায়ুর জন্য বানানো, তা বদলে গেছে। নাসার তথ্য অনুযায়ী ${a} থেকে ${b} সময়ে রংপুরের মৌসুমগুলো যেভাবে বদলেছে:`,
    temp: 'গড় তাপমাত্রা',
    heat: 'দিনের গড় সর্বোচ্চ তাপ',
    share: 'বছরের বৃষ্টির অংশ',
    then: 'তখন',
    now: 'এখন',
    rainBarTitle: 'বৃষ্টি কখন হয়?',
    headlineWarm: (s: string, d: string) => `${s} এখন ${d}°সে বেশি গরম`,
    headlineCool: (s: string, d: string) => `${s} এখন ${d}°সে বেশি ঠান্ডা`,
    headlineRain: (s: string, now: string, then: string) => `বছরের বৃষ্টির ${now}% এখন ${s} মৌসুমে হয় (আগে ছিল ${then}%)`,
    noteTitle: 'কেন ২০০১ থেকে?',
    note: 'বাংলাদেশের জন্য নাসা পাওয়ারের বৃষ্টির তথ্যে ১৯৯৭ ও ২০১৬ সালে প্রক্রিয়াগত পরিবর্তন আছে। তাই আমরা ২০০১ থেকে তুলনা করি, আর বৃষ্টির মোট পরিমাণ নয়, কখন হয় তা দেখি। নাটকীয় তথ্যের চেয়ে সৎ তথ্য দেখানোই আমাদের পছন্দ।',
    cta: 'আপনার জেলার জন্য দেখুন',
  },

  why: {
    eyebrow: 'কেন অ্যাগ্রিঅরবিট',
    title: 'স্যাটেলাইট দেখে। নিয়ম বোঝায়। সিদ্ধান্ত আপনার।',
    cards: [
      { n: '০১', t: 'নাসা পর্যবেক্ষণ করে', d: 'আপনার এলাকার বৃষ্টি, তাপমাত্রা, আর্দ্রতা, মাটির আর্দ্রতা ও গাছপালার স্বাস্থ্য, নাসার বিনামূল্যের তথ্য থেকে।' },
      { n: '০২', t: 'অ্যাগ্রিঅরবিট ব্যাখ্যা করে', d: 'প্রতিটি স্কোর আসে লেখা নিয়ম থেকে, যা আপনি পড়তে পারেন। কোনো মেশিন লার্নিং নেই, কোনো লুকানো হিসাব নেই। যেমন:' },
      { n: '০৩', t: 'কৃষক সিদ্ধান্ত নেন', d: 'আমরা বিকল্প আর কারণ দেখাই, আদেশ নয়। আপনার জমি সম্পর্কে আপনার জ্ঞানই শেষ কথা।' },
    ],
    exampleLabel: 'উদাহরণ নিয়ম',
    example: 'বৃষ্টি ৩০ দিন = ৩৮ মিমি < ৫০  এবং  মাটি = ০.১৪ < ০.১৫\n→ বেশি পানির ফসল  −১৫',
  },

  data: {
    eyebrow: 'তথ্যসূত্র',
    title: 'প্রতিটি সংখ্যার উৎস আছে।',
    sub: 'আমরা যা ব্যবহার করি, শুধু তা-ই লিখি। নাসার তথ্য পর্যবেক্ষণভিত্তিক, ২–৩ দিন পিছিয়ে থাকে, তাই সামনের দিনের জন্য আলাদা পূর্বাভাস ব্যবহার করি।',
    live: 'লাইভ',
    snapshot: 'স্ন্যাপশট',
    guidance: 'নির্দেশিকা',
    items: [
      { name: 'নাসা পাওয়ার · দৈনিক', what: 'বৃষ্টি, তাপমাত্রা, আর্দ্রতা', how: 'ফসলের পানির চাহিদা (ET₀, হারগ্রিভস পদ্ধতি) হিসাবেও ব্যবহৃত।', status: 'live' },
      { name: 'নাসা পাওয়ার · মাসিক', what: 'জলবায়ুর ইতিহাস, ২০০১ → আজ', how: 'ফিল্ড শিফট তুলনা এখান থেকে।', status: 'live' },
      { name: 'নাসা স্ম্যাপ', what: 'মাটির আর্দ্রতা (m³/m³)', how: 'প্রতি জেলার স্ন্যাপশট, ডেমোর আগে হালনাগাদ।', status: 'snapshot' },
      { name: 'নাসা মোডিস', what: 'গাছপালা (NDVI) ও ভূমির তাপমাত্রা', how: 'প্রতি জেলার স্ন্যাপশট, ডেমোর আগে হালনাগাদ।', status: 'snapshot' },
      { name: 'ওপেন-মেটিও', what: '৭ দিনের আবহাওয়া পূর্বাভাস', how: 'নাসার নয়, আলাদাভাবে কৃতজ্ঞতা জানানো হলো। ২–৩ দিনের ঘাটতি পূরণ করে, সামনে দেখায়।', status: 'live' },
      { name: 'বারি নির্দেশিকা', what: 'বাংলাদেশের ফসলের নিয়ম', how: 'বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউটের প্রকাশিত নির্দেশিকা (কোনো অংশীদারিত্ব নেই)।', status: 'guidance' },
    ],
  },

  rot: {
    eyebrow: 'তিন মৌসুমের শস্য পর্যায়',
    title: 'এক জমি। তিন মৌসুম। আরও ভালো ক্রম।',
    sub: 'অ্যাগ্রিঅরবিট শুধু পরের ফসল নয়, পুরো বছরের পরিকল্পনা করে, যাতে প্রতিটি মৌসুম পরেরটির জন্য মাটি তৈরি রাখে।',
    example: 'উদাহরণ পরিকল্পনা',
    crops: { rabi: 'সরিষা', kharif1: 'মুগ ডাল', kharif2: 'রোপা আমন ধান' },
    families: { rabi: 'সরিষা গোত্র', kharif1: 'ডাল জাতীয় · নাইট্রোজেন যোগ করে', kharif2: 'ঘাস গোত্র' },
    rules: [
      { t: 'পুনরাবৃত্তি নয়', d: 'পরপর একই গোত্রের ফসল নয়, এতে পোকা ও রোগের চক্র ভাঙে।' },
      { t: 'মাটিকে খাওয়ান', d: 'মাটিতে নাইট্রোজেন কমে গেলে পরের ফসল হবে ডাল জাতীয় (মসুর, মুগ)।' },
      { t: 'আপনার অগ্রাধিকার', d: 'পানি সাশ্রয়, মাটির স্বাস্থ্য, কম খরচ বা কম ঝুঁকি। কোনটি জরুরি, আপনি বেছে নিন।' },
    ],
  },

  cta: {
    title: 'পরের মৌসুমের পরিকল্পনা করতে প্রস্তুত?',
    sub: 'আপনার জেলা আর অগ্রাধিকার বেছে নিন। মাত্র ৩০ সেকেন্ড লাগে।',
    button: 'আমার জমি বিশ্লেষণ করুন',
  },

  footer: {
    built: 'নাসা স্পেস অ্যাপস চ্যালেঞ্জ ২০২৬-এর জন্য বে অফ অরবিটস দলের তৈরি',
    challenge: 'চ্যালেঞ্জ: ফিল্ড শিফট: নাসার তথ্য দিয়ে খামারকে মানিয়ে নেওয়া',
    team: 'দল',
    credits: 'তথ্য: নাসা পাওয়ার, স্ম্যাপ, মোডিস · পূর্বাভাস: ওপেন-মেটিও · ফসল নির্দেশিকা: বারি',
    disclaimer: 'একটি শিক্ষার্থী প্রকল্প। নাসা বা বারির সাথে সম্পৃক্ত বা তাদের অনুমোদিত নয়।',
  },

  analyze: {
    soon: 'বিশ্লেষণ পাতা নতুন করে তৈরি হচ্ছে।',
    soonSub: 'পরের ধাপ: জেলা ও অগ্রাধিকার বেছে নিন, তারপর দেখুন বর্তমান অবস্থা, ফিল্ড শিফট, শস্য পর্যায়, সতর্কতা ও কেন এই পরামর্শ।',
    back: 'হোমে ফিরুন',
  },

  weatherAdvisory: {
    badges: {
      nasa: 'নাসা জিপিএম',
      forecast: 'ওপেন-মেটিও',
      agriorbit: 'এগ্রিঅরবিট',
      live: 'লাইভ',
      cached: 'সংরক্ষিত',
      snapshot: 'স্ন্যাপশট',
    },
    actions: {
      avoidIrrigationDrainage: 'অপ্রয়োজনীয় সেচ প্রদান অবিলম্বে বন্ধ রাখুন এবং পানি নিষ্কাশনের নালা পরিষ্কার করুন।',
      delayPlannedIrrigation: 'পরিকল্পিত পাম্প সেচ সাময়িক স্থগিত রাখুন; বৃষ্টির পর মাটির রস পর্যবেক্ষণ করুন।',
      holdOffIrrigationDelayFertilizer: 'অতিরিক্ত সেচ দেওয়া বন্ধ রাখুন এবং সার প্রয়োগ সাময়িক স্থগিত রাখুন।',
      scheduleLightIrrigationMulch: 'সময়মতো হালকা সেচ প্রদান করুন অথবা মাটির রস ধরে রাখতে খড়কুটার মালচিং ব্যবহার করুন।',
      proceedRoutineOperations: 'পরিকল্পিত মৌসুমী কৃষি কাজ, নিড়ানি ও পরিচর্যা যথারীতি চালিয়ে যান।',
    },
    rationales: {
      saturatedRisk: (forecastMm: number, soilMoisture: string) =>
        `ওপেন-মেটিও আগামী ৭ দিনে প্রায় ${forecastMm} মিমি বৃষ্টির পূর্বাভাস দিচ্ছে এবং নাসা এসএমএপি অনুযায়ী মাটি ইতিমধ্যে স্যাচুরেশনের কাছাকাছি (${soilMoisture} m³/m³)। বাড়তি পানি শিকড় পচনের ঝুঁকি তৈরি করবে।`,
      naturalRecharge: (forecastMm: number, soilMoisture: string) =>
        `মাটি বর্তমানে শুষ্ক হলেও (${soilMoisture} m³/m³), পূর্বাভাস অনুযায়ী ${forecastMm} মিমি বৃষ্টি মাটির প্রয়োজনীয় রস প্রাকৃতিকভাবে পূরণ করবে এবং সেচ খরচ বাঁচাবে।`,
      heavyRainModerate: (forecastMm: number, peakMm: number, peakDate: string) =>
        `ওপেন-মেটিও আগামী ৭ দিনে ${forecastMm} মিমি বৃষ্টির পূর্বাভাস দিচ্ছে (সর্বোচ্চ ${peakMm} মিমি ${peakDate}-এ)। মাঠ দ্রুত অতিরিক্ত আর্দ্র হতে পারে।`,
      drySpellDeficit: (forecastMm: number, gpmRecentMm: number, soilMoisture: string) =>
        `পূর্বাভাসে আগামী ৭ দিনে মাত্র ~${forecastMm} মিমি বৃষ্টি এবং নাসা জিপিএম অনুযায়ী সাম্প্রতিক বৃষ্টিপাতও কম (${gpmRecentMm} মিমি)। মাটির রস ${soilMoisture} m³/m³।`,
      favorableBalance: (forecastMm: number, soilMoisture: string) =>
        `বৃষ্টিপাতের পূর্বাভাস (~${forecastMm} মিমি) এবং মাটির আর্দ্রতা (${soilMoisture} m³/m³) স্বাভাবিক সীমার মধ্যে রয়েছে।`,
    },
    cropNotes: {
      amanDelaySeedbeds: 'আমন ধানের বীজতলা তৈরি বা চারা রোপণ সাময়িক পিছিয়ে দিন যাতে চারা পানিতে তলিয়ে নষ্ট না হয়।',
      amanReinforceBunds: 'আমন ধানের বীজতলা সাময়িক পিছিয়ে দিন অথবা বীজতলার চারপাশের বাঁধ মজবুত করুন।',
      rabiDelayPotatoPulse: 'আলু ও রবি ডাল বপন স্থগিত রাখুন; অতিরিক্ত রস ও বৃষ্টিতে বীজ পচে যাওয়ার ঝুঁকি রয়েছে।',
      postponeFertilizerSprays: 'ইউরিয়া সারের উপরিপ্রয়োগ ও স্প্রে স্থগিত রাখুন; বৃষ্টির পানিতে সার ধুয়ে অপচয় হবে।',
      delayPesticideSprays: 'কীটনাশক স্প্রে পিছিয়ে দিন; বৃষ্টিতে ওষুধের কার্যকারিতা নষ্ট হতে পারে।',
      naturalRechargeTilling: 'বৃষ্টির পানি ব্যবহার করে জমি চাষ ও বীজতলার প্রস্তুতি নিতে পারেন।',
      droughtSensitiveMicroIrrigation: 'সংবেদনশীল ফসলে বিকেলে হালকা সেচ দিন যাতে প্রখর রোদে গাছ নেতিয়ে না পড়ে।',
    },
  },
};

export const STRINGS = { en, bn };
export type Lang = keyof typeof STRINGS;
