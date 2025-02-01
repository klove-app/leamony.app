'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface RootClientPageProps {
  children: ReactNode;
}

export default function RootClientPage({ children }: RootClientPageProps) {
  const [mounted, setMounted] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Инициализируем auth только на клиенте
    const { isLoading } = useAuth();
    setIsAuthLoading(isLoading);
  }, []);

  // Не рендерим ничего на сервере
  if (!mounted) {
    return null;
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
} 