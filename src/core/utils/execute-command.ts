import { execa } from 'execa';
import type { LifecycleCommand } from '../types.js';

export interface RunningProcess {
  process: ReturnType<typeof execa>;
  command: string;
}

/**
 * Execute a single lifecycle command
 * @param cmd The lifecycle command to execute
 * @param isBackground Whether to run the command in the background
 * @returns Promise that resolves when command completes (or immediately if background)
 */
export async function executeCommand(
  cmd: LifecycleCommand,
  isBackground: boolean
): Promise<RunningProcess | null> {
  const timeout = cmd.timeout || 30000;

  // Split command into parts for execa
  const [command, ...args] = cmd.command.split(' ');

  // Check if command is defined
  if (!command) {
    throw new Error(`Invalid command: ${cmd.command}`);
  }

  if (isBackground || cmd.keepAlive) {
    // Start process in background - no timeout since it runs indefinitely
    // The process will be manually killed later via the cleanup function
    const process = execa(command, args, {
      cleanup: true,
      detached: false,
      // Don't pass timeout - this process runs until manually killed
    });

    // Don't await, just return the process
    return { process, command: cmd.command };
  }

  // Execute synchronously and wait for completion
  await execa(command, args, { timeout });
  return null;
}
