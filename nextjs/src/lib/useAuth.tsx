'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, checkAuth } from './api';

interface AuthContextType {
  user: any;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, yearly_goal?: number) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const userData = await checkAuth();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setError(null);
    const result = await apiLogin(username, password);
    
    if (result.success && result.user) {
      setUser(result.user);
      return true;
    } else {
      setError(result.error || 'Login failed');
      return false;
    }
  };

  const register = async (username: string, email: string, password: string, yearly_goal?: number) => {
    setError(null);
    const result = await apiRegister(username, email, password, yearly_goal);
    
    if (result.success && result.user) {
      setUser(result.user);
      return true;
    } else {
      setError(result.error || 'Registration failed');
      return false;
    }
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 