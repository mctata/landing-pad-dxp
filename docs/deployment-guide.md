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

The CI/CD pipeline uses GitHub Actions to:

1. Run tests
2. Build Docker images
3. Push images to Docker Hub
4. Deploy to staging or production environments

### Workflow Files

- `.github/workflows/ci.yml` - Continuous Integration workflow
- `.github/workflows/deploy.yml` - Deployment workflow

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

### Required Secrets for GitHub Actions

- `DOCKER_HUB_USERNAME` - Docker Hub username
- `DOCKER_HUB_ACCESS_TOKEN` - Docker Hub access token
- `SSH_PRIVATE_KEY` - SSH key for deployment servers
- `STAGING_HOST` - Staging server hostname (user@hostname)
- `PRODUCTION_HOST` - Production server hostname (user@hostname)
- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - Secret for JWT authentication
- `API_KEY` - API key for external services
- `VERCEL_TOKEN` - (Optional) Vercel token if using Vercel deployment
- `VERCEL_ORG_ID` - (Optional) Vercel organization ID
- `VERCEL_PROJECT_ID` - (Optional) Vercel project ID

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