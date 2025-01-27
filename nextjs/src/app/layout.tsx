import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import Providers from '@/components/Providers'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RunConnect',
  description: 'Connect with runners worldwide',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={inter.className}>
      <Providers>{children}</Providers>
    </div>
  )
} 