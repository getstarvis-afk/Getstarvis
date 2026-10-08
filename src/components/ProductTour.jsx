import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const STEPS = [
  {
    route: '/dashboard',
    icon: '📊',
    title: 'Your Dashboard',
    body: 'Your command centre. See review performance, SMS quota, conversion rate, and recent activity — all at a glance.',
    points: [
      'Track monthly SMS usage against your plan limit',
      'Monitor your average star rating over time',
      'See SMS sent → review collected conversion rate',
    ],
  },
  {
    route: '/dashboard/customers',
    icon: '👥',
    title: 'Customers',
    body: 'Add customers and send them a personalised review request SMS. A customisation modal lets you edit the message before every send.',
    points: [
      'Add customers manually or via QR scan',
      'Edit the SMS template before each send',
      'Status updates in real-time: Pending → Sending → Sent',
    ],
  },
  {
    route: '/dashboard/reviews',
    icon: '⭐',
    title: 'Review Inbox',
    body: '4–5 star ratings are directed to Google. 1–3 star feedback stays private — protecting your public reputation automatically.',
    points: [
      '✅ Google-ready: customer gave 4-5 stars',
      '🔔 Private ticket: 1-3 star feedback, team-only',
      'Customer name, comment, and submission date shown',
    ],
  },
  {
    route: '/dashboard/analytics',
    icon: '📈',
    title: 'Analytics',
    body: 'Track every step of your review funnel — from SMS delivered to review submitted.',
    points: [
      'How many unique review links were opened',
      'Rating distribution across all submitted reviews',
      'Conversion funnel: Customers → SMS → Reviews',
    ],
  },
  {
    route: '/dashboard/settings',
    icon: '⚙️',
    title: 'Settings',
    body: 'Configure your business name, Google review link, SMS template, notifications, and billing plan.',
    points: [
      'Paste your Google review link under Business Profile',
      'Customise the default SMS template',
      'View your SMS quota and manage your subscription',
    ],
  },
];

export default function ProductTour({ onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const goTo = (idx) => {
    setStep(idx);
    navigate(STEPS[idx].route);
  };

  const handleNext = () => (isLast ? onComplete() : goTo(step + 1));
  const handlePrev = () => { if (!isFirst) goTo(step - 1); };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/15 bg-[#0c1628] text-white shadow-2xl shadow-black/50 select-none">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-sky-400">Product Tour</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{step + 1} / {STEPS.length}</span>
          <button
            onClick={onSkip}
            title="Close tour"
            className="rounded-full p-0.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 pt-3 pb-1">
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to step ${i + 1}`}
            className={`rounded-full transition-all ${
              i === step
                ? 'h-2 w-5 bg-sky-400'
                : i < step
                  ? 'h-2 w-2 bg-sky-700'
                  : 'h-2 w-2 bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-3xl leading-none">{current.icon}</span>
          <h3 className="text-sm font-bold text-white">{current.title}</h3>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-slate-300">{current.body}</p>
        <ul className="flex flex-col gap-1.5">
          {current.points.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
              <span className="mt-0.5 flex-shrink-0 font-bold text-sky-500">›</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
        <button
          onClick={onSkip}
          className="text-[11px] text-slate-500 transition hover:text-slate-300"
        >
          Skip tour
        </button>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              onClick={handlePrev}
              className="flex items-center gap-1 rounded-lg border border-white/20 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:bg-white/10"
            >
              <ChevronLeft size={12} /> Prev
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex items-center gap-1 rounded-lg bg-sky-500 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-sky-400"
          >
            {isLast ? 'Finish ✓' : (<>Next <ChevronRight size={12} /></>)}
          </button>
        </div>
      </div>
    </div>
  );
}
