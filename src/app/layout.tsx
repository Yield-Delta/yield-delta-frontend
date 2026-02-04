
import { Inter } from 'next/font/google'
import './globals.css'
import { Web3Provider } from '@/components/providers/Web3Provider'
import { ThemeProvider } from 'next-themes'

const inter = Inter({ subsets: ['latin'] })
// Metadata for SEO and social sharing
export const metadata = {
  title: 'Yield Delta',
  description: 'AI-driven dynamic liquidity vaults on SEI EVM',
  metadataBase: new URL('https://yielddelta.xyz'),
  openGraph: {
    title: 'Yield Delta',
    description: 'AI-driven dynamic liquidity vaults on SEI EVM',
    url: 'https://yielddelta.xyz',
    siteName: 'Yield Delta',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Yield Delta - Dynamic Liquidity Vaults on SEI',
        type: 'image/png',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yield Delta',
    description: 'AI-driven dynamic liquidity vaults on SEI EVM',
    images: ['/api/og'],
    creator: '@yielddelta',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      url: '/favicon.svg',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32.svg',
    },
    {
      rel: 'icon',
      type: 'image/png', 
      sizes: '16x16',
      url: '/favicon-16.svg',
    },
    {
      rel: 'apple-touch-icon',
      sizes: '128x128',
      url: '/favicon-128.svg',
    },
  ],
}
// QueryClient is managed internally in Web3Provider

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* Client-side web3 and query providers */}
          <Web3Provider>
            {children}
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
