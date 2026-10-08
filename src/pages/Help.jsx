import { Link, useNavigate } from 'react-router-dom';
import { Mail, RotateCcw, HelpCircle, MessageSquare, CreditCard, ExternalLink } from 'lucide-react';
import { useDashboardData } from '../context/useDashboardData';
import toast from 'react-hot-toast';

export default function Help() {
  const { saveSettings } = useDashboardData();
  const navigate = useNavigate();

  const handleRestartTour = async () => {
    try {
      await saveSettings({ tourCompleted: false });
      navigate('/dashboard');
      toast.success('Tour restarted! Returning to Dashboard…');
    } catch {
      toast.error('Could not restart the tour. Please try again.');
    }
  };

  const FAQ = [
    {
      icon: MessageSquare,
      q: 'SMS not delivering?',
      a: 'Confirm the Twilio number is provisioned and the customer phone is in E.164 format (+1XXXXXXXXXX). Trial Twilio accounts can only send to verified numbers.',
    },
    {
      icon: HelpCircle,
      q: 'No reviews appearing?',
      a: 'The customer needs to open the /r/ link from their SMS and submit a rating. Firestore updates in real time — try refreshing the Reviews page.',
    },
    {
      icon: CreditCard,
      q: 'Billing or subscription question?',
      a: 'Open Settings → Billing to sync your Stripe subscription, view your current plan, or manage cancellation.',
    },
    {
      icon: ExternalLink,
      q: 'Google review link not working?',
      a: 'Copy the "Ask for reviews" link directly from Google Business Profile → Info → Get more reviews, then paste it in Settings → Business Profile.',
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-950">Help & Support</h2>
        <p className="mt-1 text-sm text-slate-500">
          Find answers, restart the product tour, or contact the Starvis team.
        </p>
      </div>

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
            <Mail size={20} className="text-sky-600" />
          </div>
          <h3 className="font-bold text-slate-900">Contact Support</h3>
          <p className="mt-1 text-sm text-slate-500">
            Reach the Starvis team with billing, SMS, or workspace questions.
          </p>
          <Link
            to="/contact"
            className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
          >
            Open Contact Form <ExternalLink size={14} />
          </Link>
          <p className="mt-2 text-xs text-slate-400">
            Or email:{' '}
            <a href="mailto:contact@alioapp.fr" className="text-sky-500 hover:underline">
              contact@alioapp.fr
            </a>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
            <RotateCcw size={20} className="text-violet-600" />
          </div>
          <h3 className="font-bold text-slate-900">Product Tour</h3>
          <p className="mt-1 text-sm text-slate-500">
            Replay the guided walkthrough and rediscover all Starvis features.
          </p>
          <button
            onClick={handleRestartTour}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
          >
            <RotateCcw size={14} /> Restart Product Tour
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-slate-950">Frequently Asked Questions</h3>
        <div className="flex flex-col gap-3">
          {FAQ.map(({ icon: Icon, q, a }) => (
            <div key={q} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Icon size={15} className="text-sky-500 flex-shrink-0" />
                {q}
              </div>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alio branding */}
      <p className="text-center text-xs text-slate-400">
        Starvis is a product by Alio · <a href="mailto:contact@alioapp.fr" className="text-sky-500 hover:underline">contact@alioapp.fr</a>
      </p>
    </div>
  );
}
