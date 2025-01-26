import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import Providers from "@/components/Providers";
import RootClientPage from "@/components/RootClientPage";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RunConnect - AI-Powered Running Assistant",
  description: "Track your runs, earn unique achievements, and join a community of runners",
  openGraph: {
    title: "RunConnect - AI-Powered Running Assistant",
    description: "Track your runs, earn unique achievements, and join a community of runners",
    type: "website",
    url: "https://runconnect.app",
  },
  metadataBase: new URL("https://runconnect.app"),
};

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          <Suspense fallback={<LoadingSpinner />}>
            <RootClientPage>
              {children}
            </RootClientPage>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
