export const BILLING_CYCLES = {
  monthly: 'monthly',
  annual: 'annual',
};

export const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: '$49',
    annualPrice: '$390',
    annualBadge: 'Save 20%',
    smsQuota: 'Up to 100 SMS/month',
    smsLimit: 100,
    locationLimit: 1,
    locationQuota: '1 business location',
    description: 'For solo operators starting a repeatable review workflow.',
    monthlyUrl: 'https://buy.stripe.com/7sY8wRedSfgBfSA62IbQY00',
    annualUrl: 'https://buy.stripe.com/00w6oJ4Di8SdeOw4YEbQY03',
    features: ['Up to 100 SMS/month', '1 business location', 'Basic dashboard', 'Google Reviews integration', 'Email support'],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: '$149',
    annualPrice: '$950',
    annualBadge: 'Save 20%',
    smsQuota: 'Up to 500 SMS/month',
    smsLimit: 500,
    locationLimit: 3,
    locationQuota: '3 business locations',
    description: 'For growing teams that need analytics and follow-ups.',
    popular: true,
    monthlyUrl: 'https://buy.stripe.com/aFadRbfhWc4peOw3UAbQY01',
    annualUrl: 'https://buy.stripe.com/7sYbJ37PugkFdKsaiY04',
    features: ['Up to 500 SMS/month', '3 business locations', 'Advanced analytics', 'Auto follow-ups', 'Priority support', 'AI response suggestions'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: '$299',
    annualPrice: '$1900',
    annualBadge: 'Save 20%',
    smsQuota: 'Unlimited SMS',
    smsLimit: 2000,
    locationLimit: null,
    locationQuota: 'Unlimited locations',
    description: 'For multi-location operators and agencies.',
    monthlyUrl: 'https://buy.stripe.com/3cI9AVedS9WhcGo3UAbQY02',
    annualUrl: 'https://buy.stripe.com/fZu4gB0n21pL6i0fDibQY05',
    features: ['Unlimited SMS', 'Unlimited locations', 'White-label option', 'API access', 'Dedicated account manager', 'Custom integrations'],
  },
];

export function getPlan(planId) {
  return PRICING_PLANS.find(plan => plan.id === planId) || null;
}

export function getStripeLink(planId, billingCycle) {
  const plan = getPlan(planId);
  if (!plan) return '';
  return billingCycle === BILLING_CYCLES.annual ? plan.annualUrl : plan.monthlyUrl;
}

// Monthly SMS allowance per plan. Defaults to the Starter limit when the plan
// is unknown (e.g. brand-new trial accounts before a plan is selected).
export function getPlanSmsLimit(planId) {
  const plan = getPlan(planId);
  return plan?.smsLimit ?? 100;
}

export function getPlanLocationLimit(planId) {
  const plan = getPlan(planId);
  return plan?.locationLimit ?? 1;
}

export function getPlanPrice(plan, billingCycle) {
  return billingCycle === BILLING_CYCLES.annual ? plan.annualPrice : plan.monthlyPrice;
}

export function getUpgradeOptions(currentPlanId, currentCycle) {
  const currentIndex = PRICING_PLANS.findIndex(plan => plan.id === currentPlanId);
  if (currentIndex < 0) return PRICING_PLANS;

  const currentPlan = PRICING_PLANS[currentIndex];
  const options = [];
  const alternateCycle = currentCycle === BILLING_CYCLES.annual ? BILLING_CYCLES.monthly : BILLING_CYCLES.annual;
  options.push({ ...currentPlan, targetCycle: alternateCycle, action: `${currentPlan.name} ${alternateCycle}` });

  PRICING_PLANS.slice(currentIndex + 1).forEach(plan => {
    options.push({ ...plan, targetCycle: currentCycle, action: `${plan.name} ${currentCycle}` });
  });

  return options;
}
