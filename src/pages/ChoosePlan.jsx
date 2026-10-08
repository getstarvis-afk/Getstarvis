import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { BILLING_CYCLES, getPlanPrice, PRICING_PLANS } from '../config/pricing';
import { saveBillingSelection } from '../services/billing';
import { useAuth } from '../context/useAuth';

export default function ChoosePlan() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState(BILLING_CYCLES.monthly);
  const [selecting, setSelecting] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#081120] flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-sky-300" size={30} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const handleSelect = async (plan) => {
    setSelecting(plan.id);
    try {
      const billing = await saveBillingSelection(user.uid, plan.id, billingCycle, user.email);
      window.location.assign(billing.checkoutUrl);
    } catch {
      toast.error('Could not save your plan. Please try again.');
      setSelecting('');
    }
  };

  return (
    <div className="min-h-screen bg-[#081120] px-4 py-8 text-white sm:px-6">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_20%_0%,rgba(30,167,255,0.22),transparent_34%),radial-gradient(circle_at_85%_12%,rgba(123,77,255,0.2),transparent_28%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <BrandLogo to="/" size="sm" dark />
          <button onClick={() => navigate('/dashboard')} className="text-sm font-semibold text-slate-300 hover:text-white">
            Dashboard
          </button>
        </div>

        <div className="mx-auto mt-12 max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Choose your plan</p>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
              Start your Starvis workspace.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Select a plan to begin checkout. Stripe securely handles payment and trial setup.
            </p>
          </motion.div>

          <div className="mt-8 inline-flex rounded-2xl border border-white/10 bg-white/10 p-1 backdrop-blur">
            {[BILLING_CYCLES.monthly, BILLING_CYCLES.annual].map(cycle => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`rounded-xl px-5 py-2 text-sm font-bold capitalize transition-all ${
                  billingCycle === cycle ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300'
                }`}
              >
                {cycle}
                {cycle === BILLING_CYCLES.annual && <span className="ml-2 text-emerald-500">Save 20%</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PRICING_PLANS.map((plan, index) => (
            <motion.article
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className={`relative flex rounded-2xl border p-6 shadow-2xl shadow-black/10 transition-all hover:-translate-y-1 ${
                plan.popular
                  ? 'border-sky-400/50 bg-white text-slate-950'
                  : 'border-white/10 bg-white/[0.04] text-white backdrop-blur'
              }`}
            >
              {plan.popular && (
                <span className="absolute right-5 top-5 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-3 py-1 text-xs font-bold text-white">
                  Best fit
                </span>
              )}
              <div className="flex w-full flex-col">
                <h2 className="text-xl font-extrabold">{plan.name}</h2>
                <p className={`mt-2 min-h-12 text-sm leading-6 ${plan.popular ? 'text-slate-500' : 'text-slate-400'}`}>{plan.description}</p>
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-4xl font-extrabold">{getPlanPrice(plan, billingCycle)}</span>
                  <span className={plan.popular ? 'mb-1 text-slate-500' : 'mb-1 text-slate-400'}>/{billingCycle === 'annual' ? 'year' : 'month'}</span>
                </div>
                {billingCycle === BILLING_CYCLES.annual && (
                  <span className={`mt-3 w-fit rounded-full px-3 py-1 text-xs font-bold ${
                    plan.popular ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-400/10 text-emerald-300'
                  }`}>
                    Save 20%
                  </span>
                )}
                <ul className="mt-7 flex flex-1 flex-col gap-3">
                  {plan.features.map(feature => (
                    <li key={feature} className={`flex gap-3 text-sm ${plan.popular ? 'text-slate-600' : 'text-slate-300'}`}>
                      <Check size={17} className="mt-0.5 shrink-0 text-sky-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelect(plan)}
                  disabled={!!selecting}
                  className="btn-primary mt-8 justify-center py-3 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {selecting === plan.id ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  Start 14-Day Free Trial
                </button>
              </div>
            </motion.article>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">All plans include a 14-day free trial.</p>
      </div>
    </div>
  );
}
