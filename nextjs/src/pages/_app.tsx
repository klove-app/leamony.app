import type { AppProps } from 'next/app'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Providers from '@/components/Providers'
import '../styles/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Providers>
        <div className="font-inter">
          <Component {...pageProps} />
        </div>
      </Providers>
    </ErrorBoundary>
  )
} 