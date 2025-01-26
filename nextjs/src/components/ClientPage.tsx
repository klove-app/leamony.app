'use client';

import { ReactNode, Suspense } from 'react';
import { useAuth } from '@/lib/useAuth';
import Navbar from './Navbar';
import Footer from './Footer';

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

export default function ClientPage({ children, requireAuth = false }: ClientPageProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ClientPageContent requireAuth={requireAuth}>
        {children}
      </ClientPageContent>
    </Suspense>
  );
}

function ClientPageContent({ children, requireAuth }: ClientPageProps) {
  const { user, isLoading } = useAuth();

  if (requireAuth && isLoading) {
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