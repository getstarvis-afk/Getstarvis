import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { AuthContext } from './AuthContextValue';

const AUTH_TIMEOUT_MS = 10000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (!settled) {
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      settled = true;
      clearTimeout(timeoutId);
      setUser(u);
      setLoading(false);
    });
    return () => {
      settled = true;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const logout = () => signOut(auth);

  const value = useMemo(() => ({ user, loading, logout }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
