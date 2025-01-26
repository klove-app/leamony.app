import ClientWrapper from '@/components/ClientWrapper'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Stats from '@/components/Stats'
import Pricing from '@/components/Pricing'

export default function Home() {
  return (
    <ClientWrapper>
      <main className="flex min-h-screen flex-col items-center justify-between">
        <Hero />
        <Features />
        <Stats />
        <Pricing />
      </main>
    </ClientWrapper>
  )
} 