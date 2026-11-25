import React, { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../api/authApi';
import userApi from '../api/userApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('tenzal_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('tenzal_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify authentication on app launch
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('tenzal_token');
      if (storedToken) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
          localStorage.setItem('tenzal_user', JSON.stringify(userData));
        } catch (err) {
          console.warn('[AuthContext] Session initialization check failed:', err.message);
          localStorage.removeItem('tenzal_token');
          localStorage.removeItem('tenzal_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const { user: loggedInUser, token: authToken } = res.data;

      localStorage.setItem('tenzal_token', authToken);
      localStorage.setItem('tenzal_user', JSON.stringify(loggedInUser));

      setToken(authToken);
      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(userData);
      const { user: registeredUser, token: authToken } = res.data;

      localStorage.setItem('tenzal_token', authToken);
      localStorage.setItem('tenzal_user', JSON.stringify(registeredUser));

      setToken(authToken);
      setUser(registeredUser);
      return registeredUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('tenzal_token');
      localStorage.removeItem('tenzal_user');
      setUser(null);
      setToken(null);
    }
  };

  const updateProfile = async (profileData) => {
    const updated = await userApi.updateProfile(profileData);
    setUser(updated);
    localStorage.setItem('tenzal_user', JSON.stringify(updated));
    return updated;
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authApi.getMe();
      setUser(freshUser);
      localStorage.setItem('tenzal_user', JSON.stringify(freshUser));
      return freshUser;
    } catch {
      return null;
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
