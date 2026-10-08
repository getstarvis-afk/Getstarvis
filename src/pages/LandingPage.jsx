import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import TrustBar from '../components/TrustBar';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import AiIntelligence from '../components/AiIntelligence';
import Pricing from '../components/Pricing';
import CTA from '../components/CTA';
import Footer from '../components/Footer';
import { Reveal } from '../components/Reveal';
import Counter from '../components/visuals/Counter';
import Sparkline from '../components/visuals/Sparkline';
import { BarChart3, HelpCircle, MessageSquare, QrCode, Star, TrendingUp } from 'lucide-react';

/* ── Product proof: a dark, realistic look at the real dashboard ──────────── */
function DashboardPreview() {
  const kpis = [
    ['Requests sent', 2418, '', MessageSquare, 'text-azure-light'],
    ['Reviews collected', 1842, '', Star, 'text-amber-300'],
    ['Conversion', 76, '%', TrendingUp, 'text-emerald-300'],
    ['QR scans', 391, '', QrCode, 'text-iris-light'],
  ];
  const activity = [
    ['Riviera Auto Spa', 'SMS delivered', 'border-sky-400/30 bg-sky-400/10 text-sky-200'],
    ['Prime Tint Studio', 'QR registration', 'border-iris/30 bg-iris/10 text-iris-light'],
    ['Northline Roofing', '★★★★★ reviewed', 'border-amber-400/30 bg-amber-400/10 text-amber-200'],
    ['Sunset HVAC', 'Sending', 'border-azure/40 bg-azure/10 text-azure-light'],
  ];

  return (
    <section id="dashboard-preview" className="relative overflow-hidden bg-navy-800 px-4 py-24 text-white">
      <div className="pointer-events-none absolute right-1/4 top-0 h-[36vh] w-[50vw] rounded-full bg-azure/10 blur-[140px]" />
      <div className="relative mx-auto max-w-6xl">
        <Reveal className="mb-12 max-w-2xl">
          <span className="eyebrow"><BarChart3 size={12} /> The dashboard</span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-[2.7rem] sm:leading-[1.08]">
            Your whole reputation, <span className="text-gradient">at a glance</span>.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            A focused command center — every request, scan and review in one calm, realtime view.
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="rounded-[1.75rem] border border-white/10 bg-navy-900/70 p-3 shadow-card-dark sm:p-4">
            {/* window chrome */}
            <div className="mb-3 flex items-center gap-2 px-2 pt-1">
              <span className="h-3 w-3 rounded-full bg-red-400/80" />
              <span className="h-3 w-3 rounded-full bg-amber-400/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              <span className="ml-3 rounded-md bg-white/5 px-3 py-1 text-[11px] text-slate-400">app.starvis.com/dashboard</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.5fr_0.8fr]">
              {/* main panel */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {kpis.map(([label, value, suffix, Icon, color]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <Icon size={16} className={color} />
                      <div className="mt-3 text-2xl font-extrabold text-white">
                        <Counter value={value} suffix={suffix} />
                      </div>
                      <div className="text-[11px] text-slate-400">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Reviews over time</span>
                    <span className="text-xs font-bold text-emerald-300">▲ 28% this month</span>
                  </div>
                  <Sparkline data={[8, 11, 9, 14, 13, 18, 17, 23, 21, 28, 31]} width={560} height={70} />
                </div>

                <div className="mt-4 space-y-2">
                  {activity.map(([name, status, cls]) => (
                    <div key={name} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                      <span className="text-sm font-semibold text-slate-200">{name}</span>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}>{status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* side: QR */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-azure-light">QR flow</p>
                <div className="mt-5 rounded-2xl bg-white p-5">
                  <div className="mx-auto grid h-36 w-36 grid-cols-6 gap-1">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <span key={i} className={`rounded-[2px] ${(i * 7) % 3 === 0 || (i * 5) % 11 === 0 ? 'bg-navy-900' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">Scan, register, request.</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Customers join the review flow themselves — no interruption to your team.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── FAQ — clean two-column, no generic accordion ────────────────────────── */
function FAQ() {
  const items = [
    ['How does Starvis work?', 'Add customers or let them scan your QR code. Starvis sends review requests and tracks each status in realtime.'],
    ['Do I need a Google Business Profile?', 'Yes. Starvis routes happy customers to your Google review link, so a Business Profile is required.'],
    ['Can I use QR codes?', 'Every business gets a QR registration flow for in-store, job-site or invoice use.'],
    ['Is there a free trial?', 'Yes — every plan includes a 14-day free trial.'],
    ['Can I cancel anytime?', 'Yes. Plans are month-to-month, cancel whenever you like.'],
    ['Does Starvis send SMS automatically?', 'Starvis triggers SMS review requests from the dashboard or QR flow while keeping Twilio secrets safely server-side.'],
  ];

  return (
    <section className="relative bg-navy-900 px-4 py-24 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <span className="eyebrow"><HelpCircle size={12} /> FAQ</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Questions before you launch?
            </h2>
            <p className="mt-4 text-slate-400">
              Everything you need to know before your first review request goes out.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map(([q, a]) => (
                <div key={q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20">
                  <h3 className="font-bold text-white">{q}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{a}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy-900 font-sans">
      <Navbar />
      <Hero />
      <TrustBar />
      <HowItWorks />
      <Features />
      <DashboardPreview />
      <Testimonials />
      <AiIntelligence />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
