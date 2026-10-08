import { MessageSquarePlus, Send, Sparkles, Star } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from './Reveal';

const steps = [
  {
    icon: MessageSquarePlus,
    title: 'Add customers',
    desc: 'Capture details after a job, or let customers self-register by scanning your QR code on-site.',
  },
  {
    icon: Send,
    title: 'Send review requests',
    desc: 'Starvis fires a branded SMS at the right moment and tracks delivery in realtime — no chasing.',
  },
  {
    icon: Star,
    title: 'Collect 5-star reviews',
    desc: 'Happy customers land on your Google page. Unhappy ones reach you privately first.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-navy-800 px-4 py-24 text-white">
      <div className="pointer-events-none absolute right-0 top-0 h-[36vh] w-[40vw] rounded-full bg-azure/10 blur-[130px]" />

      <div className="relative mx-auto max-w-6xl">
        <Reveal className="mb-16 max-w-2xl">
          <span className="eyebrow"><Sparkles size={12} /> How it works</span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-[2.7rem] sm:leading-[1.08]">
            Asking for reviews is awkward. <span className="text-gradient">So we automated it.</span>
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            Most great service never makes it to Google — the moment passes, nobody asks. Starvis
            closes that gap with three quiet steps that run on their own.
          </p>
        </Reveal>

        <div className="relative">
          {/* connecting pipeline line (desktop) */}
          <div className="pointer-events-none absolute left-0 right-0 top-[3.25rem] hidden h-px bg-gradient-to-r from-transparent via-azure/40 to-transparent md:block" />

          <RevealGroup className="grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <RevealItem key={step.title}>
                <div className="group relative h-full rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-azure/40 hover:bg-white/[0.05]">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl border border-azure/30 bg-azure/10 text-azure-light transition-transform duration-500 group-hover:scale-110">
                      <step.icon size={22} />
                    </div>
                    <span className="text-5xl font-extrabold leading-none text-white/[0.07] transition-colors group-hover:text-white/[0.12]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{step.desc}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
