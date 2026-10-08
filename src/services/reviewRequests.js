import { getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { sendSmsRequest } from './sms';

const SEND_TIMEOUT_MS = 30 * 1000;
export const SMS_PUBLIC_FAILURE_MESSAGE = 'SMS could not be sent. This may be due to Twilio trial restrictions or an unverified number.';

function createRequestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `sms_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function sanitizeSmsError(err) {
  const message = String(err?.message || err || 'SMS could not be delivered.');
  if (message.toLowerCase().includes('configured')) return 'SMS is not configured yet.';
  return SMS_PUBLIC_FAILURE_MESSAGE;
}

async function markIfCurrent(customerRef, requestId, nextStatus, extra = {}) {
  const snap = await getDoc(customerRef);
  if (!snap.exists()) return false;
  const current = snap.data();
  if (current.smsRequestId !== requestId || current.status !== 'sending_sms') return false;
  await updateDoc(customerRef, {
    status: nextStatus,
    ...extra,
    smsCompletedAt: serverTimestamp(),
  });
  return true;
}

export function buildReviewRequestMessage({
  firstName,
  businessName,
  googleReviewLink,
}) {
  return `Hi ${firstName}! ${businessName} is asking: How was your recent service? Share your feedback here: ${googleReviewLink}`;
}

export const DEFAULT_REVIEW_SMS_TEMPLATE =
  'Hi {{firstName}}, thank you for choosing {{businessName}}. Could you leave us a quick Google review? {{reviewLink}}';

export function renderReviewTemplate(template, vars = {}) {
  return String(template || '')
    .replace(/\{\{\s*firstName\s*\}\}/g, vars.firstName ?? '')
    .replace(/\{\{\s*fullName\s*\}\}/g, vars.fullName ?? '')
    .replace(/\{\{\s*businessName\s*\}\}/g, vars.businessName ?? '')
    .replace(/\{\{\s*reviewLink\s*\}\}/g, vars.reviewLink ?? '')
    .trim();
}

export async function queueReviewRequest({
  customerRef,
  businessId,
  customerPhone,
  businessName,
  googleReviewLink,
  firstName,
  message,
  requestId: providedRequestId,
  idToken,
}) {
  const requestId = providedRequestId || createRequestId();
  const smsMessage = String(message || '').trim() || buildReviewRequestMessage({
    firstName,
    businessName,
    googleReviewLink,
  });
  const requestedAtClient = Date.now();

  try {
    await updateDoc(customerRef, {
      status: 'sending_sms',
      smsRequestId: requestId,
      smsRequestedAt: serverTimestamp(),
      smsRequestedAtClient: requestedAtClient,
      smsError: '',
      smsMessage,
    });
  } catch (error) {
    return {
      ok: false,
      requestId,
      error: sanitizeSmsError(error),
      stage: 'prepare',
    };
  }

  const watchdog = setTimeout(async () => {
    try {
      await markIfCurrent(customerRef, requestId, 'sms_failed', {
        smsError: SMS_PUBLIC_FAILURE_MESSAGE,
      });
    } catch {
      // Best-effort recovery only.
    }
  }, SEND_TIMEOUT_MS);

  try {
    const result = await sendSmsRequest({
      businessId,
      customerPhone,
      businessName,
      googleReviewLink,
      message: smsMessage,
      requestId,
    }, { idToken });

    const updated = await markIfCurrent(customerRef, requestId, 'sms_sent', {
      smsError: '',
      smsProviderSid: result?.sid || '',
    });

    return {
      ok: Boolean(updated),
      requestId,
      result,
    };
  } catch (error) {
    const failureMessage = sanitizeSmsError(error);
    try {
      await markIfCurrent(customerRef, requestId, 'sms_failed', {
        smsError: failureMessage,
      });
    } catch {
      // Best-effort recovery only.
    }
    return {
      ok: false,
      requestId,
      error: failureMessage,
      stage: 'send',
    };
  } finally {
    clearTimeout(watchdog);
  }
}
