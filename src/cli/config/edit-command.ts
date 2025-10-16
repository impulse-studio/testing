import { confirm, input } from "@inquirer/prompts";
import type { LifecycleCommand } from "@/core/schemas/lifecycle-command-schema";
import { lifecycleCommandSchema } from "@/core/schemas/lifecycle-command-schema";

/**
 * Edit or create a lifecycle command
 * @param existingCommand - Optional existing command to edit
 * @param defaultCommand - Optional default command (from auto-detection)
 * @returns The edited/created command, or null if cancelled
 */
export async function editCommand(
  existingCommand?: LifecycleCommand,
  defaultCommand?: string,
): Promise<LifecycleCommand | null> {
  try {
    // 1. Get command string
    const command = await input({
      message: "Command:",
      default: existingCommand?.command ?? defaultCommand ?? "",
      validate: (value) => value.trim().length > 0 || "Command is required",
    });

    // 2. Ask about keepAlive
    const keepAlive = await confirm({
      message: "Keep command running in background?",
      default: existingCommand?.keepAlive ?? true,
    });

    // 3. If keepAlive is false, ask for timeout
    let timeout: number | undefined;
    if (!keepAlive) {
      const timeoutInput = await input({
        message: "Timeout in milliseconds (optional):",
        default: existingCommand?.timeout?.toString() ?? "",
        validate: (value) => {
          if (value.trim() === "") return true; // optional
          const num = Number.parseInt(value, 10);
          if (Number.isNaN(num) || num <= 0) {
            return "Timeout must be a positive number";
          }
          return true;
        },
      });

      if (timeoutInput.trim() !== "") {
        timeout = Number.parseInt(timeoutInput, 10);
      }
    }

    // 4. Ask about environment variables
    let envs: Record<string, string> | undefined;

    // Display existing environment variables if editing
    if (existingCommand?.envs && Object.keys(existingCommand.envs).length > 0) {
      console.log("\nCurrent environment variables:");
      for (const [key, value] of Object.entries(existingCommand.envs)) {
        console.log(`  ${key}=${value}`);
      }
      console.log("");
    }

    const addEnvs = await confirm({
      message: "Add environment variables?",
      default: existingCommand?.envs !== undefined && Object.keys(existingCommand.envs).length > 0,
    });

    if (addEnvs) {
      envs = {};
      console.log("\nEnter environment variables (leave name empty to finish):");

      while (true) {
        const envName = await input({
          message: "Environment variable name:",
          default: "",
          validate: (value) => {
            if (value.trim() === "") return true; // empty means done
            // Basic validation: alphanumeric and underscore, can't start with number
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value.trim())) {
              return "Variable name must start with a letter or underscore and contain only letters, numbers, and underscores";
            }
            return true;
          },
        });

        // Empty name means user is done adding variables
        if (envName.trim() === "") {
          break;
        }

        const envValue = await input({
          message: `Value for ${envName}:`,
          default: "",
        });

        envs[envName.trim()] = envValue;
      }

      // If no variables were actually added, set envs to undefined
      if (Object.keys(envs).length === 0) {
        envs = undefined;
      }
    }

    // 5. Build command object
    const commandObj: LifecycleCommand = {
      command: command.trim(),
      ...(keepAlive ? { keepAlive: true } : {}),
      ...(timeout !== undefined ? { timeout } : {}),
      ...(envs !== undefined ? { envs } : {}),
    };

    // 6. Validate with schema
    try {
      lifecycleCommandSchema.parse(commandObj);
    } catch (error) {
      console.error("Invalid command configuration:", error);
      return null;
    }

    return commandObj;
  } catch (_error) {
    // User cancelled (Ctrl+C)
    return null;
  }
}
