import { BadgeCheck, Quote, Star } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from './Reveal';
import Counter from './visuals/Counter';

const testimonials = [
  {
    quote:
      'We went from begging customers for reviews to barely thinking about it. Starvis sends the text, the right people land on Google, and our rating just climbs.',
    name: 'Marcus Toledo',
    role: 'Owner · Riviera Auto Spa',
    loc: 'Austin, TX',
    avatar: 'MT',
    featured: true,
  },
  {
    quote:
      'The QR flow is simple enough for our techs to use on a job site. Follow-up is finally obvious instead of falling through the cracks.',
    name: 'Sarah Kwon',
    role: 'Ops Lead · Sunset HVAC',
    loc: 'Phoenix, AZ',
    avatar: 'SK',
  },
  {
    quote:
      'It feels like part of our brand, not a cheap texting tool. That mattered to us — and our guests noticed the difference.',
    name: 'James Lindqvist',
    role: 'GM · Bayside Bistro',
    loc: 'San Diego, CA',
    avatar: 'JL',
  },
];

const STATS = [
  { value: 2418, suffix: '+', label: 'review requests sent' },
  { value: 4.9, decimals: 1, label: 'average star rating' },
  { value: 76, suffix: '%', label: 'request-to-review rate' },
  { value: 31, suffix: ' sec', label: 'avg. time to first reply' },
];

function Stars({ count = 5, size = 15 }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-300" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
      ))}
    </div>
  );
}

function Avatar({ text }) {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-sm font-bold text-white">
      {text}
    </span>
  );
}

export default function Testimonials() {
  const [featured, ...rest] = testimonials;

  return (
    <section className="relative overflow-hidden bg-navy-800 px-4 py-24 text-white">
      <div className="pointer-events-none absolute left-0 bottom-0 h-[34vh] w-[40vw] rounded-full bg-iris/10 blur-[130px]" />

      <div className="relative mx-auto max-w-6xl">
        <Reveal className="mb-14 max-w-2xl">
          <span className="eyebrow"><BadgeCheck size={12} /> Proof</span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-[2.7rem] sm:leading-[1.08]">
            Local businesses are quietly <span className="text-gradient">winning the review game</span>.
          </h2>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Featured */}
          <Reveal className="lg:col-span-2">
            <figure className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 sm:p-10">
              <Quote className="absolute right-8 top-8 text-white/[0.06]" size={72} />
              <div className="relative">
                <Stars size={18} />
                <blockquote className="mt-6 text-2xl font-semibold leading-relaxed tracking-tight text-white sm:text-[1.7rem]">
                  “{featured.quote}”
                </blockquote>
              </div>
              <figcaption className="relative mt-8 flex items-center gap-3">
                <Avatar text={featured.avatar} />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    {featured.name}
                    <BadgeCheck size={15} className="text-azure-light" />
                  </div>
                  <div className="text-sm text-slate-400">{featured.role} · {featured.loc}</div>
                </div>
              </figcaption>
            </figure>
          </Reveal>

          {/* Google-review styled card */}
          <Reveal delay={0.1}>
            <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-base font-extrabold text-azure">G</span>
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-white">Posted on Google</p>
                    <p className="text-[11px] text-slate-400">2 weeks ago</p>
                  </div>
                </div>
                <Stars size={14} />
              </div>
              <p className="mt-5 flex-1 text-sm leading-7 text-slate-300">
                “Booked a detail, got a text the next morning, left a review in ten seconds.
                Easiest five stars I’ve ever given.”
              </p>
              <div className="mt-6 flex items-center gap-2.5 border-t border-white/10 pt-5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-400/15 text-xs font-bold text-emerald-300">DA</span>
                <div className="text-xs">
                  <p className="font-semibold text-white">Diane A.</p>
                  <p className="flex items-center gap-1 text-slate-400"><BadgeCheck size={11} /> Verified Google review</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Two compact testimonials */}
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-2">
            {rest.map((t) => (
              <RevealItem key={t.name}>
                <article className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                  <Stars />
                  <p className="mt-5 flex-1 leading-7 text-slate-300">“{t.quote}”</p>
                  <div className="mt-7 flex items-center gap-3">
                    <Avatar text={t.avatar} />
                    <div>
                      <div className="font-bold text-white">{t.name}</div>
                      <div className="text-sm text-slate-400">{t.role} · {t.loc}</div>
                    </div>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        {/* Animated trust bar */}
        <Reveal delay={0.05} className="mt-10">
          <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-navy-800 px-6 py-7 text-center">
                <div className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  <Counter value={s.value} decimals={s.decimals || 0} suffix={s.suffix || ''} />
                </div>
                <div className="mt-1.5 text-sm font-medium text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
