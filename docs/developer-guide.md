# Developer Guide

## Architecture Overview

Landing Pad Digital follows a modern microservices architecture:

- **Frontend**: Next.js application handling the UI
- **Backend API**: Express-based API for data management and business logic
- **AI Service**: Service for integrating with OpenAI and other AI providers
- **Auth Service**: Handles user authentication and authorization
- **Payment Service**: Manages subscriptions and payments

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Cache**: Redis
- **AI**: OpenAI GPT API
- **Authentication**: JWT, OAuth
- **Payment Processing**: Stripe
- **Hosting**: Vercel (frontend), AWS/Digital Ocean (backend)

## Local Development Setup

### Prerequisites

- Node.js v18+
- npm or yarn
- PostgreSQL
- Redis (optional for development)

### Setup Steps

1. Clone the repository
2. Install dependencies for both frontend and backend
3. Set up environment variables (see `.env.example` files)
4. Run database migrations
5. Start development servers

## API Integration

The API uses REST principles with JSON as the data format.

Authentication is handled via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

See the [API Reference](api-reference.md) for detailed endpoint documentation.

## Extending the Platform

### Creating Custom Components

Custom components can be added to the `frontend/components/custom` directory.

### Adding New Templates

Templates are stored in `frontend/templates` and defined as JSON configurations.

### Integrating New AI Features

AI integrations can be extended through the AI service in `backend/services/ai`.

## Testing

- Run frontend tests: `cd frontend && npm test`
- Run backend tests: `cd backend && npm test`
- End-to-end tests: `npm run test:e2e`