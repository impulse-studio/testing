import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import type { DetectorResult } from "./docker-compose";

/**
 * Check if file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get dev script name from package.json
 */
async function getDevScript(): Promise<string> {
  try {
    const packageJsonContent = await readFile("package.json", "utf-8");
    const packageJson = JSON.parse(packageJsonContent);
    const scripts = packageJson.scripts || {};

    // Priority: dev, start, serve
    if (scripts.dev) return "dev";
    if (scripts.start) return "start";
    if (scripts.serve) return "serve";

    return "dev"; // fallback
  } catch {
    return "dev";
  }
}

/**
 * Detect Yarn configuration (only if no pnpm or npm lock files exist)
 */
export async function detectYarn(): Promise<DetectorResult | null> {
  // Skip if pnpm or npm is being used
  if (await fileExists("pnpm-lock.yaml")) {
    return null;
  }
  if (await fileExists("package-lock.json")) {
    return null;
  }

  if (!(await fileExists("yarn.lock"))) {
    return null;
  }

  const scriptName = await getDevScript();

  return {
    startCommands: [
      {
        command: `yarn ${scriptName}`,
        keepAlive: true,
      },
    ],
    stopCommands: [
      {
        command: `pkill -f "yarn ${scriptName}"`,
      },
    ],
  };
}
