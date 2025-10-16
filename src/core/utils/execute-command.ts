import chalk from "chalk";
import { execa } from "execa";
import type { LifecycleCommand } from "../types.js";

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
  isBackground: boolean,
): Promise<RunningProcess | null> {
  const timeout = cmd.timeout || 30000;

  // Split command into parts for execa
  const [command, ...args] = cmd.command.split(" ");

  // Check if command is defined
  if (!command) {
    throw new Error(`Invalid command: ${cmd.command}`);
  }

  // Compute environment variables before creating local process variable
  const envVars = cmd.envs ? { ...process.env, ...cmd.envs } : process.env;

  if (isBackground || cmd.keepAlive) {
    // Log execution start for background process - only show "Executing" since it runs indefinitely
    process.stdout.write(`${chalk.cyan("Executing:")} ${chalk.dim(cmd.command)}\n`);

    // Start process in background - no timeout since it runs indefinitely
    // The process will be manually killed later via the cleanup function
    const childProcess = execa(command, args, {
      cleanup: true,
      detached: false,
      // Don't pass timeout - this process runs until manually killed
      env: envVars,
    });

    // Don't await, just return the process
    // Skip "Executed" message for background processes since they run indefinitely
    return { process: childProcess, command: cmd.command };
  }

  // Log execution start for synchronous command (without newline)
  process.stdout.write(`${chalk.cyan("Executing:")} ${chalk.dim(cmd.command)}`);

  // Execute synchronously and wait for completion
  await execa(command, args, {
    timeout,
    env: envVars,
  });

  // Clear the line and overwrite with success message
  process.stdout.write(`\r\x1b[K${chalk.green("Executed :")} ${chalk.dim(cmd.command)}\n`);

  return null;
}
