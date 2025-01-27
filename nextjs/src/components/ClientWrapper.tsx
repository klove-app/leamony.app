'use client';

import { ReactNode, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from 'react-error-boundary';

// Отдельные компоненты для лучшей организации кода
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const AuthRequired = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Требуется авторизация</h1>
      <p className="text-gray-600">Пожалуйста, войдите в систему</p>
    </div>
  </div>
);

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Произошла ошибка</h1>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Попробовать снова
      </button>
    </div>
  </div>
);

interface ClientWrapperProps {
  children: ReactNode;
  requireAuth?: boolean;
}

// Динамический импорт компонентов
const DynamicNavbar = dynamic(() => import('@/components/Navbar'), { ssr: false });
const DynamicFooter = dynamic(() => import('@/components/Footer'), { ssr: false });

const AuthContent = dynamic(() => import('@/lib/useAuth').then(mod => {
  const { useAuth } = mod;
  return function AuthenticatedContent({ children, requireAuth }: { children: ReactNode; requireAuth: boolean }) {
    const router = useRouter();
    const auth = useAuth();
    const { isLoading, user } = auth;

    useEffect(() => {
      if (!isLoading && requireAuth && !user) {
        router.push('/');
      }
    }, [isLoading, requireAuth, user, router]);

    if (isLoading) return <LoadingSpinner />;
    if (requireAuth && !user) return <AuthRequired />;

    return (
      <>
        <DynamicNavbar />
        {children}
        <DynamicFooter />
      </>
    );
  };
}), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

export default function ClientWrapper({ children, requireAuth = false }: ClientWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <AuthContent requireAuth={requireAuth}>{children}</AuthContent>
    </ErrorBoundary>
  );
} 