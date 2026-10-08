const SMS_SERVER = (import.meta.env.VITE_SMS_SERVER_URL || '').replace(/\/$/, '');
const SMS_API_KEY = import.meta.env.VITE_SMS_API_KEY || '';
const SMS_TIMEOUT_MS = 10000;

export async function sendSmsRequest(payload, options = {}) {
  if (!SMS_SERVER) {
    throw new Error('SMS server URL is not configured.');
  }
  if (!SMS_API_KEY) {
    throw new Error('SMS API key is not configured.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SMS_TIMEOUT_MS);

  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SMS_API_KEY}`,
    };
    if (options.idToken) headers['X-Firebase-Auth'] = options.idToken;

    const res = await fetch(`${SMS_SERVER}/send-sms`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `SMS request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('SMS request timed out. Please try again.', { cause: err });
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
