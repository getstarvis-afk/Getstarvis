import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { resolveSmsUsage } from '../services/smsQuota';
import { getPlan } from '../config/pricing';

export default function SmsQuotaCard({ billing, smsUsage, className = '' }) {
  const usage = resolveSmsUsage(billing, smsUsage);
  const planName = getPlan(billing?.plan)?.name || 'Starter';
  const pct = usage.limit > 0 ? Math.min(Math.round((usage.count / usage.limit) * 100), 100) : 0;

  const barClass = usage.reached
    ? 'bg-gradient-to-r from-rose-500 to-red-500'
    : pct >= 80
      ? 'bg-gradient-to-r from-amber-400 to-orange-500'
      : 'bg-gradient-to-r from-sky-500 via-blue-500 to-violet-500';

  const resetDate = new Date(usage.resetAt);
  const resetLabel = Number.isNaN(resetDate.getTime())
    ? 'next month'
    : resetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_6px_16px_-8px_rgba(15,23,42,0.14)] ${className}`}>
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/20">
            <MessageSquare size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">SMS this month</h3>
            <p className="text-xs text-slate-400">{planName} plan</p>
          </div>
        </div>
        <span className={`text-sm font-extrabold tabular ${usage.reached ? 'text-rose-600' : 'text-slate-900'}`}>
          {usage.count} / {usage.limit}
        </span>
      </div>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className={`h-full rounded-full ${barClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs">
        <span className="text-slate-400">Resets {resetLabel}</span>
        <span className="font-semibold text-slate-500 tabular">{usage.remaining} left</span>
      </div>

      {usage.reached && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
          Monthly limit reached. Upgrade your plan to send more review requests.
        </p>
      )}
    </div>
  );
}
