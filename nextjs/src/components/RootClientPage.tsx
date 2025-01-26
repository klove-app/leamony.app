'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/useAuth';
import Navbar from './Navbar';
import Footer from './Footer';

interface RootClientPageProps {
  children: ReactNode;
}

export default function RootClientPage({ children }: RootClientPageProps) {
  const { isLoading } = useAuth();

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
} 