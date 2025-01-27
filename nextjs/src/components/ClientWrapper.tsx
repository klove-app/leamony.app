'use client';

import { ReactNode, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface ClientWrapperProps {
  children: ReactNode;
  requireAuth?: boolean;
}

function ClientContent({ children }: { children: ReactNode }) {
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
}

const ClientContentWithNoSSR = dynamic(() => Promise.resolve(ClientContent), {
  ssr: false,
});

export default function ClientWrapper({ children, requireAuth = false }: ClientWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <ClientContentWithNoSSR>{children}</ClientContentWithNoSSR>;
} 