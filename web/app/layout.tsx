/**
 * @file layout.tsx
 * @purpose Root layout for the Quantum Chess Battleground application
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.1
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Quantum Chess Battleground',
  description: 'Watch AI models compete in quantum chess while revealing their reasoning process',
  keywords: 'quantum chess, AI, machine learning, LLM, reasoning, chess engine',
  authors: [{ name: 'Quantum Chess Team' }],
  openGraph: {
    title: 'Quantum Chess Battleground',
    description: 'AI models compete in quantum chess with transparent reasoning',
    url: 'https://quantum-chess.vercel.app',
    siteName: 'Quantum Chess Battleground',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quantum Chess Battleground',
    description: 'AI models compete in quantum chess with transparent reasoning',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-gray-950 antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}