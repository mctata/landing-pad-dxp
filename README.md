# Landing Pad Digital (DXP)

An AI-powered website builder platform that allows users to create, customize, and deploy websites with AI assistance.

## Overview

Landing Pad Digital is a modern website builder that leverages AI to make website creation fast, intuitive, and accessible to everyone. The platform uses AI to suggest layouts, content, and design elements while providing a simple drag-and-drop interface for customization.

## Features

- **AI-Powered Website Generation**: Get AI-generated layouts, content, and design suggestions
- **Drag-and-Drop Editor**: No-code website customization
- **Pre-built Templates**: Starting points for common website types
- **User Authentication**: Secure account management
- **Hosting & Deployment**: Automatic cloud deployment
- **Subscription Tiers**: Free, Pro, and Enterprise options
- **Image Integration**: Access to high-quality stock photos

## Tech Stack

- **Frontend**: Next.js with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **AI Integration**: OpenAI GPT API
- **Payment Processing**: Stripe
- **Hosting**: Vercel

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL
- Git
- Docker and Docker Compose (optional, for containerized development)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/mctata/landing-pad-dxp.git
   cd landing-pad-dxp
   ```

#### Option 1: Using Docker (Recommended)

2. Start the development environment with Docker Compose
   ```bash
   # Copy environment configuration
   cp .env.example .env
   
   # Start all services
   docker-compose -f docker-compose.dev.yml up
   ```

   This will start:
   - Frontend server on http://localhost:3000
   - Backend API on http://localhost:3001

#### Option 2: Manual Setup

2. Install dependencies
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. Set up environment variables
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Fill in the required environment variables

4. Start the development servers
   ```bash
   # Start backend server
   cd backend
   npm run dev
   
   # Start frontend server in another terminal
   cd frontend
   npm run dev
   ```

## Deployment

### Netlify Deployment (Frontend)

The frontend application is now configured for deployment on Netlify:

1. **Setting Up Netlify:**
   ```bash
   # Install Netlify CLI globally if not already installed
   npm install -g netlify-cli
   
   # Login to Netlify
   netlify login
   
   # Initialize Netlify site (from frontend directory)
   cd frontend
   netlify init
   ```

2. **Configure Environment Variables:**
   - Go to Site settings > Build & deploy > Environment variables in Netlify dashboard
   - Add the variables from `.env.production` with actual production values
   - Essential variables:
     - `NEXT_PUBLIC_API_URL`
     - `NEXT_PUBLIC_SITE_URL`
     - `NEXTAUTH_URL`
     - `NEXTAUTH_SECRET`
     - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (if using Stripe)

3. **Deploy Manually:**
   ```bash
   # Deploy to Netlify production
   netlify deploy --prod
   ```

4. **Continuous Deployment:**
   - Connect Netlify to your GitHub repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Commits to main branch will trigger automatic deployments

### Backend Deployment Options

1. **Docker Deployment:**
   ```bash
   # Build the backend image
   docker build -t landingpaddxp/backend:latest backend/
   
   # Run container with environment variables
   docker run -p 3001:3000 --env-file backend/.env.production landingpaddxp/backend:latest
   ```

2. **Manual Deployment to VPS/Cloud:**
   - Provision a server (AWS, DigitalOcean, etc.)
   - Set up Node.js, PostgreSQL, and Redis
   - Clone repository and install dependencies
   - Configure environment variables from `.env.production`
   - Use PM2 or similar for process management:
     ```bash
     npm install -g pm2
     cd backend
     pm2 start src/server.js --name "landing-pad-api"
     ```

For detailed deployment instructions, see the [Deployment Guide](docs/deployment-guide.md).

## Project Structure

```
├── frontend/               # Next.js frontend application
├── backend/                # Express backend API
├── .github/                # GitHub Actions workflows
├── docs/                   # Documentation
└── README.md               # Project readme
```

## API Documentation

API documentation is available in the `/docs` directory or when running the development server at `/api/docs`.

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

MIT License