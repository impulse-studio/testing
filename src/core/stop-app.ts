import { executeCommand } from './utils/execute-command.js';
import type { Config } from './types.js';

/**
 * Stop the application by executing cleanup function and lifecycle.stop commands
 * @param cleanup The cleanup function returned by startApp
 * @param config The validated configuration object
 */
export async function stopApp(
  cleanup: () => Promise<void>,
  config: Config
): Promise<void> {
  // First, execute the cleanup function to stop running processes
  await cleanup();

  // Then execute lifecycle.stop commands
  for (const cmd of config.lifecycle.stop) {
    try {
      await executeCommand(cmd, false);
    } catch (error) {
      console.error(`Failed to execute stop command "${cmd.command}":`, error);
    }
  }
}
