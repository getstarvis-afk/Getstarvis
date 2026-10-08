import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast, { Toaster } from 'react-hot-toast';
import { User, Phone, Send, CheckCircle, Loader2, Star, AlertCircle } from 'lucide-react';
import { buildReviewRequestMessage, queueReviewRequest } from '../services/reviewRequests';

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Loading…</span>
      </div>
    </div>
  );
}

function BusinessNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-white px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={28} className="text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Business not found</h2>
        <p className="text-slate-500 text-sm">This QR code link appears to be invalid or expired.</p>
      </div>
    </div>
  );
}

function SuccessScreen({ firstName, smsStatus }) {
  const message = {
    sending: 'You are registered. We are sending your feedback link by SMS now.',
    sent: 'We sent you a text message with a link to share your feedback. It only takes 10 seconds!',
    failed: 'You are registered. We could not send the SMS, so please ask the business to resend it.',
  }[smsStatus] || 'You are registered. We are preparing your feedback link.';

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle size={42} className="text-green-500" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
        Thanks{firstName ? `, ${firstName}` : ''}! 🎉
      </h2>
      <p className="text-slate-500 text-sm leading-relaxed mb-6">
        {message}
      </p>
      <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
        <p className="text-sky-700 text-sm font-semibold">📱 Check your messages</p>
        <p className="text-sky-500 text-xs mt-0.5">Your feedback means a lot to us.</p>
      </div>
    </div>
  );
}

export default function Register() {
  const { businessId } = useParams();
  const [business, setBusiness]     = useState(null);
  const [notFound, setNotFound]     = useState(false);
  const [loadingBiz, setLoadingBiz] = useState(true);
  const [form, setForm]             = useState({ firstName: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [smsStatus, setSmsStatus]   = useState('idle');

  useEffect(() => {
    if (!businessId) {
      queueMicrotask(() => {
        setNotFound(true);
        setLoadingBiz(false);
      });
      return;
    }
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', businessId));
        snap.exists() ? setBusiness(snap.data()) : setNotFound(true);
      } catch {
        setBusiness({ businessName: 'This Business' });
      } finally {
        setLoadingBiz(false);
      }
    };
    load();
  }, [businessId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const firstName = form.firstName.trim();
    const phone     = form.phone.trim();
    if (!firstName || !phone) { toast.error('Please fill in all fields'); return; }

    setSubmitting(true);
    try {
      const customerRef = await addDoc(collection(db, 'users', businessId, 'customers'), {
        name: firstName, phone, source: 'qr_scan', smsSent: false,
        createdAt: serverTimestamp(),
      });

      const reviewLink = business?.googleReviewsUrl
        || `${window.location.origin}/review/${businessId}`;
      const smsMessage = buildReviewRequestMessage({
        firstName,
        businessName: business?.businessName || 'Our Team',
        googleReviewLink: reviewLink,
      });

      setSubmitted(true);
      setSubmitting(false);
      setSmsStatus('sending');

      void queueReviewRequest({
        customerRef: doc(db, 'users', businessId, 'customers', customerRef.id),
        businessId,
        customerPhone: phone,
        businessName: business?.businessName || 'Our Team',
        googleReviewLink: reviewLink,
        firstName,
        message: smsMessage,
      }).then((result) => {
        if (!result.ok) {
          setSmsStatus('failed');
          toast.error('Registration saved, but SMS failed.');
        } else {
          setSmsStatus('sent');
          toast.success('SMS sent successfully.');
        }
      });
    } catch (err) {
      console.error('Register submit error:', err);
      toast.error('Something went wrong — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingBiz) return <PageLoader />;
  if (notFound)   return <BusinessNotFound />;

  const bizName = business?.businessName || 'How was your experience?';

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center px-4 py-12 font-sans">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px' } }} />

      <div className="w-full max-w-md">
        {submitted ? (
          <SuccessScreen firstName={form.firstName.trim()} smsStatus={smsStatus} />
        ) : (
          <div>
            {/* Business header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-200">
                <Star size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-1.5">{bizName}</h1>
              <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                Enter your details and we'll send you a quick link to share your experience.
              </p>
            </div>

            {/* Form card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="label">First Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text" required value={form.firstName} autoFocus
                      onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      placeholder="John" className="input-field pl-10" autoComplete="given-name"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="tel" required value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+1 (555) 000-0000" className="input-field pl-10" autoComplete="tel"
                    />
                  </div>
                  <p className="text-slate-400 text-xs mt-1.5">We'll only send you one text message.</p>
                </div>

                <button
                  type="submit" disabled={submitting}
                  className="btn-primary justify-center py-4 mt-1 text-base disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? <><Loader2 size={18} className="animate-spin" /> Sending…</>
                    : <><Send size={18} /> Send My Feedback</>
                  }
                </button>
              </form>
              <p className="text-center text-slate-400 text-xs mt-5 leading-relaxed">
                By submitting, you agree to receive one SMS. Standard message rates may apply.
              </p>
            </div>

            <div className="text-center mt-6">
              <a href="/" className="text-slate-400 text-xs hover:text-sky-500 transition-colors inline-flex items-center gap-1">
                Powered by Starvis
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
