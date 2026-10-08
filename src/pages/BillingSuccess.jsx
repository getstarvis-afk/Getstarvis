import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/useAuth';
import { syncStripeSubscription } from '../services/stripeBilling';
import BrandLogo from '../components/BrandLogo';

export default function BillingSuccess() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activating, setActivating] = useState(true);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;

    const syncBilling = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        const billing = snap.data()?.billing;

        if (!billing?.plan) {
          throw new Error('No billing plan was selected.');
        }

        await setDoc(userRef, {
          billing: {
            checkoutReturnedAt: serverTimestamp(),
            checkoutSyncState: 'waiting_for_stripe_webhook',
          },
        }, { merge: true });

        const idToken = await user.getIdToken();
        let lastError = null;

        for (let attempt = 1; attempt <= 6; attempt += 1) {
          try {
            const synced = await syncStripeSubscription(idToken);
            if (synced?.subscriptionId || synced?.stripeSubscriptionId) {
              if (!active) return;
              setConfirmed(true);
              toast.success('Your Starvis workspace is now active.');
              setActivating(false);
              setTimeout(() => navigate('/dashboard', { replace: true }), 2500);
              return;
            }
          } catch (err) {
            lastError = err;
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (!active) return;
        setError(lastError?.message || 'Checkout confirmed. Stripe subscription details are still syncing.');
        setActivating(false);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Could not verify billing.');
        setActivating(false);
      }
    };

    syncBilling();
    return () => { active = false; };
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#081120] text-white">
        <Loader2 className="animate-spin text-sky-300" size={32} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-[#081120] px-4 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.22),transparent_30%),radial-gradient(circle_at_80%_15%,rgba(30,167,255,0.18),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center text-center">
        <BrandLogo to="/" size="lg" dark />
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mt-10 w-full rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-black/25 backdrop-blur sm:p-12"
        >
          <motion.div
            initial={{ scale: 0.6, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"
          >
            {activating ? <Loader2 className="animate-spin" size={42} /> : <CheckCircle2 size={46} />}
          </motion.div>

          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Billing confirmed</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {confirmed ? 'Workspace activated' : 'Waiting for Stripe sync'}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            {error
              ? error
              : activating
                ? 'Stripe received your checkout. Starvis is syncing the subscription before activating billing.'
                : confirmed
                  ? 'Your Stripe subscription is synced. Redirecting you to the dashboard.'
                  : 'You can return to the dashboard while Stripe finishes syncing.'}
          </p>

          <Link to="/dashboard" className="btn-primary mt-8 justify-center px-7 py-3.5">
            Go to Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
