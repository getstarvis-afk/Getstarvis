import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { BarChart3, MessageSquare, Plus, Star, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { useAuth } from '../context/useAuth';

function EmptyAnalytics() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
        <BarChart3 size={30} />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-950">No analytics yet</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
        Add customers and send your first review request. Starvis will build your analytics from customers, reviews, and SMS status data.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/dashboard/customers" className="btn-primary justify-center text-sm"><Plus size={16} /> Add first customer</Link>
        <Link to="/dashboard/settings" className="btn-outline justify-center text-sm">Configure workspace</Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="text-2xl font-extrabold text-slate-950">{value}</div>
      <div className="mt-1 text-sm font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-xs font-medium text-slate-400">{sub}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-48 items-end justify-between gap-2 rounded-2xl bg-slate-50 p-4">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-2">
          <div className="w-full rounded-t-lg bg-slate-200/70" style={{ height: `${22 + index * 5}px` }} />
          <span className="text-xs text-slate-400">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [reviewRequests, setReviewRequests] = useState([]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [customerSnap, reviewSnap, smsSnap, requestSnap] = await Promise.all([
          getDocs(query(collection(db, 'users', user.uid, 'customers'), orderBy('createdAt', 'desc'), limit(100))),
          getDocs(query(collection(db, 'users', user.uid, 'reviews'), orderBy('createdAt', 'desc'), limit(100))),
          getDocs(query(collection(db, 'users', user.uid, 'smsLogs'), orderBy('createdAt', 'desc'), limit(100))).catch(() => ({ docs: [] })),
          // No orderBy -> single-field query, so no composite index is required.
          getDocs(query(collection(db, 'reviewRequests'), where('ownerUid', '==', user.uid), limit(500))).catch(() => ({ docs: [] })),
        ]);
        if (!active) return;
        setCustomers(customerSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setReviews(reviewSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setSmsLogs(smsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setReviewRequests(requestSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [user]);

  const metrics = useMemo(() => {
    const totalCustomers = customers.length;
    const totalReviews = reviews.length;
    const smsSentFromCustomers = customers.filter(c => ['sms_sent', 'reviewed', 'feedback_received'].includes(c.status)).length;
    const smsSent = reviewRequests.length || smsLogs.length || smsSentFromCustomers;
    const opened = reviewRequests.filter(r => r.status === 'opened' || r.status === 'submitted').length;
    const isPrivate = r => r.channel === 'private_ticket' || (!r.channel && (r.rating || 0) < 4);
    const privateTickets = reviews.filter(isPrivate).length;
    const googleReady = totalReviews - privateTickets;
    const averageRating = totalReviews
      ? (reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews).toFixed(1)
      : '0.0';
    const conversion = smsSent > 0 ? Math.round((totalReviews / smsSent) * 100) : 0;
    return { totalCustomers, totalReviews, smsSent, averageRating, conversion, opened, privateTickets, googleReady };
  }, [customers, reviews, smsLogs, reviewRequests]);

  const ratingDist = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(review => review.rating === stars).length,
  }));

  const hasData = metrics.totalCustomers > 0 || metrics.totalReviews > 0 || metrics.smsSent > 0;

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    );
  }

  if (!hasData) return <EmptyAnalytics />;

  const stats = [
    { icon: Users, label: 'Total Customers', value: metrics.totalCustomers, sub: 'From your customer list', color: 'bg-sky-500' },
    { icon: MessageSquare, label: 'SMS Sent', value: metrics.smsSent, sub: 'From customers and smsLogs', color: 'bg-violet-500' },
    { icon: Star, label: 'Total Reviews', value: metrics.totalReviews, sub: `${metrics.averageRating} average rating`, color: 'bg-emerald-500' },
    { icon: TrendingUp, label: 'Conversion Rate', value: `${metrics.conversion}%`, sub: 'Reviews divided by SMS sent', color: 'bg-amber-500' },
  ];

  return (
    <>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(stat => <StatCard key={stat.label} {...stat} />)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="mb-5 font-bold text-slate-950">Review outcomes</h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 px-4 py-3">
              <span className="text-sm font-semibold text-green-700">✅ Google-ready (4–5★)</span>
              <span className="text-lg font-extrabold text-green-700">{metrics.googleReady}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
              <span className="text-sm font-semibold text-orange-700">🔔 Private tickets (1–3★)</span>
              <span className="text-lg font-extrabold text-orange-700">{metrics.privateTickets}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-600">📨 Review links opened</span>
              <span className="text-lg font-extrabold text-slate-700">{metrics.opened}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="mb-5 font-bold text-slate-950">Rating Distribution</h3>
          <div className="flex flex-col gap-3">
            {ratingDist.map(row => {
              const pct = metrics.totalReviews > 0 ? (row.count / metrics.totalReviews) * 100 : 0;
              return (
                <div key={row.stars} className="flex items-center gap-3 text-sm">
                  <span className="w-14 text-right text-slate-500">{row.stars} star</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 font-semibold text-slate-700">{row.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
          <h3 className="mb-5 font-bold text-slate-950">Conversion Funnel</h3>
          <div className="grid gap-3">
            {[
              { label: 'Customers added', val: metrics.totalCustomers, pct: 100 },
              { label: 'SMS sent', val: metrics.smsSent, pct: metrics.totalCustomers ? (metrics.smsSent / metrics.totalCustomers) * 100 : 0 },
              { label: 'Reviews collected', val: metrics.totalReviews, pct: metrics.smsSent ? (metrics.totalReviews / metrics.smsSent) * 100 : 0 },
            ].map(row => (
              <div key={row.label} className="grid gap-2 sm:grid-cols-[150px_1fr_48px] sm:items-center">
                <span className="text-sm font-medium text-slate-500">{row.label}</span>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500" style={{ width: `${Math.min(row.pct, 100)}%` }} />
                </div>
                <span className="text-sm font-bold text-slate-950">{row.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
