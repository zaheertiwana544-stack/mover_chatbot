import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

/**
 * Auth is handled entirely via httpOnly cookies set by the server.
 * The client NEVER stores a token. It just calls /api/auth/me to check
 * if a valid session exists. Each browser tab independently verifies
 * with the server — no shared localStorage state.
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, ask the server if we have a valid session (cookie-based)
  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    // Server sets httpOnly cookie — we just store user object in React state
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {});
    // Server clears the httpOnly cookie
    setUser(null);
  }, []);

  // Called when 401 is received — clears user state
  const clearSession = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, clearSession,
      isAdmin:  user?.role === 'admin',
      isLogged: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
