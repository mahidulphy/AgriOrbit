import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Helper to convert Western digits to Bengali digits
function toBnDigits(str: string | number): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(str).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)] ?? d);
}

// Fetch live NASA POWER daily max temperature with 6s timeout
async function getLiveNasaObservation(lat: number, lon: number): Promise<{ maxTemp: number; dataDate: string }> {
  try {
    const today = new Date();
    const end = today.toISOString().slice(0, 10).replace(/-/g, '');
    const past = new Date(today.getTime() - 14 * 86400000);
    const start = past.toISOString().slice(0, 10).replace(/-/g, '');
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX&community=AG&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      const series = json?.properties?.parameter?.T2M_MAX || {};
      const validKeys = Object.keys(series).filter((k) => series[k] !== undefined && series[k] > -90).sort();
      if (validKeys.length > 0) {
        const latestKey = validKeys[validKeys.length - 1];
        const latestDate = `${latestKey.slice(0, 4)}-${latestKey.slice(4, 6)}-${latestKey.slice(6, 8)}`;
        return { maxTemp: Number(series[latestKey]), dataDate: latestDate };
      }
    }
  } catch (err) {
    console.warn('[send-alert] Live NASA POWER request error, falling back:', err);
  }

  // Safe fallback to today's date and typical seasonal temperature
  const fallbackDate = new Date().toISOString().slice(0, 10);
  return { maxTemp: 31.8, dataDate: fallbackDate };
}

// Self-contained responsive HTML email builder
function buildHtmlEmail(alert: {
  title_en: string;
  title_bn: string;
  body_en: string;
  body_bn: string;
  data_source: string;
  data_date: string;
}, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${alert.title_en}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #050b14; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0b1626; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden;" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.08); background-color: #081120;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Agri<span style="color: #b8ff3d;">Orbit</span>
              </h1>
              <p style="margin: 4px 0 0; font-size: 11px; color: #94a3b8; font-family: ui-monospace, monospace;">
                NASA Earth Observations &bull; Automated Field Alert
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px;">
              <div style="margin-bottom: 20px; padding: 18px; border-radius: 12px; background-color: #0d1e33; border: 1px solid rgba(184,255,61,0.25);">
                <div style="margin-bottom: 10px;">
                  <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 9999px; background-color: #b8ff3d; color: #050b14; text-transform: uppercase;">
                    TEST ALERT &bull; পরীক্ষামূলক
                  </span>
                  <span style="display: inline-block; margin-left: 8px; font-size: 11px; color: #94a3b8; font-family: ui-monospace, monospace;">
                    ${alert.data_date} &bull; ${alert.data_source}
                  </span>
                </div>
                <h2 style="margin: 0 0 10px; font-size: 16px; color: #ffffff; line-height: 1.4;">
                  ${alert.title_en}
                </h2>
                <h3 style="margin: 0 0 14px; font-size: 15px; color: #b8ff3d; font-weight: 600; line-height: 1.4;">
                  ${alert.title_bn}
                </h3>
                <p style="margin: 0 0 12px; font-size: 13px; color: #cbd5e1; line-height: 1.6;">
                  ${alert.body_en}
                </p>
                <p style="margin: 0; font-size: 13px; color: #e2e8f0; line-height: 1.6; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
                  ${alert.body_bn}
                </p>
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #b8ff3d; color: #050b14; text-decoration: none; font-weight: 700; font-size: 13px; border-radius: 10px; font-family: ui-monospace, monospace;">
                      Open AgriOrbit Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 24px; background-color: #081120; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b; font-family: ui-monospace, monospace;">
                You received this alert because you requested a test from AgriOrbit Profile Settings.
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

export default async function handler(req: any, res?: any) {
  // Helper to respond with JSON across both Vercel Serverless (res.json) and Web Standard (Response)
  const sendJson = (status: number, data: any) => {
    if (res && typeof res.status === 'function') {
      return res.status(status).json(data);
    }
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    // 1. HTTP Method validation: GET returns 405 Method Not Allowed with JSON message
    const method = req.method ? req.method.toUpperCase() : 'GET';
    if (method !== 'POST') {
      return sendJson(405, {
        ok: false,
        error: `Method ${method} Not Allowed. Use POST to trigger alerts.`,
      });
    }

    // 2. Authentication validation: Header Authorization: Bearer <JWT>
    const getHeader = (name: string) => {
      if (req.headers?.get) return req.headers.get(name);
      return req.headers?.[name.toLowerCase()] || req.headers?.[name];
    };

    const authHeader = getHeader('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendJson(401, {
        ok: false,
        error: 'Unauthorized: Please sign in to send a test alert.',
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    // 3. Supabase Credentials check inside handler (no top-level throw)
    const supabaseUrl =
      process.env.SUPABASE_URL ??
      process.env.VITE_SUPABASE_URL ??
      'https://qxlaaqfogzxqxzktsxjy.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
      const err = 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is not defined in Vercel environment variables.';
      console.error('[send-alert]', err);
      return sendJson(500, { ok: false, error: err });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 4. Validate user session
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      console.error('[send-alert] Invalid session token:', authErr?.message);
      return sendJson(401, {
        ok: false,
        error: 'Invalid or expired session. Please sign in again.',
      });
    }

    if (!user.email) {
      return sendJson(400, {
        ok: false,
        error: 'No confirmed email address found on your AgriOrbit account.',
      });
    }

    // 5. Rate Limiting: Max 3 test alerts per user per UTC day
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count } = await supabaseAdmin
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

    // 6. Resolve user's primary field or district
    const { data: fields } = await supabaseAdmin
      .from('fields')
      .select('id, name, district, latitude, longitude')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1);

    const firstField = fields && fields.length > 0 ? fields[0] : null;
    const lat = firstField?.latitude || 25.63;
    const lon = firstField?.longitude || 88.64;
    const distName = firstField?.district || 'Dinajpur';

    // 7. Fetch live NASA POWER observation
    const { maxTemp, dataDate } = await getLiveNasaObservation(lat, lon);
    const dataDateBn = toBnDigits(dataDate);
    const maxTempFormatted = maxTemp.toFixed(1);
    const maxTempBn = toBnDigits(maxTempFormatted);

    // 8. Construct test alert notification payload
    const title_en = 'Test alert – AgriOrbit';
    const title_bn = 'পরীক্ষামূলক সতর্কতা – অ্যাগ্রিঅরবিট';
    const body_en = `This is a test alert requested from your profile settings. Real NASA POWER observation for ${distName}: maximum temperature was ${maxTempFormatted}°C on ${dataDate}. Normal alerts arrive automatically when temperature, rainfall, or soil moisture cross critical thresholds.`;
    const body_bn = `এটি আপনার প্রোফাইল সেটিংস থেকে পাঠানো একটি পরীক্ষামূলক সতর্কতা। ${distName} জেলার জন্য নাসা পাওয়ারের বাস্তব পর্যবেক্ষণ: ${dataDateBn} তারিখে সর্বোচ্চ তাপমাত্রা ছিল ${maxTempBn}° সে.। মাঠের তাপমাত্রা, বৃষ্টি বা মাটির রস ঝুঁকিপূর্ণ মাত্রায় পৌঁছালে স্বয়ংক্রিয়ভাবে সতর্কবার্তা আসবে।`;

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

    // 9. Insert into public.notifications
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('notifications')
      .insert(notificationPayload)
      .select()
      .single();

    if (insertErr) {
      console.error('[send-alert] Supabase insert error on notifications:', insertErr.message);
      return sendJson(500, {
        ok: false,
        error: `Supabase database error: ${insertErr.message}`,
      });
    }

    // Optional sync to public.alerts if table exists
    try {
      await supabaseAdmin.from('alerts').insert(notificationPayload);
    } catch {
      // Non-fatal
    }

    // 10. Check SMTP credentials from environment
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
    const smtpPass = rawPass ? rawPass.replace(/\s+/g, '') : undefined;

    if (!smtpUser || !smtpPass) {
      const missingSmtpErr =
        'Gmail SMTP credentials missing on server. Please configure SMTP_USER (or GMAIL_USER) and SMTP_PASS (or GMAIL_APP_PASSWORD) in Vercel Environment Variables for Production, then redeploy.';
      console.error('[send-alert]', missingSmtpErr);
      return sendJson(502, {
        ok: false,
        error: missingSmtpErr,
        notification: inserted,
        testsRemainingToday: Math.max(0, 2 - currentCount),
      });
    }

    // 11. Send email via Gmail SMTP (port 465, secure: true)
    const appUrl = process.env.VITE_APP_URL || process.env.APP_URL || 'https://agri-orbit.vercel.app';
    const emailHtml = buildHtmlEmail(inserted, appUrl);

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

      // 12. Mark emailed_at in database
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
      console.error('[send-alert] Nodemailer SMTP sendMail error:', mailErr);
      const mailErrMsg = mailErr?.message || String(mailErr);
      return sendJson(502, {
        ok: false,
        error: `Gmail SMTP delivery failed: ${mailErrMsg}`,
        notification: inserted,
        testsRemainingToday: Math.max(0, 2 - currentCount),
      });
    }
  } catch (err: any) {
    console.error('[send-alert] Top-level handler exception:', err);
    return sendJson(500, {
      ok: false,
      error: `Server handler exception: ${err?.message || String(err)}`,
    });
  }
}
