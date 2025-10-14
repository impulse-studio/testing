import { select, confirm, Separator } from '@inquirer/prompts';
import chalk from 'chalk';
import type { LifecycleCommand } from '@/core/schemas/lifecycle-command-schema';
import { editCommand } from './edit-command';
import { autoDetectCommands } from './detectors';

const ADD_NEW_OPTION = '__add_new__';
const BACK_OPTION = '__back__';

/**
 * Format a command for display
 */
function formatCommand(cmd: LifecycleCommand, index: number): string {
  const parts: string[] = [chalk.cyan(cmd.command)];

  if (cmd.keepAlive) {
    parts.push(chalk.dim('(keep-alive)'));
  } else if (cmd.timeout) {
    parts.push(chalk.dim(`(timeout: ${cmd.timeout}ms)`));
  }

  return `${index + 1}. ${parts.join(' ')}`;
}

/**
 * Manage a list of lifecycle commands (start or stop)
 * @param commandType - Type of command being managed ('start' or 'stop')
 * @param commands - Current list of commands
 * @returns Updated list of commands, or null if user wants to go back
 */
export async function manageCommands(
  commandType: 'start' | 'stop',
  commands: LifecycleCommand[]
): Promise<LifecycleCommand[] | null> {
  let currentCommands = [...commands];
  let isFirstAdd = currentCommands.length === 0;

  while (true) {
    // Build choices
    const choices: Array<{ name: string; value: string } | Separator> = [];

    // Show existing commands
    if (currentCommands.length > 0) {
      choices.push(
        ...currentCommands.map((cmd, index) => ({
          name: formatCommand(cmd, index),
          value: `command_${index}`,
        }))
      );
      choices.push(new Separator());
    }

    // Add new command option
    choices.push({
      name: chalk.green('+ Add new command'),
      value: ADD_NEW_OPTION,
    });

    // Back option
    choices.push({
      name: chalk.gray('← Back to main menu'),
      value: BACK_OPTION,
    });

    // Show selection menu
    const selection = await select({
      message: `Manage ${commandType} commands:`,
      choices,
    });

    // Handle back
    if (selection === BACK_OPTION) {
      return currentCommands;
    }

    // Handle add new
    if (selection === ADD_NEW_OPTION) {
      let defaultCommand: string | undefined = undefined;

      // Auto-detect on first add
      if (isFirstAdd) {
        console.log(chalk.gray('Detecting project configuration...'));
        const detected = await autoDetectCommands();
        const detectedCommands =
          commandType === 'start' ? detected.startCommands : detected.stopCommands;

        if (detectedCommands.length > 0) {
          defaultCommand = detectedCommands[0]?.command;
          console.log(chalk.gray(`Detected: ${defaultCommand}\n`));
        }
      }

      const newCommand = await editCommand(undefined, defaultCommand);
      if (newCommand) {
        currentCommands.push(newCommand);
        console.log(chalk.green('✓ Command added\n'));
        isFirstAdd = false;
      }
      continue;
    }

    // Handle edit/delete existing command
    const index = Number.parseInt(selection.replace('command_', ''), 10);
    const selectedCommand = currentCommands[index];

    if (!selectedCommand) continue;

    // Ask what to do with this command
    const action = await select({
      message: `Command: ${chalk.cyan(selectedCommand.command)}`,
      choices: [
        { name: 'Edit', value: 'edit' },
        { name: chalk.red('Delete'), value: 'delete' },
        { name: chalk.gray('Cancel'), value: 'cancel' },
      ],
    });

    if (action === 'edit') {
      const edited = await editCommand(selectedCommand);
      if (edited) {
        currentCommands[index] = edited;
        console.log(chalk.green('✓ Command updated\n'));
      }
    } else if (action === 'delete') {
      const confirmDelete = await confirm({
        message: 'Are you sure you want to delete this command?',
        default: false,
      });

      if (confirmDelete) {
        currentCommands.splice(index, 1);
        console.log(chalk.green('✓ Command deleted\n'));
      }
    }
  }
}
