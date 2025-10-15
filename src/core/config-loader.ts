import { z } from "zod";
import { readYamlFile } from "@/cli/utils/yaml-helper";
import { CONFIG_FILE } from "./constants.js";
import { type Config, configSchema } from "./schemas/config-schema.js";

/**
 * Load and validate the configuration file
 * @returns Promise resolving to validated Config object
 * @throws Error if config file doesn't exist or is invalid
 */
export async function loadConfig(): Promise<Config> {
  try {
    const rawConfig = await readYamlFile<unknown>(CONFIG_FILE);
    const validatedConfig = configSchema.parse(rawConfig);
    return validatedConfig as Config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues
        .map((err) => `  - ${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new Error(`Invalid configuration in ${CONFIG_FILE}:\n${formattedErrors}`);
    }
    throw new Error(`Failed to load configuration from ${CONFIG_FILE}: ${error}`);
  }
}
