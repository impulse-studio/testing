import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";
import { writeYamlFile } from "@/cli/utils/yaml-helper";
import { CONFIG_FILE, TESTING_DIR } from "@/core/constants";

/**
 * Create default config file structure
 */
export async function initializeConfig(): Promise<void> {
  try {
    // 1. Create .testing directory if it doesn't exist
    await mkdir(TESTING_DIR, { recursive: true });

    // 2. Create default config.yml
    const defaultConfig = {
      lifecycle: {
        start: [],
        stop: [],
      },
      screenshots: {
        diffThreshold: 0,
      },
    };

    await writeYamlFile(CONFIG_FILE, defaultConfig);

    // 3. Create .testing/.gitignore
    const gitignorePath = join(TESTING_DIR, ".gitignore");
    const gitignoreContent = "temp/\n";
    await writeFile(gitignorePath, gitignoreContent, "utf-8");

    console.log(chalk.green("\n✓ Configuration files initialized"));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to initialize config: ${errorMessage}`);
  }
}
