'use client';

import { ReactNode, Suspense } from 'react';
import { useAuth } from '@/lib/useAuth';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

interface ClientPageProps {
  children: ReactNode;
  requireAuth?: boolean;
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

function ClientPageContent({ children, requireAuth }: ClientPageProps) {
  const router = useRouter();
  let auth;
  
  try {
    auth = useAuth();
  } catch (error) {
    if (requireAuth) {
      useEffect(() => {
        router.replace('/');
      }, []);
      return <LoadingSpinner />;
    }
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        {children}
        <Footer />
      </div>
    );
  }

  const { user, isLoading } = auth;

  useEffect(() => {
    if (requireAuth && !isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, requireAuth]);

  if (requireAuth && (isLoading || !user)) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

export default function ClientPage({ children, requireAuth = false }: ClientPageProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ClientPageContent requireAuth={requireAuth}>
        {children}
      </ClientPageContent>
    </Suspense>
  );
} 