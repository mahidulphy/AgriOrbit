import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { fetchPowerDaily } from '../src/lib/power';
import { computeConditions } from '../src/lib/conditions';
import { toBnDigits, buildAlertEmailHtml } from '../src/lib/alertGenerator';
import { BD_DISTRICTS } from '../src/data/districts';

export default async function handler(req: any, res?: any) {
  // Helper to send JSON in both Node.js (res.json) and Web Standard (Response) runtimes
  const sendJson = (status: number, data: any) => {
    if (res && typeof res.status === 'function') {
      return res.status(status).json(data);
    }
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const getHeader = (name: string) => {
    if (req.headers?.get) return req.headers.get(name);
    return req.headers?.[name.toLowerCase()] || req.headers?.[name];
  };

  const authHeader = getHeader('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendJson(401, {
      ok: false,
      error: 'Unauthorized: Please sign in to send an alert.',
    });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  const supabaseUrl =
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    'https://qxlaaqfogzxqxzktsxjy.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    const errorMsg = 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing in Vercel environment.';
    console.error('[send-alert]', errorMsg);
    return sendJson(500, { ok: false, error: errorMsg });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Authenticate user from session token
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    console.error('[send-alert] Auth error:', authErr?.message);
    return sendJson(401, {
      ok: false,
      error: 'Invalid or expired session. Please sign in again.',
    });
  }

  if (!user.email) {
    return sendJson(400, {
      ok: false,
      error: 'Your account does not have a confirmed email address to receive alerts.',
    });
  }

  // 2. Rate Limiting: Max 3 test alerts per user per day
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count, error: countErr } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('alert_type', 'test')
    .gte('created_at', todayStart.toISOString());

  const currentCount = count ?? 0;
  if (currentCount >= 3) {
    return sendJson(429, {
      ok: false,
      error: 'Daily test limit reached (maximum 3 test alerts per day).',
      testsRemainingToday: 0,
    });
  }

  try {
    // 3. Resolve user's primary field or fallback to Dinajpur HQ
    const { data: fields } = await supabaseAdmin
      .from('fields')
      .select('id, name, district, latitude, longitude')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1);

    const firstField = fields && fields.length > 0 ? fields[0] : null;

    const lat = firstField?.latitude || 25.63;
    const lon = firstField?.longitude || 88.64;
    const districtName = firstField?.district || 'Dinajpur';

    const matchedDist: any = (BD_DISTRICTS as readonly any[]).find(
      (d) =>
        d.id === districtName.toLowerCase().replace(/[\s'-]/g, '') ||
        d.nameEn.toLowerCase() === districtName.toLowerCase(),
    );

    const distNameEn = matchedDist?.nameEn || districtName;
    const distNameBn = matchedDist?.nameBn || distNameEn;

    // 4. Fetch real NASA POWER observation data
    const daily = await fetchPowerDaily(lat, lon, 60, 8000);
    const conditions = computeConditions(daily, lat, 30);
    const maxTemp = conditions.tMax30;
    const dataDate = conditions.to || new Date().toISOString().split('T')[0];
    const dataDateBn = toBnDigits(dataDate);
    const maxTempFormatted = maxTemp.toFixed(1);
    const maxTempBn = toBnDigits(maxTempFormatted);

    // 5. Construct bilingual notification payload
    const title_en = 'Test alert – AgriOrbit';
    const title_bn = 'পরীক্ষামূলক সতর্কতা – অ্যাগ্রিঅরবিট';
    const body_en = `This is a test alert requested from your profile settings. Real NASA POWER observation for ${distNameEn}: maximum temperature was ${maxTempFormatted}°C on ${dataDate}. Normal alerts arrive automatically when temperature, rainfall, or soil moisture cross critical thresholds.`;
    const body_bn = `এটি আপনার প্রোফাইল সেটিংস থেকে পাঠানো একটি পরীক্ষামূলক সতর্কতা। ${distNameBn} জেলার জন্য নাসা পাওয়ারের বাস্তব পর্যবেক্ষণ: ${dataDateBn} তারিখে সর্বোচ্চ তাপমাত্রা ছিল ${maxTempBn}° সে.। মাঠের তাপমাত্রা, বৃষ্টি বা মাটির রস ঝুঁকিপূর্ণ মাত্রায় পৌঁছালে স্বয়ংক্রিয়ভাবে সতর্কবার্তা আসবে।`;

    const notificationPayload = {
      user_id: user.id,
      field_id: firstField?.id || null,
      alert_type: 'test',
      severity: 'info' as const,
      title_en,
      title_bn,
      body_en,
      body_bn,
      data_source: 'NASA POWER (Test)',
      data_date: dataDate,
    };

    // 6. Insert notification row into public.notifications
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('notifications')
      .insert(notificationPayload)
      .select()
      .single();

    if (insertErr) {
      console.error('[send-alert] Supabase insert error (notifications):', insertErr.message);
      return sendJson(500, {
        ok: false,
        error: `Supabase database error inserting notification: ${insertErr.message}`,
      });
    }

    // Also attempt insertion into public.alerts if table exists
    try {
      await supabaseAdmin.from('alerts').insert(notificationPayload);
    } catch (alertsErr) {
      // Non-fatal if alerts table is an optional alias
    }

    // 7. Verify SMTP credentials from environment
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
    const smtpPass = rawPass ? rawPass.replace(/\s+/g, '') : undefined;

    if (!smtpUser || !smtpPass) {
      const missingVarMsg =
        'Gmail SMTP credentials missing on server. Please configure SMTP_USER (or GMAIL_USER) and SMTP_PASS (or GMAIL_APP_PASSWORD) in Vercel Project Settings > Environment Variables for Production, then redeploy.';
      console.error('[send-alert]', missingVarMsg);
      return sendJson(502, {
        ok: false,
        success: false,
        emailed: false,
        error: missingVarMsg,
        notification: inserted,
        testsRemainingToday: Math.max(0, 2 - currentCount),
      });
    }

    // 8. Send email using Nodemailer via Gmail SMTP (port 465, secure: true)
    const appUrl = process.env.VITE_APP_URL || process.env.APP_URL || 'https://agri-orbit.vercel.app';
    const emailHtml = buildAlertEmailHtml([inserted], appUrl);

    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"AgriOrbit Alerts" <${smtpUser}>`,
        to: user.email,
        subject: `${title_en} / ${title_bn}`,
        html: emailHtml,
      });

      console.log(`[send-alert] Email sent successfully to ${user.email}, messageId: ${info.messageId}`);

      // 9. Update emailed_at timestamp in database
      await supabaseAdmin
        .from('notifications')
        .update({ emailed_at: new Date().toISOString() })
        .eq('id', inserted.id);

      return sendJson(200, {
        ok: true,
        success: true,
        emailed: true,
        recipientEmail: user.email,
        message: `Test alert created and email sent successfully to ${user.email}!`,
        notification: inserted,
        testsRemainingToday: Math.max(0, 2 - currentCount),
      });
    } catch (mailErr: any) {
      console.error('[send-alert] Nodemailer SMTP Error:', mailErr);
      const mailErrMsg = mailErr?.message || String(mailErr);
      return sendJson(502, {
        ok: false,
        success: false,
        emailed: false,
        recipientEmail: user.email,
        error: `Email delivery failed via Gmail SMTP: ${mailErrMsg}`,
        notification: inserted,
        testsRemainingToday: Math.max(0, 2 - currentCount),
      });
    }
  } catch (err: any) {
    console.error('[send-alert] Unexpected error:', err);
    return sendJson(500, {
      ok: false,
      error: `Error generating test alert: ${err?.message || String(err)}`,
    });
  }
}
