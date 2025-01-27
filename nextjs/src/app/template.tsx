'use client';

import dynamic from 'next/dynamic';

const Providers = dynamic(() => import('@/components/Providers'), {
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

export default function Template({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
} 