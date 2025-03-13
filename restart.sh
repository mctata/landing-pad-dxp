#\!/bin/bash

# Stop and remove all containers
echo "Stopping and removing all containers..."
docker-compose -f docker-compose.dev.yml down

# Remove node_modules and temp files
echo "Cleaning node_modules..."
cd frontend && npm install critters --save && cd ..

# Rebuild and start containers
echo "Rebuilding and starting containers..."
docker-compose -f docker-compose.dev.yml up --build -d

echo "All services have been restarted. Frontend available at http://localhost:3000"
