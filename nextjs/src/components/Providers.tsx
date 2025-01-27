'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const AuthProvider = dynamic(() => import('@/lib/useAuth').then(mod => mod.AuthProvider), {
  ssr: false,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // На сервере возвращаем базовую разметку
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
} 