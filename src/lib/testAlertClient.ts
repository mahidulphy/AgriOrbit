import { supabase } from './supabase';

export interface SendTestAlertResult {
  ok: boolean;
  message: string;
  emailed?: boolean;
  testsRemainingToday?: number;
}

export async function sendTestAlert(isBn: boolean, userEmail?: string | null): Promise<SendTestAlertResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      const errMsg = isBn ? 'অনুরোধ ব্যর্থ: সক্রিয় সেশন পাওয়া যায়নি। অনুগ্রহ করে পুনরায় লগইন করুন।' : 'Session token not found. Please sign in again.';
      console.warn('[testAlertClient] Missing user session token.');
      return { ok: false, message: errMsg };
    }

    // Try /api/send-alert first, fallback to /api/test-alert
    let res = await fetch('/api/send-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 404) {
      res = await fetch('/api/test-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    }

    const body = await res.json().catch(() => ({}));

    if (!res.ok || (!body.ok && !body.success)) {
      const rawError = body.error || body.message || '';
      console.error('[testAlertClient] Alert API returned error status:', res.status, rawError, body);

      let friendlyMessage = rawError;
      // Sanitize raw database or postgres errors so raw SQL/Postgres errors are never shown to users
      if (
        !friendlyMessage ||
        /supabase|postgres|duplicate key|unique constraint|violates|relation|syntax error|column|table|42501|23505/i.test(friendlyMessage)
      ) {
        friendlyMessage = isBn
          ? 'একটু পরে আবার চেষ্টা করুন / Please wait a minute before sending another test.'
          : 'Please wait a moment before sending another test.';
      }

      return {
        ok: false,
        message: friendlyMessage,
        testsRemainingToday: body.testsRemainingToday,
      };
    }

    // Refresh notification bell component immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('agriorbit:refresh-notifications'));
    }

    const recipient = userEmail || body.recipientEmail || 'your email';

    return {
      ok: true,
      message: isBn
        ? `পরীক্ষামূলক সতর্কতা তৈরি হয়েছে এবং ${recipient} ঠিকানায় ইমেইল পাঠানো হয়েছে!`
        : `Test alert created and email sent successfully to ${recipient}!`,
      emailed: Boolean(body.emailed),
      testsRemainingToday: body.testsRemainingToday,
    };
  } catch (err: any) {
    console.error('[testAlertClient] Network or runtime exception sending test alert:', err);
    return {
      ok: false,
      message: err?.message || (isBn ? 'নেটওয়ার্ক সংযোগ ত্রুটি।' : 'Network connection error.'),
    };
  }
}
