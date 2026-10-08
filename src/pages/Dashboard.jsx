import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Star, TrendingUp, MessageSquare, Plus, Send, ExternalLink, QrCode, Copy, Download, Check, Settings as SettingsIcon, Sparkles, ArrowUpRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/useAuth';
import { useDashboardData } from '../context/useDashboardData';
import QRCode from 'qrcode';
import OnboardingModal from '../components/OnboardingModal';
import SmsQuotaCard from '../components/SmsQuotaCard';
import Counter from '../components/visuals/Counter';
import Sparkline from '../components/visuals/Sparkline';

// ── Skeleton loader for stat cards ────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5 animate-pulse">
      <div className="w-14 h-14 rounded-xl bg-slate-200 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-7 w-16 bg-slate-200 rounded-lg mb-2" />
        <div className="h-4 w-28 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, suffix = '', accent, sparkColor, spark }) {
  const showSpark = Array.isArray(spark) && value > 0;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5
                    shadow-[0_6px_16px_-8px_rgba(15,23,42,0.14)] transition-all duration-300
                    hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_24px_48px_-24px_rgba(30,167,255,0.45)]">
      <div className="flex items-start justify-between">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${accent}
                         text-white shadow-lg shadow-sky-500/20 transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={22} />
        </div>
        {showSpark && <Sparkline data={spark} width={86} height={30} stroke={sparkColor} />}
      </div>
      <div className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
        <Counter value={value} suffix={suffix} />
      </div>
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}

// ── Star rating (crisp SVG, replaces emoji repeat) ────────────────────────────
function StarRating({ rating = 0 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? 'text-amber-400' : 'text-slate-200'}
          fill="currentColor"
          strokeWidth={0}
        />
      ))}
    </span>
  );
}

// ── AI Insights teaser (Starvis V2) ───────────────────────────────────────────
function AiInsightCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#0B1020,#111a2e)] p-5 text-white shadow-[0_24px_60px_-26px_rgba(8,17,32,0.7)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-iris/30 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-azure-light">
            <Sparkles size={16} />
          </div>
          <h3 className="text-sm font-bold">AI Insights</h3>
        </div>
        <span className="rounded-full border border-iris/30 bg-iris/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-iris-light">
          Soon
        </span>
      </div>
      <p className="relative mt-4 text-sm leading-6 text-slate-300">
        Starvis V2 reads your reviews and surfaces the one move that lifts your rating most.
      </p>
      <div className="relative mt-4 space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" /> Faster replies are your top win this week
        </div>
        <div className="flex select-none items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400 blur-[1.5px]">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-azure-light" /> 3 customers mentioned wait times
        </div>
      </div>
    </div>
  );
}

// ── Row skeleton ──────────────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-3"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
      <td className="px-6 py-3"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
      <td className="px-6 py-3"><div className="h-5 w-24 bg-slate-100 rounded-full" /></td>
      <td className="px-6 py-3"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
    </tr>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative mb-6 grid h-24 w-24 place-items-center">
        <span className="absolute inset-0 rounded-full border border-sky-200/70" />
        <span className="absolute inset-3 rounded-full border border-sky-100" />
        <span className="absolute inset-0 rounded-full bg-sky-400/20 blur-xl" />
        <span className="grid h-14 w-14 animate-float place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/40">
          <Star size={26} fill="currentColor" strokeWidth={0} />
        </span>
      </div>
      <h3 className="text-lg font-bold text-slate-800">No reviews yet — let&apos;s change that</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Add your first customer and send a request. Your pipeline lights up here in realtime as reviews roll in.
      </p>
      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <Link to="/dashboard/customers" className="btn-primary text-sm">
          <Plus size={16} /> Add first customer
        </Link>
        <Link to="/dashboard/settings" className="btn-outline text-sm">
          <SettingsIcon size={16} /> Configure workspace
        </Link>
      </div>
    </div>
  );
}

function OnboardingChecklist({ settings, stats }) {
  const items = [
    { label: 'Add your business name', done: !!settings.businessName, to: '/dashboard/settings' },
    { label: 'Add your Google review link', done: !!settings.googleReviewsUrl, to: '/dashboard/settings' },
    { label: 'Add your first customer', done: (stats?.customers ?? 0) > 0, to: '/dashboard/customers' },
    { label: 'Send your first review request', done: (stats?.smsSent ?? 0) > 0 || (settings.smsUsage?.count ?? 0) > 0, to: '/dashboard/customers' },
  ];
  const doneCount = items.filter(i => i.done).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-slate-950">Launch checklist</h3>
          <p className="text-sm text-slate-500">Finish these steps to start collecting reviews.</p>
        </div>
        <span className="w-fit rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600">{doneCount} of {items.length} complete</span>
      </div>
      <div className="grid gap-3">
        {items.map((item, index) => (
          <Link key={item.label} to={item.to} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition-all hover:border-sky-300 hover:bg-sky-50">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {item.done ? <Check size={15} /> : index + 1}
            </span>
            <span className={`font-semibold ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.label}</span>
          </Link>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Link to="/dashboard/customers" className="btn-primary justify-center text-sm"><Plus size={16} /> Add first customer</Link>
        <Link to="/dashboard/settings" className="btn-outline justify-center text-sm"><SettingsIcon size={16} /> Configure workspace</Link>
        <Link to="/dashboard/settings" className="btn-outline justify-center text-sm"><ExternalLink size={16} /> Connect Google Reviews</Link>
      </div>
    </div>
  );
}

// ── QR Code card ──────────────────────────────────────────────────────────────
function QRCard({ userId }) {
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl]   = useState('');

  const registerUrl = useMemo(() => `${window.location.origin}/register/${userId}`, [userId]);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(registerUrl, {
      width: 180, margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then(url => { if (active) setQrUrl(url); });
    return () => { active = false; };
  }, [registerUrl]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(registerUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [registerUrl]);

  const handleDownload = useCallback(() => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = 'starvis-qr-code.png';
    link.click();
  }, [qrUrl]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
          <QrCode size={16} className="text-sky-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Customer QR Code</h3>
          <p className="text-slate-400 text-xs">Customers scan to self-register</p>
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-inner inline-block">
          {qrUrl ? (
            <img src={qrUrl} alt="Customer registration QR code" className="w-[180px] h-[180px]" />
          ) : (
            <div className="w-[180px] h-[180px] bg-slate-100 rounded-xl animate-pulse" />
          )}
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl px-3 py-2 mb-3 flex items-center gap-2 overflow-hidden">
        <span className="text-slate-500 text-xs truncate flex-1 font-mono">
          {registerUrl}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleCopy}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-[0.97]
          ${copied ? 'bg-green-500 text-white' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button
          onClick={handleDownload}
          disabled={!qrUrl}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
        >
          <Download size={14} />
          Download
        </button>
      </div>

      <p className="text-slate-400 text-xs text-center mt-3 leading-relaxed">
        Print & display at your business — customers scan to submit feedback instantly.
      </p>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const { settings, loadingSettings } = useDashboardData();
  const [stats, setStats]                   = useState(null);
  const [recentReviews, setRecentReviews]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const hasFetched                          = useRef(false);

  // ── Check onboarding flag on first mount ────────────────────────────────────
  useEffect(() => {
    if (!loadingSettings && !settings.onboardingComplete) {
      queueMicrotask(() => setShowOnboarding(true));
    }
  }, [loadingSettings, settings.onboardingComplete]);

  useEffect(() => {
    if (!user || hasFetched.current) return;
    hasFetched.current = true;

    const cacheKey = `dashboard_overview_${user.uid}`;
    const cached   = sessionStorage.getItem(cacheKey);

    const applyData = ({ reviews, customers }) => {
      const totalReviews = reviews.length;
      const totalCustomers = customers.length;
      const smsSent = customers.filter(c => ['sms_sent', 'reviewed', 'feedback_received'].includes(c.status)).length;
      const avg      = totalReviews > 0
        ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / totalReviews).toFixed(1)
        : '0.0';
      const conv = smsSent > 0 ? Math.round((totalReviews / smsSent) * 100) : 0;
      setStats({ customers: totalCustomers, smsSent, reviews: totalReviews, avgRating: avg, conversion: conv });
      setRecentReviews(reviews.slice(0, 5));
    };

    if (cached) {
      queueMicrotask(() => {
        const parsed = JSON.parse(cached);
        applyData(Array.isArray(parsed) ? { reviews: parsed, customers: [] } : parsed);
        setLoading(false);
      });
    }

    const reviewsQ = query(
      collection(db, 'users', user.uid, 'reviews'),
      orderBy('createdAt', 'desc'),
      limit(20),
    );
    const customersQ = query(
      collection(db, 'users', user.uid, 'customers'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );

    Promise.all([getDocs(reviewsQ), getDocs(customersQ)])
      .then(([reviewSnap, customerSnap]) => {
        const reviews = reviewSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const customers = customerSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        sessionStorage.setItem(cacheKey, JSON.stringify({ reviews, customers }));
        applyData({ reviews, customers });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const statCards = [
    { icon: Users,         label: 'Customers',       value: stats?.customers ?? 0,  accent: 'from-sky-500 to-cyan-400',      sparkColor: '#0ea5e9', spark: [3, 5, 4, 6, 8, 7, 10, 12] },
    { icon: MessageSquare, label: 'SMS sent',        value: stats?.smsSent ?? 0,    accent: 'from-violet-500 to-indigo-500', sparkColor: '#7c3aed', spark: [2, 4, 3, 6, 5, 9, 8, 11] },
    { icon: Star,          label: 'Reviews',         value: stats?.reviews ?? 0,    accent: 'from-amber-400 to-orange-400',  sparkColor: '#f59e0b', spark: [1, 2, 4, 3, 6, 7, 9, 12] },
    { icon: TrendingUp,    label: 'Conversion rate', value: stats?.conversion ?? 0, suffix: '%', accent: 'from-emerald-400 to-teal-500', sparkColor: '#10b981', spark: [40, 52, 48, 61, 58, 70, 72, 76] },
  ];
  const isEmptyWorkspace = !loading && (stats?.customers ?? 0) === 0 && (stats?.reviews ?? 0) === 0;
  const onboardingDone =
    !!settings.businessName &&
    !!settings.googleReviewsUrl &&
    (stats?.customers ?? 0) > 0 &&
    ((stats?.smsSent ?? 0) > 0 || (settings.smsUsage?.count ?? 0) > 0);

  return (
    <>
      {/* Onboarding modal — shows once for new users */}
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}

      {/* Welcome banner */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_12%_8%,rgba(30,167,255,0.34),transparent_38%),radial-gradient(circle_at_88%_120%,rgba(123,77,255,0.32),transparent_46%),linear-gradient(135deg,#081120,#0B1020)] p-6 text-white shadow-[0_24px_60px_-26px_rgba(8,17,32,0.7)] sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-grid-faint bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-azure-light">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Live workspace
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {isEmptyWorkspace ? 'Welcome to Starvis' : `Welcome back${user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}`}
            </h2>
            <p className="mt-1.5 text-sm text-slate-300">
              {isEmptyWorkspace ? "Let's set up your reputation workspace." : 'Here is what is happening with your review pipeline today.'}
            </p>
          </div>
          <Link to="/dashboard/customers" className="btn-primary shrink-0 px-5 py-3 text-sm">
            <Plus size={16} /> Send review request
          </Link>
        </div>
      </div>

      {!loading && !onboardingDone && <div className="mb-8"><OnboardingChecklist settings={settings} stats={stats} /></div>}

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {loading
          ? [0,1,2,3].map(i => <StatCardSkeleton key={i} />)
          : statCards.map((c, i) => <StatCard key={i} {...c} />)
        }
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recent Activity</h3>
            <Link to="/dashboard/reviews" className="text-sky-500 text-sm font-medium hover:underline">
              View all
            </Link>
          </div>

          {loading ? (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {[0,1,2].map(i => <RowSkeleton key={i} />)}
              </tbody>
            </table>
          ) : recentReviews.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Customer</th>
                    <th className="text-left px-6 py-3">Rating</th>
                    <th className="text-left px-6 py-3">Status</th>
                    <th className="text-left px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentReviews.map((r, i) => (
                    <motion.tr
                      key={r.id || i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      className="transition-colors hover:bg-sky-50/60"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-violet-500 text-[11px] font-bold text-white">
                            {(r.customerName || 'A').slice(0, 2).toUpperCase()}
                          </span>
                          <span className="font-semibold text-slate-800">{r.customerName || 'Anonymous'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5"><StarRating rating={r.rating || 0} /></td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          r.rating >= 4 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${r.rating >= 4 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {r.rating >= 4 ? 'Sent to Google' : 'Private ticket'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-400">
                        {r.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <SmsQuotaCard billing={settings.billing} smsUsage={settings.smsUsage} />
          <AiInsightCard />
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-2.5">
              <Link to="/dashboard/customers"
                className="flex items-center gap-3 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold px-4 py-3 rounded-xl transition-colors text-sm">
                <Plus size={17} /> Add New Customer
              </Link>
              <Link to="/dashboard/customers"
                className="flex items-center gap-3 bg-green-50 hover:bg-green-100 text-green-700 font-semibold px-4 py-3 rounded-xl transition-colors text-sm">
                <Send size={17} /> Send Review Request
              </Link>
              <a href="https://business.google.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold px-4 py-3 rounded-xl transition-colors text-sm">
                <ExternalLink size={17} /> View Google Reviews
              </a>
            </div>
          </div>

          {/* QR Code card */}
          {user && <QRCard userId={user.uid} />}
        </div>
      </div>
    </>
  );
}
