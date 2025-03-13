# Deployment Guide for Landing Pad DXP

This guide details the process for deploying the Landing Pad Digital Experience Platform to staging and production environments.

## Architecture Overview

The Landing Pad DXP application consists of:

1. **Frontend** - A Next.js application
2. **Backend** - A Node.js/Express API
3. **Database** - PostgreSQL database

Both frontend and backend are containerized using Docker and deployed using Docker Swarm for production environments.

## Infrastructure

### Environments

- **Development** - Local development environment
- **Staging** - Pre-production environment for testing
- **Production** - Live environment

### Deployment Infrastructure

- **Docker** - Container platform
- **Docker Swarm** - Container orchestration for production
- **Docker Hub** - Container registry
- **GitHub Actions** - CI/CD pipeline

## CI/CD Pipeline

### Netlify Deployment (Frontend)

The frontend application is now configured for deployment with Netlify:

1. **Setup and Authentication**:
   ```bash
   # Install Netlify CLI globally
   npm install -g netlify-cli
   
   # Log in to Netlify
   netlify login
   ```

2. **Initializing Netlify Project**:
   ```bash
   # From the frontend directory
   cd frontend
   netlify init
   ```
   
   Follow the prompts to:
   - Create a new site or use an existing one
   - Set up build commands and directories
   - Link to your GitHub repository for CI/CD

3. **Configuring Environment Variables**:
   In the Netlify dashboard:
   - Site settings > Build & deploy > Environment variables
   - Add all necessary environment variables from `.env.production`
   - Critical variables:
     - `NEXT_PUBLIC_API_URL`
     - `NEXT_PUBLIC_SITE_URL` 
     - `NEXTAUTH_URL`
     - `NEXTAUTH_SECRET`

4. **Manual Deploy**:
   ```bash
   # Deploy to Netlify production
   netlify deploy --prod
   ```

5. **Continuous Deployment**:
   Once connected to GitHub, Netlify will automatically:
   - Build and deploy when changes are pushed to your main branch
   - Run build commands defined in netlify.toml
   - Deploy preview environments for pull requests

## Local Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- npm

### Running the Application Locally

1. Clone the repository:
   ```
   git clone https://github.com/your-org/landing-pad-dxp.git
   cd landing-pad-dxp
   ```

2. Start the application in development mode:
   ```
   docker-compose -f docker-compose.dev.yml up
   ```

   This will start:
   - Backend API on http://localhost:3001
   - Frontend on http://localhost:3000

3. For development without Docker:
   ```
   # Start backend
   cd backend
   npm install
   npm run dev

   # Start frontend in another terminal
   cd frontend
   npm install
   npm run dev
   ```

## Manual Deployment

### Staging Deployment

To manually trigger a deployment to staging:

1. Go to the GitHub repository
2. Navigate to "Actions" tab
3. Select "Deploy" workflow
4. Click "Run workflow"
5. Select "staging" environment
6. Click "Run workflow"

### Production Deployment

To deploy to production:

1. Go to the GitHub repository
2. Navigate to "Actions" tab
3. Select "Deploy" workflow
4. Click "Run workflow"
5. Select "production" environment
6. Click "Run workflow"

## Environment Variables

### Netlify Environment Variables (Frontend)

Set these in the Netlify dashboard under Site settings > Build & deploy > Environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.landingpad-digital.com` |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL | `https://landingpad-digital.com` |
| `NEXTAUTH_URL` | Auth URL (same as site URL) | `https://landingpad-digital.com` |
| `NEXTAUTH_SECRET` | Secret for NextAuth | Random 32+ character string |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe key (if using Stripe) | `pk_live_xxx` |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Enable analytics | `true` |
| `NEXT_PUBLIC_FEATURE_AI_ENABLED` | Enable AI features | `true` |

### Backend Server Environment Variables

Store these in your backend server's environment or as `.env.production` file:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3000` |
| `CORS_ORIGIN` | Frontend URL for CORS | `https://landingpad-digital.com` |
| `DB_URL` | Database connection string | `postgres://user:password@host:port/db` |
| `DB_SSL` | Use SSL for database | `true` |
| `JWT_SECRET` | JWT signing secret | Random 32+ character string |
| `JWT_ACCESS_SECRET` | Access token secret | Random 32+ character string |
| `JWT_REFRESH_SECRET` | Refresh token secret | Random 32+ character string |
| `REDIS_URL` | Redis connection URL | `redis://user:password@host:port` |
| `OPENAI_API_KEY` | OpenAI API key | `sk_xxx` |
| `LOG_LEVEL` | Logging verbosity | `info` |

### How to Generate Secure Secrets

Use the following commands to generate secure random strings for your secrets:

```bash
# Generate a random 32-character string for JWT_SECRET
openssl rand -base64 32

# Generate a random 64-character hex string
openssl rand -hex 32
```

## Monitoring

The application includes health check endpoints:

- Backend: `/health` and `/api/health/deep`
- Frontend: `/api/health`

These are used by Docker for container health checks and can also be integrated with monitoring tools.

## Rollback Process

To rollback a deployment:

1. Identify the previous stable version
2. Run the Deploy workflow with a specific tag:
   ```
   # Add a custom tag when running the workflow
   VERSION=2023.05.10.1425-prod
   ```

## Maintenance Mode

To enable maintenance mode:

1. SSH into the server
2. Create a maintenance mode flag:
   ```
   touch /var/www/maintenance_mode
   ```

3. To disable maintenance mode:
   ```
   rm /var/www/maintenance_mode
   ```

## Troubleshooting

### Common Issues

1. **Container not starting**: Check logs with `docker logs container_name`
2. **Database connection issues**: Verify database credentials and network connectivity
3. **Health check failing**: Verify dependent services are running

### Checking Logs

```
# View container logs
docker logs landing-pad-backend-production

# View stack deployment logs
docker stack ps landing-pad-production
```

## Security Considerations

1. **Secrets Management**: All secrets are stored in GitHub Secrets
2. **Container Security**: Updates are regularly applied to base images
3. **Network Security**: Internal services are not exposed publicly
4. **TLS**: All external endpoints use HTTPS

## Backup Strategy

1. **Database**: Daily automated backups
2. **Configuration**: Infrastructure as code tracked in git
3. **User Content**: Regular backups to cloud storage

## Contact

For deployment issues, contact the DevOps team:
- Email: devops@landingpad.digital
- Slack: #deploy-help