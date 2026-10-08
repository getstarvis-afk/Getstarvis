import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../context/useAuth';
import { ensureDemoAccount } from '../services/demoSeed';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ArrowRight, LockKeyhole, ShieldCheck, Sparkles, Star } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

// ── Shake on error — CSS-only, no framer-motion ───────────────────────────────
function useShake() {
  const ref = useRef(null);
  const shake = useCallback(() => {
    if (!ref.current) return;
    ref.current.classList.remove('shake');
    void ref.current.offsetWidth; // force reflow
    ref.current.classList.add('shake');
    ref.current.addEventListener('animationend',
      () => ref.current?.classList.remove('shake'),
      { once: true },
    );
  }, []);
  return [ref, shake];
}

const ERROR_MESSAGES = {
  'auth/user-not-found':       'No account found with this email',
  'auth/wrong-password':       'Incorrect password — try again',
  'auth/email-already-in-use': 'This email is already registered',
  'auth/weak-password':        'Password must be at least 6 characters',
  'auth/invalid-credential':   'Invalid email or password',
  'auth/too-many-requests':    'Too many attempts — please wait a moment',
};

export default function Auth({ mode: initialMode }) {
  const [mode, setMode]         = useState(initialMode || 'login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const planRedirectRef = useRef(false);
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [formRef, shake] = useShake();

  useEffect(() => {
    if (!user) return;
    navigate(planRedirectRef.current ? '/choose-plan' : '/dashboard');
  }, [user, navigate]);

  const switchMode = (newMode) => {
    if (newMode !== mode) setMode(newMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'signup' && !agreed) {
      shake();
      toast.error('Please agree to the Terms of Service');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await ensureDemoAccount(credential.user);
        toast.success('Welcome back!');
      } else {
        planRedirectRef.current = true;
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await ensureDemoAccount(credential.user);
        toast.success('Account created! Welcome to Starvis.');
        navigate('/choose-plan');
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      shake();
      toast.error(ERROR_MESSAGES[err.code] || 'Authentication failed — check your Firebase config.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureDemoAccount(credential.user);
      toast.success('Welcome to Starvis.');
      navigate('/dashboard');
    } catch {
      toast.error('Google sign-in failed — check your Firebase config.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      toast.error('Enter your email address first.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      toast.success('Password reset email sent.');
    } catch {
      toast.error('Could not send password reset email.');
    }
  };

  return (
    <div className="min-h-screen bg-[#081120] px-4 py-6 font-sans text-white flex items-center justify-center relative overflow-hidden sm:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(30,167,255,0.22),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(123,77,255,0.2),transparent_30%)]" />
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur lg:grid-cols-[1fr_0.92fr]">
        <motion.aside
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="hidden min-h-[680px] flex-col justify-between bg-[radial-gradient(circle_at_10%_10%,rgba(30,167,255,0.24),transparent_32%),linear-gradient(145deg,#081120,#0B1020)] p-10 lg:flex"
        >
          <BrandLogo to="/" size="lg" dark />
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-200">
              <LockKeyhole size={14} /> Secure workspace
            </p>
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
              Premium review automation for serious local brands.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              Sign in to manage SMS requests, QR registrations, realtime statuses, and reputation analytics.
            </p>
            <div className="mt-8 grid gap-3">
              {[
                [ShieldCheck, 'Firebase Auth protected dashboard'],
                [Sparkles, 'Realtime SMS and review workflow'],
                [Star, 'Trusted SaaS experience for operators'],
              ].map(([Icon, text]) => (
                <div key={text} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200">
                  <Icon size={18} className="text-sky-300" />
                  {text}
                </div>
              ))}
            </div>
          </div>
          <blockquote className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
            "The QR flow made review collection way easier, and the dashboard finally gives our team one place to track follow-up."
            <footer className="mt-3 font-bold text-white">Riviera Auto Spa</footer>
          </blockquote>
        </motion.aside>

        <main className="relative w-full px-4 py-6 sm:px-8 sm:py-10 lg:px-10">
          <div className="mb-7 flex justify-center lg:hidden">
            <BrandLogo to="/" size="lg" dark />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42 }}
            className="relative mx-auto max-w-md rounded-2xl border border-white/20 bg-white/95 p-5 text-slate-950 shadow-2xl shadow-black/30 backdrop-blur sm:p-8"
          >
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-500">Starvis account</p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
              {mode === 'login' ? 'Welcome back' : 'Create your workspace'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'login' ? 'Securely sign in to your dashboard.' : 'Start with a 14-day free trial after plan selection.'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150
                          ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150
                          ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign Up
            </button>
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3
                       text-sm font-semibold text-slate-700 hover:border-sky-300 hover:bg-sky-50
                       transition-all duration-150 mb-5 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin text-sky-500" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoading ? 'Connecting…' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-slate-400 text-xs font-medium">or with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Form — shake ref applied here for error animation */}
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@business.com"
                className="input-field"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                  className="input-field pr-10"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="text-right -mt-1">
                <button type="button" onClick={handlePasswordReset} className="text-sky-500 text-sm hover:underline font-medium">
                  Forgot password?
                </button>
              </div>
            )}

            {mode === 'signup' && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-sky-500"
                />
                <span className="text-sm text-slate-500">
                  I agree to the{' '}
                  <Link to="/terms" className="text-sky-500 hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-sky-500 hover:underline">Privacy Policy</Link>
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary justify-center py-3.5 mt-1 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" />{mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
                : <>{mode === 'login' ? 'Sign In' : 'Create Account'}<ArrowRight size={17} /></>
              }
            </button>
          </form>
          </motion.div>

        <p className="relative text-center text-slate-300 text-sm mt-6">
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button onClick={() => switchMode('signup')} className="text-sky-300 font-medium hover:underline">Sign up free</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => switchMode('login')} className="text-sky-300 font-medium hover:underline">Sign in</button>
            </>
          )}
        </p>

        </main>
      </div>
    </div>
  );
}
