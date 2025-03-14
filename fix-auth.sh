#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running Authentication System Reset Script${NC}"
echo "This script will reset the authentication system to resolve common issues."

# Check if docker is running
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}Docker daemon is not running or cannot be accessed!${NC}"
  echo "Please start Docker and try again."
  exit 1
fi

# Clear browser storage advice
echo -e "\n${YELLOW}IMPORTANT: After running this script, you should also:${NC}"
echo -e "1. Clear your browser cookies for localhost"
echo -e "2. Clear localStorage for localhost in your browser's developer tools"
echo -e "3. Close and reopen your browser"

# Force kill any remaining containers
echo -e "\n${YELLOW}Force killing any remaining containers...${NC}"
docker kill landing-pad-frontend-dev landing-pad-backend-dev landing-pad-redis-dev landing-pad-postgres-dev 2>/dev/null || true
docker rm landing-pad-frontend-dev landing-pad-backend-dev landing-pad-redis-dev landing-pad-postgres-dev 2>/dev/null || true

# Ask for confirmation before removing volumes
echo -e "\n${YELLOW}IMPORTANT: This will remove the database volume and all user data${NC}"
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Operation cancelled.${NC}"
  exit 0
fi

# Remove volumes to force clean database
echo -e "\n${YELLOW}Removing database volume to force clean state...${NC}"
docker volume rm landing-pad-dxp_postgres-data-dev 2>/dev/null || true

# Check if S3 is properly configured
echo -e "\n${YELLOW}Checking S3 configuration...${NC}"
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo -e "${YELLOW}AWS credentials not found in environment. S3 storage may not work properly.${NC}"
  echo -e "Please ensure your .env file contains proper S3 credentials."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Operation cancelled.${NC}"
    exit 0
  fi
fi

# Pull latest images to ensure we have the most recent versions
echo -e "\n${YELLOW}Pulling latest images...${NC}"
docker-compose -f docker-compose.dev.yml pull

# Rebuild and start containers with extra timeout
echo -e "\n${YELLOW}Rebuilding and starting containers...${NC}"
COMPOSE_HTTP_TIMEOUT=300 DOCKER_CLIENT_TIMEOUT=300 docker-compose -f docker-compose.dev.yml up --build -d

# Run migrations to ensure database is up to date
echo -e "\n${YELLOW}Waiting for database to be ready...${NC}"
sleep 15

echo -e "\n${YELLOW}Running migrations...${NC}"
docker exec landing-pad-backend-dev npm run migrate

echo -e "\n${YELLOW}Running database seed...${NC}"
docker exec landing-pad-backend-dev npm run db:seed

# Verify S3 connection
echo -e "\n${YELLOW}Verifying S3 connection...${NC}"
docker exec landing-pad-backend-dev node -e "require('./src/services/storageService').healthCheck().then(console.log)"

# Verify services are running
echo -e "\n${YELLOW}Verifying services...${NC}"
BACKEND_RUNNING=$(docker ps | grep landing-pad-backend-dev | wc -l)
FRONTEND_RUNNING=$(docker ps | grep landing-pad-frontend-dev | wc -l)

if [ "$BACKEND_RUNNING" -eq 1 ] && [ "$FRONTEND_RUNNING" -eq 1 ]; then
  echo -e "\n${GREEN}Authentication reset completed successfully!${NC}"
  echo -e "${GREEN}Services should be available at:${NC}"
  echo -e "- Frontend: http://localhost:3000"
  echo -e "- Backend API: http://localhost:3001"
  echo -e "\n${YELLOW}Test users:${NC}"
  echo -e "Admin: admin@example.com / password123"
  echo -e "Regular user: john@example.com / password123"
  
  echo -e "\n${YELLOW}REMINDER: Clear your browser cookies and localStorage for localhost before testing!${NC}"
else
  echo -e "\n${RED}There may be issues with the services. Please check docker logs:${NC}"
  echo "docker logs landing-pad-backend-dev"
  echo "docker logs landing-pad-frontend-dev"
fi