'use client';

import ClientPage from '@/components/ClientPage';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Pricing from '@/components/Pricing';
import Stats from '@/components/Stats';

export default function Home() {
  return (
    <ClientPage>
      <main>
        <Hero />
        <Features />
        <Stats />
        <Pricing />
      </main>
    </ClientPage>
  );
}
