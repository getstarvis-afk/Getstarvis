import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';
import { DashboardDataContext } from './DashboardDataContextValue';
import { ensureDemoAccount } from '../services/demoSeed';

const SETTINGS_TIMEOUT_MS = 10000;

const DEFAULT_SETTINGS = {
  businessName: '',
  address: '',
  googleReviewsUrl: '',
  businessPhone: '',
  website: '',
  senderName: '',
  smsTemplate: '',
  sendTime: 'immediately',
  followUp: 'none',
  alertLowRating: true,
  alertNewReview: false,
  alertWeeklySummary: true,
  alertSmsFailure: true,
  notifEmail: '',
};

function withTimeout(promise, timeoutMs, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(message);
      err.code = 'SETTINGS_TIMEOUT';
      reject(err);
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function DashboardDataProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const loadSettings = useCallback(async () => {
    if (!user) {
      setLoadingSettings(false);
      return;
    }
    setLoadingSettings(true);
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const rawData = snap.exists() ? snap.data() : {};
      const data = await withTimeout(
        ensureDemoAccount(user, rawData),
        SETTINGS_TIMEOUT_MS,
        'Dashboard settings load timed out.',
      );
      setSettings({ ...DEFAULT_SETTINGS, notifEmail: user.email || '', ...data });
    } catch {
      setSettings({ ...DEFAULT_SETTINGS, notifEmail: user.email || '' });
    } finally {
      setLoadingSettings(false);
    }
  }, [user]);

  useEffect(() => {
    queueMicrotask(loadSettings);
  }, [loadSettings]);

  const saveSettings = useCallback(async (nextSettings) => {
    if (!user) throw new Error('You must be signed in to save settings.');
    await setDoc(doc(db, 'users', user.uid), nextSettings, { merge: true });
    setSettings(current => ({ ...current, ...nextSettings }));
  }, [user]);

  const value = useMemo(() => ({
    settings,
    loadingSettings,
    refreshSettings: loadSettings,
    saveSettings,
  }), [settings, loadingSettings, loadSettings, saveSettings]);

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}
