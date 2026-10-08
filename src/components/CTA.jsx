import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import LeadCapture from './LeadCapture';
import StarField from './visuals/StarField';
import { Reveal } from './Reveal';

export default function CTA() {
  return (
    <section className="bg-navy-900 px-4 py-24 text-white">
      <Reveal className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(30,167,255,0.28),transparent_42%),radial-gradient(circle_at_88%_20%,rgba(123,77,255,0.3),transparent_40%),linear-gradient(180deg,#0B1020,#081120)] p-10 text-center shadow-glow-brand sm:p-16">
          <StarField className="opacity-60" />
          <div className="absolute inset-0 noise" />

          <div className="relative">
            <p className="eyebrow mx-auto">Ready when you are</p>
            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl sm:leading-[1.05]">
              Start collecting more <span className="text-gradient">5-star reviews</span> today.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-300/90">
              Set up your review workflow in minutes — SMS, QR, realtime tracking and smart follow-up, all in one place.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup" className="btn-primary px-8 py-4 text-base">
                Start free trial
                <span className="btn-icon-nest grid h-7 w-7 place-items-center rounded-full bg-white/15">
                  <ArrowRight size={16} />
                </span>
              </Link>
              <button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-dark-outline px-8 py-4 text-base"
              >
                See pricing
              </button>
            </div>

            <div className="mx-auto mt-10 max-w-xl text-left">
              <LeadCapture title="Prefer a quick demo first?" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
