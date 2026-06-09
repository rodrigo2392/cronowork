import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    const response = await originalFetch(...args);
    // Only 401 (invalid/expired token) should end the session. A 403 means the
    // user IS authenticated but lacks permission for that one action (e.g. a
    // read-only member attempting a mutation) — logging them out would be wrong.
    if (response.status === 401) {
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        window.dispatchEvent(new Event('auth-unauthorized'));
      }
    }
    return response;
  } catch (error) {
    throw error;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('vibe_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vibe_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('vibe_token', data.access_token);
    localStorage.setItem('vibe_user', JSON.stringify(data.user));
  };

  const register = async (name, email, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('vibe_token', data.access_token);
    localStorage.setItem('vibe_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vibe_token');
    localStorage.removeItem('vibe_user');
    // Clear the active board state
    localStorage.removeItem('vibe_kanban_projects');
    localStorage.removeItem('vibe_kanban_active_id');

    // Clear URL search parameters (like project and task IDs)
    window.history.replaceState({}, '', window.location.pathname);
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, setUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
