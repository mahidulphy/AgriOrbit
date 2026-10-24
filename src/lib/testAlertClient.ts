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
      return {
        ok: false,
        message: isBn ? 'অনুরোধ ব্যর্থ: সক্রিয় সেশন পাওয়া যায়নি।' : 'Session token not found. Please log in again.',
      };
    }

    const res = await fetch('/api/test-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        message: body.error || (isBn ? 'সতর্কতা তৈরিতে ব্যর্থ হয়েছে।' : 'Failed to create test alert.'),
        testsRemainingToday: body.testsRemainingToday,
      };
    }

    const emailNote = body.emailed
      ? isBn
        ? ` (${userEmail ? userEmail + ' ঠিকানায় ' : ''}ইমেইল পাঠানো হয়েছে)`
        : ` (Email sent to ${userEmail || 'your email'})`
      : '';

    // Notify NotificationBell component to refresh immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('agriorbit:refresh-notifications'));
    }

    return {
      ok: true,
      message: isBn
        ? `পরীক্ষামূলক সতর্কতা তৈরি হয়েছে — বেল আইকনে দেখুন${emailNote}`
        : `Test alert created — check your bell icon${emailNote}`,
      emailed: body.emailed,
      testsRemainingToday: body.testsRemainingToday,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.message || (isBn ? 'নেটওয়ার্ক ত্রুটি।' : 'Network error.'),
    };
  }
}
