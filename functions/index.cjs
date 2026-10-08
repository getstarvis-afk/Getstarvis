const cors = require('cors');
const twilio = require('twilio');
const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

admin.initializeApp();

const twilioAccountSid = defineSecret('TWILIO_ACCOUNT_SID');
const twilioAuthToken = defineSecret('TWILIO_AUTH_TOKEN');
const twilioPhoneNumber = defineSecret('TWILIO_PHONE_NUMBER');

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://getstarvis.com',
  'https://www.getstarvis.com',
];

const corsHandler = cors({ origin: allowedOrigins });
const ipHits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxHits = 12;
  const hits = (ipHits.get(ip) || []).filter(ts => now - ts < windowMs);
  hits.push(now);
  ipHits.set(ip, hits);
  return hits.length > maxHits;
}

function jsonError(res, status, error) {
  return res.status(status).json({ success: false, error });
}

function normalizePhone(phone) {
  return String(phone || '').trim();
}

async function verifyBusinessAccess(req, businessId) {
  const authHeader = req.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return { publicRequest: true };

  const decoded = await admin.auth().verifyIdToken(token);
  if (decoded.uid !== businessId) {
    throw new Error('Authenticated user does not own this business.');
  }
  return { publicRequest: false, uid: decoded.uid };
}

exports.sendSms = onRequest({
  region: 'us-central1',
  secrets: [twilioAccountSid, twilioAuthToken, twilioPhoneNumber],
}, (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return jsonError(res, 405, 'Method not allowed.');
    }

    const ip = req.ip || req.get('x-forwarded-for') || 'unknown';
    if (rateLimited(ip)) {
      return jsonError(res, 429, 'Too many SMS requests. Please wait a minute and try again.');
    }

    const {
      businessId,
      customerPhone,
      businessName,
      googleReviewLink,
    } = req.body || {};

    const phone = normalizePhone(customerPhone);
    const name = String(businessName || '').trim().slice(0, 80);
    const reviewLink = String(googleReviewLink || '').trim();

    if (!businessId || !phone || !name) {
      return jsonError(res, 400, 'businessId, customerPhone, and businessName are required.');
    }

    if (!/^\+?[0-9().\-\s]{8,24}$/.test(phone)) {
      return jsonError(res, 400, 'Enter a valid phone number.');
    }

    try {
      await verifyBusinessAccess(req, businessId);

      const businessSnap = await admin.firestore().doc(`users/${businessId}`).get();
      if (!businessSnap.exists) {
        return jsonError(res, 404, 'Business not found.');
      }

      const fallbackLink = `https://getstarvis.com/review/${businessId}`;
      const messageBody =
        `Hi! ${name} is asking: How was your recent service? ` +
        `Rate 1-5 stars: ${reviewLink || fallbackLink}`;

      const client = twilio(twilioAccountSid.value(), twilioAuthToken.value());
      const message = await client.messages.create({
        body: messageBody,
        from: twilioPhoneNumber.value(),
        to: phone,
      });

      return res.json({ success: true, sid: message.sid });
    } catch (err) {
      console.error('sendSms failed', err);
      return jsonError(res, 500, err.message || 'SMS delivery failed.');
    }
  });
});
