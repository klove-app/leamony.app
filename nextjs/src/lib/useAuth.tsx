'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { checkAuth, logout } from './api';

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  error: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  logout: async () => {}
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Проверяем наличие токена перед запросом
        const token = document.cookie.includes('access_token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const userData = await checkAuth();
        if (userData) {
          setUser(userData);
        }
      } catch (err) {
        // Если ошибка 401, значит просто пользователь не авторизован
        if (err instanceof Error && err.message === 'Unauthorized') {
          console.log('User not authenticated');
        } else {
          console.error('Auth check error:', err);
          setError('Ошибка проверки авторизации');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
      setError('Ошибка при выходе из системы');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        logout: handleLogout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 