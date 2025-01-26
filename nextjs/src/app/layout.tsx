import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`scroll-smooth ${inter.variable}`}>
      <div className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </div>
    </div>
  );
}
