#!/usr/bin/env node
/**
 * Standalone script to run the deployment worker
 */
require('dotenv').config();
const { startWorker } = require('../src/workers/deploymentWorker');

// Start worker
console.log('Starting deployment worker in standalone mode...');
startWorker().catch(err => {
  console.error('Failed to start worker:', err);
  process.exit(1);
});