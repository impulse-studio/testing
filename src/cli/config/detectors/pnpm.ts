import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import type { DetectorResult } from './docker-compose';

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
    const packageJsonContent = await readFile('package.json', 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    const scripts = packageJson.scripts || {};

    // Priority: dev, start, serve
    if (scripts.dev) return 'dev';
    if (scripts.start) return 'start';
    if (scripts.serve) return 'serve';

    return 'dev'; // fallback
  } catch {
    return 'dev';
  }
}

/**
 * Detect pnpm configuration
 */
export async function detectPnpm(): Promise<DetectorResult | null> {
  if (!(await fileExists('pnpm-lock.yaml'))) {
    return null;
  }

  const scriptName = await getDevScript();

  return {
    startCommands: [
      {
        command: `pnpm ${scriptName}`,
        keepAlive: true,
      },
    ],
    stopCommands: [
      {
        command: `pkill -f "pnpm ${scriptName}"`,
      },
    ],
  };
}
