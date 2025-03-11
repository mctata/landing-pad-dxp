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

The application uses a Docker-based deployment process with GitHub Actions for CI/CD.

### Deployment Options

1. **GitHub Actions Automated Deployment**
   
   Merges to the `main` branch automatically deploy to staging.
   
   For manual deployments:
   - Go to Actions tab in GitHub
   - Select "Deploy" workflow
   - Click "Run workflow"
   - Choose target environment (staging or production)

2. **Manual Docker Deployment**

   ```bash
   # Build images
   docker build -t landingpaddxp/backend:latest backend/
   docker build -t landingpaddxp/frontend:latest frontend/
   
   # Deploy using docker-compose
   docker-compose -f docker-compose.yml up -d
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