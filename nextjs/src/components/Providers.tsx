'use client';

import { useEffect, useState } from 'react';
import { AuthProvider } from '@/lib/useAuth';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Показываем заглушку до монтирования
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