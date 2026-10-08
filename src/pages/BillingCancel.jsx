import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

export default function BillingCancel() {
  return (
    <div className="min-h-screen bg-[#081120] px-4 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(123,77,255,0.22),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(30,167,255,0.18),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center text-center">
        <BrandLogo to="/" size="lg" dark />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42 }}
          className="mt-10 w-full rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-black/25 backdrop-blur sm:p-12"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-400/15 text-amber-200">
            <CreditCard size={42} />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Checkout canceled</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Choose another plan</h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            No charge was completed. You can choose a different plan or return to the Starvis homepage.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/choose-plan" className="btn-primary justify-center px-7 py-3.5">
              Choose another plan
            </Link>
            <Link to="/" className="btn-dark-outline justify-center px-7 py-3.5">
              <ArrowLeft size={18} />
              Return Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
