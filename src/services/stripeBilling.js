const DEFAULT_BILLING_SERVER = 'https://starflow-production-0a94.up.railway.app';
const BILLING_SERVER = (import.meta.env.VITE_SMS_SERVER_URL || DEFAULT_BILLING_SERVER).replace(/\/$/, '');
const BILLING_API_KEY = import.meta.env.VITE_SMS_API_KEY || '';
const BILLING_TIMEOUT_MS = 10000;

async function postBillingAction(path, idToken, body = {}) {
  if (!BILLING_SERVER) {
    throw new Error('Billing server URL is not configured.');
  }
  if (!BILLING_API_KEY) {
    throw new Error('Billing API key is not configured.');
  }
  if (!idToken) {
    throw new Error('You must be signed in to manage billing.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BILLING_TIMEOUT_MS);

  try {
    const res = await fetch(`${BILLING_SERVER}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${BILLING_API_KEY}`,
        'X-Firebase-Auth': idToken,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Billing request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Billing request timed out. Please try again.', { cause: err });
    }
    if (err instanceof TypeError) {
      throw new Error('Could not reach the billing server. Please try again.', { cause: err });
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function requestSubscriptionCancellation(idToken) {
  return postBillingAction('/stripe/cancel-subscription', idToken, {
    action: 'cancel_at_period_end',
  });
}

export function syncStripeSubscription(idToken) {
  return postBillingAction('/stripe/sync-subscription', idToken, {
    action: 'sync_subscription',
  });
}

export function keepSubscription(idToken) {
  return postBillingAction('/stripe/keep-subscription', idToken, {
    action: 'keep_subscription',
  });
}
