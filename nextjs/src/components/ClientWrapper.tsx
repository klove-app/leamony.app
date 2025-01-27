'use client';

import { ReactNode, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';

interface ClientWrapperProps {
  children: ReactNode;
  requireAuth?: boolean;
}

const DynamicAuthContent = dynamic(() => import('@/lib/useAuth').then(mod => {
  const { useAuth } = mod;
  return function AuthContent({ children, requireAuth }: { children: ReactNode; requireAuth: boolean }) {
    const router = useRouter();
    const auth = useAuth();
    const { isLoading, user } = auth;

    useEffect(() => {
      if (!isLoading && requireAuth && !user) {
        router.push('/');
      }
    }, [isLoading, requireAuth, user, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (requireAuth && !user) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Требуется авторизация</h1>
            <p className="text-gray-600">Пожалуйста, войдите в систему</p>
          </div>
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
  };
}), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  ),
});

export default function ClientWrapper({ children, requireAuth = false }: ClientWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div aria-hidden="true" className="invisible">
          {children}
        </div>
      </div>
    );
  }

  return <DynamicAuthContent requireAuth={requireAuth}>{children}</DynamicAuthContent>;
} 