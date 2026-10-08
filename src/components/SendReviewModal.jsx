import { useMemo, useRef, useState } from 'react';
import { X, Send, AlertTriangle, CheckCircle2, Link2 } from 'lucide-react';
import { DEFAULT_REVIEW_SMS_TEMPLATE, renderReviewTemplate } from '../services/reviewRequests';

const VARIABLES = ['{{firstName}}', '{{fullName}}', '{{businessName}}', '{{reviewLink}}'];

function InfoCell({ label, value, tone = 'text-slate-800', icon = null }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`flex items-center gap-1 font-semibold ${tone}`}>{icon}{value}</p>
    </div>
  );
}

// Approximate GSM-7 alphabet (default + common extended chars). Used only for a
// rough SMS segment estimate shown in the UI — not for validation.
const GSM7 =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà€^{}\\[~]|';

function estimateSegments(text) {
  if (!text) return 0;
  let isGsm = true;
  for (const ch of text) {
    if (!GSM7.includes(ch)) { isGsm = false; break; }
  }
  const single = isGsm ? 160 : 70;
  const multi = isGsm ? 153 : 67;
  return text.length <= single ? 1 : Math.ceil(text.length / multi);
}

export default function SendReviewModal({
  customer,
  businessName,
  businessNameSet = true,
  reviewLink,
  hasGoogleReviewUrl = false,
  defaultTemplate,
  onClose,
  onConfirm,
}) {
  const [template, setTemplate] = useState(defaultTemplate || DEFAULT_REVIEW_SMS_TEMPLATE);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  const firstName = (customer?.firstName || '').trim() || 'there';
  const fullName = [customer?.firstName, customer?.lastName].filter(Boolean).join(' ').trim() || firstName;
  const phone = (customer?.phone || '').trim();

  const finalMessage = useMemo(
    () => renderReviewTemplate(template, { firstName, fullName, businessName, reviewLink }),
    [template, firstName, fullName, businessName, reviewLink],
  );

  if (!customer) return null;

  const charCount = finalMessage.length;
  const segments = estimateSegments(finalMessage);
  const businessNameMissing = !businessNameSet;

  const insertVariable = (token) => {
    const el = textareaRef.current;
    setError('');
    if (!el) { setTemplate(t => `${t}${token}`); return; }
    const start = el.selectionStart ?? template.length;
    const end = el.selectionEnd ?? template.length;
    setTemplate(template.slice(0, start) + token + template.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!template.trim() || !finalMessage.trim()) {
      setError('Message cannot be empty.');
      return;
    }
    if (!reviewLink) {
      setError('A review link is required. Add your Google Reviews URL in Settings.');
      return;
    }
    if (!phone) {
      setError('A customer phone number is required.');
      return;
    }
    onConfirm(finalMessage, template.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081120]/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-950/30 w-full max-w-xl max-h-[90vh] overflow-y-auto border border-sky-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Send Review Request</h2>
            <p className="text-xs text-slate-400 mt-1">Review and customize the message before it's sent.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoCell label="Customer" value={fullName} />
            <InfoCell label="Phone" value={phone || 'Missing'} tone={phone ? 'text-slate-800' : 'text-rose-600'} />
            <InfoCell label="Business" value={businessName || 'Not set'} tone={businessNameMissing ? 'text-amber-600' : 'text-slate-800'} />
            <InfoCell
              label="Google Review URL"
              value={hasGoogleReviewUrl ? 'Connected' : 'Fallback link'}
              tone={hasGoogleReviewUrl ? 'text-emerald-600' : 'text-amber-600'}
              icon={hasGoogleReviewUrl ? <CheckCircle2 size={13} /> : <Link2 size={13} />}
            />
          </div>

          <div>
            <label className="label">SMS message</label>
            <textarea
              ref={textareaRef}
              className="input-field resize-none min-h-[130px] text-sm"
              rows={5}
              value={template}
              onChange={e => { setTemplate(e.target.value); setError(''); }}
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400">Insert variable:</span>
              {VARIABLES.map(token => (
                <button
                  key={token}
                  type="button"
                  onClick={() => insertVariable(token)}
                  className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100 transition-colors"
                >
                  {token}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{charCount} characters</span>
            <span>~{segments} SMS segment{segments === 1 ? '' : 's'}</span>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800 mb-1">Preview of final SMS</p>
            <p className="leading-relaxed whitespace-pre-wrap break-words">{finalMessage || '—'}</p>
          </div>

          {businessNameMissing && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
              <span>Your business name isn't set, so the SMS uses a generic name. Add it in Settings for a more trustworthy message.</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <p className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-800">
            Message and data rates may apply. Reply STOP to opt out.
          </p>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border-2 border-gray-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!phone || !reviewLink || !finalMessage.trim()}
              className="flex-1 btn-primary justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed">
              <Send size={18} />
              Send SMS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
