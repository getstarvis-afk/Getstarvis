import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, CheckCircle2, AlertTriangle, Loader2, Mail } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import Footer from '../components/Footer';

const SERVER_URL = (import.meta.env.VITE_SMS_SERVER_URL || 'https://starflow-production-0a94.up.railway.app').replace(/\/$/, '');

const SUBJECTS = [
  'Billing question',
  'SMS not sending',
  'Review funnel issue',
  'Account access',
  'Feature request',
  'Other',
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', company: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Please enter a valid email address.';
    if (!form.subject.trim()) e.subject = 'Please select a subject.';
    if (!form.message.trim()) e.message = 'Message is required.';
    else if (form.message.trim().length < 10) e.message = 'Message must be at least 10 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    setResult(null);
    setErrorMsg('');
    try {
      const res = await fetch(`${SERVER_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          company: form.company.trim(),
          email: form.email.trim(),
          subject: form.subject,
          message: form.message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setResult('success');
    } catch (err) {
      setResult('error');
      setErrorMsg(err.message || '');
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({ label, required, error, children }) => (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-300">
        {label}{required && <span className="ml-0.5 text-rose-400">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
    </div>
  );

  const inputCls = (hasError) =>
    `w-full rounded-xl border bg-white/10 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-1 ${
      hasError
        ? 'border-rose-500/60 focus:border-rose-400 focus:ring-rose-400'
        : 'border-white/20 focus:border-sky-500 focus:ring-sky-500'
    }`;

  return (
    <div className="min-h-screen bg-[#081120] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-[radial-gradient(circle_at_30%_0%,rgba(30,167,255,0.22),transparent_34%),radial-gradient(circle_at_70%_10%,rgba(123,77,255,0.14),transparent_32%)]" />

      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
        <BrandLogo to="/" size="md" dark />
        <Link
          to="/"
          className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-sky-300 hover:text-white"
        >
          Back to Starvis
        </Link>
      </header>

      <main className="relative mx-auto max-w-2xl px-4 pb-24 pt-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/20">
            <Mail size={26} className="text-sky-400" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-sky-400">Get in touch</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Contact Us</h1>
          <p className="mt-3 text-slate-400">
            Questions about billing, SMS delivery, or your review workflow? We're here to help.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-8">
          {result === 'success' ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <CheckCircle2 size={52} className="text-emerald-400" />
              <h2 className="text-xl font-bold">Message sent!</h2>
              <p className="max-w-sm text-slate-400">
                Your message has been sent successfully. We'll get back to you at{' '}
                <span className="font-semibold text-slate-200">{form.email}</span> as soon as possible.
              </p>
              <button
                onClick={() => {
                  setResult(null);
                  setForm({ name: '', company: '', email: '', subject: '', message: '' });
                }}
                className="mt-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" required error={errors.name}>
                  <input
                    className={inputCls(!!errors.name)}
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={e => { set('name', e.target.value); setErrors(er => ({ ...er, name: '' })); }}
                  />
                </Field>
                <Field label="Company">
                  <input
                    className={inputCls(false)}
                    placeholder="Riviera Auto Spa (optional)"
                    value={form.company}
                    onChange={e => set('company', e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Email" required error={errors.email}>
                <input
                  type="email"
                  className={inputCls(!!errors.email)}
                  placeholder="jane@yourbusiness.com"
                  value={form.email}
                  onChange={e => { set('email', e.target.value); setErrors(er => ({ ...er, email: '' })); }}
                />
              </Field>

              <Field label="Subject" required error={errors.subject}>
                <select
                  className={`${inputCls(!!errors.subject)} appearance-none`}
                  value={form.subject}
                  onChange={e => { set('subject', e.target.value); setErrors(er => ({ ...er, subject: '' })); }}
                >
                  <option value="" disabled>Select a subject…</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Message" required error={errors.message}>
                <textarea
                  rows={5}
                  className={`${inputCls(!!errors.message)} resize-none`}
                  placeholder="Describe your question or issue in as much detail as possible…"
                  value={form.message}
                  onChange={e => { set('message', e.target.value); setErrors(er => ({ ...er, message: '' })); }}
                />
                <p className="mt-1 text-right text-[11px] text-slate-500">{form.message.length}/2000</p>
              </Field>

              {result === 'error' && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>
                    We couldn't send your message. Please try again or email us directly at{' '}
                    <a href="mailto:contact@alioapp.fr" className="font-semibold underline hover:text-rose-200">
                      contact@alioapp.fr
                    </a>.
                    {errorMsg ? ` (${errorMsg})` : ''}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 font-bold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {submitting ? 'Sending…' : 'Send Message'}
              </button>

              <p className="text-center text-xs text-slate-500">
                Or email us directly at{' '}
                <a href="mailto:contact@alioapp.fr" className="text-sky-400 hover:underline">
                  contact@alioapp.fr
                </a>
                . Starvis is a product by Alio.
              </p>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
