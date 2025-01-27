'use client';

import { useEffect, useState } from 'react';
import { AuthProvider } from '@/lib/useAuth';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }} />;
  }

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
} 