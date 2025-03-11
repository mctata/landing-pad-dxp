# Monitoring Guide for Landing Pad DXP

This guide explains how to set up and use the monitoring system for the Landing Pad DXP platform.

## Overview

The Landing Pad DXP monitoring stack consists of:

1. **Prometheus** - for collecting and storing metrics
2. **Grafana** - for visualizing metrics data
3. **AlertManager** - for handling and routing alerts
4. **Node Exporter** - for collecting host system metrics
5. **Application metrics** - custom metrics exposed by the frontend and backend services

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- The Landing Pad DXP application running (frontend and backend)

### Starting the Monitoring Stack

1. Run the monitoring stack alongside your application:

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

2. Access the services:
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (username: admin, password: landingpad_admin)
   - AlertManager: http://localhost:9093

## Available Metrics

### Frontend Metrics

The frontend exposes metrics at `/api/metrics` in Prometheus format:

- `app_http_requests_total` - Total number of HTTP requests
- `app_http_requests_by_path_total` - Requests broken down by path
- `app_http_errors_total` - Total number of HTTP errors
- `app_memory_usage_bytes` - Memory usage by type (rss, heapTotal, heapUsed)
- `app_cpu_load` - CPU load averages (1m, 5m, 15m)
- `app_uptime_seconds` - Application uptime in seconds
- `app_system_memory_bytes` - Host system memory info
- `app_system_cpu_count` - Number of CPUs available

### Health Check Endpoint

The frontend also provides a JSON health check endpoint at `/api/health` that returns:

- Service status and version
- Memory usage metrics
- CPU usage metrics 
- Request and error counts
- System information

## Dashboards

The following dashboards are available in Grafana:

1. **Landing Pad DXP Dashboard** - General application metrics
   - HTTP requests and errors
   - Memory usage
   - CPU load
   - Request breakdown by path

## Alerting

Alerting is set up in Prometheus and AlertManager for the following conditions:

- High error rate (> 5% of requests)
- High memory usage (> 80% of available memory)
- High CPU usage (> 80% for over 5 minutes)
- Application downtime

### Alert Configuration

Alerts are defined in Prometheus alert rules and processed by AlertManager. The alert configuration is located in:

- Alert rules: `monitoring/prometheus/alert_rules.yml`
- AlertManager configuration: `monitoring/alertmanager/config.yml`

### Alert Notifications

Alerts can be sent via multiple channels:

1. **Email notifications** - Configure SMTP settings in the AlertManager config
2. **Slack notifications** - Uncomment and configure the Slack webhook in the AlertManager config
3. **Grafana alerts** - Additional alerts can be configured directly in Grafana dashboards

## Adding Custom Metrics

### Frontend

To add custom metrics to the frontend:

1. Import the tracking utilities:

```typescript
import { trackClientRequest, trackClientError } from '@/lib/monitoring';
```

2. Track requests in components:

```typescript
// Track a page view or component interaction
trackClientRequest('/dashboard/view');

// Track errors
try {
  // Your code
} catch (error) {
  trackClientError(error, 'Dashboard component');
}
```

## Troubleshooting

### Common Issues

1. **Metrics not appearing in Prometheus**
   - Verify the services are running: `docker ps`
   - Check if the metrics endpoint is accessible
   - Verify Prometheus targets: http://localhost:9090/targets

2. **Dashboard not showing data in Grafana**
   - Verify the Prometheus data source is configured correctly
   - Check for errors in Grafana logs: `docker logs grafana`
   - Try manually querying metrics in the Explore section

3. **High resource usage by monitoring stack**
   - Adjust Prometheus storage retention
   - Reduce scrape frequency in prometheus.yml
   - Set resource limits in docker-compose.yml

## Best Practices

1. **Metric Naming**
   - Use consistent prefixes (e.g., `app_` for application metrics)
   - Include units in metric names where appropriate

2. **Labels**
   - Use labels to add dimensions to metrics
   - Avoid high cardinality labels (like user IDs)

3. **Monitoring Levels**
   - System (CPU, memory, disk)
   - Application (requests, errors)
   - Business (conversions, user activity)

## Advanced Configuration

For advanced use cases, you can modify the following files:

- `monitoring/prometheus/prometheus.yml` - Prometheus configuration
- `monitoring/grafana/provisioning/dashboards/` - Grafana dashboards
- `monitoring/grafana/provisioning/datasources/` - Grafana data sources