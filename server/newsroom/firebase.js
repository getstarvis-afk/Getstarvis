import { Buffer } from 'node:buffer';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function parseCredential() {
  const raw = process.env.NEWSROOM_FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    const clean = raw.trim();
    const account = clean.startsWith('{') ? JSON.parse(clean) : JSON.parse(Buffer.from(clean, 'base64').toString('utf8'));
    if (account.private_key) account.private_key = account.private_key.replace(/\\n/g, '\n');
    return cert(account);
  }
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') });
  }
  throw new Error('Newsroom server credentials are not configured.');
}

export function getAdminServices() {
  const app = getApps()[0] || initializeApp({ credential: parseCredential(), projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID });
  return { auth: getAuth(app), db: getFirestore(app) };
}
