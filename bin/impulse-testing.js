#!/usr/bin/env node

// Entry point for the impulse-test CLI
import('../dist/cli/index.js').catch((error) => {
  console.error('Failed to start impulse-test:', error);
  process.exit(1);
});

