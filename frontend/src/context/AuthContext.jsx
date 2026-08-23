import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TOKEN_KEY, USER_KEY } from '../api/client.js';
import { fetchMe, loginRequest } from '../api/endpoints.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    let alive = true;
    if (!token) return undefined;
    fetchMe()
      .then((me) => {
        if (!alive) return;
        setUser(me);
        localStorage.setItem(USER_KEY, JSON.stringify(me));
      })
      .catch(() => {
        if (!alive) return;
        setUser(null);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [token]);

  const login = useCallback(async (username, password) => {
    const result = await loginRequest({ username, password });
    setUser(result.user);
    setToken(result.token);
    return result.user;
  }, []);

  /** Perbarui cache user lokal (mis. setelah verifikasi OTP / hubungkan drive). */
  const updateUser = useCallback((patchOrUser) => {
    setUser((prev) => {
      const next = typeof patchOrUser === 'function' ? patchOrUser(prev) : patchOrUser;
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, logout, updateUser }),
    [user, token, loading, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
