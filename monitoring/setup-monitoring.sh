#!/bin/bash

# Setup script for Landing Pad DXP monitoring stack
set -e

# Display header
echo "======================================"
echo "Landing Pad DXP Monitoring Setup"
echo "======================================"
echo

# Check for Docker and Docker Compose
if ! command -v docker &> /dev/null; then
  echo "Error: Docker is not installed. Please install Docker first."
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo "Error: Docker Compose is not installed. Please install Docker Compose first."
  exit 1
fi

# Create required directories
echo "Creating necessary directories..."
mkdir -p ./monitoring/prometheus
mkdir -p ./monitoring/grafana/provisioning/dashboards
mkdir -p ./monitoring/grafana/provisioning/datasources
mkdir -p ./monitoring/alertmanager

# Check if application containers are running
if docker ps | grep -q "landing-pad-frontend\|landing-pad-backend"; then
  echo "✅ Landing Pad application containers are running."
else
  echo "⚠️  Warning: Landing Pad application containers not detected."
  echo "   You may need to start the application separately for metrics collection."
fi

# Start the monitoring stack
echo
echo "Starting monitoring stack..."
docker-compose -f docker-compose.monitoring.yml up -d

# Check service health
echo
echo "Checking service health..."
sleep 5

if docker ps | grep -q "prometheus"; then
  echo "✅ Prometheus is running."
else
  echo "❌ Prometheus failed to start."
fi

if docker ps | grep -q "grafana"; then
  echo "✅ Grafana is running."
else
  echo "❌ Grafana failed to start."
fi

if docker ps | grep -q "alertmanager"; then
  echo "✅ AlertManager is running."
else
  echo "❌ AlertManager failed to start."
fi

if docker ps | grep -q "node-exporter"; then
  echo "✅ Node Exporter is running."
else
  echo "❌ Node Exporter failed to start."
fi

# Display access information
echo
echo "======================================"
echo "Monitoring stack is set up and running!"
echo "======================================"
echo "Access your monitoring services at:"
echo "  - Prometheus:   http://localhost:9090"
echo "  - Grafana:      http://localhost:3001"
echo "    Username: admin"
echo "    Password: landingpad_admin"
echo "  - AlertManager: http://localhost:9093"
echo
echo "Documentation: docs/monitoring-guide.md"
echo "======================================"