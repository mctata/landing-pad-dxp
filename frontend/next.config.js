/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Allow image domains for Unsplash API
  images: {
    domains: ['images.unsplash.com'],
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
  // Simple webpack config
  webpack(config) {
    return config;
  },
};

// The Sentry config is added by @sentry/nextjs automatically when installed
module.exports = nextConfig;