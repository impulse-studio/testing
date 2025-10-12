#!/usr/bin/env node

import { Command } from 'commander';
import { runInteractiveMode } from './interactive-mode';
import packageJson from '../../package.json' with { type: 'json' };

const program = new Command();

program
  .name('impulse-testing')
  .description('E2E testing library for web apps without coding')
  .version(packageJson.version);

program
  .action(async () => {
    await runInteractiveMode();
  });

program.parse();

