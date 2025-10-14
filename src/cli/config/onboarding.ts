import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import { readYamlFile, writeYamlFile } from '@/cli/utils/yaml-helper';
import { CONFIG_FILE } from '@/core/constants';
import type { Config } from '@/core/schemas/config-schema';
import { manageCommands } from './manage-commands';

const EXIT_OPTION = '__exit__';
const START_COMMANDS_OPTION = 'start_commands';
const STOP_COMMANDS_OPTION = 'stop_commands';

/**
 * Main configuration onboarding flow
 */
export async function runConfigOnboarding(): Promise<void> {
  console.log(chalk.bold('\n⚙️  Configuration Setup\n'));

  try {
    // Load current config
    let config = await readYamlFile<Config>(CONFIG_FILE);

    while (true) {
      // Show main menu
      const choice = await select({
        message: 'What would you like to configure?',
        choices: [
          {
            name: `Start Commands ${chalk.dim(`(${config.lifecycle.start.length} configured)`)}`,
            value: START_COMMANDS_OPTION,
          },
          {
            name: `Stop Commands ${chalk.dim(`(${config.lifecycle.stop.length} configured)`)}`,
            value: STOP_COMMANDS_OPTION,
          },
          {
            name: chalk.green('✓ Save and Exit'),
            value: EXIT_OPTION,
          },
        ],
      });

      // Handle exit
      if (choice === EXIT_OPTION) {
        // Save config
        await writeYamlFile(CONFIG_FILE, config);
        console.log(chalk.green('\n✓ Configuration saved\n'));
        break;
      }

      // Handle start commands
      if (choice === START_COMMANDS_OPTION) {
        const updatedCommands = await manageCommands('start', config.lifecycle.start);
        if (updatedCommands !== null) {
          config.lifecycle.start = updatedCommands;
          // Auto-save after each change
          await writeYamlFile(CONFIG_FILE, config);
        }
      }

      // Handle stop commands
      if (choice === STOP_COMMANDS_OPTION) {
        const updatedCommands = await manageCommands('stop', config.lifecycle.stop);
        if (updatedCommands !== null) {
          config.lifecycle.stop = updatedCommands;
          // Auto-save after each change
          await writeYamlFile(CONFIG_FILE, config);
        }
      }

      // Reload config to show updated counts
      config = await readYamlFile<Config>(CONFIG_FILE);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`\n✗ Configuration failed: ${errorMessage}\n`));
    throw error;
  }
}
