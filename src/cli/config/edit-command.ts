import { input, confirm } from '@inquirer/prompts';
import type { LifecycleCommand } from '@/core/schemas/lifecycle-command-schema';
import { lifecycleCommandSchema } from '@/core/schemas/lifecycle-command-schema';

/**
 * Edit or create a lifecycle command
 * @param existingCommand - Optional existing command to edit
 * @param defaultCommand - Optional default command (from auto-detection)
 * @returns The edited/created command, or null if cancelled
 */
export async function editCommand(
  existingCommand?: LifecycleCommand,
  defaultCommand?: string
): Promise<LifecycleCommand | null> {
  try {
    // 1. Get command string
    const command = await input({
      message: 'Command:',
      default: existingCommand?.command ?? defaultCommand ?? '',
      validate: (value) => value.trim().length > 0 || 'Command is required',
    });

    // 2. Ask about keepAlive
    const keepAlive = await confirm({
      message: 'Keep command running in background?',
      default: existingCommand?.keepAlive ?? true,
    });

    // 3. If keepAlive is false, ask for timeout
    let timeout: number | undefined = undefined;
    if (!keepAlive) {
      const timeoutInput = await input({
        message: 'Timeout in milliseconds (optional):',
        default: existingCommand?.timeout?.toString() ?? '',
        validate: (value) => {
          if (value.trim() === '') return true; // optional
          const num = Number.parseInt(value, 10);
          if (Number.isNaN(num) || num <= 0) {
            return 'Timeout must be a positive number';
          }
          return true;
        },
      });

      if (timeoutInput.trim() !== '') {
        timeout = Number.parseInt(timeoutInput, 10);
      }
    }

    // 4. Build command object
    const commandObj: LifecycleCommand = {
      command: command.trim(),
      ...(keepAlive ? { keepAlive: true } : {}),
      ...(timeout !== undefined ? { timeout } : {}),
    };

    // 5. Validate with schema
    try {
      lifecycleCommandSchema.parse(commandObj);
    } catch (error) {
      console.error('Invalid command configuration:', error);
      return null;
    }

    return commandObj;
  } catch (error) {
    // User cancelled (Ctrl+C)
    return null;
  }
}
