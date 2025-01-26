'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import Navbar from './Navbar';
import Footer from './Footer';

interface ClientWrapperProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export default function ClientWrapper({ children, requireAuth = false }: ClientWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkAuth = async () => {
      try {
        const { isLoading, user } = useAuth();
        setIsAuthLoading(isLoading);
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthLoading(false);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);

  // Не рендерим на сервере
  if (!mounted) {
    return null;
  }

  // Показываем спиннер во время загрузки
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Если требуется авторизация и пользователь не авторизован
  if (requireAuth && !isAuthenticated) {
    window.location.href = '/';
    return null;
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
} 