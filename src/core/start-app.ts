import type { Config } from "./types.js";
import { executeCommand, type RunningProcess } from "./utils/execute-command.js";
import { waitForUrl } from "./utils/wait-for-url.js";

/**
 * Start the application using lifecycle.start commands
 * @param config The validated configuration object
 * @param url Optional URL to wait for after starting commands with keepAlive
 * @returns Cleanup function that stops all running processes
 */
export async function startApp(config: Config, url?: string): Promise<() => Promise<void>> {
  const runningProcesses: RunningProcess[] = [];

  try {
    for (const cmd of config.lifecycle.start) {
      const runningProcess = await executeCommand(cmd, !!cmd.keepAlive);
      if (runningProcess) {
        runningProcesses.push(runningProcess);
      }
    }

    // Wait for URL to become available if:
    // 1. A URL was provided AND
    // 2. At least one command has keepAlive: true
    const hasKeepAliveCommand = config.lifecycle.start.some((cmd) => cmd.keepAlive);
    if (url && hasKeepAliveCommand) {
      await waitForUrl(url);
    }

    // Return cleanup function
    return async () => {
      for (const { process, command } of runningProcesses) {
        try {
          process.kill("SIGTERM");
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
        process.kill("SIGTERM");
        await process.catch(() => {});
      } catch {
        // Ignore cleanup errors
      }
    }
    throw error;
  }
}
