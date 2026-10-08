import { CreditCard, MessageSquare, QrCode, ShieldCheck, Star } from 'lucide-react';
import { Reveal } from './Reveal';

// Honest "works-with" strip — every name here is a real part of the stack.
const STACK = [
  ['Google Reviews', Star],
  ['Twilio SMS', MessageSquare],
  ['Stripe billing', CreditCard],
  ['QR registration', QrCode],
  ['Secure backend', ShieldCheck],
];

export default function TrustBar() {
  return (
    <section className="relative border-y border-white/[0.06] bg-navy-900 px-4 py-10">
      <Reveal className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
          The plumbing your reputation runs on
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {STACK.map(([label, Icon]) => (
            <div
              key={label}
              className="group flex items-center gap-2.5 text-slate-400 transition-colors hover:text-white"
            >
              <Icon size={18} className="text-slate-500 transition-colors group-hover:text-azure-light" />
              <span className="text-sm font-semibold tracking-tight">{label}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
