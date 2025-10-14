import { executeCommand, type RunningProcess } from './utils/execute-command.js';
import type { Config } from './types.js';

/**
 * Start the application using lifecycle.start commands
 * @param config The validated configuration object
 * @returns Cleanup function that stops all running processes
 */
export async function startApp(
  config: Config
): Promise<() => Promise<void>> {
  const runningProcesses: RunningProcess[] = [];

  try {
    for (const cmd of config.lifecycle.start) {
      const runningProcess = await executeCommand(cmd, !!cmd.keepAlive);
      if (runningProcess) {
        runningProcesses.push(runningProcess);
      }
    }

    // Return cleanup function
    return async () => {
      for (const { process, command } of runningProcesses) {
        try {
          process.kill('SIGTERM');
          await process.catch(() => {
            // Ignore errors from killed processes
          });
        } catch (error) {
          console.error(`Failed to stop process "${command}":`, error);
        }
      }
    };
  } catch (error) {
    // If startup fails, cleanup any processes that were started
    for (const { process } of runningProcesses) {
      try {
        process.kill('SIGTERM');
        await process.catch(() => {});
      } catch {
        // Ignore cleanup errors
      }
    }
    throw error;
  }
}
