import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getStripeLink } from '../config/pricing';

function buildCheckoutUrl(paymentLink, userId, email) {
  const url = new URL(paymentLink);
  url.searchParams.set('client_reference_id', userId);
  if (email) url.searchParams.set('prefilled_email', email);
  return url.toString();
}

export async function saveBillingSelection(userId, planId, billingCycle, email = '') {
  const stripePaymentLink = getStripeLink(planId, billingCycle);
  const checkoutUrl = buildCheckoutUrl(stripePaymentLink, userId, email);
  const billing = {
    plan: planId,
    billingCycle,
    status: 'pending_checkout',
    active: false,
    email: String(email || '').trim().toLowerCase(),
    selectedAt: serverTimestamp(),
    stripePaymentLink,
    checkoutUrl,
    successUrl: `${window.location.origin}/billing/success`,
    cancelUrl: `${window.location.origin}/billing/cancel`,
  };

  await setDoc(doc(db, 'users', userId), { billing }, { merge: true });
  return billing;
}
