import test from 'node:test';
import assert from 'node:assert';
import {
  toBnDigits,
  getDistrictNames,
  buildBilingualSubject,
  buildBilingualEmailHtml,
  buildBilingualEmailText,
  type AlertEmailItem,
} from './bilingualEmailTemplate.ts';

test('1. toBnDigits: converts Western digits to Bengali numerals', () => {
  assert.strictEqual(toBnDigits('2026-10-24'), '২০২৬-১০-২৪');
  assert.strictEqual(toBnDigits('35.5'), '৩৫.৫');
  assert.strictEqual(toBnDigits(0), '০');
  assert.strictEqual(toBnDigits(123456789), '১২৩৪৫৬৭৮৯');
});

test('2. getDistrictNames: resolves English and Bengali names accurately', () => {
  const rangpur = getDistrictNames('Rangpur');
  assert.strictEqual(rangpur.nameEn, 'Rangpur');
  assert.strictEqual(rangpur.nameBn, 'রংপুর');

  const dinajpur = getDistrictNames('Dinajpur');
  assert.strictEqual(dinajpur.nameEn, 'Dinajpur');
  assert.strictEqual(dinajpur.nameBn, 'দিনাজপুর');

  const fallback = getDistrictNames();
  assert.strictEqual(fallback.nameEn, 'Bangladesh');
  assert.strictEqual(fallback.nameBn, 'বাংলাদেশ');
});

test('3. buildBilingualSubject: builds non-spammy subject lines without ALL CAPS, TEST, or emojis', () => {
  const dailySubject = buildBilingualSubject('রংপুর', 'Rangpur', false);
  assert.strictEqual(
    dailySubject,
    'আজকের ফসল পরামর্শ – রংপুর | AgriOrbit daily update – Rangpur'
  );

  const testSubject = buildBilingualSubject('দিনাজপুর', 'Dinajpur', true);
  assert.strictEqual(
    testSubject,
    'পরীক্ষামূলক ফসল পরামর্শ – দিনাজপুর | AgriOrbit sample update – Dinajpur'
  );

  // Guarantee absence of spam trigger words and shouting
  assert.doesNotMatch(dailySubject, /TEST/);
  assert.doesNotMatch(dailySubject, /!/);
  assert.doesNotMatch(testSubject, /TEST/);
  assert.doesNotMatch(testSubject, /!/);
});

test('4. buildBilingualEmailHtml: enforces UTF-8, Bengali font stack, Bangla first, divider, and actions', () => {
  const mockAlert: AlertEmailItem = {
    id: 'test-uuid-1',
    severity: 'warning',
    alert_type: 'heat',
    data_source: 'NASA POWER',
    data_date: '2026-10-24',
    title_bn: 'তাপপ্রবাহ সতর্কতা: রংপুর (৩৬.৫° সে.)',
    title_en: 'Heat Stress Warning: Rangpur (36.5°C)',
    body_bn: 'রংপুর জেলায় সর্বোচ্চ তাপমাত্রা ৩৬.৫° সে. ছাড়িয়েছে। খড় বিছিয়ে দিন।',
    body_en: 'Maximum day temperature reached 36.5°C in Rangpur. Give light evening irrigation.',
    action_bn: 'মাটি ভেজা রাখতে সন্ধ্যায় হালকা সেচ দিন অথবা খড় বিছিয়ে দিন।',
    action_en: 'Give light evening irrigation or mulch to protect roots from high heat.',
  };

  const html = buildBilingualEmailHtml([mockAlert], 'https://agri-orbit.vercel.app', false);

  // 1. Enforce UTF-8 and font stack
  assert.match(html, /<meta charset="utf-8">/i);
  assert.match(html, /Noto Sans Bengali/);
  assert.match(html, /SolaimanLipi/);
  assert.match(html, /Kalpurush/);

  // 2. Bangla appears before English
  const bnIndex = html.indexOf('তাপপ্রবাহ সতর্কতা: রংপুর');
  const enIndex = html.indexOf('Heat Stress Warning: Rangpur');
  assert.ok(bnIndex > 0, 'Bangla title must be present');
  assert.ok(enIndex > 0, 'English title must be present');
  assert.ok(bnIndex < enIndex, 'Bangla content must appear before English content');

  // 3. Clear divider exists between languages
  assert.match(html, /English Summary/);

  // 4. Action boxes in both languages
  assert.match(html, /করণীয়:/);
  assert.match(html, /মাটি ভেজা রাখতে সন্ধ্যায় হালকা সেচ দিন/);
  assert.match(html, /Recommended Action:/);
  assert.match(html, /Give light evening irrigation/);

  // 5. Data provenance and links
  assert.match(html, /উৎস: NASA POWER/);
  assert.match(html, /২০২৬-১০-২৪/);
  assert.match(html, /https:\/\/agri-orbit\.vercel\.app/);

  // 6. Unsubscribe explanations
  assert.match(html, /আপনি এই ইমেইলটি পেয়েছেন কারণ আপনার অ্যাগ্রিঅরবিট প্রোফাইলে ইমেইল সতর্কতা চালু রয়েছে/);
  assert.match(html, /You receive this because Email alerts are on in your AgriOrbit profile/);
});

test('5. buildBilingualEmailText: generates clean multipart text counterpart', () => {
  const mockAlert: AlertEmailItem = {
    severity: 'danger',
    alert_type: 'flood',
    data_source: 'Open-Meteo',
    data_date: '2026-10-24',
    title_bn: 'ভারী বৃষ্টি ও জলাবদ্ধতার ঝুঁকি: সিলেট (১৮০ মিমি)',
    title_en: 'Heavy Rainfall & Waterlogging Alert: Sylhet (180mm)',
    body_bn: 'সিলেট জেলায় ১৮০ মিমি ভারী বৃষ্টির পূর্বাভাস রয়েছে। নালা পরিষ্কার রাখুন।',
    body_en: 'Forecast predicts heavy rain (180 mm) in Sylhet. Clear drainage ditches.',
  };

  const text = buildBilingualEmailText([mockAlert], 'https://agri-orbit.vercel.app');

  assert.match(text, /\[বাংলা\]/);
  assert.match(text, /ভারী বৃষ্টি ও জলাবদ্ধতার ঝুঁকি: সিলেট/);
  assert.match(text, /\[ENGLISH\]/);
  assert.match(text, /Heavy Rainfall & Waterlogging Alert: Sylhet/);
  assert.match(text, /https:\/\/agri-orbit\.vercel\.app/);
  assert.match(text, /You receive this because Email alerts are on in your AgriOrbit profile/);
});
