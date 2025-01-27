'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from 'react-error-boundary';

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

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Что-то пошло не так</h1>
        <p className="text-gray-600 mb-8">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}

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
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ErrorBoundary>
  );
} 