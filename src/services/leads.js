import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function captureLead({ email, source, interestedPlan = '' }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Enter a valid email address.');
  }

  await addDoc(collection(db, 'leads'), {
    email: cleanEmail,
    source,
    interestedPlan,
    createdAt: serverTimestamp(),
  });
}
