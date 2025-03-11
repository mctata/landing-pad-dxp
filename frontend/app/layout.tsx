import './globals.css'
import './styles/accessibility.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Landing Pad Digital',
  description: 'AI-powered website builder platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        {/* Skip to content link for keyboard users */}
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <Providers>
          <main id="main-content">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}

// Export a Web Vitals function to measure performance
export function reportWebVitals(metric: any) {
  // Import the function dynamically to avoid issues with SSR
  if (typeof window !== 'undefined') {
    import('@/lib/monitoring').then(({ reportWebVitals }) => {
      reportWebVitals(metric);
    }).catch(() => {
      // Fail silently in case the monitoring module fails to load
      console.warn('Failed to report web vitals');
    });
  }
}
