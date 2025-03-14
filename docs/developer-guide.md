# Developer Guide

## Architecture Overview

Landing Pad Digital follows a modern microservices architecture:

- **Frontend**: Next.js application handling the UI
- **Backend API**: Express-based API for data management and business logic
- **AI Service**: Service for integrating with OpenAI and other AI providers
- **Auth Service**: Handles user authentication and authorization
- **Payment Service**: Manages subscriptions and payments
- **Storage Service**: Manages file uploads and storage (local and S3)

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Cache**: Redis
- **AI**: OpenAI GPT API
- **Authentication**: JWT, OAuth
- **Storage**: AWS S3, Local filesystem
- **Payment Processing**: Stripe
- **Hosting**: Vercel (frontend), AWS/Digital Ocean (backend)

## Authentication System

The authentication system uses a comprehensive token-based approach with robust security features.

### Core Features

1. **JWT-based Authentication**:
   - Short-lived access tokens (1 hour)
   - Refresh tokens stored in HTTP-only cookies (7 days)
   - Automatic token refresh mechanism

2. **Multiple Authentication Methods**:
   - Email/password login
   - Social login (Google, Facebook, LinkedIn)
   - Account linking between providers

3. **Email Verification**:
   - Required by default for new accounts
   - Secure token-based verification flow
   - Resend verification capability

4. **Advanced Security**:
   - Defense against auth loops
   - CSRF protection
   - Rate limiting on auth endpoints
   - IP-based brute force protection

### Authentication Flow

1. **Registration Process**:
   - User submits registration form
   - Backend validates input, creates user with status 'pending'
   - Verification email sent
   - User must verify email before login

2. **Email Verification**:
   - User clicks link with verification token
   - Token validated and account activated
   - User redirected to login

3. **Login Flow**:
   - User submits credentials
   - Backend validates and issues access + refresh tokens
   - Access token stored in memory/localStorage
   - Refresh token stored in HTTP-only cookie

4. **Token Refresh**:
   - When access token expires, refresh token is used
   - New access token generated without requiring login
   - Refresh token rotation for enhanced security

### Implementation Details

The authentication system is implemented in these key files:

- `/backend/src/controllers/auth.controller.js`: Core authentication logic
- `/backend/src/middleware/auth.js`: Authentication middleware
- `/backend/src/config/passport.js`: Social login strategies
- `/frontend/lib/auth/auth-context.tsx`: Frontend auth context provider

## Storage Configuration

Landing Pad DXP implements a flexible storage system supporting both local filesystem and AWS S3 cloud storage.

### S3 Integration

The platform uses AWS S3 with these features:

1. **Bucket Organization**:
   - Separate buckets for uploads and permanent storage
   - Environment-specific buckets (dev/staging/prod)
   - Structured folder hierarchy by user and project

2. **Storage Service**:
   - Abstract storage interface in `storageService.js`
   - Seamless fallback to local storage when needed
   - Environment-based configuration

3. **Security Features**:
   - Signed URLs for direct uploads
   - Proper content-type verification
   - File size limits and validation
   - Access control based on user ownership

4. **Advanced Features**:
   - Direct browser-to-S3 uploads for large files
   - Image optimization pipeline
   - CDN integration for published assets

### S3 Configuration

Configure S3 using these environment variables:

```
# Enable/disable S3 storage
S3_ENABLED=true

# AWS credentials
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=us-east-1

# Bucket configuration
S3_UPLOADS_BUCKET=landingpad-dxp-uploads
S3_STORAGE_BUCKET=landingpad-dxp-storage
```

For local development, the system defaults to local filesystem storage when `S3_ENABLED` is set to `false`.

## Local Development Setup

### Prerequisites

- Node.js v18+
- npm or yarn
- PostgreSQL
- Redis (optional for development)
- AWS account (optional for S3 testing)

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
- Authentication test suite: `npm run test:auth`
- Storage test suite: `npm run test:storage`