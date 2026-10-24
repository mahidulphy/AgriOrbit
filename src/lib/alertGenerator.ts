import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { fetchPowerDaily, fetchForecast } from './power';
import { computeConditions } from './conditions';
import { getDistrictSatellite } from '../data/satellite';
import { computeAlerts, type Alert } from './engine';
import { BD_DISTRICTS } from '../data/districts';
import { getDistrictAdmin, nearestDistrict } from '../data/bdAdmin';
import type { AlertSeverity } from '../types';

export interface AlertGeneratorOptions {
  authHeader?: string | null;
  dryRun?: boolean;
  cronSecret?: string;
  supabaseUrl?: string;
  supabaseServiceKey?: string;
  smtpUser?: string;
  smtpPass?: string;
  appUrl?: string;
  customFields?: UserFieldRecord[]; // Optional override for isolated unit testing
}

export interface GeneratedAlertRow {
  user_id: string;
  field_id: string | null;
  alert_type: string;
  severity: AlertSeverity;
  title_en: string;
  title_bn: string;
  body_en: string;
  body_bn: string;
  data_source: string;
  data_date: string;
}

export interface UserFieldRecord {
  id: string;
  user_id: string;
  name: string;
  district: string;
  upazila?: string | null;
  latitude: number;
  longitude: number;
}

export interface UserProfileRecord {
  id: string;
  email?: string;
  email_alerts?: boolean;
  sms_alerts?: boolean;
  preferred_language?: string;
}

export function toBnDigits(val: number | string): string {
  return String(val).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);
}

/**
 * Builds bilingual alert titles and descriptions using plain, farmer-friendly wording
 * (no jargon like evapotranspiration or floral abortion) and Bangla numerals for dates.
 */
export function formatAlertContent(
  alert: Alert,
  fieldName: string,
  districtNameEn: string,
  districtNameBn: string,
  dataDate: string,
): { severity: AlertSeverity; title_en: string; title_bn: string; body_en: string; body_bn: string; data_source: string } {
  const dataDateBn = toBnDigits(dataDate);

  switch (alert.code) {
    case 'heat': {
      const temp = alert.v.t;
      const sourceLabel = alert.source === 'POWER' ? 'NASA POWER' : 'Open-Meteo';
      const severity: AlertSeverity = temp >= 38 ? 'danger' : 'warning';
      return {
        severity,
        data_source: sourceLabel,
        title_en: `Heat Stress Warning: ${districtNameEn} (${temp}°C)`,
        title_bn: `তাপপ্রবাহ সতর্কতা: ${districtNameBn} (${toBnDigits(temp)}° সে.)`,
        body_en: `Maximum day temperature reached ${temp}°C in ${fieldName} (${districtNameEn}) on ${dataDate} (${sourceLabel}). High heat dries soil faster and can make flowers drop. Give light evening irrigation or mulch to protect the roots.`,
        body_bn: `${dataDateBn} তারিখে ${districtNameBn} জেলার ${fieldName}-এ সর্বোচ্চ তাপমাত্রা ${toBnDigits(temp)}° সে.-এ পৌঁছেছে (${sourceLabel === 'NASA POWER' ? 'নাসা পাওয়ার' : 'ওপেন-মেটিও'})। অতিরিক্ত গরমে মাটির রস দ্রুত শুকিয়ে যায় এবং ফুল ঝরে পড়তে পারে। মাটি ভেজা রাখতে সন্ধ্যায় হালকা সেচ দিন অথবা খড় বিছিয়ে দিন।`,
      };
    }
    case 'lowWater': {
      const rain = alert.v.rain;
      const soil = alert.v.soil;
      return {
        severity: 'warning',
        data_source: 'NASA SMAP / POWER',
        title_en: `Soil Moisture Deficit: ${districtNameEn} (${rain}mm rain, ${soil.toFixed(2)} m³/m³ soil)`,
        title_bn: `মাটির আর্দ্রতা ঘাটতি: ${districtNameBn} (${toBnDigits(rain)} মিমি বৃষ্টি, ${toBnDigits(soil.toFixed(2))} m³/m³ আর্দ্রতা)`,
        body_en: `Past 30 days had only ${rain} mm rain and root-zone soil moisture is ${soil.toFixed(2)} m³/m³ (below 0.15 dry limit) in ${districtNameEn} on ${dataDate}. Crops are thirsty. Water the field soon or use straw mulch to save moisture.`,
        body_bn: `${dataDateBn} তারিখ অনুযায়ী ${districtNameBn} জেলায় গত ৩০ দিনে বৃষ্টি হয়েছে মাত্র ${toBnDigits(rain)} মিমি এবং মাটির আর্দ্রতা ${toBnDigits(soil.toFixed(2))} m³/m³ (শুষ্ক সীমার নিচে)। ফসলে পানির অভাব দেখা দিতে পারে। দ্রুত হালকা সেচ দিন অথবা খড় বিছিয়ে মাটির রস ধরে রাখুন।`,
      };
    }
    case 'flood': {
      const rain7 = alert.v.rain;
      return {
        severity: 'danger',
        data_source: 'Open-Meteo',
        title_en: `Heavy Rainfall & Waterlogging Alert: ${districtNameEn} (${rain7}mm forecast)`,
        title_bn: `ভারী বৃষ্টি ও জলাবদ্ধতার ঝুঁকি: ${districtNameBn} (${toBnDigits(rain7)} মিমি পূর্বাভাস)`,
        body_en: `Forecast predicts heavy rain (${rain7} mm over 7 days) starting ${dataDate} for ${fieldName} (${districtNameEn}). Clear field drains and ditches now so standing water does not rot crop roots.`,
        body_bn: `${dataDateBn} থেকে পরবর্তী ৭ দিনে ${districtNameBn} জেলার ${fieldName}-এ মোট ${toBnDigits(rain7)} মিমি ভারী বৃষ্টির পূর্বাভাস রয়েছে (উৎস: ওপেন-মেটিও)। জমিতে পানি জমে শিকড় পচে যাওয়া ঠেকাতে এখনই নালা পরিষ্কার করুন।`,
      };
    }
    default: {
      return {
        severity: 'info',
        data_source: 'AgriOrbit / NASA',
        title_en: `Field Environmental Advisory: ${districtNameEn}`,
        title_bn: `মাঠ পরিবেশগত উপদেষ্টা: ${districtNameBn}`,
        body_en: `Environmental conditions evaluated on ${dataDate} for ${fieldName} (${districtNameEn}).`,
        body_bn: `${dataDateBn} তারিখে ${districtNameBn} জেলার ${fieldName}-এর পরিবেশগত মূল্যায়ন সম্পন্ন হয়েছে।`,
      };
    }
  }
}

/**
 * Sends alert email via Gmail SMTP (port 465, secure: true).
 * If SMTP_USER or SMTP_PASS is missing, logs and skips cleanly without failing.
 */
export async function sendAlertEmailViaSmtp(params: {
  to: string;
  subject: string;
  html: string;
  smtpUser?: string;
  smtpPass?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const user = params.smtpUser || process.env.SMTP_USER || process.env.GMAIL_USER;
  const rawPass = params.smtpPass || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
  const pass = rawPass ? rawPass.replace(/\s+/g, '') : undefined;

  if (!user || !pass) {
    const errorMsg = 'SMTP credentials missing. Please set SMTP_USER / SMTP_PASS or GMAIL_USER / GMAIL_APP_PASSWORD in Vercel environment variables.';
    console.error('[SMTP]', errorMsg);
    return { ok: false, error: errorMsg };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from: `"AgriOrbit Alerts" <${user}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    return { ok: true };
  } catch (err: any) {
    console.error('[SMTP] Failed to send email via Gmail SMTP:', err?.message);
    return { ok: false, error: err?.message };
  }
}

/**
 * Builds responsive, clean HTML email combining Bangla and English.
 */
export function buildAlertEmailHtml(alerts: GeneratedAlertRow[], appUrl: string): string {
  const alertCards = alerts
    .map((a) => {
      const badgeBg = a.severity === 'danger' ? '#ef4444' : a.severity === 'warning' ? '#f59e0b' : '#06b6d4';
      return `
        <div style="margin-bottom: 20px; padding: 16px; border-radius: 12px; background-color: #0b1626; border: 1px solid rgba(255,255,255,0.12);">
          <div style="margin-bottom: 8px;">
            <span style="display: inline-block; padding: 3px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; background-color: ${badgeBg}; color: #050b14; text-transform: uppercase;">
              ${a.severity}
            </span>
            <span style="margin-left: 8px; font-size: 12px; color: #8fa3b8; font-family: monospace;">
              ${a.data_source} · ${a.data_date}
            </span>
          </div>
          <h3 style="margin: 0 0 6px 0; font-size: 16px; color: #ffffff;">${a.title_bn}</h3>
          <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: normal; color: #94a3b8;">${a.title_en}</h4>
          <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.5; color: #cbd5e1;">${a.body_bn}</p>
          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8; font-style: italic;">${a.body_en}</p>
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AgriOrbit Field Alerts</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #050b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #070d18; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px;">
          <!-- Header -->
          <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">AgriOrbit</h1>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #b8ff3d; font-family: monospace; font-weight: bold;">
                  NASA Earth Observations for Bangladesh Agriculture
                </p>
              </div>
            </div>
          </div>

          <!-- Intro -->
          <div style="margin-bottom: 20px;">
            <h2 style="margin: 0 0 6px 0; font-size: 18px; color: #ffffff;">নতুন কৃষি ও আবহাওয়া সতর্কতা</h2>
            <p style="margin: 0; font-size: 13px; color: #94a3b8;">
              Your registered farm field has ${alerts.length} new environmental advisory alert${alerts.length > 1 ? 's' : ''} based on real satellite telemetry.
            </p>
          </div>

          <!-- Alert Cards -->
          ${alertCards}

          <!-- CTA Button -->
          <div style="text-align: center; margin: 28px 0 20px 0;">
            <a href="${appUrl}" style="display: inline-block; padding: 12px 28px; background-color: #b8ff3d; color: #050b14; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 10px;">
              ড্যাশবোর্ড দেখুন / View Dashboard
            </a>
          </div>

          <!-- Footer & Privacy Notice -->
          <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; font-size: 11px; line-height: 1.5; color: #64748b; font-family: monospace;">
            <p style="margin: 0 0 6px 0;">
              Measured from NASA POWER (~10km grid), NASA SMAP (9km), and Open-Meteo numerical weather forecasts. Never invented or synthetic.
            </p>
            <p style="margin: 0;">
              Your email is used solely for field alerts and can be turned off anytime in your profile settings. Max 1 email per user per day.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Main execution engine for /api/generate-alerts
 */
export async function processGenerateAlerts(options: AlertGeneratorOptions) {
  const {
    authHeader,
    dryRun = false,
    cronSecret = process.env.CRON_SECRET,
    supabaseUrl = options.supabaseUrl ?? process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? 'https://qxlaaqfogzxqxzktsxjy.supabase.co',
    supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY,
    smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER,
    smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS)?.replace(/\s+/g, ''),
    appUrl = process.env.VITE_APP_URL || process.env.APP_URL || 'https://agri-orbit.vercel.app',
    customFields,
  } = options;

  // 1. Authorization Check: Require Bearer ${CRON_SECRET}
  if (!cronSecret) {
    return {
      status: 500,
      body: { error: 'CRON_SECRET environment variable is not configured on the server.' },
    };
  }

  const expectedHeader = `Bearer ${cronSecret}`;
  if (!authHeader || authHeader.trim() !== expectedHeader) {
    return {
      status: 401,
      body: { error: 'Unauthorized: Missing or invalid Authorization header.' },
    };
  }

  // 2. Setup Supabase Client (Service Role for Admin / Serverless execution)
  let supabaseAdmin: any = null;
  if (supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  // 3. Fetch all user fields from DB (or use customFields in isolated unit tests)
  let userFields: UserFieldRecord[] = customFields ? [...customFields] : [];
  let userProfiles: Map<string, UserProfileRecord> = new Map();
  let userEmails: Map<string, string> = new Map();

  if (!customFields && supabaseAdmin) {
    try {
      // Fetch fields (support both fields and legacy farmer_fields)
      const { data: fData, error: fErr } = await supabaseAdmin.from('fields').select('id, user_id, name, district, upazila, latitude, longitude');
      if (!fErr && fData && fData.length > 0) {
        userFields = fData;
      } else {
        const { data: ffData } = await supabaseAdmin.from('farmer_fields').select('id, user_id, name, district, upazila, latitude, longitude');
        if (ffData) userFields = ffData;
      }

      // Fetch profiles with alert preferences
      const { data: pData } = await supabaseAdmin.from('profiles').select('id, preferred_language, email_alerts, sms_alerts');
      if (pData) {
        for (const p of pData) {
          userProfiles.set(p.id, p);
        }
      }

      // Fetch user emails from auth.users via admin API
      try {
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        for (const u of authUsers?.users ?? []) {
          if (u.id && u.email) {
            userEmails.set(u.id, u.email);
          }
        }
      } catch (authErr) {
        console.warn('Could not list auth.users:', authErr);
      }
    } catch (dbErr: any) {
      console.error('Error querying Supabase tables:', dbErr?.message);
    }
  }

  // 4. Evaluate NASA POWER + Open-Meteo for each field
  const generatedAlertRows: GeneratedAlertRow[] = [];
  const fieldLogs: Array<{ fieldId: string; fieldName: string; district: string; alertsFound: number; status: string }> = [];

  for (const field of userFields) {
    try {
      // Resolve district coordinates / names
      let lat = field.latitude;
      let lng = field.longitude;
      let districtId = field.district?.toLowerCase().replace(/[\s'-]/g, '') || 'dinajpur';

      let matchedDist: any = (BD_DISTRICTS as readonly any[]).find(
        (d) => d.id === districtId || d.nameEn.toLowerCase() === field.district?.toLowerCase(),
      );

      if (!matchedDist && (!lat || !lng)) {
        matchedDist = BD_DISTRICTS[0];
      }

      if (matchedDist) {
        districtId = matchedDist.id;
        if (!lat || !lng) {
          lat = matchedDist.lat;
          lng = matchedDist.lng;
        }
      } else if (lat && lng) {
        matchedDist = nearestDistrict(lat, lng);
        districtId = matchedDist?.id || districtId;
      }

      const distNameEn = matchedDist?.nameEn || field.district || 'Bangladesh Field';
      const distNameBn = matchedDist?.nameBn || distNameEn;

      // Real API calls with 8-second timeout. If it fails, SKIP field (Never invent values).
      const daily = await fetchPowerDaily(lat, lng, 60, 8000);
      const forecast = await fetchForecast(lat, lng, 8000);

      // Compute conditions (Hargreaves ET₀, rain, max temp)
      const conditions = computeConditions(daily, lat, 30);

      // Soil Moisture from real NASA AppEEARS SMAP observation
      const sat = getDistrictSatellite(districtId);
      const soil = sat?.smap && sat.smap.flag !== 'possible_water_contamination' ? sat.smap.value : null;

      // Run pure rule-based computeAlerts from engine.ts
      const rawAlerts = computeAlerts({
        conditions,
        soil,
        forecast,
        shift: { seasons: [] } as any,
        priority: 'water',
      });

      const dataDate = conditions.to || new Date().toISOString().split('T')[0];

      for (const alert of rawAlerts) {
        const formatted = formatAlertContent(alert, field.name, distNameEn, distNameBn, dataDate);
        generatedAlertRows.push({
          user_id: field.user_id,
          field_id: field.id,
          alert_type: alert.code,
          severity: formatted.severity,
          title_en: formatted.title_en,
          title_bn: formatted.title_bn,
          body_en: formatted.body_en,
          body_bn: formatted.body_bn,
          data_source: formatted.data_source,
          data_date: dataDate,
        });
      }

      fieldLogs.push({
        fieldId: field.id,
        fieldName: field.name,
        district: distNameEn,
        alertsFound: rawAlerts.length,
        status: 'evaluated_successfully',
      });
    } catch (fieldErr: any) {
      console.warn(`Skipping field ${field.id} (${field.name}): data fetch failed:`, fieldErr?.message);
      fieldLogs.push({
        fieldId: field.id,
        fieldName: field.name,
        district: field.district,
        alertsFound: 0,
        status: `skipped_fetch_error: ${fieldErr?.message}`,
      });
    }
  }

  // 5. Database Insertion (Skipped if dryRun=true)
  let insertedRows: any[] = [];
  if (!dryRun && supabaseAdmin && generatedAlertRows.length > 0) {
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('notifications')
      .upsert(generatedAlertRows, {
        onConflict: 'user_id,field_id,alert_type,data_date',
        ignoreDuplicates: true,
      })
      .select();

    if (insertErr) {
      console.error('Failed to insert notifications:', insertErr.message);
    } else {
      insertedRows = inserted || [];
    }
  } else if (dryRun) {
    insertedRows = generatedAlertRows.map((r, i) => ({ ...r, id: `dryrun-id-${i + 1}`, created_at: new Date().toISOString() }));
  }

  // 6. Email Dispatch via Gmail SMTP
  // For rows where profile.email_alerts = true, send 1 aggregated email per user per day.
  const emailDispatches: Array<{ userId: string; email: string; alertCount: number; status: string }> = [];

  const userAlertMap = new Map<string, any[]>();
  for (const row of insertedRows) {
    const list = userAlertMap.get(row.user_id) || [];
    list.push(row);
    userAlertMap.set(row.user_id, list);
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  for (const [userId, alerts] of userAlertMap.entries()) {
    const profile = userProfiles.get(userId);
    const userEmail = userEmails.get(userId);

    // Profile must have email_alerts: true and valid email
    if (!profile?.email_alerts || !userEmail) {
      emailDispatches.push({
        userId,
        email: userEmail || 'none',
        alertCount: alerts.length,
        status: !profile?.email_alerts ? 'skipped_email_alerts_disabled' : 'skipped_missing_email',
      });
      continue;
    }

    // Rate-limiting check: Max 1 email per user per day
    if (!dryRun && supabaseAdmin) {
      const { data: alreadyEmailed } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .gte('emailed_at', todayStart.toISOString())
        .limit(1);

      if (alreadyEmailed && alreadyEmailed.length > 0) {
        emailDispatches.push({
          userId,
          email: userEmail,
          alertCount: alerts.length,
          status: 'skipped_already_emailed_today',
        });
        continue;
      }
    }

    if (dryRun) {
      emailDispatches.push({
        userId,
        email: userEmail,
        alertCount: alerts.length,
        status: 'would_send_email (dryRun)',
      });
      continue;
    }

    // Dispatch via Gmail SMTP
    const emailHtml = buildAlertEmailHtml(alerts, appUrl);
    const sendResult = await sendAlertEmailViaSmtp({
      to: userEmail,
      subject: `AgriOrbit Alert: ${alerts.length} new field alert${alerts.length > 1 ? 's' : ''} / নতুন কৃষি সতর্কতা`,
      html: emailHtml,
      smtpUser,
      smtpPass,
    });

    if (sendResult.ok) {
      const alertIds = alerts.map((a) => a.id).filter(Boolean);
      if (alertIds.length > 0 && supabaseAdmin) {
        await supabaseAdmin
          .from('notifications')
          .update({ emailed_at: new Date().toISOString() })
          .in('id', alertIds);
      }
      emailDispatches.push({
        userId,
        email: userEmail,
        alertCount: alerts.length,
        status: 'sent_successfully',
      });
    } else {
      emailDispatches.push({
        userId,
        email: userEmail,
        alertCount: alerts.length,
        status: sendResult.error || 'smtp_error',
      });
    }
  }

  return {
    status: 200,
    body: {
      success: true,
      dryRun,
      timestamp: new Date().toISOString(),
      summary: {
        totalFields: userFields.length,
        alertsGenerated: generatedAlertRows.length,
        notificationsInserted: dryRun ? 0 : insertedRows.length,
        emailsDispatched: emailDispatches.filter((e) => e.status.includes('sent') || e.status.includes('would_send')).length,
      },
      fieldEvaluations: fieldLogs,
      generatedAlerts: generatedAlertRows,
      emailDispatches,
    },
  };
}
