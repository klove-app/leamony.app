'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/useAuth';
import Navbar from './Navbar';
import Footer from './Footer';

interface ClientPageProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export default function ClientPage({ children, requireAuth = false }: ClientPageProps) {
  const { user, isLoading } = useAuth();

  if (requireAuth && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
} 