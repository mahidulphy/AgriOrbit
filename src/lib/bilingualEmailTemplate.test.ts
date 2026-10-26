import test from 'node:test';
import assert from 'node:assert';
import nodemailer from 'nodemailer';
import {
  toBnDigits,
  getDistrictNames,
  buildBilingualSubject,
  buildBilingualEmailHtml,
  buildBilingualEmailText,
  buildBilingualAlertEmail,
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

test('6. buildBilingualAlertEmail: returns unencoded separate { subject, text, html } with standard logo tag', () => {
  const mockAlert: AlertEmailItem = {
    severity: 'info',
    data_source: 'NASA POWER',
    data_date: '2026-10-25',
    title_bn: 'স্বাভাবিক ফসল অবস্থা: রংপুর',
    title_en: 'Normal Field Conditions: Rangpur',
    body_bn: 'মাঠের আর্দ্রতা ও তাপমাত্রা স্বাভাবিক রয়েছে।',
    body_en: 'Field moisture and temperature remain within seasonal range.',
  };

  const email = buildBilingualAlertEmail([mockAlert], 'https://agri-orbit.vercel.app', true, 'রংপুর', 'Rangpur');

  assert.strictEqual(typeof email.subject, 'string');
  assert.strictEqual(typeof email.text, 'string');
  assert.strictEqual(typeof email.html, 'string');

  // Verify subject
  assert.strictEqual(email.subject, 'পরীক্ষামূলক ফসল পরামর্শ – রংপুর | AgriOrbit sample update – Rangpur');

  // Verify logo tag is standard unencoded tag with width 120
  assert.match(email.html, /<img[\s\S]*?src="https:\/\/agri-orbit\.vercel\.app\/logo\.png"[\s\S]*?alt="AgriOrbit"[\s\S]*?width="120"/);

  // Guarantee no pre-encoded boundaries or quoted-printable in the raw template strings
  assert.doesNotMatch(email.html, /----_NmP-/);
  assert.doesNotMatch(email.html, /Content-Transfer-Encoding/);
  assert.doesNotMatch(email.text, /----_NmP-/);
  assert.doesNotMatch(email.text, /Content-Transfer-Encoding/);
});

test('7. nodemailer integration: compiles clean multipart/alternative without duplicate Content-Type header', async () => {
  const mockAlert: AlertEmailItem = {
    severity: 'warning',
    data_source: 'NASA SMAP',
    data_date: '2026-10-25',
    title_bn: 'মাটির রস হ্রাস: রাজশাহী',
    title_en: 'Soil Moisture Deficit: Rajshahi',
    body_bn: 'শীর্ষ মাটির আর্দ্রতা কমেছে।',
    body_en: 'Topsoil moisture has declined.',
  };

  const { subject, text, html } = buildBilingualAlertEmail([mockAlert], 'https://agri-orbit.vercel.app', true, 'রাজশাহী', 'Rajshahi');

  const transporter = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
  });

  const info = await transporter.sendMail({
    from: '"AgriOrbit" <alerts@agriorbit.com>',
    to: 'test@example.com',
    replyTo: 'alerts@agriorbit.com',
    subject,
    text,
    html,
    headers: {
      'List-Unsubscribe': '<https://agri-orbit.vercel.app/#/profile>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });

  const rawRfcMessage = info.message.toString();

  // 1. Exactly one top-level Content-Type: multipart/alternative; boundary="..."
  const contentTypeMatches = rawRfcMessage.match(/Content-Type:\s*multipart\/alternative;\s*boundary="?([^"\r\n]+)"?/i);
  assert.ok(contentTypeMatches, 'Top-level header must be Content-Type: multipart/alternative with boundary');

  const boundary = contentTypeMatches[1];
  assert.ok(boundary.length > 5, 'Boundary token must be defined');

  // 2. Exactly two parts inside the boundary
  const parts = rawRfcMessage.split(`--${boundary}`);
  // parts[0] is header preamble, parts[1] is text/plain, parts[2] is text/html, parts[3] is trailing --\r\n
  assert.ok(parts.length >= 3, 'Must contain at least two boundary parts');
  assert.match(parts[1], /Content-Type:\s*text\/plain/i);
  assert.match(parts[2], /Content-Type:\s*text\/html/i);

  // 3. Ensure no duplicate top-level Content-Type header exists before the first boundary
  const headersPreamble = parts[0];
  const topLevelContentTypeCount = (headersPreamble.match(/^Content-Type:/gim) || []).length;
  assert.strictEqual(topLevelContentTypeCount, 1, 'Preamble must contain exactly ONE Content-Type header');
});
