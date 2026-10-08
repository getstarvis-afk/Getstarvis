import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Play, Sparkles, Star } from 'lucide-react';
import LeadCapture from './LeadCapture';
import ReputationEngine from './visuals/ReputationEngine';
import StarField from './visuals/StarField';

const EASE = [0.22, 1, 0.36, 1];
const rise = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE, delay: i * 0.08 } }),
};

const AVATARS = ['MT', 'SK', 'JL', 'RV'];

export default function Hero() {
  const scrollToDemo = () =>
    document.getElementById('dashboard-preview')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="relative overflow-hidden bg-navy-900 px-4 pb-24 pt-32 text-white sm:pb-28">
      {/* layered atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(30,167,255,0.22),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(123,77,255,0.22),transparent_32%),linear-gradient(180deg,#081120_0%,#0B1020_100%)]" />
      <div className="absolute inset-0 bg-grid-faint bg-[size:46px_46px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
      <StarField className="opacity-70" />
      <div className="absolute inset-0 noise" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
          {/* ── Copy ─────────────────────────────────────────────────────── */}
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
            <motion.div variants={rise} custom={0}>
              <span className="eyebrow">
                <Sparkles size={12} /> Intelligent reputation automation
              </span>
            </motion.div>

            <motion.h1
              variants={rise}
              custom={1}
              className="mt-6 max-w-2xl text-[2.6rem] font-extrabold leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.1rem]"
            >
              Turn happy customers into{' '}
              <span className="text-gradient">5-star reviews</span>, automatically.
            </motion.h1>

            <motion.p variants={rise} custom={2} className="mt-6 max-w-xl text-lg leading-8 text-slate-300/90">
              Starvis sends perfectly-timed SMS review requests, routes happy customers
              straight to Google, and quietly catches unhappy ones before they post. Your
              reputation, on autopilot.
            </motion.p>

            <motion.div variants={rise} custom={3} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/signup" className="btn-primary px-7 py-3.5 text-base">
                Start free trial
                <ArrowRight size={18} />
              </Link>
              <button onClick={scrollToDemo} className="btn-dark-outline px-7 py-3.5 text-base">
                <Play size={16} /> Watch it work
              </button>
            </motion.div>

            {/* social proof row */}
            <motion.div variants={rise} custom={4} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <div className="flex items-center -space-x-2.5">
                {AVATARS.map((a) => (
                  <span
                    key={a}
                    className="grid h-9 w-9 place-items-center rounded-full border-2 border-navy-900 bg-brand-gradient text-[11px] font-bold text-white"
                  >
                    {a}
                  </span>
                ))}
                <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-navy-900 bg-white/10 text-[10px] font-bold text-white">
                  +2k
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-300">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  Trusted by local businesses collecting reviews every day
                </p>
              </div>
            </motion.div>

            <motion.div variants={rise} custom={5} className="mt-7 grid gap-2.5 text-sm text-slate-300 sm:grid-cols-3">
              {['Built for local businesses', 'Realtime SMS statuses', '14-day free trial'].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  {item}
                </span>
              ))}
            </motion.div>

            <motion.div variants={rise} custom={6} className="mt-9 max-w-lg">
              <LeadCapture title="Book a personal demo" />
            </motion.div>
          </motion.div>

          {/* ── Centerpiece ──────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
            className="lg:pl-6"
          >
            <ReputationEngine />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
