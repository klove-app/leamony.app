'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const AuthProvider = dynamic(() => import('@/lib/useAuth').then(mod => mod.AuthProvider), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50">
      <div aria-hidden="true" className="invisible">
        {/* Плейсхолдер для предотвращения скачков контента */}
        <div style={{ height: '100vh' }} />
      </div>
    </div>
  ),
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // На сервере или до гидратации возвращаем плейсхолдер
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div aria-hidden="true" className="invisible">
          {children}
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
} 