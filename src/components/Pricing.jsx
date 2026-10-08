import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { BILLING_CYCLES, getPlanPrice, PRICING_PLANS } from '../config/pricing';
import { Reveal } from './Reveal';

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const billingCycle = annual ? BILLING_CYCLES.annual : BILLING_CYCLES.monthly;

  return (
    <section id="pricing" className="relative overflow-hidden bg-navy-900 px-4 py-24 text-white">
      <div className="pointer-events-none absolute left-1/2 top-10 h-[36vh] w-[70vw] -translate-x-1/2 rounded-full bg-azure/10 blur-[140px]" />

      <div className="relative mx-auto max-w-6xl">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <span className="eyebrow"><Sparkles size={12} /> Pricing</span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-[2.7rem] sm:leading-[1.08]">
            Simple plans for every stage.
          </h2>
          <p className="mt-4 text-lg text-slate-400">Every plan includes a 14-day free trial. No card games, cancel anytime.</p>

          <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${!annual ? 'bg-brand-gradient text-white shadow-glow-sky' : 'text-slate-400 hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${annual ? 'bg-brand-gradient text-white shadow-glow-sky' : 'text-slate-400 hover:text-white'}`}
            >
              Annual <span className="ml-1 text-emerald-300">−20%</span>
            </button>
          </div>
        </Reveal>

        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {PRICING_PLANS.map((plan, index) => {
            const href = annual ? plan.annualUrl : plan.monthlyUrl;
            const popular = plan.popular;
            return (
              <motion.article
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 }}
                className={`relative flex flex-col rounded-3xl p-7 sm:p-8 ${
                  popular
                    ? 'border border-azure/40 bg-gradient-to-b from-azure/[0.12] to-white/[0.02] shadow-glow-brand lg:-mt-4 lg:mb-0'
                    : 'border border-white/10 bg-white/[0.03]'
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-gradient px-4 py-1 text-xs font-bold text-white shadow-glow-sky">
                    Most popular
                  </span>
                )}

                <h3 className="text-lg font-extrabold text-white">{plan.name}</h3>
                <p className="mt-2 min-h-[3rem] text-sm leading-6 text-slate-400">{plan.description}</p>

                <div className="mt-6 flex items-end gap-1.5">
                  <motion.span
                    key={`${plan.id}-${billingCycle}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-extrabold tracking-tight tabular text-white"
                  >
                    {getPlanPrice(plan, billingCycle)}
                  </motion.span>
                  <span className="mb-1.5 text-sm text-slate-400">/{annual ? 'year' : 'month'}</span>
                </div>

                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-7 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition-all active:scale-[0.97] ${
                    popular
                      ? 'btn-primary'
                      : 'border border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/25'
                  }`}
                >
                  Start 14-day free trial
                </a>

                <ul className="mt-8 flex flex-1 flex-col gap-3.5 border-t border-white/10 pt-7">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-azure/15 text-azure-light">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
