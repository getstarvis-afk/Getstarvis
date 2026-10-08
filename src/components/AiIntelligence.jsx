import { Link } from 'react-router-dom';
import { ArrowRight, BrainCircuit, MessageSquareText, Sparkles, TrendingUp } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from './Reveal';
import SpotlightCard from './visuals/SpotlightCard';

const FEATURES = [
  {
    icon: BrainCircuit,
    name: 'AI Review Intelligence',
    desc: 'Reads every review and surfaces the themes that move your rating — what customers love, and what is quietly slipping.',
  },
  {
    icon: TrendingUp,
    name: 'AI Insights',
    desc: 'A weekly reputation briefing in plain English, with the single action most likely to lift your score this week.',
  },
  {
    icon: MessageSquareText,
    name: 'AI Reputation Engine',
    desc: 'Drafts on-brand replies to every review in one click — warm for the happy ones, careful for the rest.',
  },
];

export default function AiIntelligence() {
  return (
    <section className="relative overflow-hidden bg-navy-900 px-4 py-24">
      {/* glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[40vh] w-[80vw] -translate-x-1/2 rounded-full bg-iris/10 blur-[140px]" />

      <div className="relative mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">
            <Sparkles size={12} /> Coming in Starvis V2
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-[2.7rem] sm:leading-[1.08]">
            AI that reads the room — <span className="text-gradient">and replies for you</span>.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            Starvis already collects the reviews. Next, it understands them. A layer of
            review intelligence is landing soon — here is what it unlocks.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-5 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, name, desc }) => (
            <RevealItem key={name}>
              <SpotlightCard className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                <div className="absolute right-5 top-5 rounded-full border border-iris/30 bg-iris/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-iris-light">
                  Soon
                </div>
                <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-brand-soft text-white">
                  <Icon size={22} className="text-azure-light" />
                </div>
                <h3 className="text-lg font-bold text-white">{name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{desc}</p>
                <div className="mt-6 h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-iris animate-pulse" />
                  In active development
                </div>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal delay={0.1} className="mt-12 text-center">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-sm font-semibold text-azure-light transition-colors hover:text-white"
          >
            Join the V2 early-access list
            <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
