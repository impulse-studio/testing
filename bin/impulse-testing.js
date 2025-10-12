#!/usr/bin/env node

import('../dist/cli/index.js').catch((error) => {
  console.error('Failed to start impulse-testing:', error);
  process.exit(1);
});
