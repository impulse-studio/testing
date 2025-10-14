#!/usr/bin/env node

import { Command } from 'commander';
import { runInteractiveMode } from './interactive-mode.js';
import { handleCreateNewStory } from './callbacks/create-new-story/handler.js';
import { handleRunMultipleStories } from './callbacks/run-multiple-stories/handler.js';
import { handleCIMode } from './callbacks/ci-mode/handler.js';
import { handleConfigOnboarding } from './callbacks/config-onboarding/handler.js';
import { checkConfigOrWarn } from '@/cli/config/check-config';
import packageJson from '../../package.json' with { type: 'json' };

const program = new Command();

/**
 * Helper function to collect multiple values for --story option
 */
function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}

program
  .name('impulse-testing')
  .description('E2E testing library for web apps without coding')
  .version(packageJson.version)
  .option('--new', 'Create a new story without interactive menu')
  .option('--story <id>', 'Run specific story by ID (can be used multiple times)', collect, [])
  .option('--ci', 'Run in CI mode (non-interactive, auto-fail on screenshot mismatch)')
  .option('--init', 'Initialize and configure the testing environment')
  .option('--config', 'Alias for --init (configure the testing environment)')
  .addHelpText('after', `

Examples:
  $ impulse-testing                    # Interactive mode (default)
  $ impulse-testing --new              # Create new story directly
  $ impulse-testing --story test1      # Run specific story
  $ impulse-testing --story test1 --story test2  # Run multiple stories
  $ impulse-testing --ci               # Run all stories in CI mode
  $ impulse-testing --ci --story test1 # Run specific story in CI mode
  $ impulse-testing --init             # Initialize configuration
  $ impulse-testing --config           # Configure settings (alias for --init)
`);

program
  .action(async (options: { new?: boolean; story: string[]; ci?: boolean; init?: boolean; config?: boolean }) => {
    // Handle --init or --config flag
    if (options.init || options.config) {
      await handleConfigOnboarding();
      return;
    }

    // Check if config exists before running any commands (except --init/--config)
    const configExists = await checkConfigOrWarn();
    if (!configExists) {
      process.exit(1);
    }

    // Handle --new flag
    if (options.new) {
      await handleCreateNewStory();
      return;
    }

    // Handle --ci flag
    if (options.ci) {
      await handleCIMode(options.story);
      return;
    }

    // Handle --story flag (without --ci)
    if (options.story.length > 0) {
      await handleRunMultipleStories(options.story);
      return;
    }

    // Default: interactive mode
    await runInteractiveMode();
  });

program.parse();

