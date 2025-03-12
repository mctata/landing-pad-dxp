#!/bin/bash

# This script sets up the environment for Cypress tests

# Install required packages in the frontend
cd frontend
echo "Installing next-auth in frontend..."
npm install next-auth --save-dev

# Install required packages in the backend
cd ../backend
echo "Installing pg in backend..."
npm install pg --save-dev

# Set up test databases
echo "Setting up test database configuration..."
export DATABASE_URL=postgres://test:test@localhost:5432/testdb
export JWT_SECRET=jwt-secret-for-cypress-tests-1234567890
export API_KEY=api-key-for-cypress-tests-1234567890

# Return to root directory
cd ..

echo "Cypress setup complete!"