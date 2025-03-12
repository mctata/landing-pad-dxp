#!/bin/bash

# This script sets up a test database for CI workflows

# Install PostgreSQL client if needed
echo "Setting up PostgreSQL client..."
sudo apt-get update -y
sudo apt-get install -y postgresql-client

# Start PostgreSQL service if necessary
sudo service postgresql start || true

# Create test database and user
echo "Creating test database and user..."
sudo -u postgres psql -c "CREATE USER test WITH PASSWORD 'test';" || true
sudo -u postgres psql -c "CREATE DATABASE testdb OWNER test;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE testdb TO test;" || true

echo "Database setup complete!"