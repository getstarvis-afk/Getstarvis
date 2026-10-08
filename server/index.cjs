require('dotenv').config();

const crypto = require('crypto');
const https  = require('https');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const twilio = require('twilio');
const Stripe = require('stripe');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 8080;

const REQUIRED_ENV = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'SMS_API_KEY',
];

const STRIPE_ENV = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'https://starflow-80e49.web.app',
  'https://getstarvis.com',
  'https://www.getstarvis.com',
]);

const phoneCooldown = new Map();
const PHONE_COOLDOWN_MS = 10 * 60 * 1000;
const PHONE_MAX_PER_WINDOW = 2;
const TWILIO_TIMEOUT_MS = 10000;
const PUBLIC_APP_URL = (process.env.PUBLIC_APP_URL || 'https://getstarvis.com').replace(/\/$/, '');
const STRIPE_WEBHOOK_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
]);
const PLAN_BY_AMOUNT_INTERVAL = new Map([
  ['4900:month', { plan: 'starter', billingCycle: 'monthly' }],
  ['14900:month', { plan: 'growth', billingCycle: 'monthly' }],
  ['29900:month', { plan: 'pro', billingCycle: 'monthly' }],
  ['39000:year', { plan: 'starter', billingCycle: 'annual' }],
  ['95000:year', { plan: 'growth', billingCycle: 'annual' }],
  ['190000:year', { plan: 'pro', billingCycle: 'annual' }],
]);

// Temporary development/demo override.
// Set DEV_MODE=false or remove SMS_DEV_ALLOWED_PHONE to disable.
function isDevModeEnabled() {
  return process.env.DEV_MODE === 'true';
}

function normalizePhoneKey(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function isDevAllowedPhone(phone) {
  const allowed = normalizePhoneKey(process.env.SMS_DEV_ALLOWED_PHONE);
  return isDevModeEnabled() && allowed && normalizePhoneKey(phone) === allowed;
}

function assertEnv() {
  const missing = REQUIRED_ENV.filter(name => !process.env[name]);
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const hasServiceAccountKey = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const hasSplitServiceAccount = !!(
    process.env.FIREBASE_PROJECT_ID
    && process.env.FIREBASE_CLIENT_EMAIL
    && process.env.FIREBASE_PRIVATE_KEY
  );
  if (!hasServiceAccountKey && !hasSplitServiceAccount && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn('Firebase Admin credentials are not configured. Stripe billing sync endpoints will return 503 until configured.');
  }

  const missingStripe = STRIPE_ENV.filter(name => !process.env[name]);
  if (missingStripe.length) {
    console.warn(`Missing Stripe environment variables: ${missingStripe.join(', ')}. Stripe endpoints will return 503 until configured.`);
  }
}

function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 4) return '[masked]';
  return `[masked:${digits.slice(-4)}]`;
}

function cleanExpiredPhoneHits(now = Date.now()) {
  for (const [phone, hits] of phoneCooldown.entries()) {
    const active = hits.filter(ts => now - ts < PHONE_COOLDOWN_MS);
    if (active.length) phoneCooldown.set(phone, active);
    else phoneCooldown.delete(phone);
  }
}

function isPhoneRateLimited(phone) {
  const now = Date.now();
  cleanExpiredPhoneHits(now);
  const key = normalizePhoneKey(phone);
  const hits = (phoneCooldown.get(key) || []).filter(ts => now - ts < PHONE_COOLDOWN_MS);
  hits.push(now);
  phoneCooldown.set(key, hits);
  return hits.length > PHONE_MAX_PER_WINDOW;
}

function safeError(res, status, message) {
  return res.status(status).json({ success: false, error: message });
}

function authError(res, status, code, message, detail = {}) {
  return res.status(status).json({
    success: false,
    error: message,
    code,
    ...detail,
  });
}

function cleanLogValue(value) {
  if (value === undefined || value === null || value === '') return 'none';
  return String(value);
}

function logBilling(level, event, fields = {}) {
  const detail = Object.entries(fields)
    .map(([key, value]) => `${key}=${cleanLogValue(value)}`)
    .join(' ');
  console[level](`billing.${event}${detail ? ` ${detail}` : ''}`);
}

function withTimeout(promise, timeoutMs, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(message);
      err.code = 'TWILIO_TIMEOUT';
      reject(err);
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function getAllowedApiKeys() {
  return [process.env.SMS_API_KEY, process.env.VITE_SMS_API_KEY]
    .filter(Boolean)
    .map(key => String(key).trim());
}

function getKeyDiagnostics(value) {
  const clean = String(value || '').trim();
  return {
    present: Boolean(clean),
    prefix8: clean ? clean.slice(0, 8) : 'none',
    length: clean.length,
  };
}

function getConfiguredKeyDiagnostics() {
  return {
    smsApiKey: getKeyDiagnostics(process.env.SMS_API_KEY),
    viteSmsApiKey: getKeyDiagnostics(process.env.VITE_SMS_API_KEY),
  };
}

function parseServiceAccountKey(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  const json = trimmed.startsWith('{')
    ? trimmed
    : Buffer.from(trimmed, 'base64').toString('utf8');
  const parsed = JSON.parse(json);
  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  return parsed;
}

function getFirebaseCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return admin.credential.cert(parseServiceAccountKey(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
  }
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }
  return admin.credential.applicationDefault();
}

function initFirebaseAdmin() {
  if (admin.apps.length) return admin.firestore();
  try {
    admin.initializeApp({ credential: getFirebaseCredential() });
    return admin.firestore();
  } catch (err) {
    console.warn(`Firebase Admin initialization skipped reason=${err.message}`);
    return null;
  }
}

function requireStripeConfigured(res) {
  if (!stripe) {
    safeError(res, 503, 'Stripe billing is not configured.');
    return false;
  }
  return true;
}

function requireStripeWebhookConfigured(res) {
  if (!requireStripeConfigured(res)) return false;
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    safeError(res, 503, 'Stripe webhook is not configured.');
    return false;
  }
  return true;
}

function requireFirestoreConfigured(res) {
  if (!db) {
    safeError(res, 503, 'Billing sync is not configured.');
    return false;
  }
  return true;
}

function mapStripeSubscriptionStatus(status, cancelAtPeriodEnd = false) {
  if (cancelAtPeriodEnd && status !== 'canceled') return 'canceling';
  if (status === 'trialing') return 'trialing';
  if (status === 'active') return 'active';
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete' || status === 'incomplete_expired') return 'past_due';
  if (status === 'canceled') return 'canceled';
  return status || 'pending_checkout';
}

function isBillingActive(status) {
  return ['trialing', 'active', 'canceling'].includes(status);
}

function getId(value) {
  return typeof value === 'string' ? value : value?.id || '';
}

function summarizeSubscription(subscription) {
  if (!subscription) return null;
  return {
    id: subscription.id,
    customerId: getId(subscription.customer),
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end || null,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    trialEnd: subscription.trial_end || null,
    created: subscription.created || null,
  };
}

function summarizeCustomer(customer) {
  if (!customer || customer.deleted) return null;
  return {
    id: customer.id,
    email: customer.email || null,
    created: customer.created || null,
  };
}

function subscriptionRank(subscription) {
  const statusRank = {
    active: 5,
    trialing: 4,
    past_due: 3,
    unpaid: 2,
    incomplete: 1,
  };
  return statusRank[subscription?.status] || 0;
}

function pickBestSubscription(subscriptions) {
  return subscriptions
    .filter(subscription => subscription.status !== 'canceled' && subscription.status !== 'incomplete_expired')
    .sort((left, right) => {
      const rankDiff = subscriptionRank(right) - subscriptionRank(left);
      if (rankDiff) return rankDiff;
      return (right.created || 0) - (left.created || 0);
    })[0] || null;
}

function inferPlanFromPrice(price) {
  if (!price) return {};
  if (price.metadata?.plan && price.metadata?.billingCycle) {
    return { plan: price.metadata.plan, billingCycle: price.metadata.billingCycle };
  }
  const interval = price.recurring?.interval || '';
  const amount = price.unit_amount;
  return PLAN_BY_AMOUNT_INTERVAL.get(`${amount}:${interval}`) || {};
}

function inferPlanFromSubscription(subscription) {
  const price = subscription?.items?.data?.[0]?.price;
  return inferPlanFromPrice(price);
}

async function findUserRefForStripe({ uid, customerId, subscriptionId, email }) {
  if (!db) return null;

  if (uid) {
    return db.collection('users').doc(uid);
  }

  if (subscriptionId) {
    const bySubscription = await db.collection('users')
      .where('billing.stripeSubscriptionId', '==', subscriptionId)
      .limit(1)
      .get();
    if (!bySubscription.empty) return bySubscription.docs[0].ref;
  }

  if (subscriptionId) {
    const bySubscriptionAlias = await db.collection('users')
      .where('billing.subscriptionId', '==', subscriptionId)
      .limit(1)
      .get();
    if (!bySubscriptionAlias.empty) return bySubscriptionAlias.docs[0].ref;
  }

  if (customerId) {
    const byCustomer = await db.collection('users')
      .where('billing.stripeCustomerId', '==', customerId)
      .limit(1)
      .get();
    if (!byCustomer.empty) return byCustomer.docs[0].ref;
  }

  if (email) {
    const cleanEmail = String(email).trim().toLowerCase();
    const byBillingEmail = await db.collection('users')
      .where('billing.email', '==', cleanEmail)
      .limit(1)
      .get();
    if (!byBillingEmail.empty) return byBillingEmail.docs[0].ref;
  }

  return null;
}

async function updateUserBilling(userRef, patch) {
  const cleanPatch = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined && value !== ''),
  );
  await userRef.set({
    billing: {
      ...cleanPatch,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  }, { merge: true });
}

function buildSubscriptionBillingPatch(subscription, extra = {}) {
  const inferred = inferPlanFromSubscription(subscription);
  const customerId = getId(subscription.customer);
  const subscriptionId = subscription.id;
  const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);
  const subscriptionStatus = subscription.status || '';
  const status = extra.status || mapStripeSubscriptionStatus(subscriptionStatus, cancelAtPeriodEnd);
  const currentPeriodStart = subscription.current_period_start || undefined;
  const currentPeriodEnd = subscription.current_period_end || undefined;
  const trialEnd = subscription.trial_end || undefined;

  return {
    ...inferred,
    ...extra,
    status,
    active: isBillingActive(status),
    subscriptionStatus,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    subscriptionId,
    stripeCurrentPeriodStart: currentPeriodStart,
    stripeCurrentPeriodEnd: currentPeriodEnd,
    currentPeriodStart,
    currentPeriodEnd,
    stripeTrialEnd: trialEnd,
    trialEnd,
    trialActive: status === 'trialing',
    stripeCancelAtPeriodEnd: cancelAtPeriodEnd,
    cancelAtPeriodEnd,
    canceledAt: subscription.canceled_at || undefined,
  };
}

async function handleCheckoutCompleted(session) {
  const uid = session.client_reference_id || session.metadata?.uid || '';
  const subscriptionId = getId(session.subscription);
  const customerId = getId(session.customer);
  const email = session.customer_details?.email || session.customer_email || '';
  console.info(`Stripe webhook received type=checkout.session.completed session=${session.id} customer=${customerId || 'none'} subscription=${subscriptionId || 'none'} uid=${uid || 'none'}`);
  const userRef = await findUserRefForStripe({ uid, customerId, subscriptionId, email });

  if (!userRef) {
    console.warn(`Stripe checkout completed without matching user session=${session.id} customer=${customerId || 'none'} subscription=${subscriptionId || 'none'} email=${email || 'none'}`);
    return;
  }

  const existing = (await userRef.get()).data()?.billing || {};
  let subscription = null;
  if (subscriptionId) {
    subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price'],
    });
  }

  await updateUserBilling(userRef, {
    ...existing,
    ...(subscription ? buildSubscriptionBillingPatch(subscription) : {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionId,
      active: false,
      subscriptionStatus: 'checkout_completed',
    }),
    stripeCheckoutSessionId: session.id,
    stripePaymentStatus: session.payment_status,
    email: email ? email.toLowerCase() : existing.email,
    activatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.info(`Firestore billing updated from checkout uid=${userRef.id} customer=${customerId} subscription=${subscriptionId || 'none'}`);
}

async function handleSubscriptionEvent(subscription, forcedStatus) {
  const subscriptionId = subscription.id;
  const customerId = getId(subscription.customer);
  console.info(`Stripe webhook received type=subscription status=${subscription.status} customer=${customerId} subscription=${subscriptionId}`);
  let userRef = await findUserRefForStripe({ customerId, subscriptionId });
  if (!userRef && customerId) {
    const customer = await stripe.customers.retrieve(customerId).catch(() => null);
    userRef = await findUserRefForStripe({
      customerId,
      subscriptionId,
      email: customer && !customer.deleted ? customer.email : '',
    });
  }

  if (!userRef) {
    console.warn(`Stripe subscription event without matching user subscription=${subscriptionId} customer=${customerId}`);
    return;
  }

  const patch = buildSubscriptionBillingPatch(subscription, forcedStatus ? { status: forcedStatus } : {});
  await updateUserBilling(userRef, {
    ...patch,
  });

  console.info(`Firestore billing updated from subscription uid=${userRef.id} status=${patch.status} subscription=${subscriptionId}`);
}

async function handleInvoiceEvent(invoice, status) {
  const subscriptionId = getId(invoice.subscription);
  const customerId = getId(invoice.customer);
  console.info(`Stripe webhook received type=invoice status=${status} invoice=${invoice.id} customer=${customerId || 'none'} subscription=${subscriptionId || 'none'}`);
  let userRef = await findUserRefForStripe({ customerId, subscriptionId });
  if (!userRef && customerId) {
    const customer = await stripe.customers.retrieve(customerId).catch(() => null);
    userRef = await findUserRefForStripe({
      customerId,
      subscriptionId,
      email: customer && !customer.deleted ? customer.email : '',
    });
  }

  if (!userRef) {
    console.warn(`Stripe invoice event without matching user invoice=${invoice.id} customer=${customerId} subscription=${subscriptionId || 'none'}`);
    return;
  }

  await updateUserBilling(userRef, {
    status,
    active: isBillingActive(status),
    subscriptionStatus: status,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    subscriptionId,
    latestInvoiceId: invoice.id,
    latestInvoiceStatus: invoice.status,
    latestInvoiceHostedUrl: invoice.hosted_invoice_url || undefined,
  });

  console.info(`Stripe invoice updated uid=${userRef.id} status=${status} invoice=${invoice.id}`);
}

async function findLatestSubscriptionForUser({ uid, email, billing }) {
  const existingSubscriptionId = billing?.stripeSubscriptionId || billing?.subscriptionId;
  if (existingSubscriptionId) {
    logBilling('info', 'stripe.subscription.retrieve.start', { uid, subscriptionId: existingSubscriptionId });
    try {
      const subscription = await stripe.subscriptions.retrieve(existingSubscriptionId, {
        expand: ['items.data.price'],
      });
      logBilling('info', 'stripe.subscription.retrieve.success', {
        uid,
        subscriptionId: subscription.id,
        status: subscription.status,
        customerId: getId(subscription.customer),
      });
      return subscription;
    } catch (err) {
      if (err && err.code !== 'resource_missing') throw err;
      logBilling('warn', 'stripe.subscription.retrieve.missing', { uid, subscriptionId: existingSubscriptionId });
    }
  }

  const candidateCustomerIds = new Set();
  if (billing?.stripeCustomerId) candidateCustomerIds.add(billing.stripeCustomerId);

  const cleanEmail = String(email || billing?.email || '').trim().toLowerCase();
  if (cleanEmail) {
    logBilling('info', 'stripe.customer.lookup.start', { uid, email: cleanEmail });
    const customers = await stripe.customers.list({
      email: cleanEmail,
      limit: 10,
    });
    logBilling('info', 'stripe.customer.lookup.success', {
      uid,
      email: cleanEmail,
      count: customers.data.length,
      customerIds: customers.data.map(customer => customer.id).join(',') || 'none',
    });
    customers.data.forEach(customer => candidateCustomerIds.add(customer.id));
  }

  const candidates = [];
  for (const customerId of candidateCustomerIds) {
    logBilling('info', 'stripe.subscription.lookup.start', { uid, customerId });
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
      expand: ['data.items.data.price'],
    });
    logBilling('info', 'stripe.subscription.lookup.success', {
      uid,
      customerId,
      count: subscriptions.data.length,
      statuses: subscriptions.data.map(subscription => `${subscription.id}:${subscription.status}`).join(',') || 'none',
    });
    candidates.push(...subscriptions.data);
  }

  const selected = pickBestSubscription(candidates);
  if (!selected) {
    logBilling('warn', 'stripe.subscription.lookup.empty', { uid, email: cleanEmail || 'none' });
  } else {
    logBilling('info', 'stripe.subscription.lookup.selected', {
      uid,
      subscriptionId: selected.id,
      status: selected.status,
      customerId: getId(selected.customer),
    });
  }
  return selected;
}

async function syncUserSubscriptionFromStripe(userRef, firebaseUser) {
  const snap = await userRef.get();
  const billing = snap.data()?.billing || {};
  const email = firebaseUser.email || billing.email || '';
  const subscription = await findLatestSubscriptionForUser({
    uid: userRef.id,
    email,
    billing,
  });

  if (!subscription) return null;

  const patch = buildSubscriptionBillingPatch(subscription, {
    email: email ? String(email).toLowerCase() : billing.email,
    lastManualSyncAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await updateUserBilling(userRef, patch);
  logBilling('info', 'firestore.update.success', {
    uid: userRef.id,
    status: patch.status,
    active: patch.active,
    customerId: patch.stripeCustomerId,
    subscriptionId: patch.subscriptionId,
    currentPeriodEnd: patch.currentPeriodEnd || 'none',
    cancelAtPeriodEnd: patch.cancelAtPeriodEnd,
  });
  return { subscription, patch };
}

async function handleStripeEvent(event) {
  console.info(`Stripe webhook dispatch type=${event.type} id=${event.id}`);
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionEvent(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionEvent(event.data.object, 'canceled');
      break;
    case 'invoice.paid':
      await handleInvoiceEvent(event.data.object, 'active');
      break;
    case 'invoice.payment_failed':
      await handleInvoiceEvent(event.data.object, 'past_due');
      break;
    default:
      break;
  }
}

function requireApiKey(req, res, next) {
  const auth = req.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const allowedKeys = getAllowedApiKeys();
  const receivedKey = getKeyDiagnostics(token);
  const configuredKeys = getConfiguredKeyDiagnostics();
  const hasAuthorization = Boolean(auth);
  const hasBearerToken = Boolean(token);
  const hasAllowedKeys = allowedKeys.length > 0;
  if (!token || !allowedKeys.some(key => timingSafeEqualString(token, key))) {
    const reason = !hasAuthorization
      ? 'missing_authorization_header'
      : !hasBearerToken
        ? 'missing_bearer_token'
        : !hasAllowedKeys
          ? 'no_server_api_keys_configured'
          : 'api_key_mismatch';
    logBilling('warn', 'api_key.failure', {
      path: req.path,
      reason,
      apiKeyReceived: hasBearerToken,
      firebaseTokenReceived: Boolean(req.get('x-firebase-auth')),
      hasAuthorization,
      allowedKeyCount: allowedKeys.length,
      receivedKeyPrefix8: receivedKey.prefix8,
      receivedKeyLength: receivedKey.length,
      smsApiKeyPrefix8: configuredKeys.smsApiKey.prefix8,
      smsApiKeyLength: configuredKeys.smsApiKey.length,
      viteSmsApiKeyPrefix8: configuredKeys.viteSmsApiKey.prefix8,
      viteSmsApiKeyLength: configuredKeys.viteSmsApiKey.length,
    });
    return authError(res, 401, 'api_key_unauthorized', 'Billing API key was not accepted.', {
      reason,
      apiKeyReceived: hasBearerToken,
      firebaseTokenReceived: Boolean(req.get('x-firebase-auth')),
      receivedKeyPrefix8: receivedKey.prefix8,
      receivedKeyLength: receivedKey.length,
      configuredKeyCount: allowedKeys.length,
      configuredKeys: {
        smsApiKeyPrefix8: configuredKeys.smsApiKey.prefix8,
        smsApiKeyLength: configuredKeys.smsApiKey.length,
        viteSmsApiKeyPrefix8: configuredKeys.viteSmsApiKey.prefix8,
        viteSmsApiKeyLength: configuredKeys.viteSmsApiKey.length,
      },
    });
  }
  logBilling('info', 'api_key.success', {
    path: req.path,
    apiKeyReceived: true,
    firebaseTokenReceived: Boolean(req.get('x-firebase-auth')),
    allowedKeyCount: allowedKeys.length,
    receivedKeyPrefix8: receivedKey.prefix8,
    receivedKeyLength: receivedKey.length,
  });
  return next();
}

async function requireFirebaseUser(req, res, next) {
  if (!db) {
    return safeError(res, 503, 'Billing sync is not configured.');
  }

  const token = req.get('x-firebase-auth') || '';
  if (!token) {
    logBilling('warn', 'firebase_auth.failure', {
      path: req.path,
      reason: 'missing_firebase_token',
      apiKeyReceived: Boolean((req.get('authorization') || '').startsWith('Bearer ')),
      firebaseTokenReceived: false,
    });
    return authError(res, 401, 'firebase_auth_missing', 'Firebase authentication token is required.', {
      reason: 'missing_firebase_token',
      apiKeyReceived: Boolean((req.get('authorization') || '').startsWith('Bearer ')),
      firebaseTokenReceived: false,
    });
  }

  try {
    req.firebaseUser = await admin.auth().verifyIdToken(token);
    logBilling('info', 'firebase_auth.success', {
      path: req.path,
      uid: req.firebaseUser.uid,
      email: req.firebaseUser.email || 'none',
      apiKeyReceived: Boolean((req.get('authorization') || '').startsWith('Bearer ')),
      firebaseTokenReceived: true,
    });
    return next();
  } catch (err) {
    const reason = err.code || err.message || 'invalid_firebase_token';
    logBilling('warn', 'firebase_auth.failure', {
      path: req.path,
      reason,
      apiKeyReceived: Boolean((req.get('authorization') || '').startsWith('Bearer ')),
      firebaseTokenReceived: true,
    });
    return authError(res, 401, 'firebase_auth_invalid', 'Firebase authentication token could not be verified.', {
      reason,
      apiKeyReceived: Boolean((req.get('authorization') || '').startsWith('Bearer ')),
      firebaseTokenReceived: true,
    });
  }
}

const MAX_SMS_MESSAGE_LENGTH = 640;

// Strip control characters (keep tab/newline) and normalize line endings so a
// custom message is safe to hand to Twilio. Normal text — including the
// "Reply STOP to opt out." consent wording — is preserved untouched.
function sanitizeSmsMessage(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

function validateSmsPayload(body) {
  const businessId = String(body.businessId || '').trim();
  const customerPhone = String(body.customerPhone || '').trim();
  const businessName = String(body.businessName || '').trim();
  const googleReviewLink = String(body.googleReviewLink || '').trim();
  const message = sanitizeSmsMessage(body.message);
  const requestId = String(body.requestId || '').trim();

  if (!businessId || !/^[A-Za-z0-9_-]{6,128}$/.test(businessId)) {
    return { error: 'Invalid business identifier.' };
  }

  if (!customerPhone || !/^\+?[0-9().\-\s]{8,24}$/.test(customerPhone)) {
    return { error: 'Invalid phone number.' };
  }

  if (!businessName || businessName.length > 80) {
    return { error: 'Invalid business name.' };
  }

  if (message && message.length > MAX_SMS_MESSAGE_LENGTH) {
    return { error: 'Message is too long.' };
  }

  if (requestId && requestId.length > 64) {
    return { error: 'Invalid request identifier.' };
  }

  if (googleReviewLink) {
    try {
      const url = new URL(googleReviewLink);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return { error: 'Invalid review link.' };
      }
    } catch {
      return { error: 'Invalid review link.' };
    }
  }

  return {
    value: {
      businessId,
      customerPhone,
      businessName,
      googleReviewLink,
      message,
      requestId,
    },
  };
}

assertEnv();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const db = initFirebaseAdmin();
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

app.disable('x-powered-by');
app.set('trust proxy', 1);

console.log(`Startup Node version: ${process.version}`);
console.log(`Startup PORT value: ${PORT}`);
console.log(`Startup Railway environment detected: ${Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY_SERVICE_ID)}`);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'starvis-sms' });
});
console.log('Startup health endpoint registered: GET /health');

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.has(origin)) return callback(null, true);
    return callback(new Error('CORS origin denied.'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Firebase-Auth'],
  maxAge: 600,
}));

app.post('/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
  if (!requireStripeWebhookConfigured(res) || !requireFirestoreConfigured(res)) return undefined;

  const signature = req.get('stripe-signature');
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.warn(`Stripe webhook signature rejected reason=${err.message}`);
    return res.status(400).send('Invalid webhook signature.');
  }

  if (!STRIPE_WEBHOOK_EVENTS.has(event.type)) {
    return res.json({ received: true, ignored: true });
  }

  try {
    await handleStripeEvent(event);
    return res.json({ received: true });
  } catch (err) {
    console.error(`Stripe webhook failed event=${event.type} id=${event.id} reason=${err.message}`);
    return res.status(500).json({ received: false, error: 'Webhook processing failed.' });
  }
});

app.use(express.json({ limit: '10kb' }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logBilling('warn', 'json_parse.failure', { path: req.path, reason: err.message });
    return safeError(res, 400, 'Invalid JSON body.');
  }
  return next(err);
});

// Public sports endpoints use a shared Firestore cache and their own small
// request limit; provider credentials stay exclusively in this server process.
require('./sports/routes.cjs')(app, { db });

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many API requests. Please try again later.' },
}));

const smsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many SMS requests. Please try again later.' },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many contact requests. Please try again later.' },
});

// Send an email via the Resend REST API using Node's built-in https module.
// If RESEND_API_KEY is not configured, resolves immediately with { skipped: true }.
function sendViaResend({ to, subject, text }) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) { resolve({ skipped: true }); return; }

    const fromAddress = process.env.RESEND_FROM || 'Starvis Contact <onboarding@resend.dev>';
    const body = JSON.stringify({ from: fromAddress, to: [to], subject, text });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data || '{}'));
        } else {
          reject(new Error(`Resend ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

app.post('/stripe/cancel-subscription', requireApiKey, requireFirebaseUser, async (req, res) => {
  if (!requireStripeConfigured(res) || !requireFirestoreConfigured(res)) return undefined;

  const uid = req.firebaseUser.uid;
  const userRef = db.collection('users').doc(uid);
  const snap = await userRef.get();
  const billing = snap.data()?.billing || {};
  const subscriptionId = billing.stripeSubscriptionId || billing.subscriptionId;

  if (!subscriptionId) {
    return safeError(res, 409, 'Stripe subscription is still syncing. Please try again shortly.');
  }

  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    const cancellationEffectiveAt = subscription.current_period_end
      || billing.stripeCurrentPeriodEnd
      || subscription.trial_end
      || billing.stripeTrialEnd;

    await updateUserBilling(userRef, {
      status: 'canceling',
      active: true,
      subscriptionStatus: subscription.status,
      stripeSubscriptionId: subscription.id,
      subscriptionId: subscription.id,
      stripeCustomerId: getId(subscription.customer) || billing.stripeCustomerId,
      stripeCancelAtPeriodEnd: true,
      cancelAtPeriodEnd: true,
      stripeCurrentPeriodEnd: subscription.current_period_end || billing.stripeCurrentPeriodEnd,
      currentPeriodEnd: subscription.current_period_end || billing.currentPeriodEnd,
      stripeTrialEnd: subscription.trial_end || billing.stripeTrialEnd,
      trialEnd: subscription.trial_end || billing.trialEnd,
      cancellationEffectiveAt,
      cancellationRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.info(`Stripe cancellation scheduled uid=${uid} subscription=${subscription.id} effectiveAt=${cancellationEffectiveAt || 'unknown'}`);
    return res.json({
      success: true,
      status: 'canceling',
      cancellationEffectiveAt,
      trialEnd: subscription.trial_end || billing.stripeTrialEnd || null,
    });
  } catch (err) {
    console.error(`Stripe cancellation failed uid=${uid} subscription=${subscriptionId} reason=${err.code || err.type || err.message || 'unknown'}`);
    return safeError(res, 502, 'Could not schedule subscription cancellation.');
  }
});

app.post('/stripe/keep-subscription', requireApiKey, requireFirebaseUser, async (req, res) => {
  if (!requireStripeConfigured(res) || !requireFirestoreConfigured(res)) return undefined;

  const uid = req.firebaseUser.uid;
  const email = req.firebaseUser.email || 'none';
  logBilling('info', 'keep_subscription.request.received', { uid, email });
  logBilling('info', 'keep_subscription.firebase_auth.success', { uid, email });

  const userRef = db.collection('users').doc(uid);
  const snap = await userRef.get();
  const billing = snap.data()?.billing || {};
  // Security: only ever act on the subscription id saved in Firestore for the authenticated
  // user. The subscription id is never read from the request body.
  const subscriptionId = billing.stripeSubscriptionId || billing.subscriptionId;

  if (!subscriptionId) {
    return safeError(res, 409, 'Stripe subscription is still syncing. Please try again shortly.');
  }

  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    logBilling('info', 'keep_subscription.stripe.update.success', {
      uid,
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    const status = mapStripeSubscriptionStatus(subscription.status, false);

    await updateUserBilling(userRef, {
      status,
      active: isBillingActive(status),
      subscriptionStatus: subscription.status,
      stripeSubscriptionId: subscription.id,
      subscriptionId: subscription.id,
      stripeCustomerId: getId(subscription.customer) || billing.stripeCustomerId,
      stripeCancelAtPeriodEnd: false,
      cancelAtPeriodEnd: false,
      stripeCurrentPeriodEnd: subscription.current_period_end || billing.stripeCurrentPeriodEnd,
      currentPeriodEnd: subscription.current_period_end || billing.currentPeriodEnd,
      stripeTrialEnd: subscription.trial_end || billing.stripeTrialEnd,
      trialEnd: subscription.trial_end || billing.trialEnd,
      trialActive: status === 'trialing',
      canceledAt: null,
      cancellationScheduledAt: null,
      cancellationRequestedAt: null,
      cancellationEffectiveAt: null,
      cancelAt: null,
      keptActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    logBilling('info', 'keep_subscription.firestore.update.success', {
      uid,
      status,
      subscriptionId: subscription.id,
      cancelAtPeriodEnd: false,
    });

    const payload = {
      success: true,
      status,
      active: isBillingActive(status),
      cancelAtPeriodEnd: false,
      subscriptionStatus: subscription.status,
      currentPeriodEnd: subscription.current_period_end || null,
      trialEnd: subscription.trial_end || null,
    };
    logBilling('info', 'keep_subscription.response.payload', {
      uid,
      status: payload.status,
      active: payload.active,
      subscriptionId: subscription.id,
      cancelAtPeriodEnd: payload.cancelAtPeriodEnd,
      subscriptionStatus: payload.subscriptionStatus,
      currentPeriodEnd: payload.currentPeriodEnd || 'none',
    });
    return res.json(payload);
  } catch (err) {
    logBilling('error', 'keep_subscription.failure', {
      uid,
      subscriptionId,
      reason: err.code || err.type || err.message || 'unknown',
    });
    return safeError(res, 502, 'Could not keep subscription.');
  }
});

app.post('/stripe/sync-subscription', requireApiKey, requireFirebaseUser, async (req, res) => {
  if (!requireStripeConfigured(res) || !requireFirestoreConfigured(res)) return undefined;

  const uid = req.firebaseUser.uid;
  const email = req.firebaseUser.email || 'none';
  const userRef = db.collection('users').doc(uid);
  logBilling('info', 'sync.request.received', { uid, email });

  try {
    const synced = await syncUserSubscriptionFromStripe(userRef, req.firebaseUser);
    if (!synced) {
      logBilling('warn', 'sync.failure', { uid, reason: 'subscription_not_found' });
      return safeError(res, 404, 'Subscription not found yet. Please wait a moment and try again.');
    }

    const payload = {
      success: true,
      status: synced.patch.status,
      active: synced.patch.active,
      stripeCustomerId: synced.patch.stripeCustomerId,
      stripeSubscriptionId: synced.patch.stripeSubscriptionId,
      subscriptionId: synced.patch.subscriptionId,
      currentPeriodEnd: synced.patch.currentPeriodEnd || null,
      cancelAtPeriodEnd: synced.patch.cancelAtPeriodEnd,
      subscriptionStatus: synced.patch.subscriptionStatus,
      trialEnd: synced.patch.trialEnd || null,
    };
    logBilling('info', 'sync.response.payload', {
      uid,
      status: payload.status,
      active: payload.active,
      customerId: payload.stripeCustomerId,
      subscriptionId: payload.subscriptionId,
      currentPeriodEnd: payload.currentPeriodEnd || 'none',
      cancelAtPeriodEnd: payload.cancelAtPeriodEnd,
      subscriptionStatus: payload.subscriptionStatus,
      trialEnd: payload.trialEnd || 'none',
    });
    return res.json(payload);
  } catch (err) {
    logBilling('error', 'sync.failure', { uid, reason: err.code || err.type || err.message || 'unknown' });
    return safeError(res, 502, 'Could not sync Stripe subscription.');
  }
});

app.get('/debug/billing/:uid', requireApiKey, async (req, res) => {
  if (!requireStripeConfigured(res) || !requireFirestoreConfigured(res)) return undefined;

  const uid = String(req.params.uid || '').trim();
  if (!uid) return safeError(res, 400, 'User id is required.');

  const result = {
    success: true,
    uid,
    billing: null,
    stripeCustomerFound: null,
    stripeSubscriptionFound: null,
    syncErrors: [],
  };

  try {
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      result.success = false;
      result.syncErrors.push('Firestore user not found.');
      return res.status(404).json(result);
    }

    const userData = snap.data() || {};
    const billing = userData.billing || {};
    result.billing = billing;

    const email = String(userData.email || billing.email || '').trim().toLowerCase();
    const customerIds = new Set();
    if (billing.stripeCustomerId) customerIds.add(billing.stripeCustomerId);

    if (email) {
      try {
        const customers = await stripe.customers.list({ email, limit: 10 });
        customers.data.forEach(customer => customerIds.add(customer.id));
        result.stripeCustomerFound = customers.data.map(summarizeCustomer).filter(Boolean);
      } catch (err) {
        result.syncErrors.push(`Stripe customer lookup failed: ${err.code || err.message || 'unknown'}`);
      }
    }

    const subscriptionId = billing.stripeSubscriptionId || billing.subscriptionId;
    const subscriptions = [];
    if (subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['items.data.price'],
        });
        subscriptions.push(subscription);
      } catch (err) {
        result.syncErrors.push(`Saved subscription lookup failed: ${err.code || err.message || 'unknown'}`);
      }
    }

    for (const customerId of customerIds) {
      try {
        const listed = await stripe.subscriptions.list({
          customer: customerId,
          status: 'all',
          limit: 10,
          expand: ['data.items.data.price'],
        });
        subscriptions.push(...listed.data);
      } catch (err) {
        result.syncErrors.push(`Subscription lookup failed for ${customerId}: ${err.code || err.message || 'unknown'}`);
      }
    }

    result.stripeSubscriptionFound = pickBestSubscription(subscriptions);
    result.stripeSubscriptionFound = summarizeSubscription(result.stripeSubscriptionFound);
    logBilling('info', 'debug.response.payload', {
      uid,
      customerCount: Array.isArray(result.stripeCustomerFound) ? result.stripeCustomerFound.length : 0,
      subscriptionId: result.stripeSubscriptionFound?.id || 'none',
      errorCount: result.syncErrors.length,
    });
    return res.json(result);
  } catch (err) {
    logBilling('error', 'debug.failure', { uid, reason: err.code || err.message || 'unknown' });
    return safeError(res, 500, 'Could not inspect billing debug data.');
  }
});

app.post('/send-sms', requireApiKey, smsLimiter, async (req, res) => {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const parsed = validateSmsPayload(req.body || {});
  if (parsed.error) {
    console.warn(`SMS request invalid requestId=${requestId} reason=${parsed.error}`);
    return safeError(res, 400, parsed.error);
  }

  const {
    businessId,
    customerPhone,
    businessName,
    googleReviewLink,
    message,
    requestId: clientRequestId,
  } = parsed.value;

  const smsRequestId = clientRequestId || requestId;
  console.info(`SMS request received requestId=${smsRequestId} to=${maskPhone(customerPhone)} business=${businessId}`);

  if (isDevAllowedPhone(customerPhone)) {
    console.info(`DEV_MODE phone override active requestId=${smsRequestId} to=${maskPhone(customerPhone)} business=${businessId}`);
  } else if (isPhoneRateLimited(customerPhone)) {
    console.warn(`SMS cooldown blocked requestId=${smsRequestId} to=${maskPhone(customerPhone)} business=${businessId}`);
    return safeError(res, 429, 'This phone number has received too many requests. Please wait before trying again.');
  }

  const reviewLink = googleReviewLink || `${PUBLIC_APP_URL}/review/${encodeURIComponent(businessId)}`;
  const messageBody = message || (
    `Hi! ${businessName} is asking: How was your recent service? ` +
    `Rate 1-5 stars: ${reviewLink}`
  );

  try {
    console.info(`Twilio request start requestId=${smsRequestId} to=${maskPhone(customerPhone)} business=${businessId}`);
    const message = await withTimeout(
      client.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: customerPhone,
      }),
      TWILIO_TIMEOUT_MS,
      'Twilio request timed out.',
    );

    console.info(`Twilio response requestId=${smsRequestId} sid=${message.sid} status=${message.status || 'unknown'} durationMs=${Date.now() - startedAt} to=${maskPhone(customerPhone)} business=${businessId}`);
    return res.json({ success: true, sid: message.sid });
  } catch (err) {
    if (err.code === 'TWILIO_TIMEOUT') {
      console.error(`Twilio timeout requestId=${smsRequestId} durationMs=${Date.now() - startedAt} to=${maskPhone(customerPhone)} business=${businessId}`);
      return safeError(res, 504, 'SMS provider timed out.');
    }

    const reason = err.code || err.status || err.name || 'unknown';
    console.error(`Twilio send failed requestId=${smsRequestId} durationMs=${Date.now() - startedAt} to=${maskPhone(customerPhone)} business=${businessId} reason=${reason}`);
    return safeError(res, 502, 'SMS provider rejected the request.');
  }
});

app.post('/contact', contactLimiter, async (req, res) => {
  const name    = String(req.body?.name    || '').trim().slice(0, 100);
  const company = String(req.body?.company || '').trim().slice(0, 100);
  const email   = String(req.body?.email   || '').trim().slice(0, 200);
  const subject = String(req.body?.subject || '').trim().slice(0, 200);
  const message = String(req.body?.message || '').trim().slice(0, 2000);

  if (!name || !email || !subject || !message) {
    return safeError(res, 400, 'Name, email, subject, and message are required.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return safeError(res, 400, 'Invalid email address.');
  }

  console.info(`Contact form received name="${name}" email="${email}" subject="${subject}"`);

  // Persist to Firestore (best-effort — never blocks the response).
  if (db) {
    db.collection('contactMessages').add({
      name, company, email, subject, message,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ip: (req.ip || 'unknown').slice(0, 64),
    }).catch(err => console.warn(`Contact Firestore save failed: ${err.message}`));
  }

  // Send email via Resend (best-effort — failure still returns 200).
  const emailText =
    `Name: ${name}\nCompany: ${company || 'N/A'}\nEmail: ${email}\n\nMessage:\n${message}` +
    `\n\n---\nSent via Starvis contact form at ${new Date().toISOString()}`;

  sendViaResend({
    to: 'contact@alioapp.fr',
    subject: `[Starvis Contact] ${subject}`,
    text: emailText,
  })
    .then(r => {
      if (r.skipped) {
        console.info('Contact form: Resend not configured — message saved to Firestore only.');
      } else {
        console.info(`Contact form email sent id=${r.id || 'unknown'} to=contact@alioapp.fr`);
      }
    })
    .catch(err => console.warn(`Contact form email failed: ${err.message}`));

  return res.json({ success: true });
});

app.use((err, _req, res, _next) => {
  if (err && err.message === 'CORS origin denied.') {
    return safeError(res, 403, 'Origin not allowed.');
  }
  console.error(`Unhandled backend error: ${err && err.message ? err.message : 'unknown'}`);
  return safeError(res, 500, 'Internal server error.');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on ${PORT}`);
  console.log('Startup Express started');
});
