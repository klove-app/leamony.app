import type { AppProps } from 'next/app'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Providers from '@/components/Providers'
import '../styles/globals.css'

// Импортируем шрифт Inter
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Providers>
        <div className={inter.variable}>
          <Component {...pageProps} />
        </div>
      </Providers>
    </ErrorBoundary>
  )
} 