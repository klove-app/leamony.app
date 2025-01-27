'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface ClientWrapperProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export default function ClientWrapper({ children, requireAuth = false }: ClientWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { isLoading, user } = auth;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
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