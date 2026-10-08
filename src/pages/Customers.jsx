import { useState, useEffect, useRef, useMemo } from 'react';
import {
  collection, addDoc, deleteDoc, getDocs,
  doc, setDoc, serverTimestamp, updateDoc,
  query, orderBy, limit, onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/useAuth';
import { useDashboardData } from '../context/useDashboardData';
import { Plus, Search, Trash2, Send, X, Loader2, UserPlus, Clock, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomerTableSkeleton } from '../components/Skeleton';
import SendReviewModal from '../components/SendReviewModal';
import { buildReviewRequestMessage, queueReviewRequest, SMS_PUBLIC_FAILURE_MESSAGE, DEFAULT_REVIEW_SMS_TEMPLATE } from '../services/reviewRequests';
import { resolveSmsUsage, usageAfterSend } from '../services/smsQuota';

const QUERY_LIMIT = 50;

const INITIAL_FORM = {
  firstName: '', lastName: '', phone: '', email: '',
  serviceType: '', notes: '', sendNow: true,
};

const SMS_TIMEOUT_MS = 30 * 1000;

// ── SMS helper ────────────────────────────────────────────────────────────────
// ── Add Customer Modal ────────────────────────────────────────────────────────
// Calls onSave(form) then closes IMMEDIATELY — no waiting on Firestore.
function AddCustomerModal({ onClose, onSave }) {
  const [form, setForm]   = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.phone.trim()) { setError('Phone number is required for SMS'); return; }
    onSave(form);   // fire-and-forget — parent handles async
    onClose();      // close immediately (optimistic)
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-slate-900">Add New Customer</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input className="input-field" required value={form.firstName}
                onChange={e => set('firstName', e.target.value)} placeholder="John" />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input className="input-field" required value={form.lastName}
                onChange={e => set('lastName', e.target.value)} placeholder="Smith" />
            </div>
          </div>

          <div>
            <label className="label">
              Phone Number * <span className="text-slate-400 font-normal">(required for SMS)</span>
            </label>
            <input className="input-field" required type="tel" value={form.phone}
              onChange={e => { set('phone', e.target.value); setError(''); }}
              placeholder="+1 (555) 000-0000" />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="label">Email <span className="text-slate-400 font-normal">(optional)</span></label>
            <input className="input-field" type="email" value={form.email}
              onChange={e => set('email', e.target.value)} placeholder="john@email.com" />
          </div>

          <div>
            <label className="label">Service Type</label>
            <input className="input-field" value={form.serviceType}
              onChange={e => set('serviceType', e.target.value)}
              placeholder="e.g. Oil Change, Haircut, Plumbing..." />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input-field resize-none" rows={3} value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any notes about this customer or service..." />
          </div>

          {/* Send Now toggle */}
          <label className="flex items-center gap-3 cursor-pointer bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
            <div
              onClick={() => set('sendNow', !form.sendNow)}
              className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${form.sendNow ? 'bg-sky-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.sendNow ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-sm">Send Review Request Now</div>
              <div className="text-slate-400 text-xs">Review request is sent right after the customer is saved</div>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border-2 border-gray-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary justify-center py-3">
              <UserPlus size={18} />
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyCustomers() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" className="mb-5">
        <circle cx="50" cy="50" r="46" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="2"/>
        <circle cx="50" cy="38" r="12" fill="#bae6fd"/>
        <path d="M26 72c0-13.255 10.745-24 24-24s24 10.745 24 24" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="72" cy="38" r="8" fill="#e0f2fe"/>
      </svg>
      <h3 className="text-lg font-bold text-slate-700 mb-2">No customers yet</h3>
      <p className="text-slate-400 text-sm max-w-xs">
        Add your first customer to start collecting reviews!
      </p>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, optimistic, smsError }) {
  if (optimistic) {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-400 flex items-center gap-1 w-fit">
        <Clock size={11} /> Saving…
      </span>
    );
  }
  const map = {
    sending_sms: { label: 'Sending SMS', cls: 'bg-amber-100 text-amber-700' },
    sms_sent: { label: 'SMS Sent', cls: 'bg-blue-100 text-blue-700' },
    sms_failed: { label: 'SMS could not be sent', cls: 'bg-red-100 text-red-700' },
    reviewed:  { label: 'Reviewed', cls: 'bg-green-100 text-green-700' },
    pending:   { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700' },
  };
  const s = map[status] || map.pending;
  return (
    <div className="flex max-w-[240px] flex-col gap-1">
      <span className={`w-fit px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
      {status === 'sms_failed' && (
        <span className="text-xs leading-5 text-slate-500">
          {smsError || SMS_PUBLIC_FAILURE_MESSAGE}
        </span>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Customers() {
  const { user } = useAuth();
  const { settings: bizSettings, saveSettings } = useDashboardData();
  const [customers, setCustomers]     = useState([]);
  const [search, setSearch]           = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [deleting, setDeleting]       = useState(null);
  const [sendModalCustomer, setSendModalCustomer] = useState(null);
  const [sendModalTemplate, setSendModalTemplate] = useState('');
  const [sendModalRequestId, setSendModalRequestId] = useState('');

  // Guard — fetch customers exactly once per session
  const hasFetched = useRef(false);
  const optimisticCounter = useRef(0);
  const customersRef = useRef([]);
  const smsTimeoutsRef = useRef(new Map());
  const toastStatusRef = useRef(new Map());

  // ── Load business settings ──────────────────────────────────────────────────
  // ── Initial fetch — sessionStorage cache for instant reload ───────────────
  useEffect(() => {
    if (!user || hasFetched.current) return undefined;
    hasFetched.current = true;

    const cacheKey = `customers_${user.uid}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        queueMicrotask(() => {
          customersRef.current = parsed;
          setCustomers(parsed);
          setLoading(false);
        });
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }

    const q = query(
      collection(db, 'users', user.uid, 'customers'),
      orderBy('createdAt', 'desc'),
      limit(QUERY_LIMIT),
    );

    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 10000);

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const fresh = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const optimisticRows = customersRef.current.filter(c => c._optimistic);
        const merged = [
          ...optimisticRows,
          ...fresh.filter(row => !optimisticRows.some(opt => opt.id === row.id)),
        ];
        customersRef.current = merged;
        setCustomers(merged);
        sessionStorage.setItem(cacheKey, JSON.stringify(fresh));
        setLoading(false);
      },
      (error) => {
        console.error('Customer snapshot failed:', error);
        toast.error('Could not load customers.');
        setLoading(false);
      },
    );

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
      hasFetched.current = false;
    };
  }, [user]);
  const updateCustomerLocal = (customerId, patch) => {
    setCustomers(current => {
      const next = current.map(c => (c.id === customerId ? { ...c, ...patch } : c));
      customersRef.current = next;
      return next;
    });
  };

  const getDefaultMessage = (customer, reviewLink) => buildReviewRequestMessage({
    firstName: customer.firstName || '',
    businessName: bizSettings.businessName || 'Our Business',
    googleReviewLink: reviewLink || '',
  });

  const getDefaultTemplate = () => bizSettings.reviewSmsTemplate || DEFAULT_REVIEW_SMS_TEMPLATE;

  const handleOpenSendModal = (customer) => {
    // Anti-abuse: max 2 review SMS to the same customer within 24 hours.
    const DAY_MS = 24 * 60 * 60 * 1000;
    const recentSends = (Array.isArray(customer.smsTimestamps) ? customer.smsTimestamps : [])
      .filter(t => Date.now() - t < DAY_MS);
    if (recentSends.length >= 2) {
      toast.error('This customer recently received a review request. Please try again later.');
      return;
    }
    // Monthly SMS quota guard.
    if (resolveSmsUsage(bizSettings.billing, bizSettings.smsUsage).reached) {
      toast.error("You've reached your monthly SMS limit. Upgrade your plan to send more review requests.");
      return;
    }
    setSendModalCustomer(customer);
    setSendModalTemplate(getDefaultTemplate());
    setSendModalRequestId(crypto.randomUUID());
  };

  const handleConfirmSend = async (customer, finalMessage, rawTemplate) => {
    if (!customer?.id) return;

    const requestId = sendModalRequestId || crypto.randomUUID();
    const reviewLink = `${window.location.origin}/r/${requestId}`;
    const customerRef = doc(db, 'users', user.uid, 'customers', customer.id);
    const requestMessage = (finalMessage || '').trim() || getDefaultMessage(customer, reviewLink);

    setSendModalCustomer(null);
    setSendModalTemplate('');
    setSendModalRequestId('');

    // Best-effort: remember the user's last custom template for next time.
    if (rawTemplate && rawTemplate.trim()) {
      saveSettings({ reviewSmsTemplate: rawTemplate.trim() }).catch(() => {});
    }

    toast.loading('Sending review request...', { id: requestId });
    updateCustomerLocal(customer.id, {
      status: 'sending_sms',
      smsRequestId: requestId,
      smsMessage: requestMessage,
      smsError: '',
      smsRequestedAtClient: Date.now(),
    });

    // Create the review request first so the unique /r/{requestId} link resolves
    // the moment the customer opens it.
    try {
      await setDoc(doc(db, 'reviewRequests', requestId), {
        businessId: user.uid,
        ownerUid: user.uid,
        customerId: customer.id,
        customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer',
        businessName: bizSettings.businessName || 'Our Business',
        googleReviewUrl: bizSettings.googleReviewsUrl || '',
        token: crypto.randomUUID(),
        status: 'sent',
        createdAt: serverTimestamp(),
      });
    } catch {
      toast.error('Could not create the review link. Please try again.', { id: requestId });
      updateCustomerLocal(customer.id, {
        status: 'sms_failed',
        smsError: 'Could not create the review link.',
      });
      return;
    }

    // Count this send against the monthly quota and the per-customer 24h window.
    saveSettings({ smsUsage: usageAfterSend(bizSettings.billing, bizSettings.smsUsage) }).catch(() => {});
    const DAY_MS = 24 * 60 * 60 * 1000;
    const recentSends = (Array.isArray(customer.smsTimestamps) ? customer.smsTimestamps : [])
      .filter(t => Date.now() - t < DAY_MS);
    const nextSends = [...recentSends, Date.now()].slice(-5);
    updateCustomerLocal(customer.id, { smsTimestamps: nextSends });
    updateDoc(customerRef, { smsTimestamps: nextSends }).catch(() => {});

    void queueReviewRequest({
      customerRef,
      businessId: user.uid,
      customerPhone: customer.phone,
      businessName: bizSettings.businessName || 'Our Business',
      googleReviewLink: reviewLink,
      firstName: customer.firstName,
      message: requestMessage,
      requestId,
      idToken: null,
    }).then(result => {
      if (!result.ok && result.stage === 'prepare') {
        toastStatusRef.current.set(customer.id, 'sms_failed');
        toast.error(SMS_PUBLIC_FAILURE_MESSAGE, { id: requestId });
        updateCustomerLocal(customer.id, {
          status: 'sms_failed',
          smsError: result.error,
        });
      }
    });
  };

  const handleSave = async (form) => {
    optimisticCounter.current += 1;
    const tempId = `_optimistic_${optimisticCounter.current}`;
    const optimisticEntry = {
      id: tempId,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email,
      serviceType: form.serviceType,
      notes: form.notes,
      status: 'pending',
      _optimistic: true,
    };

    setCustomers(current => {
      const next = [optimisticEntry, ...current];
      customersRef.current = next;
      return next;
    });

    try {
      const docRef = await addDoc(
        collection(db, 'users', user.uid, 'customers'),
        {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          email: form.email,
          serviceType: form.serviceType,
          notes: form.notes,
          status: 'pending',
          createdAt: serverTimestamp(),
        },
      );

      const savedCustomer = {
        id: docRef.id,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        serviceType: form.serviceType,
        notes: form.notes,
        status: 'pending',
      };

      setCustomers(current => {
        const next = current.map(c => (c.id === tempId ? { ...savedCustomer, _optimistic: false } : c));
        customersRef.current = next;
        return next;
      });

      if (form.sendNow) {
        handleOpenSendModal(savedCustomer);
      } else {
        toast.success(`${form.firstName} added!`);
      }
    } catch {
      setCustomers(current => {
        const next = current.filter(c => c.id !== tempId);
        customersRef.current = next;
        return next;
      });
      toast.error('Failed to save customer — check Firebase config');
    }
  };
  const handleDelete = async (id, name) => {
    if (!confirm(`Remove ${name}?`)) return;
    setDeleting(id);

    // Optimistic removal
    setCustomers(current => {
      const next = current.filter(c => c.id !== id);
      customersRef.current = next;
      return next;
    });

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'customers', id));
      toast.success('Customer removed');
    } catch {
      // Roll back — re-fetch to restore accurate state
      toast.error('Failed to delete');
      hasFetched.current = false;   // allow one re-fetch
      const q = query(
        collection(db, 'users', user.uid, 'customers'),
        orderBy('createdAt', 'desc'),
        limit(QUERY_LIMIT),
      );
      getDocs(q).then(snap => {
        const next = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        customersRef.current = next;
        setCustomers(next);
      }).catch(() => {});
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    customersRef.current = customers;
  }, [customers]);

  useEffect(() => {
    const activeTimers = smsTimeoutsRef.current;
    const activeToasts = toastStatusRef.current;
    const currentIds = new Set(customers.map(c => c.id));

    activeTimers.forEach((timer, customerId) => {
      if (!currentIds.has(customerId)) {
        clearTimeout(timer);
        activeTimers.delete(customerId);
        activeToasts.delete(customerId);
      }
    });

    customers.forEach(customer => {
      if (customer.status !== 'sending_sms') {
        const timer = activeTimers.get(customer.id);
        if (timer) {
          clearTimeout(timer);
          activeTimers.delete(customer.id);
        }
        return;
      }

      if (activeTimers.has(customer.id)) return;

      const requestedAt = customer.smsRequestedAtClient
        || customer.smsRequestedAt?.toMillis?.()
        || customer.smsRequestedAt?._seconds * 1000
        || Date.now();
      const elapsed = Date.now() - requestedAt;
      const remaining = Math.max(SMS_TIMEOUT_MS - elapsed, 0);

      const timer = setTimeout(async () => {
        const latest = customersRef.current.find(c => c.id === customer.id);
        if (!latest || latest.status !== 'sending_sms') return;
        try {
          await updateDoc(doc(db, 'users', user.uid, 'customers', customer.id), {
            status: 'sms_failed',
            smsError: SMS_PUBLIC_FAILURE_MESSAGE,
          });
        } catch {
          // Firestore update failures are surfaced by the snapshot state fallback.
        }
      }, remaining);

      activeTimers.set(customer.id, timer);
    });

    customers.forEach(customer => {
      const previous = activeToasts.get(customer.id);
      if (previous === customer.status) return;

      if (previous === 'sending_sms' && customer.status === 'sms_sent') {
        toast.success('SMS sent successfully.', { id: customer.smsRequestId || customer.id });
      }

      if (previous === 'sending_sms' && customer.status === 'sms_failed') {
        toast.error(SMS_PUBLIC_FAILURE_MESSAGE, { id: customer.smsRequestId || customer.id });
      }

      activeToasts.set(customer.id, customer.status);
    });
  }, [customers, user.uid]);

  // ── Filter (memoised — only recomputes when customers or search changes) ────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      `${c.firstName} ${c.lastName} ${c.phone} ${c.email}`.toLowerCase().includes(q)
    );
  }, [customers, search]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field pl-10"
            placeholder="Search by name, phone, or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary whitespace-nowrap">
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      {/* Settings reminder */}
      {!bizSettings.businessName && !loading && (
        <div className="mb-4 flex items-center gap-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded-xl">
          ⚠️ Add your <strong>Business Name</strong> and <strong>Google Reviews URL</strong> in{' '}
          <a href="/dashboard/settings" className="underline font-semibold">Settings</a> so SMS includes the right details.
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <CustomerTableSkeleton />
        ) : filtered.length === 0 ? (
          customers.length === 0
            ? <EmptyCustomers />
            : <div className="py-16 text-center text-slate-400">No customers match "{search}"</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr className="text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-3">Name</th>
                  <th className="text-left px-6 py-3">Phone</th>
                  <th className="text-left px-6 py-3">Email</th>
                  <th className="text-left px-6 py-3">Service</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <>
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {c.firstName} {c.lastName}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{c.phone}</td>
                      <td className="px-6 py-4 text-slate-500">{c.email || '—'}</td>
                      <td className="px-6 py-4 text-slate-500">{c.serviceType || '—'}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={c.status} optimistic={c._optimistic} smsError={c.smsError} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            title={c.status === 'sms_failed' ? 'Retry SMS' : 'Send SMS review request'}
                            disabled={c.status === 'sending_sms' || c._optimistic}
                            onClick={() => handleOpenSendModal(c)}
                            className="p-2 rounded-lg text-sky-500 hover:bg-sky-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {c.status === 'sending_sms'
                              ? <Loader2 size={16} className="animate-spin" />
                              : c.status === 'sms_failed'
                                ? <RotateCcw size={16} />
                                : <Send size={16} />}
                          </button>
                          <button
                            title="Delete customer"
                            disabled={deleting === c.id || c._optimistic}
                            onClick={() => handleDelete(c.id, `${c.firstName} ${c.lastName}`)}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {deleting === c.id
                              ? <Loader2 size={16} className="animate-spin" />
                              : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count */}
      {!loading && customers.length > 0 && (
        <p className="text-slate-400 text-sm mt-3 text-center">
          {filtered.length} of {customers.length} customers
          {customers.length === QUERY_LIMIT && ' (showing latest 50)'}
        </p>
      )}

      {/* Modal */}
      <>
        {sendModalCustomer && (
          <SendReviewModal
            key={sendModalCustomer.id}
            customer={sendModalCustomer}
            businessName={bizSettings.businessName || 'Our Business'}
            businessNameSet={Boolean(bizSettings.businessName)}
            reviewLink={sendModalRequestId ? `${window.location.origin}/r/${sendModalRequestId}` : ''}
            hasGoogleReviewUrl={Boolean(bizSettings.googleReviewsUrl)}
            defaultTemplate={sendModalTemplate}
            onClose={() => {
              setSendModalCustomer(null);
              setSendModalTemplate('');
              setSendModalRequestId('');
            }}
            onConfirm={(finalMessage, rawTemplate) => handleConfirmSend(sendModalCustomer, finalMessage, rawTemplate)}
          />
        )}
        {showModal && (
          <AddCustomerModal
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
      </>
    </>
  );
}
