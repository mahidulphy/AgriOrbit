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
    materials: 'Study Materials',
    signIn: 'Sign In',
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
    cta: 'Analyze my field',
    cta2: 'Explore How It Works',
    trust: ['Rule-based, explainable logic', 'Based on BARI/BRRI guidance and NASA data', 'English & বাংলা'],
  },
  heroCard: {
    place: 'Rangpur',
    now: (from?: string, to?: string) => (from && to ? `Snapshot · ${from} – ${to}` : 'Data unavailable'),
    live: (from?: string, to?: string) => (from && to ? `NASA POWER · ${from} – ${to}` : 'NASA POWER'),
    unavailable: 'Data unavailable',
    rain: '30-Day Rainfall',
    heat: 'Peak Temperature',
    humidity: 'Relative Humidity',
    et0: 'Crop Water Need',
    rainDesc: '30d cumulative',
    heatDesc: 'Peak daytime high',
    humidityDesc: 'Mean relative humidity',
    et0Desc: 'Crop water need (ET₀)',
    shiftTeaser: 'Two Decades of Climate Shift',
    shiftLink: 'Explore Field Shift',
    shift: (a: string, b: string) => `Field Shift · ${a} vs ${b}`,
    warmer: 'warmer',
    cooler: 'cooler',
    source: (from: string, to: string) => `NASA POWER · ${from} – ${to}`,
  },

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
    biggestChange: 'Biggest change',
    legendTitle: 'Legend',
    legendTempUp: 'Temp increase',
    legendTempDown: 'Temp decrease',
    legendRainUp: 'Rain share up',
    legendRainDown: 'Rain share down',
    takeaways: {
      rabi: 'Winter is slightly warmer; late-season heat stress risk is rising for wheat and potato.',
      kharif1: 'Pre-monsoon rain share surged; lower irrigation demand for Aus and summer crops.',
      kharif2: 'Monsoon rain share softened; keep supplemental irrigation ready during early Aman.',
    } as Record<SeasonId, string>,
  },

  why: {
    eyebrow: 'Why AgriOrbit',
    title: 'Satellites observe. Rules explain. You decide.',
    cards: [
      { n: '01', t: 'NASA observes', d: 'NASA POWER gives rain, temperature and humidity today; soil moisture and vegetation (SMAP/MODIS) are being added.' },
      { n: '02', t: 'AgriOrbit explains', d: 'Every score comes from a written rule you can read. No machine learning, no black box. For example:' },
      { n: '03', t: 'The farmer decides', d: 'We show options and reasons, not orders. Your knowledge of your own land has the final say.' },
    ],
    exampleLabel: 'Example rule',
    example: 'Rain 30d = 38 mm < 50  and  soil = 0.14 < 0.15\n→ high-water crops  −15',
  },

  atlas: {
    provenanceDesc: (researchCount: number, estimatedCount: number) =>
      `${researchCount} crops use values from BARI/BRRI guidance compiled by our team; ${estimatedCount} are estimated.`,
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
      { name: 'NASA SMAP', what: 'Soil moisture (m³/m³)', how: 'NASA SMAP & MODIS, observed Sep–Oct 2026.', status: 'snapshot' },
      { name: 'NASA MODIS', what: 'Vegetation (NDVI) and land temperature', how: 'NASA SMAP & MODIS, observed Sep–Oct 2026.', status: 'snapshot' },
      { name: 'ESA Sentinel-1 · C-SAR', what: '10 m radar flood & waterlogging detection', how: 'Copernicus Data Space SAR penetrates clouds to map waterlogged cropland (Rule SAR-01).', status: 'snapshot' },
      { name: 'ESA Sentinel-2 · MSI', what: '10 m field-level vegetation index (NDVI)', how: 'Copernicus optical sensor with SCL cloud-masking resolves individual farm plots (10 m vs 250 m MODIS).', status: 'snapshot' },
      { name: 'JAXA Earth API · GSMaP & AMSR2', what: 'GSMaP v8 operational rain & AMSR2 soil moisture', how: 'Cross-verifies NASA precipitation and soil drought index (SPI) across independent microwave sensors.', status: 'snapshot' },
      { name: 'ESA CCI Soil Moisture · Combined', what: 'Decadal soil moisture history, 2001 → 2025', how: '0.25° microwave satellite climate data record powers the Field Shift soil comparison.', status: 'snapshot' },
      { name: 'ISRO MOSDAC · INSAT-3DR', what: 'Geostationary LST & Hydro-Estimator rain', how: 'Continuously monitors South Asia at 74°E to cross-verify daytime canopy heat waves and thunderstorms.', status: 'snapshot' },
      { name: 'NASA-ISRO NISAR · 200m SAR', what: 'High-resolution L-band radar soil moisture', how: 'Provisional Level 3 soil moisture (July 2026 release) resolving 200 m cropland field texture.', status: 'snapshot' },
      { name: 'Open-Meteo', what: '7-day weather forecast', how: 'Not NASA, credited separately. Fills the 2–3 day gap and looks ahead.', status: 'live' },
      { name: 'BARI & BRRI guidelines', what: 'Crop rules for Bangladesh', how: 'Published crop guidance from BARI and BRRI (no partnership).', status: 'guidance' },
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
    credits: 'Data: NASA (POWER, SMAP, MODIS), ESA Copernicus (Sentinel-1, 2), ESA CCI (Soil Moisture), JAXA Earth API (GSMaP v8, AMSR2) · Forecast: Open-Meteo · Crop guidance: BARI & BRRI',
    disclaimer: 'A student project. Not affiliated with or endorsed by NASA, BARI, or BRRI.',
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
        `While topsoil is currently dry (${soilMoisture} m³/m³), the incoming ${forecastMm} mm forecast will naturally replenish root-zone moisture, saving diesel pumping expenses.`,
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
  faq: {
    heading: 'Frequently Asked Questions',
    subheading: 'Everything you need to know about AgriOrbit.',
    eyebrow: 'Questions & Answers',
    items: [
      {
        id: 'simulator',
        question: 'What does the Simulator do?',
        answer:
          'It lets you explore hypothetical changes in field conditions and farmer priorities to see how crop recommendations or scores may change. It is a planning tool, not a guarantee of future results.',
      },
      {
        id: 'data-sources',
        question: 'Where does the data come from?',
        answer:
          'AgriOrbit uses NASA Earth observation data, including NASA POWER weather data. Some features use other sources, cached data, or snapshots. The app should clearly label each data source and whether it is live, cached, or a snapshot.',
      },
      {
        id: 'nasa-recommend',
        question: 'Does NASA recommend these crops?',
        answer:
          'No. NASA provides Earth observation data. AgriOrbit combines available data with agricultural rules and farmer priorities to generate explainable suggestions. NASA does not endorse the recommendations.',
      },
      {
        id: 'how-choose',
        question: 'How does AgriOrbit choose a crop?',
        answer:
          'It applies transparent, rule-based logic using available weather and soil information, crop characteristics, agricultural guidelines, and your selected priorities.',
      },
      {
        id: 'explain-why',
        question: 'What does “Explain Why” mean?',
        answer:
          'It shows the rules behind a recommendation and explains how field conditions and priorities affect crop scores.',
      },
      {
        id: 'guaranteed',
        question: 'Are the recommendations guaranteed to work?',
        answer:
          'No. They are decision-support suggestions, not guarantees. Actual results depend on local soil conditions, water availability, pests, farming practices, and other factors. Consult local agricultural experts before making major farming decisions.',
      },
      {
        id: 'live-unavailable',
        question: 'What if live data is unavailable?',
        answer:
          'AgriOrbit may fall back to cached or bundled data where supported. Clearly show the data status and avoid presenting fallback data as live observations.',
      },
      {
        id: 'change-priorities',
        question: 'Can I change my farming priorities?',
        answer:
          'Yes. Select supported priorities such as saving water, improving soil health, maximizing profit or yield, lowering costs, or reducing climate risk. Explain how the selected priority influences the recommendation.',
      },
      {
        id: 'obs-vs-forecast',
        question: 'What is the difference between observations and forecasts?',
        answer:
          'Observations describe measured or estimated past and current conditions. Forecasts estimate future weather. Clearly distinguish NASA observations from separately sourced weather forecasts.',
      },
      {
        id: 'expert-replacement',
        question: 'Is AgriOrbit a replacement for an agricultural expert?',
        answer:
          'No. It helps farmers understand available information and compare options, but local agricultural expertise remains important.',
      },
    ],
  },
};

export type Dict = typeof en;

const bn: Dict = {
  nav: {
    fieldShift: 'আবহাওয়া বদল',
    crops: 'ফসলের তালিকা',
    how: 'কীভাবে কাজ করে',
    data: 'তথ্যসূত্র',
    rotation: 'শস্য পর্যায়',
    materials: 'শিক্ষা উপকরণ',
    signIn: 'লগইন করুন',
    analyze: 'আমার জমি যাচাই করুন',
  },
  season: { rabi: 'রবি', kharif1: 'খরিফ-১', kharif2: 'খরিফ-২' },
  seasonMonths: { rabi: 'নভেম্বর – ফেব্রুয়ারি', kharif1: 'মার্চ – জুন', kharif2: 'জুলাই – অক্টোবর' },
  seasonHint: { rabi: 'শুষ্ক শীত', kharif1: 'বর্ষার আগের গরম কাল', kharif2: 'বর্ষাকাল' },

  hero: {
    badge: 'নাসার স্যাটেলাইট পর্যবেক্ষণ × বাংলাদেশ কৃষি',
    eyebrow: 'নাসার স্যাটেলাইট পর্যবেক্ষণ × বাংলাদেশ কৃষি',
    title1: 'জমির হাল বুঝুন,',
    title2: 'সামনের চাষ ঠিক করুন।',
    sub: 'নাসার স্যাটেলাইট তথ্য, এলাকার কৃষি জ্ঞান আর আপনার চাহিদা মিলিয়ে, বদলে যাওয়া আবহাওয়ায় কোন ফসল ভালো হবে তা বেছে নিতে আমরা সাহায্য করি।',
    cta: 'আমার জমি যাচাই করুন',
    cta2: 'কীভাবে কাজ করে দেখুন',
    trust: ['স্পষ্ট ও নির্ভরযোগ্য নিয়ম', 'বারি ও ব্রি নির্দেশিকা এবং নাসার তথ্যের ভিত্তিতে', 'বাংলা ও English'],
  },
  heroCard: {
    place: 'রংপুর',
    now: (from?: string, to?: string) => (from && to ? `সাম্প্রতিক · ${from} – ${to}` : 'তথ্য পাওয়া যায়নি'),
    live: (from?: string, to?: string) => (from && to ? `নাসা পাওয়ার · ${from} – ${to}` : 'নাসা পাওয়ার'),
    unavailable: 'তথ্য পাওয়া যায়নি',
    rain: '৩০ দিনের বৃষ্টি',
    heat: 'সর্বোচ্চ তাপমাত্রা',
    humidity: 'বাতাসের আর্দ্রতা',
    et0: 'ফসলের দৈনিক পানির চাহিদা',
    rainDesc: 'গত ৩০ দিনের মোট বৃষ্টি',
    heatDesc: 'দিনের সর্বোচ্চ তাপমাত্রা',
    humidityDesc: 'গড় আপেক্ষিক আর্দ্রতা',
    et0Desc: 'ফসলের দৈনিক পানির চাহিদা (ET₀)',
    shiftTeaser: 'দুই দশকের আবহাওয়া বদল',
    shiftLink: 'আবহাওয়া বদল দেখুন',
    shift: (a: string, b: string) => `আবহাওয়া বদল · ${a} বনাম ${b}`,
    warmer: 'বেশি গরম',
    cooler: 'বেশি ঠান্ডা',
    source: (from: string, to: string) => `নাসা পাওয়ার · ${from} – ${to}`,
  },

  fs: {
    eyebrow: 'আবহাওয়া বদল',
    title: 'আপনার এলাকার আবহাওয়া আর আগের মতো নেই।',
    sub: (a: string, b: string) =>
      `বাপ-দাদার আমলের চাষের হিসাব যে আবহাওয়ার জন্য ছিল, সেটা এখন বদলে গেছে। নাসার তথ্যে দেখুন ${a} থেকে ${b} সালে রংপুরের মৌসুমে কী বদল এসেছে:`,
    temp: 'গড় তাপমাত্রা',
    heat: 'দিনের গড় সর্বোচ্চ তাপ',
    share: 'বছরের মোট বৃষ্টির ভাগ',
    then: 'আগে',
    now: 'এখন',
    rainBarTitle: 'বৃষ্টি কোন মৌসুমে বেশি হয়?',
    headlineWarm: (s: string, d: string) => `${s} মৌসুম এখন আগের চেয়ে ${d}°সে বেশি গরম`,
    headlineCool: (s: string, d: string) => `${s} মৌসুম এখন আগের চেয়ে ${d}°সে বেশি ঠান্ডা`,
    headlineRain: (s: string, now: string, then: string) => `বছরের মোট বৃষ্টির ${now}% এখন ${s} মৌসুমে হয় (আগে ছিল ${then}%)`,
    noteTitle: 'কেন ২০০১ সাল থেকে?',
    note: 'বাংলাদেশের জন্য নাসা পাওয়ারের বৃষ্টির তথ্যে ১৯৯৭ ও ২০১৬ সালে প্রযুক্তিগত পরিবর্তন ছিল। তাই আমরা ২০০১ সাল থেকে হিসাব করি—বৃষ্টির মোট পরিমাণ নয়, কোন সময়ে বৃষ্টি নামে তা দেখি। চমক নয়, সঠিক তথ্য দেখানোই আমাদের লক্ষ্য।',
    cta: 'আপনার জেলার জন্য দেখুন',
    biggestChange: 'সবচেয়ে বড় পরিবর্তন',
    legendTitle: 'নির্দেশক',
    legendTempUp: 'তাপমাত্রা বৃদ্ধি',
    legendTempDown: 'তাপমাত্রা হ্রাস',
    legendRainUp: 'বৃষ্টির ভাগ বৃদ্ধি',
    legendRainDown: 'বৃষ্টির ভাগ হ্রাস',
    takeaways: {
      rabi: 'শীত আগের চেয়ে একটু উষ্ণ, গম ও আলুতে শেষ মৌসুমে তাপের ঝুঁকি বাড়ছে।',
      kharif1: 'প্রাক-বর্ষায় বৃষ্টির ভাগ অনেক বেড়েছে, আউশ ও গ্রীষ্মকালীন শাকসবজিতে সেচের চাপ কমবে।',
      kharif2: 'মূল বর্ষায় বৃষ্টির ভাগ কিছুটা কমেছে, আমন রোপণের শুরুতে সম্পূরক সেচের প্রস্তুতি জরুরি।',
    } as Record<SeasonId, string>,
  },

  why: {
    eyebrow: 'কেন অ্যাগ্রিঅরবিট',
    title: 'স্যাটেলাইট দেখে, নিয়ম বুঝিয়ে দেয়, সিদ্ধান্ত নেন আপনি।',
    cards: [
      { n: '০১', t: 'নাসা নজর রাখে', d: 'নাসা পাওয়ার দেয় আজকের বৃষ্টি, তাপমাত্রা ও বাতাসের আর্দ্রতা; এর সাথে মাটির রস আর ফসলের হালও (স্ম্যাপ/মোডিস) যুক্ত হচ্ছে।' },
      { n: '০২', t: 'অ্যাগ্রিঅরবিট বুঝিয়ে বলে', d: 'প্রতিটি নম্বর বা পরামর্শের পেছনে স্পষ্ট নিয়ম আছে, যা আপনি নিজেই পড়তে পারবেন। কোনো জটিল বা অজানা হিসাব নেই। যেমন:' },
      { n: '০৩', t: 'শেষ সিদ্ধান্ত কৃষকের', d: 'আমরা শুধু পথ আর কারণ দেখাই, হুকুম দিই না। নিজের জমি আপনিই সবচেয়ে ভালো চেনেন।' },
    ],
    exampleLabel: 'নিয়মের উদাহরণ',
    example: 'বৃষ্টি ৩০ দিন = ৩৮ মিমি < ৫০  এবং  মাটি = ০.১৪ < ০.১৫\n→ বেশি পানির ফসল  −১৫',
  },

  atlas: {
    provenanceDesc: (researchCount: number, estimatedCount: number) =>
      `${researchCount}টি ফসলের তথ্য আমাদের দল বারি ও ব্রি নির্দেশিকা থেকে নিয়েছে; ${estimatedCount}টি ফসলের তথ্য আনুমানিক।`,
  },

  data: {
    eyebrow: 'তথ্যসূত্র',
    title: 'প্রতিটি সংখ্যার পেছনে নির্ভরযোগ্য উৎস আছে।',
    sub: 'আমরা যা কাজে লাগাই, শুধু সেটাই উল্লেখ করি। নাসার তথ্য সরাসরি পর্যবেক্ষণ করা, যা পৌঁছাতে ২–৩ দিন সময় নেয়। তাই সামনের দিনের জন্য আলাদা পূর্বাভাস রাখা হয়েছে।',
    live: 'সরাসরি',
    snapshot: 'সাম্প্রতিক',
    guidance: 'নির্দেশিকা',
    items: [
      { name: 'নাসা পাওয়ার · দৈনিক', what: 'বৃষ্টি, তাপমাত্রা, আর্দ্রতা', how: 'ফসলের পানির চাহিদা (ET₀, হারগ্রিভস পদ্ধতি) বের করতেও ব্যবহৃত হয়।', status: 'live' },
      { name: 'নাসা পাওয়ার · মাসিক', what: 'আবহাওয়ার ইতিহাস, ২০০১ → আজ', how: 'আবহাওয়া বদল তুলনা এখান থেকেই করা।', status: 'live' },
      { name: 'নাসা স্ম্যাপ', what: 'মাটির আর্দ্রতা (m³/m³)', how: 'নাসা স্ম্যাপ ও মোডিস, পর্যবেক্ষণ সেপ্টেম্বর–অক্টোবর ২০২৬।', status: 'snapshot' },
      { name: 'নাসা মোডিস', what: 'সবুজায়ন (NDVI) ও মাটির তাপমাত্রা', how: 'নাসা স্ম্যাপ ও মোডিস, পর্যবেক্ষণ সেপ্টেম্বর–অক্টোবর ২০২৬।', status: 'snapshot' },
      { name: 'ইএসএ সেন্টিনেল-১ · সি-সার', what: '১০ মিটার রেজ্যুলুশনে বন্যা ও জলাবদ্ধতা শনাক্তকরণ', how: 'কোপার্নিকাস রাডার মেঘ ভেদ করে ফসলি জমিতে জলাবদ্ধতা শনাক্ত করে (নিয়ম SAR-01)।', status: 'snapshot' },
      { name: 'ইএসএ সেন্টিনেল-২ · এমএসআই', what: '১০ মিটার রেজ্যুলুশনে ফসলের সবুজায়ন সূচক (NDVI)', how: 'কোপার্নিকাস অপটিক্যাল সেন্সর মেঘমুক্ত অ্যালগরিদমে একক ফসলি জমি বিশ্লেষণ করে (১০মি বনাম ২৫০মি মোডিস)।', status: 'snapshot' },
      { name: 'জাক্সা আর্থ এপিআই · জিএসএমএপি ও এএমএসআর২', what: 'জিএসএমএপি ৮ বৃষ্টিপাত ও এএমএসআর২ মাটির আর্দ্রতা', how: 'নাসার বৃষ্টি ও মাটির আর্দ্রতার সাথে জাক্সার উপগ্রহ তথ্যের সরাসরি অমিল বা মিল যাচাই (SPI খরা সূচক)।', status: 'snapshot' },
      { name: 'ইএসএ সিসিআই মাটির আর্দ্রতা · কম্বাইন্ড', what: 'মাটির আর্দ্রতার ২০ বছরের ইতিহাস, ২০০১ → ২০২৫', how: '০.২৫ ডিগ্রি গ্রিডের জলবায়ু উপগ্রহ ডেটাসেট দ্বারা আবহাওয়া বদলের মাটির পরিবর্তন বিশ্লেষণ করা হয়।', status: 'snapshot' },
      { name: 'ইসরো মসডাক · ইনস্যাট-৩ডিআর', what: 'ভূ-স্থির উপগ্রহ থেকে পৃষ্ঠের তাপমাত্রা ও বৃষ্টিপাত', how: '৭৪ ডিগ্রি পূর্ব দ্রাঘিমাংশ থেকে দক্ষিণ এশিয়ার তাপদাহ ও ঝড়বৃষ্টি সার্বক্ষণিক পর্যবেক্ষণ করে নাসার তথ্য যাচাই করে।', status: 'snapshot' },
      { name: 'নাসা-ইসরো নিসার · ২০০মি রাডার', what: 'উচ্চ রেজ্যুলুশন এল-ব্যান্ড রাডারে মাটির আর্দ্রতা', how: 'জুলাই ২০২৬-এর উন্মুক্ত লেভেল-৩ ডেটাসেট যা ২০০ মিটার রেজ্যুলুশনে মাটির রস পরিমাপ করে।', status: 'snapshot' },
      { name: 'ওপেন-মেটিও', what: '৭ দিনের আবহাওয়া পূর্বাভাস', how: 'নাসার নয়, আলাদাভাবে নেওয়া। ২–৩ দিনের ফাঁক পূরণ করে সামনের পূর্বাভাস দেয়।', status: 'live' },
      { name: 'বারি ও ব্রি নির্দেশিকা', what: 'বাংলাদেশের ফসলের নিয়ম', how: 'বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউট (বারি) ও বাংলাদেশ ধান গবেষণা ইনস্টিটিউটের (ব্রি) গবেষণা নির্দেশিকা (কোনো প্রাতিষ্ঠানিক চুক্তি নেই)।', status: 'guidance' },
    ],
  },

  rot: {
    eyebrow: 'তিন মৌসুমের শস্য পর্যায়',
    title: 'এক জমিতে তিন মৌসুম, ফসল সাজান বুঝেশুনে।',
    sub: 'অ্যাগ্রিঅরবিট শুধু পরের ফসল নয়, সারা বছরের পরিকল্পনা সাজায়, যাতে এক মৌসুমের পর মাটি পরের মৌসুমের জন্য উর্বর থাকে।',
    example: 'নমুনা পরিকল্পনা',
    crops: { rabi: 'সরিষা', kharif1: 'মুগ ডাল', kharif2: 'রোপা আমন ধান' },
    families: { rabi: 'সরিষা জাতীয়', kharif1: 'ডাল জাতীয় · মাটিতে নাইট্রোজেন যোগ করে', kharif2: 'ধান জাতীয়' },
    rules: [
      { t: 'একই ফসল বারবার নয়', d: 'পরপর একই জাতের ফসল না লাগালে পোকা ও রোগের উপদ্রব কমে।' },
      { t: 'মাটির শক্তি ফেরান', d: 'মাটিতে নাইট্রোজেন কমে গেলে পরের বার ডাল জাতীয় ফসল (মসুর, মুগ) লাগান, এতে মাটি আবার উর্বর হয়।' },
      { t: 'আপনার যা দরকার', d: 'পানি বাঁচানো, মাটির স্বাস্থ্য, কম খরচ নাকি কম ঝুঁকি—আপনার জন্য যেটা সবচেয়ে জরুরি, সেটাই বেছে নিন।' },
    ],
  },

  cta: {
    title: 'পরের মৌসুমের চাষ ঠিক করবেন?',
    sub: 'জেলা আর আপনার চাহিদা বেছে নিন, আধা মিনিটেই হয়ে যাবে।',
    button: 'আমার জমি যাচাই করুন',
  },

  footer: {
    built: 'নাসা স্পেস অ্যাপস চ্যালেঞ্জ ২০২৬-এর জন্য বে অফ অরবিটস দলের তৈরি',
    challenge: 'চ্যালেঞ্জ: ফিল্ড শিফট: নাসার তথ্য দিয়ে খামারকে মানিয়ে নেওয়া',
    team: 'টিম',
    credits: 'তথ্যসূত্র: নাসা (পাওয়ার, স্ম্যাপ, মোডিস), ইএসএ কোপার্নিকাস (সেন্টিনেল-১, ২), ইএসএ সিসিআই (মাটির আর্দ্রতা), জাক্সা আর্থ এপিআই (জিএসএমএপি ৮, এএমএসআর২) · পূর্বাভাস: ওপেন-মেটিও · ফসলের নিয়ম: বারি ও ব্রি',
    disclaimer: 'শিক্ষার্থীদের তৈরি একটি প্রকল্প। নাসা, বারি বা ব্রির সাথে কোনো আনুষ্ঠানিক চুক্তি নেই।',
  },

  analyze: {
    soon: 'যাচাই পাতা নতুন করে তৈরি হচ্ছে।',
    soonSub: 'পরের ধাপ: জেলা ও চাহিদা বেছে নিন, তারপর দেখুন বর্তমান অবস্থা, আবহাওয়া বদল, শস্য পর্যায়, সতর্কতা ও সিদ্ধান্তের কারণ।',
    back: 'মূল পাতায় ফিরুন',
  },

  weatherAdvisory: {
    badges: {
      nasa: 'নাসা জিপিএম',
      forecast: 'ওপেন-মেটিও',
      agriorbit: 'এগ্রিঅরবিট',
      live: 'সরাসরি',
      cached: 'সংরক্ষিত',
      snapshot: 'সাম্প্রতিক',
    },
    actions: {
      avoidIrrigationDrainage: 'অপ্রয়োজনীয় সেচ বন্ধ রাখুন এবং জমির পানি বের হওয়ার নালা পরিষ্কার করুন।',
      delayPlannedIrrigation: 'এখনই সেচ দেবেন না; বৃষ্টির পর মাটির রস দেখে সিদ্ধান্ত নিন।',
      holdOffIrrigationDelayFertilizer: 'বাড়তি সেচ দেওয়া বন্ধ রাখুন এবং সার দেওয়া কিছুদিন পিছিয়ে দিন।',
      scheduleLightIrrigationMulch: 'হালকা সেচ দিন অথবা মাটির রস ধরে রাখতে খড়কুটা দিয়ে ঢেকে দিন (মালচিং)।',
      proceedRoutineOperations: 'পরিকল্পনা অনুযায়ী স্বাভাবিক চাষাবাদ ও ক্ষেতের পরিচর্যা চালিয়ে যান।',
    },
    rationales: {
      saturatedRisk: (forecastMm: number, soilMoisture: string) =>
        `ওপেন-মেটিও পূর্বাভাস দিচ্ছে আগামী ৭ দিনে প্রায় ${forecastMm} মিমি বৃষ্টি হতে পারে এবং নাসা এসএমএপি অনুযায়ী মাটিতে ইতিমধ্যে প্রচুর রস আছে (${soilMoisture} m³/m³)। এখন সেচ দিলে জমিতে পানি জমে শিকড় পচে যাওয়ার ভয় থাকে।`,
      naturalRecharge: (forecastMm: number, soilMoisture: string) =>
        `মাটি এখন শুকনো হলেও (${soilMoisture} m³/m³), আগামী কয়েক দিনে ${forecastMm} মিমি বৃষ্টির সম্ভাবনা আছে। এতে মাটির রস প্রাকৃতিকভাবেই পূরণ হবে এবং পাম্পের খরচ বাঁচবে।`,
      heavyRainModerate: (forecastMm: number, peakMm: number, peakDate: string) =>
        `ওপেন-মেটিও পূর্বাভাস অনুযায়ী আগামী ৭ দিনে ${forecastMm} মিমি বৃষ্টি হতে পারে (সবচেয়ে বেশি ${peakMm} মিমি ${peakDate} তারিখে)। জমিতে পানি জমতে পারে, সতর্ক থাকুন।`,
      drySpellDeficit: (forecastMm: number, gpmRecentMm: number, soilMoisture: string) =>
        `সামনের ৭ দিনে মাত্র ~${forecastMm} মিমি বৃষ্টির সম্ভাবনা আর নাসা জিপিএম-এ দেখা যাচ্ছে সম্প্রতি বৃষ্টিও কম হয়েছে (${gpmRecentMm} মিমি)। মাটির রস ${soilMoisture} m³/m³।`,
      favorableBalance: (forecastMm: number, soilMoisture: string) =>
        `বৃষ্টির সম্ভাবনা (~${forecastMm} মিমি) এবং মাটির রস (${soilMoisture} m³/m³) দুটোই এখন চাষের জন্য একদম অনুকূল।`,
    },
    cropNotes: {
      amanDelaySeedbeds: 'আমন ধানের বীজতলা তৈরি বা চারা লাগানো কিছুদিন পিছিয়ে দিন, যাতে বেশি বৃষ্টিতে চারা তলিয়ে না যায়।',
      amanReinforceBunds: 'আমন ধানের বীজতলা কিছুদিন পিছিয়ে দিন অথবা বীজতলার চারপাশের আইল উঁচু ও শক্ত করুন।',
      rabiDelayPotatoPulse: 'আলু ও রবি ডাল বোনা কিছুদিন পিছিয়ে দিন; ভেজা মাটিতে বীজ পচে যাওয়ার ভয় থাকে।',
      postponeFertilizerSprays: 'ইউরিয়া সার ও পাতায় স্প্রে করা আপাতত বন্ধ রাখুন; বৃষ্টিতে ধুয়ে অপচয় হবে।',
      delayPesticideSprays: 'কীটনাশক স্প্রে করা পিছিয়ে দিন; বৃষ্টিতে ওষুধ ধুয়ে কাজ করবে না।',
      naturalRechargeTilling: 'বৃষ্টির পানি কাজে লাগিয়ে জমি চাষ ও বীজতলার প্রস্তুতি সেরে নিতে পারেন।',
      droughtSensitiveMicroIrrigation: 'রোদে পোড়া ফসল বাঁচাতে বিকেলে হালকা সেচ দিন, যাতে গাছ নেতিয়ে না পড়ে।',
    },
  },
  faq: {
    heading: 'সাধারণ জিজ্ঞাসা',
    subheading: 'এগ্রিঅরবিট নিয়ে কৃষকদের সাধারণ প্রশ্নের সহজ উত্তর।',
    eyebrow: 'প্রশ্নোত্তর',
    items: [
      {
        id: 'simulator',
        question: 'সিমুলেটর দিয়ে কী করা যায়?',
        answer:
          'জমির অবস্থা বা আপনার চাহিদা বদলে দেখলে কোন ফসলের পরামর্শ কীভাবে বদলাবে, তা আগেভাগেই দেখে নেওয়ার সুযোগ দেয়। এটি ফসল পরিকল্পনার সহায়ক, নিশ্চিত কোনো প্রতিশ্রুতি নয়।',
      },
      {
        id: 'data-sources',
        question: 'এই তথ্যগুলো কোথা থেকে আসে?',
        answer:
          'এগ্রিঅরবিট নাসার স্যাটেলাইট তথ্য (যেমন নাসা পাওয়ারের আবহাওয়া তথ্য) ব্যবহার করে। এছাড়া নির্ভরযোগ্য পূর্বাভাস ও গবেষণা নির্দেশিকাও কাজে লাগানো হয়। তথ্যের উৎস এবং তা সরাসরি নাকি সাম্প্রতিক, তা পরিষ্কারভাবে উল্লেখ থাকে।',
      },
      {
        id: 'nasa-recommend',
        question: 'নাসা কি সরাসরি এই ফসলগুলোর সুপারিশ করে?',
        answer:
          'না। নাসা কেবল স্যাটেলাইট থেকে আবহাওয়া ও মাটির তথ্য দেয়। এগ্রিঅরবিট সেই তথ্যের সাথে আমাদের দেশের কৃষি গবেষণা ও আপনার চাহিদা মিলিয়ে যুক্তিযুক্ত পরামর্শ তৈরি করে। নাসা কোনো ফসল সরাসরি অনুমোদন করে না।',
      },
      {
        id: 'how-choose',
        question: 'এগ্রিঅরবিট কীভাবে ফসল বাছাই করে?',
        answer:
          'আবহাওয়া, মাটির রস, ফসলের পানির চাহিদা, বারি ও ব্রির নির্দেশিকা এবং আপনার পছন্দের চাহিদার ভিত্তিতে সম্পূর্ণ নিয়ম মেনে ফসল সাজানো হয়। এখানে কোনো লুকানো হিসাব নেই।',
      },
      {
        id: 'explain-why',
        question: '“কারণ দেখুন” কী কাজ করে?',
        answer:
          'কোন নিয়মের ওপর ভিত্তি করে একটি ফসলকে এগিয়ে বা পিছিয়ে রাখা হলো, তা একদম খোলামেলাভাবে বুঝিয়ে দেয়।',
      },
      {
        id: 'guaranteed',
        question: 'পরামর্শ অনুযায়ী চাষ করলে কি নিশ্চিত ফলন হবে?',
        answer:
          'না। এটি সিদ্ধান্ত নেওয়ার সহায়ক হিসাব, কোনো গ্যারান্টি নয়। ফলন নির্ভর করে আপনার জমির যত্ন, বালাই দমন ও সঠিক পরিচর্যার ওপর। বড় সিদ্ধান্তের আগে স্থানীয় উপসহকারী কৃষি কর্মকর্তার সাথেও কথা বলুন।',
      },
      {
        id: 'live-unavailable',
        question: 'সরাসরি তথ্য না পাওয়া গেলে কী হয়?',
        answer:
          'তখন এগ্রিঅরবিট সম্প্রতি সংরক্ষিত তথ্য দিয়ে কাজ চালায়। তবে সেটাকে কখনোই সরাসরি তথ্য বলে ভুল বোঝানো হয় না।',
      },
      {
        id: 'change-priorities',
        question: 'আমি কি আমার চাহিদা বদলাতে পারি?',
        answer:
          'হ্যাঁ, যেকোনো সময়। পানি সাশ্রয়, মাটির উর্বরতা রক্ষা, কম খরচ, বেশি লাভ বা আবহাওয়া ঝুঁকি কমানোর মতো বিষয়গুলো বেছে নিতে পারেন। চাহিদা বদলালে সুপারিশও সে অনুযায়ী বদলে যাবে।',
      },
      {
        id: 'obs-vs-forecast',
        question: 'পর্যবেক্ষণ আর পূর্বাভাসের মধ্যে তফাত কী?',
        answer:
          'পর্যবেক্ষণ হলো স্যাটেলাইটে মাপা অতীত ও বর্তমানের বাস্তব তথ্য। আর পূর্বাভাস হলো আগামী কয়েক দিনের সম্ভাব্য আবহাওয়ার অনুমান। দুটোকে সবসময় আলাদা রাখা হয়।',
      },
      {
        id: 'expert-replacement',
        question: 'এগ্রিঅরবিট কি কৃষি কর্মকর্তার বিকল্প?',
        answer:
          'না। এটি আপনাকে আবহাওয়ার হাল আর ফসলের হিসাব সহজে বুঝতে সাহায্য করে। তবে মাঠপর্যায়ের কৃষি কর্মকর্তার বাস্তব অভিজ্ঞতা ও পরামর্শ সবসময়ই মূল্যবান।',
      },
    ],
  },
};

export const STRINGS = { en, bn };
export type Lang = keyof typeof STRINGS;
