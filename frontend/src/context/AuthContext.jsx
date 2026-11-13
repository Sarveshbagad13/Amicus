import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    if (!decoded.exp) return false;
    return decoded.exp * 1000 <= Date.now();
  } catch (e) {
    return true;
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('amicus_token');
    if (!saved) return null;
    if (isTokenExpired(saved)) {
      localStorage.removeItem('amicus_token');
      return null;
    }
    return saved;
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyUser() {
      if (!token || isTokenExpired(token)) {
        if (token) {
          localStorage.removeItem('amicus_token');
          setToken(null);
        }
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await api.auth.me(token);
        setUser(res.data.user);
      } catch (err) {
        console.warn('Session expired or invalid token:', err);
        logout();
      } finally {
        setLoading(false);
      }
    }
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    const { user: userData, token: newToken } = res.data;
    localStorage.setItem('amicus_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (email, password, fullName) => {
    const res = await api.auth.register(email, password, fullName);
    const { user: userData, token: newToken } = res.data;
    localStorage.setItem('amicus_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('amicus_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
