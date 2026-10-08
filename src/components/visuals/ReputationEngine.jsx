import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Activity, Check, Send, Star } from 'lucide-react';
import Counter from './Counter';

/* ── Pipeline data ──────────────────────────────────────────────────────────── */
const POOL = [
  ['Riviera Auto Spa', 'Ceramic coating'],
  ['Northline Roofing', 'Roof inspection'],
  ['Prime Tint Studio', 'Window tint'],
  ['Sunset HVAC', 'AC tune-up'],
  ['Bayside Dental', 'Cleaning visit'],
  ['Apex Barber Co.', 'Fade & beard trim'],
  ['Verde Landscaping', 'Spring cleanup'],
  ['Lumière Med Spa', 'Facial session'],
];

const STAGES = [
  { key: 'queued', label: 'Queued', icon: null, cls: 'border-white/10 bg-white/[0.06] text-slate-300' },
  { key: 'sending', label: 'Sending', icon: Send, cls: 'border-azure/40 bg-azure/10 text-azure-light' },
  { key: 'delivered', label: 'Delivered', icon: Check, cls: 'border-sky-400/30 bg-sky-400/10 text-sky-200' },
  { key: 'reviewed', label: '5-star', icon: Star, cls: 'border-amber-400/30 bg-amber-400/10 text-amber-200' },
];

const initials = (name) =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/* ── Animated score ring ───────────────────────────────────────────────────── */
function ScoreRing({ score = 4.9 }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const ratio = Math.min(score / 5, 1);
  const reduce = useReducedMotion();

  return (
    <div className="relative grid h-[132px] w-[132px] place-items-center">
      <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1EA7FF" />
            <stop offset="100%" stopColor="#7B4DFF" />
          </linearGradient>
        </defs>
        <circle cx="66" cy="66" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
        <motion.circle
          cx="66" cy="66" r={R} fill="none" stroke="url(#ring-grad)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: reduce ? C * (1 - ratio) : C }}
          whileInView={{ strokeDashoffset: C * (1 - ratio) }}
          viewport={{ once: true }}
          transition={{ duration: 1.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(30,167,255,0.5))' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold tracking-tight text-white">
          <Counter value={score} decimals={1} duration={1700} />
        </span>
        <span className="-mt-0.5 text-[11px] font-semibold text-slate-400">/ 5.0 rating</span>
      </div>
    </div>
  );
}

/* ── Floating glass chip (the "review received" cards) ─────────────────────── */
function FloatChip({ className, children, delay = '0s' }) {
  return (
    <div
      className={`absolute z-20 hidden rounded-2xl border border-white/12 bg-navy-850/80 px-3.5 py-2.5 shadow-glow-brand backdrop-blur-md animate-float sm:flex ${className}`}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
}

/* ── The engine ─────────────────────────────────────────────────────────────── */
export default function ReputationEngine() {
  const cursor = useRef(POOL.length);
  const [feed, setFeed] = useState(() =>
    POOL.slice(0, 4).map((c, i) => ({ id: i, name: c[0], service: c[1], stage: i })),
  );
  const [liveReviews, setLiveReviews] = useState(1842);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => {
      setFeed((prev) => {
        const advanced = prev.map((it) => ({ ...it, stage: Math.min(it.stage + 1, 3) }));
        const [name, service] = POOL[cursor.current % POOL.length];
        cursor.current += 1;
        return [{ id: cursor.current + 1000, name, service, stage: 0 }, ...advanced].slice(0, 4);
      });
      setLiveReviews((r) => r + (Math.random() > 0.35 ? 1 : 0));
    }, 2300);
    return () => clearInterval(t);
  }, [reduce]);

  const handleMove = (e) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((e.clientX - r.left) / r.width - 0.5) * 9,
      y: ((e.clientY - r.top) / r.height - 0.5) * -9,
    });
  };

  return (
    <div
      className="relative [perspective:1400px]"
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      {/* ambient glow behind the panel */}
      <div className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_30%_20%,rgba(30,167,255,0.3),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(123,77,255,0.28),transparent_55%)] blur-2xl" />

      {/* floating review cards */}
      <FloatChip className="-left-6 top-10" delay="-1.5s">
        <div className="flex items-center gap-2">
          <span className="text-amber-300">★★★★★</span>
          <span className="text-xs font-semibold text-white">New 5-star review</span>
        </div>
      </FloatChip>
      <FloatChip className="-right-5 bottom-16" delay="-3.5s">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
            <Check size={15} />
          </span>
          <div className="leading-tight">
            <p className="text-xs font-bold text-white">Sent to Google</p>
            <p className="text-[10px] text-slate-400">+1 just now</p>
          </div>
        </div>
      </FloatChip>

      <motion.div
        className="glass-strong relative rounded-[1.75rem] p-3 sm:p-4"
        style={{ transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`, transformStyle: 'preserve-3d', transition: 'transform 250ms ease-out' }}
      >
        <div className="rounded-[1.4rem] border border-white/10 bg-navy-900/80 p-4 sm:p-5" style={{ transform: 'translateZ(40px)' }}>
          {/* header */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-azure-light">Reputation engine</p>
              <h3 className="mt-1 text-lg font-bold text-white">Live review pipeline</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Realtime
            </span>
          </div>

          {/* score + KPIs */}
          <div className="mb-4 grid grid-cols-[auto_1fr] items-center gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
              <ScoreRing score={4.9} />
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <Star size={12} className="text-amber-300" /> Reviews collected
                </div>
                <div className="mt-1 text-2xl font-extrabold tabular text-white">
                  {liveReviews.toLocaleString('en-US')}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <Activity size={12} className="text-azure-light" /> Conversion rate
                </div>
                <div className="mt-1 text-2xl font-extrabold text-white">
                  <Counter value={76} suffix="%" duration={1800} />
                </div>
              </div>
            </div>
          </div>

          {/* live feed */}
          <div className="space-y-2">
            <AnimatePresence initial={false} mode="popLayout">
              {feed.map((item) => {
                const stage = STAGES[item.stage];
                const Icon = stage.icon;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: -12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 24, transition: { duration: 0.3 } }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-gradient text-[11px] font-bold text-white">
                      {initials(item.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                      <p className="truncate text-[11px] text-slate-400">{item.service}</p>
                    </div>
                    {item.stage === 3 ? (
                      <span className="shrink-0 text-sm text-amber-300">★★★★★</span>
                    ) : (
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stage.cls}`}>
                        {stage.key === 'sending' && (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-azure-light" />
                        )}
                        {Icon && stage.key !== 'sending' && <Icon size={11} />}
                        {stage.label}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
