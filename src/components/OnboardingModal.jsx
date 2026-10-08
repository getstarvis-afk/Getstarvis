import { useState, useCallback, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/useAuth';
import QRCode from 'qrcode';
import { Loader2, Download, ArrowRight, Check, Star } from 'lucide-react';

// ── Confetti burst (pure CSS + JS, no deps) ───────────────────────────────────
function Confetti() {
  useEffect(() => {
    const container = document.getElementById('sf-confetti');
    if (!container) return;
    const colors = ['#0ea5e9', '#38bdf8', '#f0abfc', '#fde68a', '#6ee7b7', '#fca5a5'];
    const pieces = Array.from({ length: 60 }, (_, i) => {
      const el = document.createElement('div');
      const size = Math.random() * 8 + 5;
      el.style.cssText = `
        position:absolute;width:${size}px;height:${size}px;
        background:${colors[i % colors.length]};
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        left:${Math.random() * 100}%;top:-10px;
        opacity:${Math.random() * 0.6 + 0.4};
        animation:sf-fall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 0.8}s forwards;
      `;
      return el;
    });
    pieces.forEach(p => container.appendChild(p));
    return () => pieces.forEach(p => p.remove());
  }, []);

  return (
    <>
      <style>{`
        @keyframes sf-fall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div id="sf-confetti" className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" />
    </>
  );
}

// ── Step 1 — Welcome ──────────────────────────────────────────────────────────
function StepWelcome({ onNext }) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-4">
      <div className="relative">
        <div className="w-24 h-24 bg-sky-500 rounded-3xl flex items-center justify-center shadow-xl shadow-sky-200">
          <Star size={44} className="text-white" fill="white" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-lg">
          🚀
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
          Welcome to Starvis
        </h2>
        <p className="text-slate-500 text-base leading-relaxed max-w-sm">
          Let's get you set up in 2 minutes so you can start collecting 5-star reviews automatically.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {['Set up your business', 'Add your Google Review link', 'Generate your QR code', 'Send your first review request'].map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-left bg-sky-50 rounded-xl px-4 py-3">
            <div className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {i + 1}
            </div>
            <span className="text-slate-700 text-sm font-medium">{item}</span>
          </div>
        ))}
      </div>

      <button onClick={onNext} className="btn-primary px-8 py-3.5 text-base mt-2">
        Continue <ArrowRight size={18} />
      </button>
    </div>
  );
}

// ── Step 2 — Business Setup ───────────────────────────────────────────────────
function StepBusinessSetup({ userId, onNext }) {
  const [businessName, setBusinessName] = useState('');
  const [googleReviewsUrl, setGoogleReviewsUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!businessName.trim()) { setError('Please enter your business name'); return; }
    if (!googleReviewsUrl.trim()) { setError('Please enter your Google Reviews URL'); return; }
    setError('');
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', userId), {
        businessName: businessName.trim(),
        googleReviewsUrl: googleReviewsUrl.trim(),
      }, { merge: true });
      onNext({ businessName: businessName.trim(), googleReviewsUrl: googleReviewsUrl.trim() });
    } catch {
      setError('Failed to save — please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center mb-2">
        <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🏪</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Set up your business</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Your customers will see your business name when they scan your QR code.
        </p>
      </div>

      <div>
        <label className="label">Business Name *</label>
        <input
          className="input-field"
          value={businessName}
          onChange={e => { setBusinessName(e.target.value); setError(''); }}
          placeholder="Riviera Auto Spa"
          autoFocus
        />
      </div>

      <div>
        <label className="label">Google Reviews URL *</label>
        <input
          className="input-field"
          value={googleReviewsUrl}
          onChange={e => { setGoogleReviewsUrl(e.target.value); setError(''); }}
          placeholder="https://g.page/r/YOUR_BUSINESS_ID/review"
        />
        <p className="text-slate-400 text-xs mt-1.5">
          Find this in Google Business Profile → Get more reviews
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <button onClick={handleSave} disabled={saving} className="btn-primary justify-center py-4 disabled:opacity-60">
        {saving ? <><Loader2 size={18} className="animate-spin" /> Saving…</> : <>Save & Continue <ArrowRight size={18} /></>}
      </button>
    </div>
  );
}

// ── Step 3 — QR Code ──────────────────────────────────────────────────────────
function StepQRCode({ userId, businessName, onNext }) {
  const registerUrl = `${window.location.origin}/register/${userId}`;
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(registerUrl, {
      width: 180,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then(url => {
      if (active) setQrUrl(url);
    });
    return () => { active = false; };
  }, [registerUrl]);

  const handleDownload = useCallback(() => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.href     = qrUrl;
    link.download = 'starvis-qr-code.png';
    link.click();
  }, [qrUrl]);

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div>
        <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📱</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Your QR Code is ready!</h2>
        <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
          Print this QR code and show it to customers after each service. They scan it, enter their number, and you get a review.
        </p>
      </div>

      <div className="bg-white border-2 border-sky-100 rounded-2xl p-5 shadow-sm">
        {qrUrl ? (
          <img src={qrUrl} alt="Customer registration QR code" className="h-[180px] w-[180px]" />
        ) : (
          <div className="h-[180px] w-[180px] rounded-xl bg-slate-100 animate-pulse" />
        )}
      </div>

      {businessName && (
        <p className="text-slate-500 text-sm font-medium">{businessName}</p>
      )}

      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={handleDownload}
          disabled={!qrUrl}
          className="flex items-center justify-center gap-2 border-2 border-sky-500 text-sky-500 font-semibold py-3 rounded-xl hover:bg-sky-50 transition-colors"
        >
          <Download size={18} /> Download QR Code (.png)
        </button>
        <button onClick={onNext} className="btn-primary justify-center py-3.5">
          Got it <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ── Step 4 — All Done ─────────────────────────────────────────────────────────
function StepDone({ onFinish, finishing }) {
  return (
    <div className="relative flex flex-col items-center text-center gap-6 py-4">
      <Confetti />

      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
        <Check size={44} className="text-green-500" strokeWidth={3} />
      </div>

      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3">You're all set! 🎉</h2>
        <p className="text-slate-500 text-base leading-relaxed max-w-sm">
          Your first review request can be sent as soon as a customer scans your QR code.
          Start collecting 5-star reviews today!
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {[['📱', 'Customer scans QR'], ['⭐', 'Rates experience'], ['🚀', 'Review posted']].map(([icon, label]) => (
          <div key={label} className="bg-sky-50 rounded-xl p-3 flex flex-col items-center gap-1">
            <span className="text-2xl">{icon}</span>
            <span className="text-slate-600 text-xs font-medium leading-tight">{label}</span>
          </div>
        ))}
      </div>

      <button onClick={onFinish} disabled={finishing} className="btn-primary px-8 py-3.5 text-base mt-2 disabled:opacity-60">
        {finishing ? <><Loader2 size={18} className="animate-spin" /> Setting up…</> : 'Go to Dashboard →'}
      </button>
    </div>
  );
}

// ── Progress dots ─────────────────────────────────────────────────────────────
function ProgressDots({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current ? 'w-6 h-2.5 bg-sky-500' : i < current ? 'w-2.5 h-2.5 bg-sky-300' : 'w-2.5 h-2.5 bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

// ── Main OnboardingModal ───────────────────────────────────────────────────────
export default function OnboardingModal({ onComplete }) {
  const { user } = useAuth();
  const [step, setStep]           = useState(0);
  const [businessData, setBizData] = useState({});
  const [finishing, setFinishing]  = useState(false);

  const handleBizSave = (data) => {
    setBizData(data);
    setStep(2);
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { onboardingComplete: true }, { merge: true });
      onComplete();
    } catch {
      // Even if write fails, let them through
      onComplete();
    }
  };

  const STEPS = 4;

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <ProgressDots current={step} total={STEPS} />

          {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
          {step === 1 && <StepBusinessSetup userId={user.uid} onNext={handleBizSave} />}
          {step === 2 && (
            <StepQRCode
              userId={user.uid}
              businessName={businessData.businessName}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && <StepDone onFinish={handleFinish} finishing={finishing} />}
        </div>
      </div>
    </div>
  );
}
