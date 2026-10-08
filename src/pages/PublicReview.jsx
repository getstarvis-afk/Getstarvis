import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ExternalLink, Loader2, CheckCircle, Send, Lock } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Okay', 'Great', 'Excellent!'];

export default function PublicReview() {
  const { requestId } = useParams();
  // phase: loading | invalid | form | google | private | done
  const [phaseState, setPhaseState] = useState(() => ({
    requestId,
    phase: requestId ? 'loading' : 'invalid',
  }));
  const phase = phaseState.requestId === requestId
    ? phaseState.phase
    : requestId ? 'loading' : 'invalid';
  const setPhase = useCallback(
    nextPhase => setPhaseState({ requestId, phase: nextPhase }),
    [requestId],
  );
  const [req, setReq] = useState(null);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!requestId) return undefined;
    let active = true;
    (async () => {
      try {
        const ref = doc(db, 'reviewRequests', requestId);
        const snap = await getDoc(ref);
        if (!active) return;
        if (!snap.exists()) { setPhase('invalid'); return; }
        const data = snap.data();
        setReq(data);
        if (data.status === 'submitted') { setPhase('done'); return; }
        setPhase('form');
        // Mark opened (best-effort; never blocks the customer).
        if (data.status === 'sent') {
          updateDoc(ref, { status: 'opened', openedAt: serverTimestamp() }).catch(() => {});
        }
      } catch {
        if (active) setPhase('invalid');
      }
    })();
    return () => { active = false; };
  }, [requestId, setPhase]);

  const handleSubmit = async () => {
    if (rating < 1) { setError('Please select a star rating.'); return; }
    if (submitting || !req) return;
    setSubmitting(true);
    setError('');
    const channel = rating >= 4 ? 'google_ready' : 'private_ticket';
    const ownerUid = req.ownerUid;
    try {
      // Doc id === requestId guarantees one review per request (duplicate guard).
      await setDoc(doc(db, 'users', ownerUid, 'reviews', requestId), {
        requestId,
        businessId: req.businessId || ownerUid,
        ownerUid,
        customerId: req.customerId || '',
        customerName: req.customerName || 'Anonymous',
        rating,
        comment: comment.trim(),
        feedback: comment.trim(),
        channel,
        type: rating >= 4 ? 'positive' : 'negative',
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'reviewRequests', requestId), {
        status: 'submitted',
        submittedAt: serverTimestamp(),
      }).catch(() => {});
      setPhase(rating >= 4 ? 'google' : 'private');
    } catch {
      setError('Could not submit your feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const businessName = req?.businessName || 'this business';
  let content;

  if (phase === 'loading') {
    content = (
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center">
        <Loader2 className="animate-spin text-sky-500 mx-auto" size={32} />
      </div>
    );
  } else if (phase === 'invalid') {
    content = (
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Link not found</h1>
        <p className="text-slate-500">This review link is invalid or has expired.</p>
      </div>
    );
  } else if (phase === 'done') {
    content = (
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        <CheckCircle className="mx-auto text-green-500 mb-5" size={56} />
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">We've got your feedback</h2>
        <p className="text-slate-500">This review request has already been completed. Thank you!</p>
      </div>
    );
  } else if (phase === 'google') {
    content = (
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="text-6xl mb-5">🎉</div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Thank you so much!</h2>
        <p className="text-slate-500 mb-2">You rated {businessName} {'⭐'.repeat(rating)}</p>
        <p className="text-slate-400 text-sm mb-8">Would you mind sharing it on Google? It takes 30 seconds and helps us a lot.</p>
        {req?.googleReviewUrl ? (
          <a
            href={req.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-base py-4 px-8 justify-center w-full inline-flex"
          >
            <ExternalLink size={20} />
            Leave your review on Google
          </a>
        ) : (
          <p className="text-slate-400 text-sm">Thanks again for your support! 🙏</p>
        )}
      </div>
    );
  } else if (phase === 'private') {
    content = (
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        <CheckCircle className="mx-auto text-green-500 mb-5" size={56} />
        <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Thank you for your feedback</h2>
        <p className="text-slate-500">
          It goes directly to the {businessName} team — privately — so they can make things right. 🙏
        </p>
      </div>
    );
  } else {
    content = (
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">🏪</div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">{businessName}</h1>
        <p className="text-slate-500 mb-7">How was your experience?</p>

        <div className="flex justify-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => { setRating(star); setError(''); }}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-5xl sm:text-6xl transition-transform hover:scale-110 focus:outline-none select-none"
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              {star <= (hovered || rating) ? '⭐' : '☆'}
            </button>
          ))}
        </div>
        <p className="text-slate-400 text-sm mb-6 h-5">
          {(hovered || rating) ? RATING_LABELS[hovered || rating] : 'Tap a star to rate'}
        </p>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
          maxLength={1000}
          className="input-field resize-none text-left mb-2"
          placeholder="Add a comment (optional)"
        />

        <p className="flex items-center justify-center gap-1.5 text-slate-400 text-xs mb-2">
          <Lock size={12} /> Your feedback is private until you choose to post it publicly.
        </p>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary w-full justify-center py-4 mt-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {submitting ? 'Submitting...' : 'Submit feedback'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-50 flex items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo to="/" size="sm" />
        </div>
        {content}
        <p className="text-center text-slate-300 text-xs mt-6">Powered by Starvis</p>
      </div>
    </div>
  );
}
