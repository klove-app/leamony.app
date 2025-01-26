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
  const auth = useAuth();

  if (!auth) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { user, loading } = auth;

  useEffect(() => {
    if (requireAuth && !loading && !user) {
      router.push('/login');
    }
  }, [user, loading, requireAuth, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

export default function ClientPage({ children, requireAuth = true }: ClientPageProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ClientPageContent requireAuth={requireAuth}>
        {children}
      </ClientPageContent>
    </Suspense>
  );
} 