# Landing Pad Digital (DXP)

An AI-powered website builder platform that allows users to create, customise, and deploy websites with AI assistance.

## Overview

Landing Pad Digital is a modern website builder that leverages AI to make website creation fast, intuitive, and accessible to everyone. The platform uses AI to suggest layouts, content, and design elements while providing a simple drag-and-drop interface for customisation.

## Features

- **AI-Powered Website Generation**: Get AI-generated layouts, content, and design suggestions
- **Drag-and-Drop Editor**: No-code website customisation
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

### Backend Setup

1. Clone the repository
   ```bash
   git clone https://github.com/mctata/landing-pad-dxp.git
   cd landing-pad-dxp
   ```

2. Install backend dependencies
   ```bash
   cd backend
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file and fill in the required environment variables:
   - Database connection details
   - JWT secret
   - OpenAI API key
   - Stripe API keys
   - Unsplash API key

4. Create and seed the database
   ```bash
   npm run seed
   ```

5. Start the backend development server
   ```bash
   npm run dev
   ```
   The server will run on http://localhost:5000 by default.

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory
   ```bash
   cd frontend
   ```

2. Install frontend dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   ```
   Edit the `.env.local` file with the appropriate values:
   - Backend API URL
   - Stripe publishable key

4. Start the frontend development server
   ```bash
   npm run dev
   ```
   The application will be available at http://localhost:3000.

## Usage

### Creating a Website

1. Sign up or log in to your account
2. Select "Create New Website" from the dashboard
3. Choose a template that suits your needs
4. Use the AI assistant to generate content based on your prompts
5. Customise the design and layout using the drag-and-drop editor
6. Preview your website and make any necessary adjustments
7. Publish your website when you're satisfied with the result

### Subscription Plans

- **Free**: Basic features with Landing Pad branding
  - Up to 3 websites
  - Basic templates
  - Community support

- **Pro**: £12/month
  - Up to 10 websites
  - All templates
  - Custom domain support
  - No Landing Pad branding
  - Priority support

- **Enterprise**: £49/month
  - Unlimited websites
  - All templates
  - Custom domain support
  - White-label option
  - Team collaboration
  - Dedicated support

## Project Structure

```
├── frontend/               # Next.js frontend application
│   ├── app/                # Application routes using Next.js App Router
│   ├── components/         # Reusable UI components
│   ├── lib/                # Utility functions and context providers
│   └── public/             # Static assets
├── backend/                # Express backend API
│   ├── src/                # Source code
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── seeds/          # Database seed scripts
│   │   └── server.js       # Entry point
│   └── tests/              # Backend tests
├── .github/                # GitHub Actions workflows
├── docs/                   # Documentation
└── README.md               # Project readme
```

## API Documentation

API documentation is available when running the development server at `/api/docs`.

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

MIT License