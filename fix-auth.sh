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
else
  echo -e "\n${RED}There may be issues with the services. Please check docker logs:${NC}"
  echo "docker logs landing-pad-backend-dev"
  echo "docker logs landing-pad-frontend-dev"
fi