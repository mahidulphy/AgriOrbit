import { createClient } from '@supabase/supabase-js';
import { fetchPowerDaily } from '../src/lib/power';
import { computeConditions } from '../src/lib/conditions';
import { toBnDigits, sendAlertEmailViaSmtp, buildAlertEmailHtml } from '../src/lib/alertGenerator';
import { BD_DISTRICTS } from '../src/data/districts';

export default async function handler(req: any, res?: any) {
  // Support both Node.js (req, res) and Web standard Request
  const getHeader = (name: string) => {
    if (req.headers?.get) return req.headers.get(name);
    return req.headers?.[name.toLowerCase()] || req.headers?.[name];
  };

  const authHeader = getHeader('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const errorBody = { error: 'Please sign in to send a test alert.' };
    return res && res.status ? res.status(401).json(errorBody) : new Response(JSON.stringify(errorBody), { status: 401 });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? 'https://qxlaaqfogzxqxzktsxjy.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    const errorBody = { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.' };
    return res && res.status ? res.status(500).json(errorBody) : new Response(JSON.stringify(errorBody), { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Verify User Session from JWT
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    const errorBody = { error: 'Invalid or expired session. Please sign in again.' };
    return res && res.status ? res.status(401).json(errorBody) : new Response(JSON.stringify(errorBody), { status: 401 });
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
    const errorBody = {
      error: 'Daily test limit reached (maximum 3 test alerts per day).',
      testsRemainingToday: 0,
    };
    return res && res.status ? res.status(429).json(errorBody) : new Response(JSON.stringify(errorBody), { status: 429 });
  }

  try {
    // 3. Resolve user's first field or fallback to district HQ
    const { data: fields } = await supabaseAdmin
      .from('fields')
      .select('id, name, district, latitude, longitude')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1);

    const firstField = fields && fields.length > 0 ? fields[0] : null;

    let lat = firstField?.latitude || 25.63;
    let lon = firstField?.longitude || 88.64;
    let districtName = firstField?.district || 'Dinajpur';

    const matchedDist: any = (BD_DISTRICTS as readonly any[]).find(
      (d) => d.id === districtName.toLowerCase().replace(/[\s'-]/g, '') || d.nameEn.toLowerCase() === districtName.toLowerCase(),
    );

    const distNameEn = matchedDist?.nameEn || districtName;
    const distNameBn = matchedDist?.nameBn || distNameEn;

    // 4. Fetch real NASA POWER data
    const daily = await fetchPowerDaily(lat, lon, 60, 8000);
    const conditions = computeConditions(daily, lat, 30);
    const maxTemp = conditions.tMax30;
    const dataDate = conditions.to || new Date().toISOString().split('T')[0];
    const dataDateBn = toBnDigits(dataDate);
    const maxTempFormatted = maxTemp.toFixed(1);
    const maxTempBn = toBnDigits(maxTempFormatted);

    // 5. Construct Test Alert Notification Row
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

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('notifications')
      .insert(notificationPayload)
      .select()
      .single();

    if (insertErr) {
      console.error('Failed to insert test alert:', insertErr.message);
      const errorBody = { error: `Failed to create test alert: ${insertErr.message}` };
      return res && res.status ? res.status(500).json(errorBody) : new Response(JSON.stringify(errorBody), { status: 500 });
    }

    // 6. Check if email_alerts is enabled on user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email_alerts')
      .eq('id', user.id)
      .maybeSingle();

    let emailed = false;
    if (profile?.email_alerts && user.email) {
      const appUrl = process.env.VITE_APP_URL || process.env.APP_URL || 'https://agri-orbit.vercel.app';
      const emailHtml = buildAlertEmailHtml([inserted], appUrl);
      const sendRes = await sendAlertEmailViaSmtp({
        to: user.email,
        subject: `${title_en} / ${title_bn}`,
        html: emailHtml,
      });

      if (sendRes.ok) {
        emailed = true;
        await supabaseAdmin
          .from('notifications')
          .update({ emailed_at: new Date().toISOString() })
          .eq('id', inserted.id);
      }
    }

    const responseBody = {
      success: true,
      message: 'Test alert generated successfully',
      notification: inserted,
      emailed,
      testsRemainingToday: Math.max(0, 2 - currentCount),
    };

    return res && res.status ? res.status(200).json(responseBody) : new Response(JSON.stringify(responseBody), { status: 200 });
  } catch (err: any) {
    console.error('Error generating test alert:', err?.message);
    const errorBody = { error: `Error generating test alert: ${err?.message}` };
    return res && res.status ? res.status(500).json(errorBody) : new Response(JSON.stringify(errorBody), { status: 500 });
  }
}
