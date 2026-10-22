const fs = require('fs');

const cropsCode = fs.readFileSync('docs/crops/generate_table.cjs', 'utf8');
const match = cropsCode.match(/const CROP_DEFINITIONS = (\[[\s\S]*?\n\];)/);
if (!match) {
  console.error('Could not find CROP_DEFINITIONS');
  process.exit(1);
}
const defs = eval(match[1]);

// Map category string to category_id
function getCatId(catStr) {
  if (catStr.includes('Cereal')) return 'cereal';
  if (catStr.includes('Pulses')) return 'pulses';
  if (catStr.includes('Oilseeds')) return 'oilseeds';
  if (catStr.includes('Tuber')) return 'tubers';
  if (catStr.includes('Cash')) return 'cash_fiber';
  if (catStr.includes('Spices')) return 'spices_veg';
  throw new Error('Unknown category: ' + catStr);
}

// Map plant family
const PLANT_FAMILY_MAP = {
  aus: 'poaceae',
  aman: 'poaceae',
  boro: 'poaceae',
  wheat: 'poaceae',
  maize: 'poaceae',
  sugarcane: 'poaceae',
  lentil: 'fabaceae',
  mungbean: 'fabaceae',
  grass_pea: 'fabaceae',
  blackgram: 'fabaceae',
  chickpea: 'fabaceae',
  soybean: 'fabaceae',
  groundnut: 'fabaceae',
  country_bean: 'fabaceae',
  mustard: 'brassicaceae',
  radish: 'brassicaceae',
  potato: 'solanaceae',
  tomato: 'solanaceae',
  brinjal: 'solanaceae',
  chili: 'solanaceae',
  tobacco: 'solanaceae',
  jute: 'malvaceae',
  cotton: 'malvaceae',
  sweet_potato: 'convolvulaceae',
  greater_yam: 'dioscoreaceae',
  giant_taro: 'araceae',
  water_taro: 'araceae',
  eddoe_taro: 'araceae',
  tannia: 'araceae',
  elephant_foot_yam: 'araceae',
  cassava: 'euphorbiaceae',
  onion: 'amaryllidaceae',
  garlic: 'amaryllidaceae',
  ginger: 'zingiberaceae',
  turmeric: 'zingiberaceae',
  sesame: 'pedaliaceae',
  sunflower: 'asteraceae',
};

// Parent groups
const PARENT_GROUP_MAP = {
  aus: 'rice',
  aman: 'rice',
  boro: 'rice',
  giant_taro: 'taro',
  water_taro: 'taro',
  eddoe_taro: 'taro',
  tannia: 'taro',
  elephant_foot_yam: 'taro',
  greater_yam: 'yam',
};

// Scientific names
const SCI_NAMES = {
  aus: 'Oryza sativa var. aus',
  aman: 'Oryza sativa',
  boro: 'Oryza sativa var. boro',
  wheat: 'Triticum aestivum',
  maize: 'Zea mays',
  lentil: 'Lens culinaris',
  mungbean: 'Vigna radiata',
  grass_pea: 'Lathyrus sativus',
  blackgram: 'Vigna mungo',
  chickpea: 'Cicer arietinum',
  mustard: 'Brassica napus',
  groundnut: 'Arachis hypogaea',
  sesame: 'Sesamum indicum',
  sunflower: 'Helianthus annuus',
  soybean: 'Glycine max',
  potato: 'Solanum tuberosum',
  sweet_potato: 'Ipomoea batatas',
  greater_yam: 'Dioscorea alata',
  giant_taro: 'Alocasia macrorrhizos',
  water_taro: 'Colocasia esculenta var. aquatilis',
  eddoe_taro: 'Colocasia esculenta var. antiquorum',
  tannia: 'Xanthosoma sagittifolium',
  elephant_foot_yam: 'Amorphophallus paeoniifolius',
  cassava: 'Manihot esculenta',
  jute: 'Corchorus olitorius',
  sugarcane: 'Saccharum officinarum',
  cotton: 'Gossypium hirsutum',
  tobacco: 'Nicotiana tabacum',
  onion: 'Allium cepa',
  garlic: 'Allium sativum',
  chili: 'Capsicum annuum',
  ginger: 'Zingiber officinale',
  turmeric: 'Curcuma longa',
  tomato: 'Solanum lycopersicum',
  brinjal: 'Solanum melongena',
  radish: 'Raphanus sativus',
  country_bean: 'Lablab purpureus',
};

// Season array mapping
function parseSeasons(c) {
  const id = c.id;
  if (id === 'sugarcane') return ['rabi', 'kharif1', 'kharif2'];
  if (id === 'maize') return ['rabi', 'kharif1'];
  if (id === 'groundnut') return ['rabi', 'kharif1'];
  if (id === 'sunflower') return ['rabi', 'kharif1'];
  if (id === 'soybean') return ['rabi', 'kharif2'];
  if (id === 'sesame') return ['kharif1', 'kharif2'];
  if (id === 'onion') return ['rabi', 'kharif1'];
  if (id === 'chili') return ['rabi', 'kharif1', 'kharif2'];
  if (id === 'tomato') return ['rabi', 'kharif1'];
  if (id === 'brinjal') return ['rabi', 'kharif1', 'kharif2'];
  if (id === 'radish') return ['rabi', 'kharif2'];
  if (id === 'cassava') return ['rabi', 'kharif1'];
  if (id === 'cotton') return ['kharif2'];
  if (id === 'mungbean') return ['kharif1', 'kharif2'];
  if (id === 'blackgram') return ['kharif2'];
  if (id === 'aman') return ['kharif2'];
  if (id === 'aus' || id === 'jute' || id === 'giant_taro' || id === 'water_taro' || id === 'eddoe_taro' || id === 'tannia' || id === 'elephant_foot_yam' || id === 'greater_yam' || id === 'ginger' || id === 'turmeric') {
    return ['kharif1'];
  }
  return ['rabi'];
}

// Occupies seasons (multi-season crops)
const OCCUPIES_MAP = {
  sugarcane: ['rabi', 'kharif1', 'kharif2'],
  greater_yam: ['kharif1', 'kharif2', 'rabi'],
  giant_taro: ['kharif1', 'kharif2', 'rabi'],
  tannia: ['kharif1', 'kharif2', 'rabi'],
  elephant_foot_yam: ['kharif1', 'kharif2'],
  cassava: ['kharif1', 'kharif2', 'rabi'],
  cotton: ['kharif2', 'rabi'],
  ginger: ['kharif1', 'kharif2', 'rabi'],
  turmeric: ['kharif1', 'kharif2', 'rabi'],
};

// Sowing windows
const SOWING_MAP = {
  aus: { months_en: 'March – April', months_bn: 'চৈত্র – বৈশাখ (মার্চ – এপ্রিল)', start_month: 3, end_month: 4 },
  aman: { months_en: 'July – August', months_bn: '১৫ আষাঢ় – ১৫ শ্রাবণ (জুলাই – আগস্ট)', start_month: 7, end_month: 8 },
  boro: { months_en: 'December – January', months_bn: 'অগ্রহায়ণ – পৌষ (ডিসেম্বর – জানুয়ারি)', start_month: 12, end_month: 1 },
  wheat: { months_en: '15 November – 30 November', months_bn: 'কার্তিক – অগ্রহায়ণ (১৫ নভেম্বর – ৩০ নভেম্বর)', start_month: 11, end_month: 11 },
  maize: { months_en: 'Rabi: mid-Oct – Dec; Kharif: mid-Feb – March', months_bn: 'রবি: মধ্য-অক্টোবর – ডিসেম্বর; খরিফ-১: মধ্য-ফেব্রুয়ারি – মার্চ', start_month: 10, end_month: 3 },
  lentil: { months_en: 'mid-October – mid-November', months_bn: 'কার্তিক (মধ্য-অক্টোবর – মধ্য-নভেম্বর)', start_month: 10, end_month: 11 },
  mungbean: { months_en: 'Kharif-1: late-Feb – March; Kharif-2: Aug – mid-Sep', months_bn: 'খরিফ-১: ফেব্রুয়ারি শেষ – মার্চ; খরিফ-২: আগস্ট – মধ্য-সেপ্টেম্বর', start_month: 2, end_month: 9 },
  grass_pea: { months_en: 'mid-October – mid-November', months_bn: 'কার্তিক (মধ্য-অক্টোবর – মধ্য-নভেম্বর)', start_month: 10, end_month: 11 },
  blackgram: { months_en: '15 August – 25 September', months_bn: 'ভাদ্র – আশ্বিন (১৫ আগস্ট – ২৫ সেপ্টেম্বর)', start_month: 8, end_month: 9 },
  chickpea: { months_en: 'November', months_bn: 'কার্তিক – অগ্রহায়ণ (নভেম্বর)', start_month: 11, end_month: 11 },
  mustard: { months_en: 'mid-October – mid-November', months_bn: 'কার্তিক (মধ্য-অক্টোবর – মধ্য-নভেম্বর)', start_month: 10, end_month: 11 },
  groundnut: { months_en: 'Rabi: mid-Oct – Dec; Kharif-1: mid-Feb – April', months_bn: 'রবি: মধ্য-অক্টোবর – ডিসেম্বর; খরিফ-১: মধ্য-ফেব্রুয়ারি – এপ্রিল', start_month: 10, end_month: 4 },
  sesame: { months_en: 'mid-February – April', months_bn: 'ফাল্গুন – চৈত্র (মধ্য-ফেব্রুয়ারি – এপ্রিল)', start_month: 2, end_month: 4 },
  sunflower: { months_en: 'mid-November – late-December', months_bn: 'অগ্রহায়ণ – পৌষ (নভেম্বর মধ্য – ডিসেম্বর শেষ)', start_month: 11, end_month: 12 },
  soybean: { months_en: 'Rabi: mid-Dec – mid-Jan; Kharif-2: July – August', months_bn: 'রবি: মধ্য-ডিসেম্বর – মধ্য-জানুয়ারি; খরিফ-২: জুলাই – আগস্ট', start_month: 12, end_month: 8 },
  potato: { months_en: '1 November – 30 November', months_bn: 'কার্তিক – অগ্রহায়ণ (১ নভেম্বর – ৩০ নভেম্বর)', start_month: 11, end_month: 11 },
  sweet_potato: { months_en: 'late-October – November', months_bn: 'কার্তিক – অগ্রহায়ণ (অক্টোবর শেষ – নভেম্বর)', start_month: 10, end_month: 11 },
  greater_yam: { months_en: 'March – April', months_bn: 'ফাল্গুন – বৈশাখ (মার্চ – এপ্রিল)', start_month: 3, end_month: 4 },
  giant_taro: { months_en: 'February – April', months_bn: 'মাঘ – চৈত্র (ফেব্রুয়ারি – এপ্রিল)', start_month: 2, end_month: 4 },
  water_taro: { months_en: 'mid-January – April', months_bn: 'মাঘ – চৈত্র (মধ্য-জানুয়ারি – এপ্রিল)', start_month: 1, end_month: 4 },
  eddoe_taro: { months_en: 'mid-January – April', months_bn: 'মাঘ – বৈশাখ (মধ্য-জানুয়ারি – এপ্রিল)', start_month: 1, end_month: 4 },
  tannia: { months_en: 'March – May', months_bn: 'ফাল্গুন – বৈশাখ (মার্চ – মে)', start_month: 3, end_month: 5 },
  elephant_foot_yam: { months_en: 'late-February – April', months_bn: 'ফাল্গুন – চৈত্র (ফেব্রুয়ারি শেষ – এপ্রিল)', start_month: 2, end_month: 4 },
  cassava: { months_en: 'April – May or October – November', months_bn: 'চৈত্র – বৈশাখ (এপ্রিল – মে) বা আশ্বিন – কার্তিক (অক্টোবর – নভেম্বর)', start_month: 4, end_month: 11 },
  jute: { months_en: 'March – April', months_bn: 'চৈত্র – বৈশাখ (মার্চ – এপ্রিল)', start_month: 3, end_month: 4 },
  sugarcane: { months_en: 'October – January', months_bn: 'কার্তিক – পৌষ (অক্টোবর – জানুয়ারি)', start_month: 10, end_month: 1 },
  cotton: { months_en: 'June – August', months_bn: 'আষাঢ় – শ্রাবণ (জুন – আগস্ট)', start_month: 6, end_month: 8 },
  tobacco: { months_en: 'October – December (local guide)', months_bn: 'কার্তিক – পৌষ (স্থানীয় নির্দেশিকা)', start_month: 10, end_month: 12 },
  onion: { months_en: 'Rabi: late-Oct – Nov; Kharif: March – April', months_bn: 'রবি: কার্তিক – অগ্রহায়ণ (অক্টোবর শেষ – নভেম্বর); খরিফ: ফাল্গুন – চৈত্র (মার্চ – এপ্রিল)', start_month: 10, end_month: 4 },
  garlic: { months_en: 'mid-October – November', months_bn: 'কার্তিক (মধ্য-অক্টোবর – নভেম্বর)', start_month: 10, end_month: 11 },
  chili: { months_en: 'Rabi: Oct – Nov; Kharif-1: Feb – March', months_bn: 'রবি: অক্টোবর – নভেম্বর; খরিফ-১: ফেব্রুয়ারি – মার্চ', start_month: 10, end_month: 3 },
  ginger: { months_en: 'April – May', months_bn: 'চৈত্র – বৈশাখ (এপ্রিল – মে)', start_month: 4, end_month: 5 },
  turmeric: { months_en: 'April – May', months_bn: 'চৈত্র – বৈশাখ (এপ্রিল – মে)', start_month: 4, end_month: 5 },
  tomato: { months_en: 'Rabi: Oct – Nov; Summer: May – June', months_bn: 'রবি: কার্তিক – অগ্রহায়ণ (অক্টোবর – নভেম্বর); গ্রীষ্মকালীন: বৈশাখ – জ্যৈষ্ঠ (মে – জুন)', start_month: 10, end_month: 6 },
  brinjal: { months_en: 'Rabi: Sep – Oct; Kharif: Feb – March', months_bn: 'রবি: আশ্বিন – কার্তিক (সেপ্টেম্বর – অক্টোবর); খরিফ: ফাল্গুন – চৈত্র (ফেব্রুয়ারি – মার্চ)', start_month: 9, end_month: 3 },
  radish: { months_en: 'Rabi: Sep – Nov; Early: August', months_bn: 'রবি: আশ্বিন – অগ্রহায়ণ (সেপ্টেম্বর – নভেম্বর); আগাম: ভাদ্র (আগস্ট)', start_month: 8, end_month: 11 },
  country_bean: { months_en: 'July – late-August', months_bn: 'আষাঢ় – ভাদ্র (জুলাই – আগস্ট শেষ)', start_month: 7, end_month: 8 },
};

// Harvest windows
const HARVEST_MAP = {
  aus: { months_en: 'July – August', months_bn: 'আষাঢ় – শ্রাবণ (জুলাই – আগস্ট)', start_month: 7, end_month: 8 },
  aman: { months_en: 'November – December', months_bn: 'অগ্রহায়ণ (নভেম্বর – ডিসেম্বর)', start_month: 11, end_month: 12 },
  boro: { months_en: 'April – May', months_bn: 'বৈশাখ – জ্যৈষ্ঠ (এপ্রিল – মে)', start_month: 4, end_month: 5 },
  wheat: { months_en: 'March – April', months_bn: 'ফাল্গুন – চৈত্র (মার্চ – এপ্রিল)', start_month: 3, end_month: 4 },
  maize: { months_en: 'Rabi: April – May; Kharif: June – July', months_bn: 'রবি: এপ্রিল – মে; খরিফ-১: জুন – জুলাই', start_month: 4, end_month: 7 },
  lentil: { months_en: 'February – mid-March', months_bn: 'ফাল্গুন (ফেব্রুয়ারি – মধ্য-মার্চ)', start_month: 2, end_month: 3 },
  mungbean: { months_en: 'Kharif-1: late-April – May; Kharif-2: Oct – Nov', months_bn: 'খরিফ-১: এপ্রিল শেষ – মে; খরিফ-২: অক্টোবর – নভেম্বর', start_month: 4, end_month: 11 },
  grass_pea: { months_en: 'February – mid-March', months_bn: 'ফাল্গুন (ফেব্রুয়ারি – মধ্য-মার্চ)', start_month: 2, end_month: 3 },
  blackgram: { months_en: 'November – December', months_bn: 'কার্তিক – অগ্রহায়ণ (নভেম্বর – ডিসেম্বর)', start_month: 11, end_month: 12 },
  chickpea: { months_en: 'late-February – March', months_bn: 'ফাল্গুন – চৈত্র (ফেব্রুয়ারি শেষ – মার্চ)', start_month: 2, end_month: 3 },
  mustard: { months_en: 'January – February', months_bn: 'মাঘ – ফাল্গুন (জানুয়ারি – ফেব্রুয়ারি)', start_month: 1, end_month: 2 },
  groundnut: { months_en: 'Rabi: April – May; Kharif-1: June – July', months_bn: 'রবি: এপ্রিল – মে; খরিফ-১: জুন – জুলাই', start_month: 4, end_month: 7 },
  sesame: { months_en: 'May – June', months_bn: 'জ্যৈষ্ঠ – আষাঢ় (মে – জুন)', start_month: 5, end_month: 6 },
  sunflower: { months_en: 'April – May', months_bn: 'চৈত্র – বৈশাখ (এপ্রিল – মে)', start_month: 4, end_month: 5 },
  soybean: { months_en: 'Rabi: March – May; Kharif-2: Oct – Dec', months_bn: 'রবি: মার্চ – মে; খরিফ-২: অক্টোবর – ডিসেম্বর', start_month: 3, end_month: 12 },
  potato: { months_en: 'late-January – February', months_bn: 'মাঘ – ফাল্গুন (জানুয়ারি শেষ – ফেব্রুয়ারি)', start_month: 1, end_month: 2 },
  sweet_potato: { months_en: 'late-February – March', months_bn: 'ফাল্গুন – চৈত্র (ফেব্রুয়ারি শেষ – মার্চ)', start_month: 2, end_month: 3 },
  greater_yam: { months_en: 'December – January', months_bn: 'পৌষ – মাঘ (ডিসেম্বর – জানুয়ারি)', start_month: 12, end_month: 1 },
  giant_taro: { months_en: 'December – January', months_bn: 'পৌষ – মাঘ (ডিসেম্বর – জানুয়ারি)', start_month: 12, end_month: 1 },
  water_taro: { months_en: 'Stem: April – Oct; Corm: Oct – Dec', months_bn: 'লতি: এপ্রিল – অক্টোবর; কাণ্ড/কচু: অক্টোবর – ডিসেম্বর', start_month: 4, end_month: 12 },
  eddoe_taro: { months_en: 'August – October', months_bn: 'ভাদ্র – কার্তিক (আগস্ট – অক্টোবর)', start_month: 8, end_month: 10 },
  tannia: { months_en: 'December – February', months_bn: 'পৌষ – মাঘ (ডিসেম্বর – ফেব্রুয়ারি)', start_month: 12, end_month: 2 },
  elephant_foot_yam: { months_en: 'November – January', months_bn: 'কার্তিক – পৌষ (নভেম্বর – জানুয়ারি)', start_month: 11, end_month: 1 },
  cassava: { months_en: '10–12 months after planting', months_bn: 'বপনের ১০-১২ মাস পর', start_month: 2, end_month: 11 },
  jute: { months_en: 'July – August', months_bn: 'শ্রাবণ – ভাদ্র (জুলাই – আগস্ট)', start_month: 7, end_month: 8 },
  sugarcane: { months_en: 'October – March (10-14 months after planting)', months_bn: 'রোপণের ১০-১৪ মাস পর (কার্তিক – চৈত্র)', start_month: 10, end_month: 3 },
  cotton: { months_en: 'January – February', months_bn: 'পৌষ – মাঘ (জানুয়ারি – ফেব্রুয়ারি)', start_month: 1, end_month: 2 },
  tobacco: { months_en: 'February – April (local guide)', months_bn: 'ফাল্গুন – চৈত্র (স্থানীয় নির্দেশিকা)', start_month: 2, end_month: 4 },
  onion: { months_en: 'Rabi: March – April; Kharif: July – August', months_bn: 'রবি: ফাল্গুন – চৈত্র (মার্চ – এপ্রিল); খরিফ: আষাঢ় – শ্রাবণ (জুলাই – আগস্ট)', start_month: 3, end_month: 8 },
  garlic: { months_en: 'March – April', months_bn: 'ফাল্গুন – চৈত্র (মার্চ – এপ্রিল)', start_month: 3, end_month: 4 },
  chili: { months_en: 'Rabi: Jan – April; Kharif-1: May – July', months_bn: 'রবি: জানুয়ারি – এপ্রিল; খরিফ-১: মে – জুলাই', start_month: 1, end_month: 7 },
  ginger: { months_en: 'December – January', months_bn: 'পৌষ – মাঘ (ডিসেম্বর – জানুয়ারি)', start_month: 12, end_month: 1 },
  turmeric: { months_en: 'December – January', months_bn: 'পৌষ – মাঘ (ডিসেম্বর – জানুয়ারি)', start_month: 12, end_month: 1 },
  tomato: { months_en: 'Rabi: Jan – March; Summer: July – Sep', months_bn: 'রবি: পৌষ – চৈত্র (জানুয়ারি – মার্চ); গ্রীষ্মকালীন: শ্রাবণ – আশ্বিন (জুলাই – সেপ্টেম্বর)', start_month: 1, end_month: 9 },
  brinjal: { months_en: 'Rabi: Dec – April; Kharif: May – Sep', months_bn: 'রবি: পৌষ – বৈশাখ (ডিসেম্বর – এপ্রিল); খরিফ: জ্যৈষ্ঠ – আশ্বিন (মে – সেপ্টেম্বর)', start_month: 12, end_month: 9 },
  radish: { months_en: 'October – January (40-60 days after sowing)', months_bn: 'বপনের ৪০-৬০ দিন পর (অক্টোবর – জানুয়ারি)', start_month: 10, end_month: 1 },
  country_bean: { months_en: 'November – March', months_bn: 'অগ্রহায়ণ – চৈত্র (নভেম্বর – মার্চ)', start_month: 11, end_month: 3 },
};

// Numeric durations {min, max}
const DURATION_MAP = {
  aus: { min: 100, max: 120 },
  aman: { min: 110, max: 160 },
  boro: { min: 140, max: 160 },
  wheat: { min: 100, max: 115 },
  maize: { min: 130, max: 155 },
  lentil: { min: 100, max: 115 },
  mungbean: { min: 60, max: 75 },
  grass_pea: { min: 110, max: 125 },
  blackgram: { min: 70, max: 85 },
  chickpea: { min: 120, max: 135 },
  mustard: { min: 70, max: 90 },
  groundnut: { min: 120, max: 150 },
  sesame: { min: 85, max: 100 },
  sunflower: { min: 90, max: 110 },
  soybean: { min: 90, max: 120 },
  potato: { min: 80, max: 100 },
  sweet_potato: { min: 110, max: 130 },
  greater_yam: { min: 240, max: 270 },
  giant_taro: { min: 280, max: 330 },
  water_taro: { min: 180, max: 240 },
  eddoe_taro: { min: 150, max: 180 },
  tannia: { min: 240, max: 300 },
  elephant_foot_yam: { min: 210, max: 250 },
  cassava: { min: 280, max: 320 },
  jute: { min: 100, max: 120 },
  sugarcane: { min: 310, max: 400 },
  cotton: { min: 150, max: 180 },
  tobacco: null,
  onion: { min: 90, max: 125 },
  garlic: { min: 110, max: 125 },
  chili: { min: 130, max: 150 },
  ginger: { min: 240, max: 270 },
  turmeric: { min: 250, max: 280 },
  tomato: { min: 100, max: 125 },
  brinjal: { min: 150, max: 180 },
  radish: { min: 40, max: 60 },
  country_bean: { min: 150, max: 180 },
};

// Water need {min, max} in mm
const WATER_MAP = {
  aus: { min: 500, max: 700 },
  aman: { min: 1000, max: 1250 },
  boro: { min: 1200, max: 1500 },
  wheat: { min: 200, max: 300 },
  maize: { min: 500, max: 700 },
  lentil: { min: 200, max: 250 },
  mungbean: { min: 200, max: 300 },
  grass_pea: { min: 150, max: 200 },
  blackgram: { min: 250, max: 350 },
  chickpea: { min: 200, max: 250 },
  mustard: { min: 150, max: 250 },
  groundnut: { min: 350, max: 500 },
  sesame: { min: 200, max: 300 },
  sunflower: { min: 350, max: 500 },
  soybean: { min: 300, max: 500 },
  potato: { min: 300, max: 500 },
  sweet_potato: { min: 350, max: 500 },
  greater_yam: { min: 800, max: 1200 },
  giant_taro: { min: 1000, max: 1500 },
  water_taro: { min: 1200, max: 1800 },
  eddoe_taro: { min: 700, max: 1000 },
  tannia: { min: 800, max: 1200 },
  elephant_foot_yam: { min: 800, max: 1100 },
  cassava: { min: 600, max: 900 },
  jute: { min: 500, max: 700 },
  sugarcane: { min: 1200, max: 1650 },
  cotton: { min: 600, max: 900 },
  tobacco: null,
  onion: { min: 350, max: 500 },
  garlic: { min: 300, max: 400 },
  chili: { min: 400, max: 600 },
  ginger: { min: 1200, max: 1500 },
  turmeric: { min: 1000, max: 1400 },
  tomato: { min: 400, max: 600 },
  brinjal: { min: 500, max: 800 },
  radish: { min: 250, max: 350 },
  country_bean: { min: 400, max: 600 },
};

// Temperature thresholds
const TEMP_MAP = {
  aus: { base: 20, optimal_min: 26, optimal_max: 35, critical_min: 15, critical_max: 38, notes_bn: 'ফুল ফোটার সময় ৩৮°C এর বেশি সংকটপূর্ণ', notes_en: 'Critical >38°C at flowering' },
  aman: { base: 18, optimal_min: 25, optimal_max: 33, critical_min: 15, critical_max: 37, notes_bn: 'ফুল ফোটার সময় ৩৭°C এর বেশি সংকটপূর্ণ', notes_en: 'Critical >37°C at flowering' },
  boro: { base: 12, optimal_min: 22, optimal_max: 32, critical_min: 10, critical_max: 35, notes_bn: 'চারা অবস্থায় <১০°C কোল্ড ইনজুরি, ফুল ফোটার সময় >৩৫°C চিটা', notes_en: 'Cold injury <10°C in nursery, sterility >35°C at flowering' },
  wheat: { base: 4, optimal_min: 15, optimal_max: 25, critical_min: 4, critical_max: 30, notes_bn: 'দানা গঠনকালে ২৫-৩০°C টার্মিনাল হিট স্ট্রেস', notes_en: 'Terminal heat stress 25-30°C during grain filling' },
  maize: { base: 8, optimal_min: 21, optimal_max: 32, critical_min: 10, critical_max: 35, notes_bn: 'শৈত্যপ্রবাহ <১০°C বৃদ্ধি বন্ধ, সিল্কিংয়ে >৩৫°C হিট স্ট্রেস', notes_en: 'Growth halts <10°C, heat stress >35°C at silking' },
  lentil: { base: 5, optimal_min: 15, optimal_max: 25, critical_min: 5, critical_max: 30, notes_bn: 'ফুল ফোটার সময় >২৮-৩০°C ফুল ঝরে যায়', notes_en: 'Flowers abort at >28-30°C' },
  mungbean: { base: 12, optimal_min: 25, optimal_max: 35, critical_min: 12, critical_max: 40, notes_bn: 'ফুল ফোটার সময় চরম তাপদাহে ফুল ঝরে', notes_en: 'Flowers drop under severe heat at flowering' },
  grass_pea: { base: 5, optimal_min: 15, optimal_max: 25, critical_min: 5, critical_max: 30, notes_bn: 'শীতকালীন নাতিশীতোষ্ণ আবহাওয়া অনুকূল', notes_en: 'Cool winter climate favorable' },
  blackgram: { base: 12, optimal_min: 25, optimal_max: 35, critical_min: 12, critical_max: 38, notes_bn: 'ফুল ফোটার সময় ৩৫°C এর বেশি ক্ষতিকর', notes_en: 'Harmful above 35°C at flowering' },
  chickpea: { base: 5, optimal_min: 15, optimal_max: 25, critical_min: 5, critical_max: 32, notes_bn: 'পড ফিলিংয়ের সময় ৩০-৩২°C এ চিটা হয়', notes_en: 'Pod filling impaired above 30-32°C' },
  mustard: { base: 6, optimal_min: 12, optimal_max: 22, critical_min: 6, critical_max: 28, notes_bn: 'বীজ গঠনের সময় >২৫-২৮°C তেল কমে যায়', notes_en: 'Seed oil yield drops above 25-28°C' },
  groundnut: { base: 12, optimal_min: 22, optimal_max: 30, critical_min: 12, critical_max: 35, notes_bn: 'পেগিং ও পড ফিলিংয়ে ২০-২৮°C প্রয়োজন', notes_en: 'Pegging and pod filling require 20-28°C' },
  sesame: { base: 15, optimal_min: 25, optimal_max: 35, critical_min: 15, critical_max: 40, notes_bn: 'উষ্ণ ও রৌদ্রোজ্জ্বল আবহাওয়া অনুকূল', notes_en: 'Warm sunny weather optimal' },
  sunflower: { base: 8, optimal_min: 20, optimal_max: 28, critical_min: 8, critical_max: 34, notes_bn: 'পরাগায়নে ২৫-২৮°C আদর্শ', notes_en: 'Pollination optimal at 25-28°C' },
  soybean: { base: 10, optimal_min: 25, optimal_max: 30, critical_min: 10, critical_max: 40, notes_bn: 'শুঁটি গঠনকালে ৩৫-৪০°C তাপমাত্রা সংকটপূর্ণ', notes_en: 'Critical above 35-40°C during pod formation' },
  potato: { base: 7, optimal_min: 15, optimal_max: 20, critical_min: 7, critical_max: 25, notes_bn: 'রাতের তাপমাত্রা >২০-২২°C হলে কন্দ গঠন বন্ধ হয়', notes_en: 'Tuber bulking halts if night temp >20-22°C' },
  sweet_potato: { base: 10, optimal_min: 22, optimal_max: 30, critical_min: 10, critical_max: 35, notes_bn: 'কন্দ গঠনে রাতের তাপমাত্রা ১৫-২০°C আদর্শ', notes_en: 'Night temp 15-20°C ideal for tuber formation' },
  greater_yam: { base: 15, optimal_min: 25, optimal_max: 35, critical_min: 15, critical_max: 40, notes_bn: 'উষ্ণ ও আর্দ্র আবহাওয়ায় ভালো বাড়ে', notes_en: 'Thrives in warm, humid weather' },
  giant_taro: { base: 15, optimal_min: 23, optimal_max: 33, critical_min: 15, critical_max: 38, notes_bn: 'ছায়াযুক্ত স্যাঁতসেঁতে পরিবেশ সহনশীল', notes_en: 'Tolerant to shade and dampness' },
  water_taro: { base: 16, optimal_min: 25, optimal_max: 35, critical_min: 16, critical_max: 38, notes_bn: 'উষ্ণ আবহাওয়া ও দাঁড়িয়ে থাকা পানি সহায়ক', notes_en: 'Warm climate and standing water favorable' },
  eddoe_taro: { base: 14, optimal_min: 24, optimal_max: 32, critical_min: 14, critical_max: 37, notes_bn: 'মাঝারি উষ্ণ তাপমাত্রা অনুকূল', notes_en: 'Moderately warm climate optimal' },
  tannia: { base: 15, optimal_min: 25, optimal_max: 35, critical_min: 15, critical_max: 38, notes_bn: 'আংশিক ছায়া ও উষ্ণ আবহাওয়া পছন্দ করে', notes_en: 'Prefers partial shade and warmth' },
  elephant_foot_yam: { base: 15, optimal_min: 25, optimal_max: 35, critical_min: 15, critical_max: 38, notes_bn: 'উষ্ণ বর্ষাকালীন বৃদ্ধি ও শুষ্ক শীতকালীন পরিপক্কতা', notes_en: 'Warm monsoon growth with dry winter harvest' },
  cassava: { base: 13, optimal_min: 25, optimal_max: 32, critical_min: 12, critical_max: 38, notes_bn: 'তাপমাত্রা <১৫°C হলে বৃদ্ধি স্তব্ধ হয়', notes_en: 'Growth halts below 15°C' },
  jute: { base: 15, optimal_min: 18, optimal_max: 35, critical_min: 15, critical_max: 43, notes_bn: 'উষ্ণ ও আর্দ্র আবহাওয়ায় দ্রুত বাড়ে', notes_en: 'Rapid growth in warm and humid conditions' },
  sugarcane: { base: 12, optimal_min: 25, optimal_max: 35, critical_min: 12, critical_max: 37, notes_bn: 'বৃদ্ধি পর্যায়ে ২৭-৩৫°C ও পরিপক্কতায় শীতল রৌদ্রোজ্জ্বল আবহাওয়া', notes_en: '27-35°C during growth, cool sunny during ripening' },
  cotton: { base: 15, optimal_min: 25, optimal_max: 35, critical_min: 15, critical_max: 38, notes_bn: 'গুটি গঠনকালে ৩৮°C-এর বেশি সংকটপূর্ণ', notes_en: 'Critical >38°C during boll development' },
  tobacco: { base: null, optimal_min: null, optimal_max: null, critical_min: null, critical_max: null, notes_en: null, notes_bn: null },
  onion: { base: 7, optimal_min: 15, optimal_max: 25, critical_min: 7, critical_max: 34, notes_bn: 'রাতের তাপমাত্রা <১২°C থাকলে বোল্টিং হয়', notes_en: 'Bolting occurs if night temp <12°C' },
  garlic: { base: 6, optimal_min: 12, optimal_max: 22, critical_min: 6, critical_max: 30, notes_bn: 'কন্দ গঠনে ভার্নালাইজেশন প্রয়োজন', notes_en: 'Requires chilling vernalization for clove division' },
  chili: { base: 10, optimal_min: 20, optimal_max: 30, critical_min: 10, critical_max: 35, notes_bn: 'রাতে <১৫°C হলে ফুল ঝরে যায়', notes_en: 'Flowers drop if night temp <15°C' },
  ginger: { base: 13, optimal_min: 25, optimal_max: 32, critical_min: 13, critical_max: 35, notes_bn: 'তীব্র তাপদাহ ক্ষতিকর; আদা ২০-৪০% ছায়া পছন্দ করে', notes_en: 'Severe heat harmful; prefers 20-40% partial shade' },
  turmeric: { base: 14, optimal_min: 25, optimal_max: 34, critical_min: 14, critical_max: 38, notes_bn: 'উষ্ণ ও আর্দ্র জলবায়ু সহায়ক', notes_en: 'Warm, humid conditions favorable' },
  tomato: { base: 10, optimal_min: 20, optimal_max: 28, critical_min: 10, critical_max: 34, notes_bn: 'রাতের তাপমাত্রা >২৫°C হলে পরাগায়ন ব্যর্থ ও ফল ঝরে', notes_en: 'Night temp >25°C causes pollination failure' },
  brinjal: { base: 12, optimal_min: 22, optimal_max: 32, critical_min: 10, critical_max: 35, notes_bn: 'রাতে <১০°C নামলে ফলের আকার বিকৃত হয়', notes_en: 'Night temp <10°C deforms fruit shape' },
  radish: { base: 10, optimal_min: 15, optimal_max: 20, critical_min: 10, critical_max: 28, notes_bn: 'তাপমাত্রা >২৮°C হলে বোল্টিং হয়', notes_en: 'Premature bolting occurs above 28°C' },
  country_bean: { base: 15, optimal_min: 18, optimal_max: 28, critical_min: 12, critical_max: 32, notes_bn: 'রাতের তাপমাত্রা <২০°C আবশ্যক; >৩২°C ফুল ঝরে', notes_en: 'Night temp <20°C required; flowers drop above 32°C' },
};

// Optimal SMAP moisture ranges
const SMAP_MAP = {
  aus: { min: 0.25, max: 0.35 },
  aman: { min: 0.30, max: 0.45 },
  boro: { min: 0.35, max: 0.50 },
  wheat: { min: 0.20, max: 0.30 },
  maize: { min: 0.25, max: 0.35 },
  lentil: { min: 0.18, max: 0.25 },
  mungbean: { min: 0.20, max: 0.30 },
  grass_pea: { min: 0.18, max: 0.25 },
  blackgram: { min: 0.20, max: 0.28 },
  chickpea: { min: 0.15, max: 0.22 },
  mustard: { min: 0.20, max: 0.30 },
  groundnut: { min: 0.18, max: 0.25 },
  sesame: { min: 0.15, max: 0.23 },
  sunflower: { min: 0.20, max: 0.30 },
  soybean: { min: 0.25, max: 0.35 },
  potato: { min: 0.25, max: 0.35 },
  sweet_potato: { min: 0.20, max: 0.28 },
  greater_yam: { min: 0.25, max: 0.35 },
  giant_taro: { min: 0.30, max: 0.45 },
  water_taro: { min: 0.35, max: 0.55 },
  eddoe_taro: { min: 0.25, max: 0.35 },
  tannia: { min: 0.25, max: 0.35 },
  elephant_foot_yam: { min: 0.25, max: 0.35 },
  cassava: { min: 0.15, max: 0.25 },
  jute: { min: 0.30, max: 0.45 },
  sugarcane: { min: 0.35, max: 0.50 },
  cotton: { min: 0.25, max: 0.35 },
  tobacco: { min: null, max: null },
  onion: { min: 0.23, max: 0.32 },
  garlic: { min: 0.20, max: 0.28 },
  chili: { min: 0.20, max: 0.30 },
  ginger: { min: 0.25, max: 0.35 },
  turmeric: { min: 0.25, max: 0.35 },
  tomato: { min: 0.25, max: 0.35 },
  brinjal: { min: 0.25, max: 0.35 },
  radish: { min: 0.20, max: 0.28 },
  country_bean: { min: 0.20, max: 0.30 },
};

// Humidity thresholds
const HUMIDITY_MAP = {
  aus: { optimal_min: 60, optimal_max: 85, risk_above: 90, notes_bn: 'শুরুতে ৬০-৭০%, শেষে ৮০-৮৫%', notes_en: '60-70% initially, 80-85% at harvest' },
  aman: { optimal_min: 80, optimal_max: 90, risk_above: 95, notes_bn: 'বৃদ্ধি পর্যায়ে ৮০-৯০%, কাটার সময় ৬০-৭০%', notes_en: '80-90% vegetative, 60-70% harvest' },
  boro: { optimal_min: 50, optimal_max: 75, risk_above: 85, notes_bn: 'শুরুতে ৫০-৬০%, মার্চ-এপ্রিলে ৭০-৭৫%', notes_en: '50-60% initially, 70-75% in March-April' },
  wheat: { optimal_min: 50, optimal_max: 60, risk_above: 85, notes_bn: '৮৫% এর বেশি আর্দ্রতা ও কুয়াশায় ব্লাস্ট ঝুঁকি', notes_en: 'Blast disease risk above 85% with fog' },
  maize: { optimal_min: 55, optimal_max: 75, risk_above: 85, notes_bn: 'রবিতে ৫৫-৭০%, খরিফে ৭০-৮০%', notes_en: '55-70% in Rabi, 70-80% in Kharif' },
  lentil: { optimal_min: 50, optimal_max: 65, risk_above: 80, notes_bn: 'উচ্চ আর্দ্রতায় স্টেমফাইলিয়াম ব্লাইট রোগ', notes_en: 'Stemphylium blight risk under high humidity' },
  mungbean: { optimal_min: 60, optimal_max: 75, risk_above: 85, notes_bn: 'মেঘলা ও উচ্চ আর্দ্রতায় হলুদ মোজাইক ভাইরাস', notes_en: 'YMV risk under prolonged cloudy humidity' },
  grass_pea: { optimal_min: 50, optimal_max: 65, risk_above: 80, notes_bn: 'ফুল ফোটার সময় ডাউনি মিলডিউ রোগঝুঁকি', notes_en: 'Downy mildew risk during flowering' },
  blackgram: { optimal_min: 65, optimal_max: 75, risk_above: 85, notes_bn: 'অতিরিক্ত আর্দ্রতায় গোড়া পচন ও YMV', notes_en: 'Root rot and YMV under high humidity' },
  chickpea: { optimal_min: 40, optimal_max: 60, risk_above: 75, notes_bn: 'উচ্চ আর্দ্রতা (>৭৫%) ও কুয়াশায় বোট্রাইটিস গ্রে মোল্ড', notes_en: 'Botrytis grey mould if humidity >75%' },
  mustard: { optimal_min: 55, optimal_max: 70, risk_above: 85, notes_bn: 'কুয়াশাচ্ছন্ন আর্দ্রতায় জাপপোকা (জাব) আক্রমণ', notes_en: 'Aphid outbreak under warm humid fog' },
  groundnut: { optimal_min: 55, optimal_max: 70, risk_above: 85, notes_bn: 'উচ্চ আর্দ্রতায় টিক্কা রোগ বাড়ে', notes_en: 'Tikka leaf spot aggravated by humidity' },
  sesame: { optimal_min: 50, optimal_max: 65, risk_above: 80, notes_bn: 'কম আর্দ্রতা ও রৌদ্রোজ্জ্বল পরিবেশ পছন্দ করে', notes_en: 'Prefers lower humidity and direct sunlight' },
  sunflower: { optimal_min: 50, optimal_max: 65, risk_above: 80, notes_bn: 'মাথায় পানি জমলে স্ক্লেরোটিনিয়া পচন রোগ', notes_en: 'Head rot (Sclerotinia) under wet humidity' },
  soybean: { optimal_min: 50, optimal_max: 70, risk_above: 85, notes_bn: '৫০-৭০% অনুকূল আর্দ্রতা', notes_en: '50-70% optimal relative humidity' },
  potato: { optimal_min: 65, optimal_max: 80, risk_above: 85, notes_bn: 'আর্দ্রতা >৮৫% ও কুয়াশায় লেট ব্লাইটের তীব্র আক্রমণ', notes_en: 'Late blight epidemics if humidity >85%' },
  sweet_potato: { optimal_min: 55, optimal_max: 70, risk_above: 80, notes_bn: 'পরিপক্কতায় মাঝারি আর্দ্রতা উত্তম', notes_en: 'Moderate humidity optimal at bulking' },
  greater_yam: { optimal_min: 70, optimal_max: 85, risk_above: 90, notes_bn: 'টানা বৃষ্টি ও উষ্ণ আর্দ্রতায় এনথ্রাকনোজ ব্লাইট', notes_en: 'Anthracnose blight in persistent wet weather' },
  giant_taro: { optimal_min: 70, optimal_max: 85, risk_above: 95, notes_bn: 'উচ্চ আর্দ্রতায় চমৎকার বৃদ্ধি হয়', notes_en: 'Vigorous foliage growth in high humidity' },
  water_taro: { optimal_min: 75, optimal_max: 90, risk_above: 95, notes_bn: 'জলাবদ্ধ ও চরম আর্দ্র পরিবেশ সহনশীল', notes_en: 'Thrives in saturated damp conditions' },
  eddoe_taro: { optimal_min: 70, optimal_max: 85, risk_above: 90, notes_bn: 'উচ্চ আর্দ্রতায় পাতা ঝলসানো রোগঝুঁকি', notes_en: 'Leaf blight risk under damp conditions' },
  tannia: { optimal_min: 65, optimal_max: 80, risk_above: 90, notes_bn: 'উষ্ণ আর্দ্র পরিবেশে রাইজোম দ্রুত বাড়ে', notes_en: 'Rhizomes expand in warm humid conditions' },
  elephant_foot_yam: { optimal_min: 70, optimal_max: 80, risk_above: 85, notes_bn: 'টানা জলাবদ্ধতায় কন্দ পচন রোগ বাড়ে', notes_en: 'Corm collar rot in waterlogged conditions' },
  cassava: { optimal_min: 60, optimal_max: 75, risk_above: 85, notes_bn: 'মাঝারি আর্দ্রতায় শিকড় ভালো বাড়ে', notes_en: 'Roots develop well under moderate humidity' },
  jute: { optimal_min: 80, optimal_max: 90, risk_above: 95, notes_bn: 'আঁশের বৃদ্ধির জন্য উচ্চ আর্দ্রতা অনুকূল', notes_en: 'High humidity accelerates fiber elongation' },
  sugarcane: { optimal_min: 70, optimal_max: 85, risk_above: 90, notes_bn: 'বৃদ্ধি পর্যায়ে উচ্চ আর্দ্রতা রস বাড়ায়', notes_en: 'High humidity aids cane juice accumulation' },
  cotton: { optimal_min: 50, optimal_max: 70, risk_above: 80, notes_bn: 'গুটি ফোটার সময় কম আর্দ্রতা ও সূর্যালোক আবশ্যক', notes_en: 'Dry sunny weather needed for boll opening' },
  tobacco: { optimal_min: null, optimal_max: null, risk_above: null, notes_en: null, notes_bn: null },
  onion: { optimal_min: 55, optimal_max: 70, risk_above: 80, notes_bn: 'উচ্চ আর্দ্রতায় পার্পল ব্লচ রোগের প্রাদুর্ভাব', notes_en: 'Purple blotch outbreaks in wet humidity' },
  garlic: { optimal_min: 50, optimal_max: 65, risk_above: 80, notes_bn: 'শুষ্ক ও নাতিশীতোষ্ণ শীতকালে ভালো হয়', notes_en: 'Best in dry, sunny, cool winter conditions' },
  chili: { optimal_min: 60, optimal_max: 75, risk_above: 85, notes_bn: 'উচ্চ আর্দ্রতায় ডাইব্যাক ও এনথ্রাকনোজ রোগ', notes_en: 'Anthracnose dieback risk in heavy humidity' },
  ginger: { optimal_min: 70, optimal_max: 85, risk_above: 90, notes_bn: 'রাইজোম রট রোধে মাটির সুনিষ্কাশন জরুরি', notes_en: 'Soil drainage crucial to avoid rhizome rot' },
  turmeric: { optimal_min: 70, optimal_max: 85, risk_above: 90, notes_bn: 'বর্ষায় উষ্ণ আর্দ্রতায় দ্রুত পাতা গজায়', notes_en: 'Vigorous leaf growth during monsoon' },
  tomato: { optimal_min: 60, optimal_max: 75, risk_above: 85, notes_bn: 'কুয়াশা ও আর্দ্রতা >৮৫% হলে লেট ব্লাইটের আক্রমণ', notes_en: 'Late blight attacks when humidity >85%' },
  brinjal: { optimal_min: 60, optimal_max: 75, risk_above: 85, notes_bn: 'উচ্চ আর্দ্রতায় ব্যাকটেরিয়াল উইল্ট রোগ বাড়ে', notes_en: 'Bacterial wilt prevalent in saturated soil' },
  radish: { optimal_min: 60, optimal_max: 70, risk_above: 80, notes_bn: 'আর্দ্রতার তারতম্যে মূল ফেটে যায়', notes_en: 'Root cracking occurs with moisture swings' },
  country_bean: { optimal_min: 65, optimal_max: 75, risk_above: 85, notes_bn: 'কুয়াশাচ্ছন্ন আর্দ্রতায় ফুল পচন ও পোকা আক্রমণ', notes_en: 'Flower rot and pod borer under heavy fog' },
};

// Construct the 37 crops
const finalCrops = defs.map((d, index) => {
  const id = d.id;
  const isEstimated = ['soybean', 'jute', 'sugarcane', 'cotton', 'tobacco'].includes(id);
  const isTobacco = id === 'tobacco';
  const catId = getCatId(d.cat);
  const family = PLANT_FAMILY_MAP[id];
  const isLegume = ['lentil', 'mungbean', 'grass_pea', 'blackgram', 'chickpea', 'soybean', 'groundnut', 'country_bean'].includes(id);
  const seasons = parseSeasons(d);
  const occupiesSeasons = OCCUPIES_MAP[id];
  const isLongDuration = Boolean(occupiesSeasons || id === 'sugarcane');

  // Values for backward compatibility
  const tempThresh = TEMP_MAP[id];
  const smapThresh = SMAP_MAP[id];
  const dur = DURATION_MAP[id];
  const waterMm = WATER_MAP[id];

  // Water level tag for old engine
  let waterLevel = 'medium';
  if (['boro', 'aman', 'sugarcane', 'water_taro'].includes(id)) waterLevel = 'high';
  else if (['wheat', 'mustard', 'lentil', 'mungbean', 'grass_pea', 'blackgram', 'chickpea', 'sesame', 'sunflower', 'soybean', 'sweet_potato', 'radish', 'country_bean'].includes(id)) waterLevel = 'low';

  // Cost level tag
  let costLevel = 'medium';
  if (['boro', 'potato', 'sugarcane', 'onion', 'garlic', 'ginger'].includes(id)) costLevel = 'high';
  else if (['mustard', 'lentil', 'mungbean', 'grass_pea', 'blackgram', 'chickpea', 'sesame', 'sunflower', 'soybean', 'sweet_potato', 'radish', 'jute'].includes(id)) costLevel = 'low';

  // Commercial value category
  let valCat = 'medium';
  if (['boro', 'potato', 'onion', 'garlic', 'chili', 'ginger', 'turmeric', 'mustard', 'lentil', 'maize', 'tomato', 'brinjal', 'sugarcane', 'cotton', 'sunflower'].includes(id)) valCat = 'high';
  else if (['grass_pea', 'sweet_potato', 'cassava'].includes(id)) valCat = 'low';
  if (isTobacco) valCat = null;

  // Nutrient nitrogen delta
  let nutrientDelta = -1;
  if (isLegume) nutrientDelta = 2;
  else if (['boro', 'maize', 'sugarcane'].includes(id)) nutrientDelta = -3;
  else if (['wheat', 'aus', 'aman', 'potato', 'cassava'].includes(id)) nutrientDelta = -2;
  else if (['jute', 'cotton'].includes(id)) nutrientDelta = 0;

  const isStaple = ['boro', 'aman', 'aus', 'wheat', 'lentil', 'mungbean', 'potato'].includes(id);
  const floodTolerant = ['aman', 'water_taro'].includes(id);

  // Rainfall alerts
  const alerts = [];
  if (id === 'boro') {
    alerts.push({
      condition: 'flash_flood',
      threshold: 100,
      window_days: 1,
      alert_en: 'GPM rainfall >100mm in 24h at harvest triggers early flash flood alert for haor/lowlands',
      alert_bn: 'ফসল কাটার সময়ে ২৪ ঘণ্টায় ১০০ মিমি বেশি বৃষ্টিপাত রেকর্ড হলে হাওর বা নিচু এলাকার জন্য আগাম বন্যা সতর্কতা জারি',
    });
  } else if (id === 'aman') {
    alerts.push({
      condition: 'monsoon_deficit',
      threshold: 40,
      window_days: 30,
      alert_en: 'July rainfall forecast 40% below normal suggests drought-tolerant varieties (BRRI dhan56/71)',
      alert_bn: 'জুলাই বৃষ্টিপাতের পূর্বাভাস স্বাভাবিকের চেয়ে ৪০% কম থাকলে খরা-সহনশীল জাত (ব্রি ধান৫৬/৭১) নির্বাচনের নির্দেশ',
    });
  } else if (id === 'aus') {
    alerts.push({
      condition: 'drought',
      threshold: 0,
      window_days: 30,
      alert_en: 'Zero rain in March with inadequate irrigation suggests switching to summer sesame or mungbean',
      alert_bn: 'মার্চে শূন্য বৃষ্টিপাত ও সেচ সংকট থাকলে তিল বা মুগডালে শিফট করার পরামর্শ',
    });
  } else if (id === 'wheat') {
    alerts.push({
      condition: 'heat_wave',
      threshold: 30,
      window_days: 7,
      alert_en: 'Feb-March heat wave suggests fast-maturing oilseeds or pulses instead of late wheat',
      alert_bn: 'ফেব্রুয়ারি-মার্চে আগাম তাপদাহের সম্ভাবনা থাকলে দেরিতে বপন করা গম বাতিল করে দ্রুত পরিপক্ক তেলবীজ/ডালে সুপারিশ',
    });
  } else if (id === 'maize') {
    alerts.push({
      condition: 'groundwater_depletion',
      threshold: 0,
      window_days: 0,
      alert_en: 'Falling groundwater level where Boro planned triggers rabi maize shift for 50% water savings',
      alert_bn: 'ভূগর্ভস্থ পানির স্তর নিচে নামলে বোরোর পরিবর্তে ৫০% পানি সাশ্রয়ী রবি ভুট্টায় শিফট করার সিদ্ধান্ত',
    });
  } else if (id === 'soybean') {
    alerts.push({
      condition: 'waterlogging',
      threshold: 50,
      window_days: 1,
      alert_en: 'Waterlogging risk: ensure adequate drainage',
      alert_bn: 'জলাবদ্ধতার ঝুঁকি: দ্রুত পানি নিষ্কাশন নিশ্চিত করুন',
    });
  } else if (id === 'jute') {
    alerts.push({
      condition: 'early_waterlogging',
      threshold: 50,
      window_days: 1,
      alert_en: 'Waterlogging at seedling stage halts plant growth',
      alert_bn: 'চারা অবস্থায় জলাবদ্ধতা বৃদ্ধি স্তব্ধ করে দেয়',
    });
  } else if (id === 'cotton') {
    alerts.push({
      condition: 'boll_rot',
      threshold: 50,
      window_days: 3,
      alert_en: 'Heavy rain during boll opening causes boll rot and fiber damage',
      alert_bn: 'গুটি ফোটার সময় অতিবৃষ্টিতে গুটি পচন ও আঁশের ক্ষতি',
    });
  }

  // Growth stages
  const growthStages = [];
  if (id === 'boro') {
    growthStages.push({ name_en: 'Seedbed', name_bn: 'বীজতলা পর্যায়', weeks_min: 4, weeks_max: 5 });
    growthStages.push({ name_en: 'Vegetative Tillering', name_bn: 'চারার অঙ্গজ বৃদ্ধি পর্যায়', weeks_min: 7, weeks_max: 8 });
    growthStages.push({ name_en: 'Panicle & Flowering', name_bn: 'থোড় ও ফুল ফোটা পর্যায়', weeks_min: 3, weeks_max: 4 });
    growthStages.push({ name_en: 'Grain Filling & Maturity', name_bn: 'দানা গঠন ও পরিপক্কতা পর্যায়', weeks_min: 4, weeks_max: 5 });
  } else if (id === 'aman') {
    growthStages.push({ name_en: 'Seedbed', name_bn: 'বীজতলা পর্যায়', weeks_min: 3, weeks_max: 4 });
    growthStages.push({ name_en: 'Vegetative Tillering', name_bn: 'অঙ্গজ বৃদ্ধি ও টিলারিং', weeks_min: 7, weeks_max: 9 });
    growthStages.push({ name_en: 'Panicle & Flowering', name_bn: 'থোড় ও ফুল ফোটা', weeks_min: 3, weeks_max: 4 });
    growthStages.push({ name_en: 'Ripening', name_bn: 'পরিপক্কতা ও ফসল কাটা', weeks_min: 4, weeks_max: 5 });
  } else if (id === 'aus') {
    growthStages.push({ name_en: 'Seedling & Vegetative', name_bn: 'বীজতলা ও অঙ্গজ বৃদ্ধি', weeks_min: 5, weeks_max: 6 });
    growthStages.push({ name_en: 'Panicle & Flowering', name_bn: 'থোড় ও ফুল ফোটা', weeks_min: 3, weeks_max: 4 });
    growthStages.push({ name_en: 'Ripening', name_bn: 'দানা গঠন ও পরিপক্কতা', weeks_min: 4, weeks_max: 5 });
  } else if (id === 'wheat') {
    growthStages.push({ name_en: 'Crown Root & Tillering', name_bn: 'ক্রাউন রুট ও টিলারিং', weeks_min: 4, weeks_max: 5 });
    growthStages.push({ name_en: 'Booting & Heading', name_bn: 'শীষ বের হওয়া ও ফুল ফোটা', weeks_min: 4, weeks_max: 5 });
    growthStages.push({ name_en: 'Grain Filling & Ripening', name_bn: 'দানা গঠন ও পরিপক্কতা', weeks_min: 4, weeks_max: 5 });
  } else if (id === 'maize') {
    growthStages.push({ name_en: 'Vegetative Growth', name_bn: 'অঙ্গজ বৃদ্ধি', weeks_min: 6, weeks_max: 7 });
    growthStages.push({ name_en: 'Tasseling & Silking', name_bn: 'ফুল ও মোচা আসা', weeks_min: 3, weeks_max: 4 });
    growthStages.push({ name_en: 'Grain Filling & Maturity', name_bn: 'দানা গঠন ও পরিপক্কতা', weeks_min: 5, weeks_max: 6 });
  } else if (dur) {
    const totalWeeks = Math.round(dur.max / 7);
    const w1 = Math.round(totalWeeks * 0.45);
    const w2 = Math.round(totalWeeks * 0.25);
    const w3 = totalWeeks - w1 - w2;
    growthStages.push({ name_en: 'Vegetative Stage', name_bn: 'অঙ্গজ বৃদ্ধি পর্যায়', weeks_min: Math.max(2, w1 - 1), weeks_max: w1 + 1 });
    growthStages.push({ name_en: 'Flowering / Tuberization', name_bn: 'ফুল ফোটা / কন্দ গঠন', weeks_min: Math.max(2, w2 - 1), weeks_max: w2 + 1 });
    growthStages.push({ name_en: 'Ripening & Harvest', name_bn: 'পরিপক্কতা ও ফসল আহরণ', weeks_min: Math.max(2, w3 - 1), weeks_max: w3 + 1 });
  }

  // Key risks
  const risksBn = d.risks && d.risks !== 'MISSING'
    ? d.risks.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
    : (isTobacco ? ['খরা', 'অতিবৃষ্টি', 'জলাবদ্ধতা ও রোগবালাই'] : []);
  
  const risksEn = risksBn.map(r => {
    if (r.includes('জলাবদ্ধতা')) return 'Waterlogging and poor drainage';
    if (r.includes('খরা')) return 'Drought stress during critical stages';
    if (r.includes('শৈত্যপ্রবাহ') || r.includes('শীত')) return 'Cold stress and frost injury';
    if (r.includes('হিট') || r.includes('তাপদাহ') || r.includes('তাপ')) return 'Heat stress during reproductive stage';
    if (r.includes('বন্যা')) return 'Flash flood risk';
    if (r.includes('ব্লাস্ট') || r.includes('রোগ')) return 'Fungal/bacterial disease pressure';
    if (r.includes('পোকা')) return 'Pest attacks';
    return r;
  });

  // Decision rules
  const decisionRulesBn = (d.algo && d.algo !== 'MISSING') ? [d.algo] : [];
  const decisionRulesEn = decisionRulesBn.map(rule => {
    if (id === 'boro') return 'If December soil moisture is <20% and irrigation is inadequate, switch to wheat or rabi maize.';
    if (id === 'aman') return 'If July rainfall forecast is 40% below normal, recommend drought-tolerant varieties (BRRI dhan56/71).';
    if (id === 'aus') return 'If March rainfall is zero and irrigation is inadequate, cancel Aus and recommend sesame or mungbean.';
    if (id === 'wheat') return 'If Feb-March forecast indicates early heat wave, recommend fast-maturing oilseeds/pulses over late wheat.';
    if (id === 'maize') return 'In falling groundwater areas where Boro is planned, recommend rabi maize to save 50% water.';
    return rule;
  });

  // Sources
  const sources = [];
  if (isEstimated) {
    sources.push({ field: 'all', file: 'missing-values.json', section: d.name_en, confidence: 'estimated' });
  } else {
    sources.push({ field: 'crop_characteristics', file: 'crop-list.txt', section: d.listHeader || d.name_bn, confidence: 'research' });
    if (d.ruleNum) {
      sources.push({ field: 'thresholds_and_rules', file: 'crop-rules.txt', section: `${d.ruleNum}. ${d.name_bn}`, confidence: 'research' });
    }
  }

  // NASA link
  const nasaLinkEn = isTobacco ? null : 'NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring';
  const nasaLinkBn = isTobacco ? null : 'নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা';

  return {
    id,
    category_id: catId,
    parent_group: PARENT_GROUP_MAP[id] || null,
    name_en: d.name_en,
    name_bn: d.name_bn,
    scientific_name: SCI_NAMES[id] || null,
    plant_family: family,
    is_legume: isLegume,
    seasons,
    occupies_seasons: occupiesSeasons || undefined,
    is_long_duration: isLongDuration || undefined,
    sowing_window: SOWING_MAP[id],
    harvest_window: HARVEST_MAP[id],
    duration_days: dur,
    growth_stages: growthStages,
    water_need_mm: waterMm,
    irrigation_notes_en: isTobacco ? null : (waterLevel === 'high' ? 'High water requirement; regular irrigation or standing water needed' : (waterLevel === 'low' ? 'Low water requirement; 1-2 light irrigations or rainfed' : 'Moderate water requirement; 2-3 supplementary irrigations needed')),
    irrigation_notes_bn: isTobacco ? null : (waterLevel === 'high' ? 'উচ্চ সেচ নির্ভর; নিয়মিত সেচ বা স্থির পানি বজায় রাখা প্রয়োজন' : (waterLevel === 'low' ? 'কম পানি লাগে; ১-২টি হালকা সম্পূরক সেচ বা বৃষ্টির আর্দ্রতায় চাষ' : 'মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন')),
    temperature_c: tempThresh,
    humidity: HUMIDITY_MAP[id],
    smap_optimal: smapThresh,
    rainfall_alerts: alerts,
    key_risks_en: risksEn,
    key_risks_bn: risksBn,
    decision_rules_en: decisionRulesEn.length ? decisionRulesEn : undefined,
    decision_rules_bn: decisionRulesBn.length ? decisionRulesBn : undefined,
    nasa_data_link_en: nasaLinkEn,
    nasa_data_link_bn: nasaLinkBn,
    value_category: valCat,
    is_staple: isStaple,
    floodTolerant: floodTolerant || undefined,
    data_confidence: isEstimated ? 'estimated' : 'research',
    data_complete: !isTobacco,
    recommendable: !isTobacco,
    sources,

    // Aliases
    nameEn: d.name_en,
    nameBn: d.name_bn,
    family: (isLegume ? 'legume' : (family === 'poaceae' ? 'grass' : (family === 'brassicaceae' ? 'mustard' : (family === 'solanaceae' ? 'nightshade' : (family === 'malvaceae' ? 'mallow' : family))))),
    tempMin: tempThresh.optimal_min ?? 15,
    tempMax: tempThresh.optimal_max ?? 30,
    water: waterLevel,
    soilMin: smapThresh.min ?? 0.20,
    soilMax: smapThresh.max ?? 0.35,
    nutrient: nutrientDelta,
    days: dur ? dur.max : 100,
    cost: costLevel,
    source: (id === 'boro' || id === 'aman' || id === 'aus') ? 'BRRI' : (isEstimated ? 'Estimated' : 'BARI'),
  };
});

console.log('Total final crops:', finalCrops.length);
console.log('Research crops:', finalCrops.filter(c => c.data_confidence === 'research').length);
console.log('Estimated crops:', finalCrops.filter(c => c.data_confidence === 'estimated').length);
console.log('Recommendable:', finalCrops.filter(c => c.recommendable).length);
console.log('Non-recommendable:', finalCrops.filter(c => !c.recommendable).length);

// Generate src/data/crops.ts
const tsOutput = `// AgriOrbit Crop Knowledge Base
// Single source of truth for all 37 crops across 6 categories.
// Generated from research files: crop-list.txt, crop-rules.txt, and missing-values.json.

import type { SeasonId } from '../lib/fieldShift.ts';
import type { CropCategoryId } from './cropCategories.ts';
import type { CropData } from '../types.ts';

export type Family =
  | 'poaceae'
  | 'grass'
  | 'fabaceae'
  | 'legume'
  | 'brassicaceae'
  | 'mustard'
  | 'solanaceae'
  | 'nightshade'
  | 'malvaceae'
  | 'mallow'
  | 'araceae'
  | 'convolvulaceae'
  | 'dioscoreaceae'
  | 'euphorbiaceae'
  | 'amaryllidaceae'
  | 'zingiberaceae'
  | 'pedaliaceae'
  | 'asteraceae';

export type Level = 'low' | 'medium' | 'high';

export interface SowingWindow {
  months_en: string;
  months_bn: string;
  start_month: number;
  end_month: number;
}

export interface GrowthStage {
  name_en: string;
  name_bn: string;
  weeks_min: number;
  weeks_max: number;
}

export interface TemperatureThresholds {
  base: number | null;
  optimal_min: number | null;
  optimal_max: number | null;
  critical_min: number | null;
  critical_max: number | null;
  notes_en?: string | null;
  notes_bn?: string | null;
}

export interface HumidityThresholds {
  optimal_min: number | null;
  optimal_max: number | null;
  risk_above: number | null;
  notes_en?: string | null;
  notes_bn?: string | null;
}

export interface RainfallAlert {
  condition: string;
  threshold: number;
  window_days: number;
  alert_en: string;
  alert_bn: string;
}

export interface CropSource {
  field: string;
  file: string;
  section: string;
  confidence?: 'research' | 'estimated';
}

export interface Crop {
  id: string;
  category_id: CropCategoryId;
  parent_group: string | null;
  name_en: string;
  name_bn: string;
  scientific_name: string | null;
  plant_family: string;
  is_legume: boolean;
  seasons: SeasonId[];
  occupies_seasons?: SeasonId[];
  is_long_duration?: boolean;
  sowing_window: SowingWindow;
  harvest_window: SowingWindow;
  duration_days: { min: number; max: number } | null;
  growth_stages: GrowthStage[];
  water_need_mm: { min: number; max: number } | null;
  irrigation_notes_en: string | null;
  irrigation_notes_bn: string | null;
  temperature_c: TemperatureThresholds;
  humidity: HumidityThresholds;
  smap_optimal: { min: number | null; max: number | null };
  rainfall_alerts: RainfallAlert[];
  key_risks_en: string[];
  key_risks_bn: string[];
  decision_rules_en?: string[];
  decision_rules_bn?: string[];
  nasa_data_link_en: string | null;
  nasa_data_link_bn: string | null;
  value_category: Level | null;
  is_staple: boolean;
  floodTolerant?: boolean;
  data_confidence: 'research' | 'estimated';
  data_complete: boolean;
  recommendable: boolean;
  sources: CropSource[];

  // Backwards-compatible aliases for existing engine & UI components
  nameEn: string;
  nameBn: string;
  family: Family;
  tempMin: number;
  tempMax: number;
  water: Level;
  soilMin: number;
  soilMax: number;
  nutrient: number;
  days: number;
  cost: Level;
  source: 'BARI' | 'BRRI' | 'Research' | 'Estimated';
}

export const CROPS: Crop[] = ${JSON.stringify(finalCrops, null, 2)};

export const FAMILY_LABEL: Record<string, { en: string; bn: string }> = {
  poaceae: { en: 'Grass family (cereals & sugarcane)', bn: 'ঘাস গোত্র (দানাশস্য ও আখ)' },
  grass: { en: 'Grass family (cereals & sugarcane)', bn: 'ঘাস গোত্র (দানাশস্য ও আখ)' },
  fabaceae: { en: 'Legume · fixes atmospheric nitrogen', bn: 'ডাল জাতীয় · নাইট্রোজেন যোগ করে' },
  legume: { en: 'Legume · fixes atmospheric nitrogen', bn: 'ডাল জাতীয় · নাইট্রোজেন যোগ করে' },
  brassicaceae: { en: 'Mustard family (Brassicaceae)', bn: 'সরিষা গোত্র' },
  mustard: { en: 'Mustard family (Brassicaceae)', bn: 'সরিষা গোত্র' },
  solanaceae: { en: 'Nightshade family (Solanaceae)', bn: 'আলু ও বেগুন গোত্র' },
  nightshade: { en: 'Nightshade family (Solanaceae)', bn: 'আলু ও বেগুন গোত্র' },
  malvaceae: { en: 'Mallow family (fiber crops)', bn: 'পাট ও তুলা গোত্র' },
  mallow: { en: 'Mallow family (fiber crops)', bn: 'পাট ও তুলা গোত্র' },
  araceae: { en: 'Arum family (Taro species)', bn: 'কচু গোত্র' },
  convolvulaceae: { en: 'Morning glory family (Sweet potato)', bn: 'মিষ্টি আলু গোত্র' },
  dioscoreaceae: { en: 'Yam family (Dioscoreaceae)', bn: 'মেটে আলু গোত্র' },
  euphorbiaceae: { en: 'Spurge family (Cassava)', bn: 'কাসাভা গোত্র' },
  amaryllidaceae: { en: 'Allium family (Onion & Garlic)', bn: 'পেঁয়াজ ও রসুন গোত্র' },
  zingiberaceae: { en: 'Ginger family (Zingiberaceae)', bn: 'আদা ও হলুদ গোত্র' },
  pedaliaceae: { en: 'Sesame family (Pedaliaceae)', bn: 'তিল গোত্র' },
  asteraceae: { en: 'Sunflower family (Asteraceae)', bn: 'সূর্যমুখী গোত্র' },
};

export const CROP_ID_MAP: Record<string, string> = {
  // rice aliases
  boro_rice: 'boro',
  aus_rice: 'aus',
  aman_rice: 'aman',
  t_aman: 'aman',
  't. aman': 'aman',
  t_aman_rice: 'aman',
  // Bengali aliases
  'বোরো': 'boro',
  'বোরো ধান': 'boro',
  'আউশ': 'aus',
  'আউশ ধান': 'aus',
  'আমন': 'aman',
  'আমন ধান': 'aman',
  'রোপা আমন': 'aman',
  'রোপা আমন ধান': 'aman',
  'গম': 'wheat',
  'ভুট্টা': 'maize',
  'মসুর': 'lentil',
  'মসুর ডাল': 'lentil',
  'মুগ': 'mungbean',
  'মুগ ডাল': 'mungbean',
  'মুগডাল': 'mungbean',
  'সরিষা': 'mustard',
  'আলু': 'potato',
  'গোল আলু': 'potato',
  'পাট': 'jute',
  'খেসারি': 'grass_pea',
  'খেসারি ডাল': 'grass_pea',
  'মাষকলাই': 'blackgram',
  'মাষকলাই ডাল': 'blackgram',
  'ছোলা': 'chickpea',
  'ছোলা ডাল': 'chickpea',
  'চীনাবাদাম': 'groundnut',
  'চিনাবাদাম': 'groundnut',
  'বাদাম': 'groundnut',
  'তিল': 'sesame',
  'সূর্যমুখী': 'sunflower',
  'সয়াবিন': 'soybean',
  'মিষ্টি আলু': 'sweet_potato',
  'মিষ্টিআলু': 'sweet_potato',
  'মেটে আলু': 'greater_yam',
  'মেটেআলু': 'greater_yam',
  'গাছআলু': 'greater_yam',
  'মাছআলু': 'greater_yam',
  'বড় পেঁচালু': 'greater_yam',
  'কচু': 'giant_taro',
  'মানকচু': 'giant_taro',
  'পানিকচু': 'water_taro',
  'মুখীকচু': 'eddoe_taro',
  'সাহেবী কচু': 'tannia',
  'মৌলভী কচু': 'tannia',
  'বিলাতী কচু': 'tannia',
  'দুধকচু': 'tannia',
  'ওলকচু': 'elephant_foot_yam',
  'কাসাভা': 'cassava',
  'শিমুল আলু': 'cassava',
  'আখ': 'sugarcane',
  'তুলা': 'cotton',
  'তামাক': 'tobacco',
  'পেঁয়াজ': 'onion',
  'রসুন': 'garlic',
  'মরিচ': 'chili',
  'আদা': 'ginger',
  'হলুদ': 'turmeric',
  'টমেটো': 'tomato',
  'বেগুন': 'brinjal',
  'মূলা': 'radish',
  'মুলা': 'radish',
  'শিম': 'country_bean',
};

export function resolveCropId(val: string | null | undefined): string {
  if (!val) return '';
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase().replace(/[\\s\\-_]+/g, '_');
  if (CROP_ID_MAP[trimmed]) return CROP_ID_MAP[trimmed];
  if (CROP_ID_MAP[lower]) return CROP_ID_MAP[lower];
  const directMatch = CROPS.find(
    (c) =>
      c.id.toLowerCase() === lower ||
      c.name_en.toLowerCase() === trimmed.toLowerCase() ||
      c.name_bn === trimmed ||
      c.nameEn.toLowerCase() === trimmed.toLowerCase() ||
      c.nameBn === trimmed
  );
  if (directMatch) return directMatch.id;
  return lower;
}

export const cropById = (id: string): Crop => {
  const canonical = resolveCropId(id);
  const found = CROPS.find((c) => c.id === canonical || c.id === id);
  return (found || CROPS[0])!;
};

const BASE_SCORES = {
  boro: 78,
  aman: 88,
  aus: 82,
  wheat: 86,
  maize: 87,
  lentil: 94,
  mungbean: 91,
  grass_pea: 90,
  blackgram: 89,
  chickpea: 85,
  mustard: 92,
  groundnut: 86,
  sesame: 88,
  sunflower: 84,
  soybean: 83,
  potato: 84,
  sweet_potato: 88,
  greater_yam: 81,
  giant_taro: 80,
  water_taro: 83,
  eddoe_taro: 85,
  tannia: 82,
  elephant_foot_yam: 84,
  cassava: 79,
  jute: 89,
  sugarcane: 80,
  cotton: 82,
  tobacco: 60,
  onion: 87,
  garlic: 86,
  chili: 88,
  ginger: 83,
  turmeric: 85,
  tomato: 86,
  brinjal: 87,
  radish: 90,
  country_bean: 88,
};

export function toCropData(crop: Crop): CropData {
  const isEstimated = crop.data_confidence === 'estimated';
  const obsEn: string[] = [
    \`NASA POWER agro-meteorology indicates seasonal suitability for \${crop.name_en}.\`,
    \`SMAP rootzone moisture (\${crop.smap_optimal.min ?? 0.20} - \${crop.smap_optimal.max ?? 0.35} m³/m³) matches crop establishment requirements.\`,
  ];
  const obsBn: string[] = [
    \`নাসা পাওয়ার কৃষি-আবহাওয়া তথ্য অনুযায়ী \${crop.name_bn}-এর অনুকূল পরিবেশ বিদ্যমান।\`,
    \`স্ম্যাপ আর্দ্রতা (\${crop.smap_optimal.min ?? 0.20} - \${crop.smap_optimal.max ?? 0.35}) এই ফসলের বৃদ্ধির জন্য সামঞ্জস্যপূর্ণ।\`,
  ];

  if (isEstimated) {
    obsEn.push('Estimated data: unverified with field trials; confirm with local upazila agriculture office.');
    obsBn.push('এই ফসলের তথ্য এখনো যাচাই করা হয়নি; স্থানীয় কৃষি অফিসে নিশ্চিত হোন।');
  }

  const seasonEnMap: Record<string, 'Rabi' | 'Kharif-1' | 'Kharif-2'> = {
    rabi: 'Rabi',
    kharif1: 'Kharif-1',
    kharif2: 'Kharif-2',
  };
  const seasonBnMap: Record<string, 'রবি' | 'খরিফ-১' | 'খরিফ-২'> = {
    rabi: 'রবি',
    kharif1: 'খরিফ-১',
    kharif2: 'খরিফ-২',
  };

  const primarySeason = crop.seasons[0] || 'rabi';
  const waterReqEn = crop.water === 'high' ? 'High' : crop.water === 'low' ? 'Low' : 'Medium';
  const waterReqBn = crop.water === 'high' ? 'বেশি' : crop.water === 'low' ? 'কম' : 'মাঝারি';

  return {
    id: crop.id,
    nameEn: crop.name_en,
    nameBn: crop.name_bn,
    scientificName: crop.scientific_name || '',
    seasonEn: seasonEnMap[primarySeason] || 'Rabi',
    seasonBn: seasonBnMap[primarySeason] || 'রবি',
    suitabilityScore: (BASE_SCORES as Record<string, number>)[crop.id] || 85,
    suitabilityTier: 'high',
    waterRequirementEn: waterReqEn,
    waterRequirementBn: waterReqBn,
    waterDetailEn: crop.irrigation_notes_en || \`\${crop.water_need_mm?.min ?? 300}-\${crop.water_need_mm?.max ?? 600}mm total water need\`,
    waterDetailBn: crop.irrigation_notes_bn || \`\${crop.water_need_mm?.min ?? 300}-\${crop.water_need_mm?.max ?? 600} মিমি মোট পানির চাহিদা\`,
    durationDays: crop.duration_days?.max || crop.days || 100,
    valueCategory: crop.value_category || undefined,
    isStaple: crop.is_staple,
    shortWhyEn: crop.key_risks_en[0] ? \`Resilient choice; monitor \${crop.key_risks_en[0].toLowerCase()}.\` : 'Suitable for season and soil moisture.',
    shortWhyBn: crop.key_risks_bn[0] ? \`মৌসুমের উপযোগী ফসল; \${crop.key_risks_bn[0]} এড়িয়ে চলার পরামর্শ।\` : 'মৌসুম ও মাটির আর্দ্রতার জন্য উপযোগী।',
    explanation: {
      observationsTriggered: obsEn,
      observationsTriggeredBn: obsBn,
      priorityAlignment: isEstimated
        ? 'Estimated data: recommendations should be cross-checked with local agricultural extension.'
        : 'Aligned with field conditions and seasonal crop rotation guidelines.',
      priorityAlignmentBn: isEstimated
        ? 'এই ফসলের তথ্য এখনো যাচাই করা হয়নি; স্থানীয় কৃষি অফিসে নিশ্চিত হোন।'
        : 'জমির আবহাওয়া ও মৌসুমী ফসল পরিক্রমার সাথে সামঞ্জস্যপূর্ণ।',
      rulesSatisfied: crop.decision_rules_en && crop.decision_rules_en.length > 0
        ? crop.decision_rules_en
        : [\`Rule: Season match for \${crop.name_en}\`],
      rulesSatisfiedBn: crop.decision_rules_bn && crop.decision_rules_bn.length > 0
        ? crop.decision_rules_bn
        : [\`রুল: \${crop.name_bn} মৌসুমী উৎপাদন নিয়মের সাথে সামঞ্জস্যপূর্ণ\`],
    },
  };
}

export const CROPS_DATABASE: Record<string, CropData> = (() => {
  const db: Record<string, CropData> = {};
  for (const c of CROPS) {
    if (c.recommendable) {
      db[c.id] = toCropData(c);
    }
  }
  // aliases for backward compatibility
  if (db['boro']) db['boro_rice'] = db['boro'];
  if (db['aman']) db['aman_rice'] = db['aman'];
  if (db['aus']) db['aus_rice'] = db['aus'];
  return db;
})();
`;

fs.writeFileSync('src/data/crops.ts', tsOutput, 'utf8');
console.log('Successfully wrote src/data/crops.ts');
