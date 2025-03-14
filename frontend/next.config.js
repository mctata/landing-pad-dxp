/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configure image optimization
  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
    // Set this for Netlify compatibility
    unoptimized: process.env.NODE_ENV === 'production',
  },
  
  // Output as standalone for better Netlify compatibility
  output: 'standalone',
  
  // Experimental features that are now stable in Next.js 14
  experimental: {
    // Enable server components features
    serverComponents: true,
    // Improve memory usage
    optimizeCss: true,
    // Improve scrolling experience
    scrollRestoration: true,
  },
  
  // For environment variables
  env: {
    // API endpoint for the backend
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    // Unsplash API key for images
    UNSPLASH_ACCESS_KEY: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY,
    // OpenAI API key for content generation
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  
  // Configure webpack
  webpack(config) {
    // Optimize bundle size
    config.optimization.moduleIds = 'deterministic';
    // Return the modified config
    return config;
  },
  
  // Disable source maps in production for better performance
  productionBrowserSourceMaps: false,
};

// The Sentry config is added by @sentry/nextjs automatically when installed
module.exports = nextConfig;