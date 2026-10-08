import { Link } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';

// Demo / contact CTA. Routes people to the real, working Contact page
// (which delivers to the support inbox) instead of a silent lead form.
export default function LeadCapture({ title = 'Want a quick demo?' }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-6">
      <div className="flex items-start gap-3.5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-azure-light">
          <Mail size={18} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Want a quick demo? Contact us and we&apos;ll help you set up Starvis.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/contact" className="btn-primary px-5 py-3 text-sm">
              Contact us
              <ArrowRight size={16} />
            </Link>
            <a
              href="mailto:contact@alioapp.fr"
              className="text-sm font-medium text-azure-light transition-colors hover:text-white"
            >
              Or email contact@alioapp.fr
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
