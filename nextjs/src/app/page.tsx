'use client';

import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import Stats from '@/components/sections/Stats';
import Pricing from '@/components/sections/Pricing';
import Footer from '@/components/layout/Footer';
import AuthModal from '@/components/layout/AuthModal';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Stats />
        <Pricing />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
