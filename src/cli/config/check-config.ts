import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import chalk from 'chalk';
import { CONFIG_FILE } from '@/core/constants';

/**
 * Check if the config file exists
 * @returns True if config exists, false otherwise
 */
export async function checkConfigExists(): Promise<boolean> {
  try {
    await access(CONFIG_FILE, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if config exists and show helpful message if not
 * @returns True if config exists, false otherwise
 */
export async function checkConfigOrWarn(): Promise<boolean> {
  const exists = await checkConfigExists();

  if (!exists) {
    console.log(chalk.yellow('\n⚠️  Configuration file not found'));
    console.log(chalk.gray(`Expected location: ${CONFIG_FILE}`));
    console.log(chalk.blue('\n💡 Run configuration setup:'));
    console.log(chalk.cyan('   npx impulse-testing --init\n'));
  }

  return exists;
}
