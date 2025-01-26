import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Stats from '@/components/Stats';
import Pricing from '@/components/Pricing';
import ClientWrapper from '@/components/ClientWrapper';

// Отключаем статическую генерацию для этой страницы
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Home() {
  return (
    <ClientWrapper>
      <main>
        <Hero />
        <Features />
        <Stats />
        <Pricing />
      </main>
    </ClientWrapper>
  );
}
