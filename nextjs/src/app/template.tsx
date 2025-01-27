'use client';

import dynamic from 'next/dynamic';

const Providers = dynamic(() => import('@/components/Providers'), {
  ssr: false,
});

export default function Template({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
} 