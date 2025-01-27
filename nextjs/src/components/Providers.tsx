'use client';

import { useEffect, useState } from 'react';
import { AuthProvider } from '@/lib/useAuth';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // На сервере или до гидратации возвращаем базовую разметку
  if (!mounted) {
    return (
      <div style={{ display: 'contents' }}>
        {children}
      </div>
    );
  }

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
} 