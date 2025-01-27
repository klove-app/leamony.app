'use client';

import Providers from '@/components/Providers';

export default function Template({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
} 