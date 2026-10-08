import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useDashboardData } from '../context/useDashboardData';
import { Save, Loader2, Building2, MessageSquare, Bell, CreditCard, AlertTriangle, CalendarClock, CheckCircle2, X, HelpCircle, RotateCcw, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SmsQuotaCard from '../components/SmsQuotaCard';
import { BILLING_CYCLES, getPlan, getPlanPrice, getStripeLink, getUpgradeOptions, PRICING_PLANS } from '../config/pricing';
import { saveBillingSelection } from '../services/billing';
import { requestSubscriptionCancellation, syncStripeSubscription, keepSubscription } from '../services/stripeBilling';

const TABS = [
  { id: 'profile',  label: 'Business Profile', icon: Building2   },
  { id: 'sms',      label: 'SMS Settings',      icon: MessageSquare },
  { id: 'notifications', label: 'Notifications', icon: Bell      },
  { id: 'billing',  label: 'Billing',            icon: CreditCard },
  { id: 'help',     label: 'Help & Support',     icon: HelpCircle },
];

function BusinessProfile({ data, onChange, onSave, saving }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="label">Business Name *</label>
        <input className="input-field" value={data.businessName || ''} onChange={e => onChange('businessName', e.target.value)} placeholder="Riviera Auto Spa" />
      </div>
      <div>
        <label className="label">Business Address</label>
        <input className="input-field" value={data.address || ''} onChange={e => onChange('address', e.target.value)} placeholder="123 Main St, Austin, TX 78701" />
      </div>
      <div>
        <label className="label">Google Reviews URL *</label>
        <input className="input-field" value={data.googleReviewsUrl || ''} onChange={e => onChange('googleReviewsUrl', e.target.value)} placeholder="https://g.page/r/YOUR_BUSINESS_ID/review" />
        <p className="text-slate-400 text-xs mt-1">Paste your Google review link here. You can copy it from your Google Business Profile under "Ask for reviews".</p>
      </div>
      <div>
        <label className="label">Business Phone</label>
        <input className="input-field" value={data.businessPhone || ''} onChange={e => onChange('businessPhone', e.target.value)} placeholder="+1 (555) 000-0000" />
      </div>
      <div>
        <label className="label">Business Website</label>
        <input className="input-field" value={data.website || ''} onChange={e => onChange('website', e.target.value)} placeholder="https://yourbusiness.com" />
      </div>
      <button onClick={onSave} disabled={saving} className="btn-primary self-start disabled:opacity-60">
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {saving ? 'Saving...' : 'Save Changes'}
      </button>

      <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">Connect Google Business Profile</p>
            <p className="mt-0.5 text-xs text-slate-400">Import and sync your existing Google reviews automatically. Coming soon.</p>
          </div>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="w-fit cursor-not-allowed rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-400"
          >
            Connect — coming soon
          </button>
        </div>
      </div>
    </div>
  );
}

function SMSSettings({ data, onChange, onSave, saving }) {
  const defaultMsg = "Hi {firstName}! How was your experience with {businessName}? We'd love your feedback. Rate us 1-5:";
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="label">Sender Name</label>
        <input className="input-field" value={data.senderName || ''} onChange={e => onChange('senderName', e.target.value)} placeholder="Riviera Auto Spa" />
        <p className="text-slate-400 text-xs mt-1">How your business appears in the SMS</p>
      </div>
      <div>
        <label className="label">SMS Message Template</label>
        <textarea
          className="input-field resize-none"
          rows={4}
          value={data.smsTemplate || defaultMsg}
          onChange={e => onChange('smsTemplate', e.target.value)}
          placeholder={defaultMsg}
        />
        <p className="text-slate-400 text-xs mt-1">Use {'{firstName}'} and {'{businessName}'} as dynamic placeholders</p>
      </div>
      <div>
        <label className="label">Preferred Send Time</label>
        <select className="input-field" value={data.sendTime || 'immediately'} onChange={e => onChange('sendTime', e.target.value)}>
          <option value="immediately">Send immediately after service</option>
          <option value="1h">1 hour after service</option>
          <option value="2h">2 hours after service</option>
          <option value="24h">Next day (24 hours)</option>
        </select>
      </div>
      <div>
        <label className="label">Auto Follow-up</label>
        <select className="input-field" value={data.followUp || 'none'} onChange={e => onChange('followUp', e.target.value)}>
          <option value="none">No follow-up</option>
          <option value="24h">Follow-up after 24 hours</option>
          <option value="48h">Follow-up after 48 hours</option>
          <option value="72h">Follow-up after 72 hours</option>
        </select>
      </div>
      <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
        <p className="text-sky-700 font-semibold text-sm mb-1">📱 Preview</p>
        <p className="text-slate-600 text-sm">
          "{data.smsTemplate?.replace('{firstName}', 'John')?.replace('{businessName}', data.businessName || 'Your Business') || defaultMsg.replace('{firstName}', 'John').replace('{businessName}', 'Your Business')}"
        </p>
      </div>
      <button onClick={onSave} disabled={saving} className="btn-primary self-start disabled:opacity-60">
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

function NotificationToggle({ label, desc, field, data, onChange }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <div className="font-medium text-slate-800 text-sm">{label}</div>
        <div className="text-slate-400 text-xs mt-0.5">{desc}</div>
      </div>
      <div
        onClick={() => onChange(field, !data[field])}
        className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors flex-shrink-0 ${data[field] ? 'bg-sky-500' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${data[field] ? 'translate-x-6' : 'translate-x-1'}`} />
      </div>
    </div>
  );
}

function Notifications({ data, onChange, onSave, saving }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="bg-white rounded-xl border border-gray-100 px-5">
        <NotificationToggle label="Low Rating Alerts" desc="Email me when a customer rates 1-3 stars" field="alertLowRating" data={data} onChange={onChange} />
        <NotificationToggle label="New Review Alerts" desc="Email me when any review is submitted" field="alertNewReview" data={data} onChange={onChange} />
        <NotificationToggle label="Weekly Summary" desc="Receive a weekly email with your review stats" field="alertWeeklySummary" data={data} onChange={onChange} />
        <NotificationToggle label="SMS Delivery Failures" desc="Alert me if an SMS couldn't be delivered" field="alertSmsFailure" data={data} onChange={onChange} />
      </div>
      <div className="mt-3">
        <label className="label">Notification Email</label>
        <input className="input-field" type="email" value={data.notifEmail || ''} onChange={e => onChange('notifEmail', e.target.value)} placeholder="you@yourbusiness.com" />
      </div>
      <button onClick={onSave} disabled={saving} className="btn-primary self-start mt-2 disabled:opacity-60">
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

const STATUS_LABELS = {
  trialing: 'Trialing',
  active: 'Active',
  canceling: 'Canceling',
  canceled: 'Canceled',
  past_due: 'Past Due',
  pending_checkout: 'Pending Checkout',
  trial: 'Trialing',
};

function toDate(value) {
  if (!value) return null;
  if (typeof value === 'number') return new Date(value * 1000);
  if (typeof value.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) return 'Syncing from Stripe';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function Billing({ user, userId, userEmail, billing, smsUsage, refreshSettings }) {
  const currentPlan = getPlan(billing?.plan) || PRICING_PLANS[1];
  const currentCycle = billing?.billingCycle || BILLING_CYCLES.monthly;
  const status = billing?.status || 'trial';
  const options = getUpgradeOptions(currentPlan.id, currentCycle);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [keeping, setKeeping] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [cancelResult, setCancelResult] = useState(null);
  const statusLabel = STATUS_LABELS[status] || status.replace('_', ' ');
  const subscriptionId = billing?.stripeSubscriptionId || billing?.subscriptionId;
  const trialEnd = billing?.stripeTrialEnd || billing?.trialEnd || billing?.trialEndsAt || cancelResult?.trialEnd;
  const periodEnd = billing?.cancellationEffectiveAt || cancelResult?.cancellationEffectiveAt || billing?.stripeCurrentPeriodEnd || billing?.currentPeriodEnd || trialEnd;
  const isTrial = status === 'trialing' || status === 'trial' || billing?.trialActive;
  const canCancel = subscriptionId && !['canceling', 'canceled'].includes(status);
  const cancellationScheduled = billing?.cancelAtPeriodEnd === true || status === 'canceling';

  const handleCheckout = async (planId, billingCycle) => {
    try {
      const billing = await saveBillingSelection(userId, planId, billingCycle, userEmail);
      window.location.assign(billing.checkoutUrl || getStripeLink(planId, billingCycle));
    } catch {
      toast.error('Could not open Stripe checkout.');
    }
  };

  const handleCancelSubscription = async () => {
    setCanceling(true);
    try {
      const idToken = await user.getIdToken();
      const result = await requestSubscriptionCancellation(idToken);
      setCancelResult(result);
      setShowCancelModal(false);
      toast.success('Subscription cancellation scheduled.');
      if (refreshSettings) await refreshSettings();
    } catch (err) {
      toast.error(err.message || 'Could not cancel subscription.');
    } finally {
      setCanceling(false);
    }
  };

  const handleKeepSubscription = async () => {
    setKeeping(true);
    try {
      const idToken = await user.getIdToken();
      await keepSubscription(idToken);
      setCancelResult(null);
      toast.success('Subscription will continue.');
      if (refreshSettings) await refreshSettings();
    } catch (err) {
      toast.error(err.message || 'Could not keep subscription.');
    } finally {
      setKeeping(false);
    }
  };

  const handleSyncSubscription = async () => {
    setSyncing(true);
    try {
      const idToken = await user.getIdToken();
      await syncStripeSubscription(idToken);
      toast.success('Stripe subscription synced.');
    } catch (err) {
      toast.error(err.message || 'Stripe subscription is still syncing.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <SmsQuotaCard billing={billing} smsUsage={smsUsage} />
      <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(30,167,255,0.24),transparent_34%),linear-gradient(135deg,#081120,#111827)] p-5 text-white sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-bold uppercase tracking-[0.18em] text-sky-200">Current plan</span>
          <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{statusLabel}</span>
        </div>
        <div className="mt-5 text-3xl font-extrabold">{currentPlan.name} Plan</div>
        <div className="mt-1 text-slate-300">
          {getPlanPrice(currentPlan, currentCycle)} / {currentCycle === BILLING_CYCLES.annual ? 'year' : 'month'} after trial
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-200">
              <CalendarClock size={15} /> {status === 'canceling' ? 'Cancellation effective' : 'Renewal date'}
            </p>
            <p className="mt-2 text-lg font-bold">{formatDate(periodEnd)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-200">
              <CheckCircle2 size={15} /> Trial status
            </p>
            <p className="mt-2 text-lg font-bold">{isTrial ? `Trial active until ${formatDate(trialEnd)}` : 'Trial completed'}</p>
          </div>
        </div>
        {status === 'pending_checkout' && (
          <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100">
            Complete your billing setup to activate your Starvis workspace.
          </div>
        )}
        {status === 'canceling' && (
          <div className="mt-4 rounded-xl border border-sky-300/30 bg-sky-300/10 px-4 py-3 text-sm font-semibold text-sky-100">
            Your subscription remains active until {formatDate(periodEnd)}.
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h4 className="font-bold text-slate-950">Included usage</h4>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">SMS quota</p>
              <p className="mt-1 font-bold text-slate-950">{currentPlan.smsQuota}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Locations</p>
              <p className="mt-1 font-bold text-slate-950">{currentPlan.locationQuota}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h4 className="font-bold text-slate-950">Plan features</h4>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
            {currentPlan.features.map(f => (
              <li key={f} className="flex items-center gap-2"><span className="text-sky-500">✓</span>{f}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-bold text-slate-950">Upgrade and manage billing</h4>
            <p className="text-sm text-slate-500">Stripe securely handles billing updates and checkout.</p>
          </div>
          <span className="w-fit rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600 capitalize">{currentCycle}</span>
        </div>

        {currentPlan.id === 'pro' && currentCycle === BILLING_CYCLES.annual ? (
          <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            You're on the highest plan.
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {options.map(option => (
              <button
                key={`${option.id}-${option.targetCycle}`}
                onClick={() => handleCheckout(option.id, option.targetCycle)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-left transition-all hover:border-sky-300 hover:bg-sky-50"
              >
                <span className="block font-bold text-slate-950">{option.action}</span>
                <span className="mt-1 block text-sm text-slate-500">{getPlanPrice(option, option.targetCycle)} / {option.targetCycle === 'annual' ? 'year' : 'month'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-rose-100 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className={cancellationScheduled ? 'text-sky-500' : 'text-rose-500'} />
              <h4 className="font-bold text-slate-950">{cancellationScheduled ? 'Subscription scheduled to cancel' : 'Cancel subscription'}</h4>
            </div>
            {cancellationScheduled ? (
              <>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Your subscription is scheduled to cancel at the end of your trial/billing period.
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Cancellation scheduled for {formatDate(periodEnd)}.
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {isTrial
                    ? 'Your subscription will remain active until the end of your free trial. No future payment should occur when Stripe confirms the scheduled cancellation.'
                    : 'Paid subscriptions may be canceled within 10 days of subscription activation. Cancellation takes effect at the end of the current billing period.'}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Current active plan: {currentPlan.name}.
                </p>
              </>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            {cancellationScheduled ? (
              <button
                onClick={handleKeepSubscription}
                disabled={keeping || !subscriptionId}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {keeping ? 'Keeping...' : 'Keep Subscription'}
              </button>
            ) : (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={!canCancel}
                className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
        {!subscriptionId && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 sm:flex-row sm:items-center sm:justify-between">
            <span>Stripe subscription details are still syncing. Cancellation becomes available after Stripe confirms the subscription.</span>
            <button
              onClick={handleSyncSubscription}
              disabled={syncing}
              className="w-fit rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-200 disabled:opacity-60"
            >
              {syncing ? 'Syncing...' : 'Retry sync'}
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {PRICING_PLANS.map(plan => (
          <button
            key={plan.id}
            onClick={() => handleCheckout(plan.id, currentCycle)}
            disabled={plan.id === currentPlan.id}
            className="rounded-xl border border-slate-200 px-4 py-3 text-left transition-all hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="block text-sm font-bold text-slate-950">{plan.name}</span>
            <span className="block text-xs text-slate-500">{getPlanPrice(plan, currentCycle)} / {currentCycle === 'annual' ? 'year' : 'month'}</span>
          </button>
          ))}
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500">Confirm cancellation</p>
                <h3 className="mt-2 text-2xl font-extrabold text-slate-950">Schedule cancellation?</h3>
              </div>
              <button onClick={() => setShowCancelModal(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {isTrial
                ? 'Your workspace will stay active until the end of the free trial. Stripe will be asked to cancel at period end so no future payment is collected.'
                : 'Your workspace will stay active until the end of the current billing period. Stripe securely handles the cancellation schedule.'}
            </p>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <div className="font-bold">Effective date</div>
              <div className="mt-1">{formatDate(periodEnd)}</div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={canceling}
                className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {canceling ? 'Scheduling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HelpSupport() {
  const { saveSettings } = useDashboardData();
  const navigate = useNavigate();

  const handleRestartTour = async () => {
    try {
      await saveSettings({ tourCompleted: false });
      navigate('/dashboard');
      toast.success('Tour restarted! Returning to Dashboard…');
    } catch {
      toast.error('Could not restart tour. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
          <RotateCcw size={20} className="text-violet-600" />
        </div>
        <h3 className="font-bold text-slate-900">Product Tour</h3>
        <p className="mt-1 text-sm text-slate-500">
          Replay the guided walkthrough to rediscover Starvis features.
        </p>
        <button
          onClick={handleRestartTour}
          className="mt-4 flex items-center gap-2 rounded-xl bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
        >
          <RotateCcw size={14} /> Restart Product Tour
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
          <HelpCircle size={20} className="text-sky-600" />
        </div>
        <h3 className="font-bold text-slate-900">Contact Support</h3>
        <p className="mt-1 text-sm text-slate-500">
          Reach the Starvis team for billing, SMS, or workspace questions.
        </p>
        <Link
          to="/contact"
          className="mt-4 flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
        >
          Open Contact Form <ExternalLink size={14} />
        </Link>
        <p className="mt-2 text-xs text-slate-400">
          Or email:{' '}
          <a href="mailto:contact@alioapp.fr" className="text-sky-500 hover:underline">
            contact@alioapp.fr
          </a>
        </p>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { settings, loadingSettings, saveSettings, refreshSettings } = useDashboardData();
  const [activeTab, setActiveTab] = useState('profile');
  const [data, setData] = useState({
    businessName: '', address: '', googleReviewsUrl: '', businessPhone: '', website: '',
    senderName: '', smsTemplate: '', sendTime: 'immediately', followUp: 'none',
    alertLowRating: true, alertNewReview: false, alertWeeklySummary: true, alertSmsFailure: true,
    notifEmail: user?.email || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loadingSettings) {
      queueMicrotask(() => setData(d => ({ ...d, ...settings })));
    }
  }, [loadingSettings, settings]);

  const onChange = (k, v) => setData(d => ({ ...d, [k]: v }));

  const onSave = async () => {
    setSaving(true);
    try {
      await saveSettings(data);
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save — check Firebase config');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab sidebar */}
        <div className="lg:w-56 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0">
          {TABS.map(t => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                            whitespace-nowrap transition-colors duration-150 overflow-hidden
                            ${active ? 'text-white shadow-sm' : 'bg-white text-slate-500 border border-gray-200 hover:border-sky-300 hover:text-sky-500'}`}
              >
                {active && (
                  <div
                    className="absolute inset-0 bg-sky-500 rounded-xl"
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <t.icon size={17} />
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div
          key={activeTab}
          className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          {activeTab === 'profile' && <BusinessProfile data={data} onChange={onChange} onSave={onSave} saving={saving} />}
          {activeTab === 'sms' && <SMSSettings data={data} onChange={onChange} onSave={onSave} saving={saving} />}
          {activeTab === 'notifications' && <Notifications data={data} onChange={onChange} onSave={onSave} saving={saving} />}
          {activeTab === 'billing' && <Billing user={user} userId={user.uid} userEmail={user.email} billing={settings.billing} smsUsage={settings.smsUsage} refreshSettings={refreshSettings} />}
          {activeTab === 'help' && <HelpSupport />}
        </div>
      </div>
    </>
  );
}
