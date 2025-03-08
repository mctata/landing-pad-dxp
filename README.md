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

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/mctata/landing-pad-dxp.git
   cd landing-pad-dxp
   ```

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