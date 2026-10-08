import { Timestamp, doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { canUseDemoMode } from '../config/devMode';

export const DEMO_SEED_VERSION = 3;
const DEMO_SEED_STORAGE_PREFIX = 'starvis_demo_seed_';
const inFlightDemoSeeds = new Map();

const day = 24 * 60 * 60 * 1000;

function timestampDaysAgo(days) {
  return Timestamp.fromDate(new Date(Date.now() - days * day));
}

function getDemoSeedStorageKey(user) {
  return `${DEMO_SEED_STORAGE_PREFIX}${user.uid}`;
}

function markDemoSeedComplete(user) {
  try {
    window.sessionStorage.setItem(getDemoSeedStorageKey(user), 'done');
  } catch {
    // Session storage is a best-effort optimization only.
  }
}

function hasDemoSeedCompleted(user) {
  try {
    return window.sessionStorage.getItem(getDemoSeedStorageKey(user)) === 'done';
  } catch {
    return false;
  }
}

const demoCustomers = [
  {
    id: 'demo-customer-riviera',
    firstName: 'Avery',
    lastName: 'Cole',
    phone: '+13185550101',
    email: 'avery.cole@example.com',
    serviceType: 'Riviera Auto Spa - ceramic coating',
    notes: 'Asked for a review link after pickup.',
    status: 'sms_sent',
    createdAt: timestampDaysAgo(2),
  },
  {
    id: 'demo-customer-prestige',
    firstName: 'Jordan',
    lastName: 'Reed',
    phone: '+13185550102',
    email: 'jordan.reed@example.com',
    serviceType: 'Prestige Detailing - paint correction',
    notes: 'Repeat client, high review potential.',
    status: 'reviewed',
    createdAt: timestampDaysAgo(5),
  },
  {
    id: 'demo-customer-sunset',
    firstName: 'Maya',
    lastName: 'Brooks',
    phone: '+13185550103',
    email: 'maya.brooks@example.com',
    serviceType: 'Sunset HVAC - maintenance visit',
    notes: 'Technician reported a positive service experience.',
    status: 'pending',
    createdAt: timestampDaysAgo(9),
  },
  {
    id: 'demo-customer-bluewave',
    firstName: 'Chris',
    lastName: 'Morgan',
    phone: '+13185550104',
    email: 'chris.morgan@example.com',
    serviceType: 'BlueWave Plumbing - emergency repair',
    notes: 'SMS sent after invoice was paid.',
    status: 'sms_sent',
    createdAt: timestampDaysAgo(13),
  },
];

const demoReviews = [
  {
    id: 'demo-review-1',
    customerName: 'Jordan Reed',
    rating: 5,
    feedback: 'Fast turnaround and great communication.',
    type: 'positive',
    createdAt: timestampDaysAgo(1),
  },
  {
    id: 'demo-review-2',
    customerName: 'Avery Cole',
    rating: 5,
    feedback: 'The QR flow made review collection way easier.',
    type: 'positive',
    createdAt: timestampDaysAgo(3),
  },
  {
    id: 'demo-review-3',
    customerName: 'Chris Morgan',
    rating: 4,
    feedback: 'We started getting Google reviews consistently.',
    type: 'positive',
    createdAt: timestampDaysAgo(6),
  },
  {
    id: 'demo-review-4',
    customerName: 'Maya Brooks',
    rating: 3,
    feedback: 'Good service overall, but arrival timing could be clearer.',
    type: 'negative',
    createdAt: timestampDaysAgo(10),
  },
];

export function buildDemoSettings(user) {
  const safeReviewUrl = 'https://example.com/starvis-demo-review';

  return {
    businessName: 'Starvis Demo Auto Spa',
    businessType: 'Auto Detailing',
    address: 'Los Angeles, CA',
    phone: '+13184808712',
    businessPhone: '+13184808712',
    googleReviewLink: safeReviewUrl,
    googleReviewsUrl: safeReviewUrl,
    website: 'https://example.com/starvis-demo-auto-spa',
    senderName: 'Starvis Demo Auto Spa',
    smsTemplate: "Hi {firstName}! How was your visit with {businessName}? We'd love your feedback.",
    sendTime: 'immediately',
    followUp: '24h',
    alertLowRating: true,
    alertNewReview: true,
    alertWeeklySummary: true,
    alertSmsFailure: true,
    notifEmail: user.email || '',
    onboardingComplete: true,
    role: 'admin',
    isAdmin: true,
    demoMode: true,
    devMode: true,
    billing: {
      plan: 'growth',
      billingCycle: 'monthly',
      status: 'active',
      trialActive: true,
      stripePaymentLink: 'https://buy.stripe.com/aFadRbfhWc4peOw3UAbQY01',
    },
    demoSeedVersion: DEMO_SEED_VERSION,
  };
}

export async function ensureDemoAccount(user, existingSettings = {}) {
  if (!canUseDemoMode(user)) return existingSettings;
  if (
    hasDemoSeedCompleted(user)
    && existingSettings.demoSeedVersion === DEMO_SEED_VERSION
    && existingSettings.onboardingComplete
  ) {
    return existingSettings;
  }

  const cached = inFlightDemoSeeds.get(user.uid);
  if (cached) return cached;

  // Temporary demo override for the allowlisted account only.
  // Remove this service and its callers when seeded public demo access is no longer needed.
  // Fixed document IDs keep the seed idempotent and repair missing demo docs on later logins.
  const seedPromise = (async () => {
    const settings = { ...existingSettings, ...buildDemoSettings(user) };
    const userRef = doc(db, 'users', user.uid);
    const batch = writeBatch(db);

    batch.set(userRef, settings, { merge: true });
    demoCustomers.forEach(customer => {
      batch.set(doc(db, 'users', user.uid, 'customers', customer.id), customer, { merge: true });
    });
    demoReviews.forEach(review => {
      batch.set(doc(db, 'users', user.uid, 'reviews', review.id), review, { merge: true });
    });

    await batch.commit();
    markDemoSeedComplete(user);

    const fresh = await getDoc(userRef);
    return fresh.exists() ? fresh.data() : settings;
  })();

  inFlightDemoSeeds.set(user.uid, seedPromise);

  try {
    return await seedPromise;
  } finally {
    inFlightDemoSeeds.delete(user.uid);
  }
}
