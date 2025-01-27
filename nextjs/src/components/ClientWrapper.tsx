'use client';

import { ReactNode, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface ClientWrapperProps {
  children: ReactNode;
  requireAuth?: boolean;
}

const DynamicAuthContent = dynamic(() => import('@/lib/useAuth').then(mod => {
  const { useAuth } = mod;
  return function AuthContent({ children }: { children: ReactNode }) {
    const auth = useAuth();
    const { isLoading, user } = auth;

    if (isLoading) {
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

  return <DynamicAuthContent>{children}</DynamicAuthContent>;
} 