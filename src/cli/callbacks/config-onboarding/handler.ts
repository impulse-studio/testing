import chalk from 'chalk';
import { checkConfigExists } from '@/cli/config/check-config';
import { initializeConfig } from '@/cli/config/init-config';
import { runConfigOnboarding } from '@/cli/config/onboarding';

/**
 * Handle --init and --config CLI flags
 * Creates default config if it doesn't exist, then launches onboarding
 */
export async function handleConfigOnboarding(): Promise<void> {
  try {
    const configExists = await checkConfigExists();

    if (!configExists) {
      await initializeConfig();
    }

    // Launch interactive onboarding
    await runConfigOnboarding();
  } catch (error) {
    console.error(chalk.red('\n✗ Configuration setup failed:'), error);
    process.exit(1);
  }
}
