import './globals.css'
import './styles/accessibility.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

// Optimize font loading to prevent layout shift
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'Arial', 'sans-serif']
})

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
    try {
      // Access the monitoring module safely
      const metricData = {
        name: metric.name,
        value: metric.value,
        id: metric.id,
        startTime: metric.startTime,
        label: metric.label
      };
      
      // Log the metric for now
      console.debug('Web Vital:', metricData);
      
      // Safely import the monitoring module
      import('@/lib/monitoring').then(({ reportWebVitals }) => {
        reportWebVitals(metricData);
      }).catch((err) => {
        // Fail silently in case the monitoring module fails to load
        console.warn('Failed to report web vitals:', err);
      });
    } catch (err) {
      console.warn('Failed to process web vitals:', err);
    }
  }
}
