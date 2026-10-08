import { BarChart3, Building2, CreditCard, QrCode, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from './Reveal';
import SpotlightCard from './visuals/SpotlightCard';
import Sparkline from './visuals/Sparkline';

const STATUS_DEMO = [
  ['Riviera Auto Spa', 'reviewed', 'border-amber-400/30 bg-amber-400/10 text-amber-200'],
  ['Sunset HVAC', 'delivered', 'border-sky-400/30 bg-sky-400/10 text-sky-200'],
  ['Prime Tint Studio', 'sending', 'border-azure/40 bg-azure/10 text-azure-light'],
  ['Northline Roofing', 'queued', 'border-white/10 bg-white/[0.06] text-slate-300'],
];

function Tile({ className = '', children }) {
  return (
    <RevealItem className={className}>
      <SpotlightCard className="group h-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-500 hover:bg-white/[0.05]">
        {children}
      </SpotlightCard>
    </RevealItem>
  );
}

function IconBadge({ icon: Icon, highlight }) {
  return (
    <div className={`mb-5 grid h-11 w-11 place-items-center rounded-2xl border text-white transition-transform duration-500 group-hover:scale-110 ${
      highlight ? 'border-iris/30 bg-brand-soft text-azure-light' : 'border-white/10 bg-white/[0.06] text-azure-light'
    }`}>
      <Icon size={20} />
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative overflow-hidden bg-navy-900 px-4 py-24 text-white">
      <div className="relative mx-auto max-w-6xl">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="eyebrow"><Sparkles size={12} /> The cockpit</span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-[2.7rem] sm:leading-[1.08]">
            Everything your reputation needs, <span className="text-gradient">in one place</span>.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            SMS, QR, realtime tracking, analytics and production-grade security — engineered to feel like one calm surface.
          </p>
        </Reveal>

        <RevealGroup className="grid auto-rows-[minmax(0,1fr)] gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.07}>
          {/* Featured — realtime status engine */}
          <Tile className="sm:col-span-2 lg:row-span-2">
            <div className="flex h-full flex-col">
              <IconBadge icon={RefreshCw} />
              <h3 className="text-xl font-bold text-white">Realtime status engine</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                Watch every request move through queued, sending, delivered and reviewed —
                live, with no refresh and no guessing.
              </p>
              <div className="mt-6 flex-1 space-y-2.5 rounded-2xl border border-white/10 bg-navy-900/60 p-3.5">
                {STATUS_DEMO.map(([name, status, cls]) => (
                  <div key={name} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <span className="text-sm font-semibold text-slate-200">{name}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </Tile>

          <Tile>
            <IconBadge icon={QrCode} />
            <h3 className="font-bold text-white">QR registration</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Walk-ins scan, register and get the right feedback link instantly.</p>
          </Tile>

          <Tile>
            <IconBadge icon={BarChart3} />
            <h3 className="font-bold text-white">Analytics dashboard</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Conversion, volume and SMS outcomes at a glance.</p>
            <div className="mt-4">
              <Sparkline data={[6, 9, 7, 12, 10, 15, 14, 19, 22]} width={150} height={34} />
            </div>
          </Tile>

          <Tile>
            <IconBadge icon={Building2} />
            <h3 className="font-bold text-white">Multi-location ready</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Separate businesses, locations and teams as you scale.</p>
          </Tile>

          <Tile>
            <IconBadge icon={ShieldCheck} />
            <h3 className="font-bold text-white">Secure by design</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Twilio secrets stay server-side, behind API keys, CORS and rate limits.</p>
          </Tile>

          {/* AI teaser tile */}
          <Tile className="sm:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <IconBadge icon={Sparkles} highlight />
                <h3 className="font-bold text-white">AI response suggestions</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  On-brand replies drafted for every review, ready to post in a click.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-iris/30 bg-iris/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-iris-light">
                Coming soon
              </span>
            </div>
          </Tile>

          <Tile className="sm:col-span-2">
            <div className="flex items-center gap-4">
              <IconBadge icon={CreditCard} />
              <div>
                <h3 className="font-bold text-white">Stripe-ready billing</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">Subscriptions, trials and upgrades wired and production-ready.</p>
              </div>
            </div>
          </Tile>
        </RevealGroup>
      </div>
    </section>
  );
}
