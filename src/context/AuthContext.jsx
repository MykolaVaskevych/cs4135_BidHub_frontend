import { useState, useCallback } from 'react';
import { AuthContext } from './useAuth';
import { api } from '../api/client';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const saveAuth = useCallback((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ userId: data.userId, email: data.email, role: data.role }));
    setUser({ userId: data.userId, email: data.email, role: data.role });
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    saveAuth(data);
    return data;
  }, [saveAuth]);

  const register = useCallback(async (form) => {
    const data = await api.post('/auth/register', form);
    saveAuth(data);
    return data;
  }, [saveAuth]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const isSeller = user?.role === 'SELLER';

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin, isSeller }}>
      {children}
    </AuthContext.Provider>
  );
}
