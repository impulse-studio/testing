import type { LifecycleCommand } from '@/core/schemas/lifecycle-command-schema';
import { detectDockerCompose } from './docker-compose';
import { detectPnpm } from './pnpm';
import { detectNpm } from './npm';
import { detectBun } from './bun';
import { detectYarn } from './yarn';

export interface AutoDetectionResult {
  startCommands: LifecycleCommand[];
  stopCommands: LifecycleCommand[];
}

/**
 * Run all detectors and combine results
 * Priority: Docker Compose first, then package managers (pnpm > bun > npm > yarn)
 */
export async function autoDetectCommands(): Promise<AutoDetectionResult> {
  const startCommands: LifecycleCommand[] = [];
  const stopCommands: LifecycleCommand[] = [];

  try {
    // 1. Check for Docker Compose
    const dockerResult = await detectDockerCompose();
    if (dockerResult) {
      startCommands.push(...dockerResult.startCommands);
      stopCommands.push(...dockerResult.stopCommands);
    }

    // 2. Check for package managers (only one will match due to lock file checks)
    const packageManagerDetectors = [
      detectPnpm,
      detectBun,
      detectNpm,
      detectYarn,
    ];

    for (const detector of packageManagerDetectors) {
      const result = await detector();
      if (result) {
        startCommands.push(...result.startCommands);
        stopCommands.push(...result.stopCommands);
        break; // Only use the first matching package manager
      }
    }
  } catch (error) {
    // If detection fails, return empty arrays
    console.error('Auto-detection failed:', error);
  }

  return { startCommands, stopCommands };
}
