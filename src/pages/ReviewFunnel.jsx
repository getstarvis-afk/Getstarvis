import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ExternalLink, Send, Loader2, CheckCircle } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

// Simple confetti component
function Confetti() {
  return <div className="fixed inset-0 pointer-events-none overflow-hidden z-10" />;
}

function StarButton({ star, selected, hovered, onClick, onHover, onLeave }) {
  const filled = star <= (hovered || selected);
  return (
    <button
      onClick={() => onClick(star)}
      onMouseEnter={() => onHover(star)}
      onMouseLeave={onLeave}
      className="text-5xl sm:text-6xl transition-all duration-150 focus:outline-none select-none"
      aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
    >
      {filled ? '⭐' : '☆'}
    </button>
  );
}

export default function ReviewFunnel() {
  const { businessId } = useParams();
  const [business, setBusiness] = useState({ name: 'This Business', googleReviewsUrl: '' });
  const [step, setStep] = useState('rating'); // 'rating' | 'positive' | 'negative' | 'submitted'
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', businessId));
        if (snap.exists()) {
          const d = snap.data();
          setBusiness({
            name: d.businessName || 'This Business',
            googleReviewsUrl: d.googleReviewsUrl || '',
          });
        }
      } catch {
        // Firebase not configured — use defaults
      }
    };
    load();
  }, [businessId]);

  const handleRating = async (star) => {
    setRating(star);
    if (star >= 4) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      // Save to Firestore
      try {
        await addDoc(collection(db, 'users', businessId, 'reviews'), {
          rating: star,
          type: 'positive',
          createdAt: serverTimestamp(),
        });
      } catch {
        // Keep the customer-facing flow moving even if analytics logging fails.
      }
      setStep('positive');
    } else {
      setStep('negative');
    }
  };

  const handleFeedbackSubmit = async () => {
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'users', businessId, 'reviews'), {
        rating,
        feedback,
        type: 'negative',
        createdAt: serverTimestamp(),
      });
    } catch {
      // Keep the customer-facing flow moving even if analytics logging fails.
    }
    await new Promise(r => setTimeout(r, 800));
    setSubmitting(false);
    setStep('submitted');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-50 flex items-center justify-center px-4 font-sans">
      {showConfetti && <Confetti />}

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <BrandLogo to="/" size="sm" />
        </div>

        <>
          {/* STEP 1: Rating */}
          {step === 'rating' && (
            <div
              key="rating"
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center"
            >
              <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">
                🏪
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-2">{business.name}</h1>
              <p className="text-slate-500 mb-8">How was your experience with us?</p>

              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map(star => (
                  <StarButton
                    key={star}
                    star={star}
                    selected={rating}
                    hovered={hovered}
                    onClick={handleRating}
                    onHover={setHovered}
                    onLeave={() => setHovered(0)}
                  />
                ))}
              </div>

              <p className="text-slate-400 text-sm">
                {hovered > 0
                  ? ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][hovered]
                  : 'Tap a star to rate your experience'}
              </p>
            </div>
          )}

          {/* STEP 2A: Positive (4-5 stars) */}
          {step === 'positive' && (
            <div
              key="positive"
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center"
            >
              <div
                className="text-6xl mb-5"
              >
                🎉
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
                We're so glad you had a great experience!
              </h2>
              <p className="text-slate-500 mb-2">
                You gave us <strong>{'⭐'.repeat(rating)}</strong>
              </p>
              <p className="text-slate-400 text-sm mb-8">
                It only takes 30 seconds and helps us so much!
              </p>

              <a
                href={business.googleReviewsUrl || 'https://business.google.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-base py-4 px-8 justify-center w-full inline-flex"
              >
                <ExternalLink size={20} />
                Leave a Google Review
              </a>

              <p className="text-slate-400 text-xs mt-5">
                Your review helps other customers find us. Thank you! 🙏
              </p>
            </div>
          )}

          {/* STEP 2B: Negative (1-3 stars) */}
          {step === 'negative' && (
            <div
              key="negative"
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center"
            >
              <div className="text-5xl mb-5">😔</div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
                We're sorry to hear that.
              </h2>
              <p className="text-slate-500 mb-6">We'd love to make it right. What went wrong?</p>

              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                className="input-field resize-none text-left mb-5"
                rows={4}
                placeholder="Tell us what went wrong..."
              />

              <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mb-6 text-left">
                <p className="text-orange-700 text-sm">
                  🔒 Your feedback goes directly to our team — <strong>not public</strong>.
                </p>
              </div>

              <button
                onClick={handleFeedbackSubmit}
                disabled={submitting || !feedback.trim()}
                className="btn-primary w-full justify-center py-4 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          )}

          {/* STEP 3: Submitted */}
          {step === 'submitted' && (
            <div
              key="submitted"
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center"
            >
              <div
              >
                <CheckCircle className="mx-auto text-green-500 mb-5" size={64} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
                Thank you for your feedback!
              </h2>
              <p className="text-slate-500 text-lg">
                We'll be in touch shortly to make things right. 🙏
              </p>
              <p className="text-slate-400 text-sm mt-4">
                We take every piece of feedback seriously and are committed to improving.
              </p>
            </div>
          )}
        </>

        <p className="text-center text-slate-300 text-xs mt-6">
          Powered by Starvis
        </p>
      </div>
    </div>
  );
}
