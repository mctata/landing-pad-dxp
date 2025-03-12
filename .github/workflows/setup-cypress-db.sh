#!/bin/bash

# This script sets up a test database for Cypress workflows

# Install PostgreSQL client if needed
echo "Setting up PostgreSQL client for Cypress..."
sudo apt-get update -y
sudo apt-get install -y postgresql-client

# Start PostgreSQL service if necessary
sudo service postgresql start || true

# Create test database and user
echo "Creating test database and user for Cypress..."
sudo -u postgres psql -c "CREATE USER test WITH PASSWORD 'test';" || true
sudo -u postgres psql -c "CREATE DATABASE testdb OWNER test;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE testdb TO test;" || true

# Create basic schema
echo "Creating basic schema for Cypress tests..."
PGPASSWORD=test psql -h localhost -U test -d testdb -c "
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (email, password, first_name, last_name)
VALUES ('test@example.com', 'password123', 'Test', 'User')
ON CONFLICT (email) DO NOTHING;
" || true

echo "Database setup for Cypress complete!"