import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/useAuth';
import { Star, AlertCircle, CheckCircle } from 'lucide-react';
import { ReviewRowSkeleton } from '../components/Skeleton';

function EmptyReviews() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" className="mb-5">
        <circle cx="50" cy="50" r="46" fill="#fefce8" stroke="#fde047" strokeWidth="2"/>
        <path d="M50 25l6.18 12.53L70 39.26l-10 9.74 2.36 13.76L50 56.13l-12.36 6.63L40 49l-10-9.74 13.82-1.73z" fill="#fde047" stroke="#facc15" strokeWidth="1.5"/>
      </svg>
      <h3 className="text-lg font-bold text-slate-700 mb-2">No reviews yet</h3>
      <p className="text-slate-400 text-sm max-w-xs">Add customers and send review requests to start seeing responses here.</p>
    </div>
  );
}

export default function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;

    const cacheKey = `reviews_${user.uid}`;
    const cached   = sessionStorage.getItem(cacheKey);

    if (cached) {
      queueMicrotask(() => {
        setReviews(JSON.parse(cached));
        setLoading(false);
      });
    }

    const fetch = async () => {
      try {
        const q    = query(
          collection(db, 'users', user.uid, 'reviews'),
          orderBy('createdAt', 'desc'),
          limit(20),
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setReviews(data);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch {
        // Firebase not configured
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const isPrivate = (r) => r.channel === 'private_ticket' || (!r.channel && (r.rating || 0) < 4);

  const { positive, negative, avg, filtered } = useMemo(() => {
    const negative = reviews.filter(isPrivate);
    const positive = reviews.filter(r => !isPrivate(r));
    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : '0.0';
    const filtered = filter === 'positive' ? positive : filter === 'negative' ? negative : reviews;
    return { positive, negative, avg, filtered };
  }, [reviews, filter]);

  return (
    <>
      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: Star, label: 'Average Rating', value: `${avg} ⭐`, color: 'bg-yellow-500' },
          { icon: CheckCircle, label: 'Sent to Google', value: positive.length, color: 'bg-green-500' },
          { icon: AlertCircle, label: 'Private Tickets', value: negative.length, color: 'bg-orange-500' },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4"
          >
            <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <s.icon size={22} className="text-white" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900">{s.value}</div>
              <div className="text-slate-500 text-sm">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'all', label: `All (${reviews.length})` },
          { key: 'positive', label: `⭐ Google (${positive.length})` },
          { key: 'negative', label: `🔔 Private (${negative.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === t.key ? 'bg-sky-500 text-white shadow-sm' : 'bg-white text-slate-500 border border-gray-200 hover:border-sky-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Coming soon — Planned for Starvis V2 (not active yet) */}
      <div className="mb-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h3 className="font-bold text-slate-800">Coming soon — Planned for Starvis V2</h3>
        </div>
        <p className="mt-1 text-sm text-slate-500">We're building deeper review tooling. None of the items below are active yet.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            ['🔗', 'Google Business Profile integration', 'Import and display your existing Google reviews.'],
            ['🤖', 'AI review response suggestions', 'Draft replies to reviews in your brand voice.'],
            ['📈', 'Sentiment analysis & insights', 'Spot trends and review performance over time.'],
            ['🚨', 'Negative feedback detection', 'Get alerted to unhappy customers automatically.'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="flex items-start gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
              <span className="text-base">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {title}
                  <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Soon</span>
                </p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => <ReviewRowSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyReviews />
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600 font-bold text-sm flex-shrink-0">
                    {(r.customerName || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{r.customerName || 'Anonymous'}</div>
                    <div className="text-yellow-400 text-sm">{'⭐'.repeat(r.rating || 0)}</div>
                    {(r.comment || r.feedback) && (
                      <p className="text-slate-500 text-sm mt-1 italic">"{r.comment || r.feedback}"</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isPrivate(r) ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {isPrivate(r) ? '🔔 Private' : '✅ Google-ready'}
                  </span>
                  <span className="text-slate-400 text-xs">
                    {r.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
