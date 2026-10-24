/**
 * src/lib/bilingualEmailTemplate.ts
 *
 * Dedicated bilingual (Bangla + English) email generator for AgriOrbit alerts.
 * Used for both daily automated cron alerts and user-requested test alerts.
 * Formatted specifically for high email deliverability (avoids Spam folder triggers):
 *  - No ALL CAPS, no emojis, no spam trigger words like "TEST" or "!!!"
 *  - Simple, clean HTML with high text-to-code ratio and at most 1-2 official links
 *  - Always provides plain-text multipart counterpart
 *  - Includes clear unsubscribe explanations and headers
 *  - Uses UTF-8 with standard Bangla font stack
 */

export interface AlertEmailItem {
  id?: string;
  severity: 'info' | 'warning' | 'danger';
  alert_type?: string;
  data_source: string;
  data_date: string;
  title_bn: string;
  title_en: string;
  body_bn: string;
  body_en: string;
  district_bn?: string;
  district_en?: string;
  action_bn?: string;
  action_en?: string;
}

// Convert Western digits (0-9) to Bengali digits (০-৯)
export function toBnDigits(str: string | number): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(str).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)] ?? d);
}

// Comprehensive 64 Bangladesh districts map (English -> Bengali)
const DISTRICT_BN_MAP: Record<string, string> = {
  dhaka: 'ঢাকা',
  gazipur: 'গাজীপুর',
  narayanganj: 'নারায়ণগঞ্জ',
  munshiganj: 'মুন্সীগঞ্জ',
  narsingdi: 'নরসিংদী',
  manikganj: 'মানিকগঞ্জ',
  tangail: 'টাঙ্গাইল',
  kishoreganj: 'কিশোরগঞ্জ',
  faridpur: 'ফরিদপুর',
  rajbari: 'রাজবাড়ী',
  shariatpur: 'শরীয়তপুর',
  madaripur: 'মাদারীপুর',
  gopalganj: 'গোপালগঞ্জ',
  chattogram: 'চট্টগ্রাম',
  chittagong: 'চট্টগ্রাম',
  coxsbazar: 'কক্সবাজার',
  cumilla: 'কুমিল্লা',
  comilla: 'কুমিল্লা',
  feni: 'ফেনী',
  brahmanbaria: 'ব্রাহ্মণবাড়িয়া',
  noakhali: 'নোয়াখালী',
  chandpur: 'চাঁদপুর',
  lakshmipur: 'লক্ষ্মীপুর',
  rangamati: 'রাঙ্গামাটি',
  khagrachhari: 'খাগড়াছড়ি',
  bandarban: 'বান্দরবান',
  rajshahi: 'রাজশাহী',
  bogura: 'বগুড়া',
  bogra: 'বগুড়া',
  pabna: 'পাবনা',
  sirajganj: 'সিরাজগঞ্জ',
  naogaon: 'নওগাঁ',
  natore: 'নাটোর',
  joypurhat: 'জয়পুরহাট',
  chapai_nawabganj: 'চাঁপাইনবাবগঞ্জ',
  chapainawabganj: 'চাঁপাইনবাবগঞ্জ',
  khulna: 'খুলনা',
  jashore: 'যশোর',
  jessore: 'যশোর',
  satkhira: 'সাতক্ষীরা',
  bagerhat: 'বাগেরহাট',
  jhenaidah: 'ঝিনাইদহ',
  kushtia: 'কুষ্টিয়া',
  magura: 'মাগুরা',
  meherpur: 'মেহেরপুর',
  chuadanga: 'চুয়াডাঙ্গা',
  narail: 'নড়াইল',
  barishal: 'বরিশাল',
  barisal: 'বরিশাল',
  patuakhali: 'পটুয়াখালী',
  bhola: 'ভোলা',
  pirojpur: 'পিরোজপুর',
  barguna: 'বরগুনা',
  jhalokati: 'ঝালকাঠি',
  sylhet: 'সিলেট',
  moulvibazar: 'মৌলভীবাজার',
  habiganj: 'হবিগঞ্জ',
  sunamganj: 'সুনামগঞ্জ',
  rangpur: 'রংপুর',
  dinajpur: 'দিনাজপুর',
  kurigram: 'কুড়িগ্রাম',
  gaibandha: 'গাইবান্ধা',
  nilphamari: 'নীলফামারী',
  panchagarh: 'পঞ্চগড়',
  thakurgaon: 'ঠাকুরগাঁও',
  lalmonirhat: 'লালমনিরহাট',
  mymensingh: 'ময়মনসিংহ',
  jamalpur: 'জামালপুর',
  netrokona: 'নেত্রকোণা',
  sherpur: 'শেরপুর',
};

export function getDistrictNames(rawDistrict?: string): { nameEn: string; nameBn: string } {
  if (!rawDistrict) return { nameEn: 'Bangladesh', nameBn: 'বাংলাদেশ' };
  const key = rawDistrict.toLowerCase().replace(/[\s'-]/g, '');
  const bn = DISTRICT_BN_MAP[key] || rawDistrict;
  const en = rawDistrict.charAt(0).toUpperCase() + rawDistrict.slice(1);
  return { nameEn: en, nameBn: bn };
}

/**
 * Derives a short, clean, farmer-friendly action from the alert type (no emojis).
 */
export function getAlertAction(alert: AlertEmailItem): { actionBn: string; actionEn: string } {
  if (alert.action_bn && alert.action_en) {
    return { actionBn: alert.action_bn, actionEn: alert.action_en };
  }

  const type = (alert.alert_type || '').toLowerCase();
  if (type === 'heat' || alert.title_en.toLowerCase().includes('heat')) {
    return {
      actionBn: 'মাটি ভেজা রাখতে সন্ধ্যায় হালকা সেচ দিন অথবা খড় বিছিয়ে দিন।',
      actionEn: 'Give light evening irrigation or mulch to protect roots from high heat.',
    };
  }
  if (type === 'lowwater' || type === 'drought' || alert.title_en.toLowerCase().includes('deficit') || alert.title_en.toLowerCase().includes('moisture')) {
    return {
      actionBn: 'আগামী ৩ দিনের মধ্যে জমিতে হালকা সেচ দিন অথবা খড় দিয়ে মাটির রস ধরে রাখুন।',
      actionEn: 'Irrigate within the next 3 days or use straw mulch to retain root moisture.',
    };
  }
  if (type === 'flood' || alert.title_en.toLowerCase().includes('rain') || alert.title_en.toLowerCase().includes('waterlogging')) {
    return {
      actionBn: 'জমিতে পানি জমে শিকড় পচে যাওয়া ঠেকাতে এখনই নিষ্কাশন নালা পরিষ্কার করুন।',
      actionEn: 'Clear drainage ditches immediately to prevent standing water and root rot.',
    };
  }
  if (type === 'test' || alert.title_en.toLowerCase().includes('test')) {
    return {
      actionBn: 'মাঠের তাপমাত্রা ও আর্দ্রতা স্বাভাবিক থাকলে নিয়মিত পরিচর্যা বজায় রাখুন।',
      actionEn: 'Maintain standard field management while temperature and moisture remain normal.',
    };
  }
  return {
    actionBn: 'মাঠ পর্যবেক্ষণ করুন এবং আবহাওয়া অনুযায়ী প্রয়োজনীয় পদক্ষেপ নিন।',
    actionEn: 'Monitor field conditions and take action based on local weather.',
  };
}

/**
 * Builds polite, low-spam-score subject line:
 *  - Daily: "আজকের ফসল পরামর্শ – রংপুর | AgriOrbit daily update – Rangpur"
 *  - Test:  "পরীক্ষামূলক ফসল পরামর্শ – দিনাজপুর | AgriOrbit sample update – Dinajpur"
 * Avoids ALL CAPS, emojis, "TEST", and exclamation marks.
 */
export function buildBilingualSubject(districtBn: string, districtEn: string, isTest = false): string {
  if (isTest) {
    return `পরীক্ষামূলক ফসল পরামর্শ – ${districtBn} | AgriOrbit sample update – ${districtEn}`;
  }
  return `আজকের ফসল পরামর্শ – ${districtBn} | AgriOrbit daily update – ${districtEn}`;
}

/**
 * Builds responsive, clean HTML email with:
 *  - Bangla on top, clear divider, English below
 *  - UTF-8 charset and standard Bangla font stack
 *  - No large images, no emojis, at most 1-2 links to dashboard
 *  - Complete bilingual unsubscribe footer explaining why they receive this email
 */
export function buildBilingualEmailHtml(
  alerts: AlertEmailItem[],
  appUrl: string,
  isTest = false
): string {
  const cardsHtml = alerts
    .map((alert) => {
      const { actionBn, actionEn } = getAlertAction(alert);
      const dataDateBn = toBnDigits(alert.data_date);
      const isDanger = alert.severity === 'danger';
      const isWarning = alert.severity === 'warning';
      const badgeBg = isDanger ? '#dc2626' : isWarning ? '#d97706' : '#16a34a';
      const badgeText = isTest
        ? 'পরীক্ষামূলক পরামর্শ · Sample advisory'
        : isDanger
        ? 'জরুরি পরামর্শ · Priority advisory'
        : isWarning
        ? 'সতর্কতা · Advisory notice'
        : 'পরামর্শ · Field advisory';

      return `
        <div style="margin-bottom: 24px; padding: 20px; border-radius: 12px; background-color: #0b1626; border: 1px solid rgba(255,255,255,0.12);">
          <!-- Header Tag & Meta -->
          <div style="margin-bottom: 12px;">
            <span style="display: inline-block; padding: 3px 8px; font-size: 11px; font-weight: 600; border-radius: 4px; background-color: ${badgeBg}; color: #ffffff;">
              ${badgeText}
            </span>
            <span style="margin-left: 8px; font-size: 11px; color: #94a3b8; font-family: monospace;">
              উৎস: ${alert.data_source} · তারিখ: ${dataDateBn} (${alert.data_date})
            </span>
          </div>

          <!-- 1. BANGLA SECTION (TOP) -->
          <div style="margin-bottom: 16px;">
            <h2 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #ffffff; line-height: 1.4;">
              ${alert.title_bn}
            </h2>
            <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
              ${alert.body_bn}
            </p>
            <div style="padding: 10px 12px; background-color: rgba(184, 255, 61, 0.08); border-left: 3px solid #b8ff3d; border-radius: 4px;">
              <span style="color: #b8ff3d; font-size: 13px; font-weight: bold;">করণীয়:</span>
              <span style="color: #f1f5f9; font-size: 13px; margin-left: 4px;">${actionBn}</span>
            </div>
          </div>

          <!-- DIVIDER LINE -->
          <div style="margin: 18px 0; border-top: 1px dashed rgba(255,255,255,0.18); text-align: center;">
            <span style="display: inline-block; background-color: #0b1626; padding: 0 8px; position: relative; top: -9px; font-size: 10px; font-weight: 600; color: #64748b; font-family: monospace;">
              English Summary
            </span>
          </div>

          <!-- 2. ENGLISH SECTION (BELOW) -->
          <div>
            <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #e2e8f0; line-height: 1.4;">
              ${alert.title_en}
            </h3>
            <p style="margin: 0 0 10px 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
              ${alert.body_en}
            </p>
            <div style="padding: 10px 12px; background-color: rgba(255, 255, 255, 0.04); border-left: 3px solid #38bdf8; border-radius: 4px;">
              <span style="color: #38bdf8; font-size: 12px; font-weight: bold;">Recommended Action:</span>
              <span style="color: #cbd5e1; font-size: 12px; margin-left: 4px;">${actionEn}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AgriOrbit Alert</title>
  <style>
    body, table, td, p, h1, h2, h3, h4, span, a, div {
      font-family: 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #050b14; color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #050b14; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #070d18; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; overflow: hidden;" cellspacing="0" cellpadding="0">
          <!-- App Header -->
          <tr>
            <td style="padding: 22px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); background-color: #081120;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Agri<span style="color: #b8ff3d;">Orbit</span>
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8; font-family: monospace;">
                নাসা উপগ্রহ পর্যবেক্ষণ · NASA Earth Observations for Bangladesh
              </p>
            </td>
          </tr>

          <!-- Main Alert Body -->
          <tr>
            <td style="padding: 24px;">
              ${cardsHtml}

              <!-- Call to Action (clean direct link) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #b8ff3d; color: #050b14; text-decoration: none; font-weight: 700; font-size: 13px; border-radius: 8px;">
                      ড্যাশবোর্ড দেখুন / Open AgriOrbit Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Clear Unsubscribe and Explanation Footer -->
          <tr>
            <td style="padding: 18px 24px; background-color: #081120; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                আপনি এই ইমেইলটি পেয়েছেন কারণ আপনার অ্যাগ্রিঅরবিট প্রোফাইলে ইমেইল সতর্কতা চালু রয়েছে। বন্ধ করতে প্রোফাইল → সতর্কতায় যান।
              </p>
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                You receive this because Email alerts are on in your AgriOrbit profile. Turn off in Profile &rarr; Alerts.
              </p>
              <p style="margin: 0 0 6px 0; font-size: 10px; color: #64748b; line-height: 1.5; font-family: monospace;">
                Your email is used solely for field alerts and can be turned off anytime in your profile settings. Max 1 email per user per day.
              </p>
              <p style="margin: 0; font-size: 10px; color: #475569; font-family: monospace;">
                AgriOrbit · <a href="${appUrl}" style="color: #64748b; text-decoration: underline;">${appUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Builds clean plain-text multipart counterpart.
 * Suitable for basic mobile devices, feature phones, and text-only email clients.
 */
export function buildBilingualEmailText(
  alerts: AlertEmailItem[],
  appUrl: string,
  isTest = false
): string {
  const sections = alerts.map((alert, idx) => {
    const { actionBn, actionEn } = getAlertAction(alert);
    const dataDateBn = toBnDigits(alert.data_date);
    return `
------------------------------------------------------------
[পরামর্শ #${idx + 1}] ${isTest ? '(নমুনা / Sample)' : alert.severity}
উৎস / Source: ${alert.data_source} | তারিখ / Date: ${dataDateBn} (${alert.data_date})
------------------------------------------------------------

[বাংলা]
শিরোনাম: ${alert.title_bn}
বিস্তারিত: ${alert.body_bn}
করণীয়: ${actionBn}

============================================================

[ENGLISH]
Title: ${alert.title_en}
Details: ${alert.body_en}
Action: ${actionEn}
`;
  }).join('\n');

  return `AgriOrbit — ফসল ও আবহাওয়া পরামর্শ / Field Advisory
নাসা উপগ্রহ পর্যবেক্ষণ / NASA Earth Observations
============================================================
${sections}
============================================================
বিস্তারিত দেখতে ড্যাশবোর্ডে প্রবেশ করুন / View details on dashboard:
${appUrl}

------------------------------------------------------------
আপনি এই ইমেইলটি পেয়েছেন কারণ আপনার অ্যাগ্রিঅরবিট প্রোফাইলে ইমেইল সতর্কতা চালু রয়েছে। বন্ধ করতে প্রোফাইল -> সতর্কতায় যান।
You receive this because Email alerts are on in your AgriOrbit profile. Turn off in Profile -> Alerts.
Your email is used solely for field alerts and can be turned off anytime in your profile settings. Max 1 email per user per day.

AgriOrbit • Bangladesh Agriculture Telemetry
`;
}
