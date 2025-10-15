import { constants } from "node:fs";
import { access } from "node:fs/promises";
import type { LifecycleCommand } from "@/core/schemas/lifecycle-command-schema";

export interface DetectorResult {
  startCommands: LifecycleCommand[];
  stopCommands: LifecycleCommand[];
}

/**
 * Check if any Docker Compose file exists
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
 * Detect Docker Compose configuration
 */
export async function detectDockerCompose(): Promise<DetectorResult | null> {
  const possibleFiles = [
    "docker-compose.yml",
    "docker-compose.yaml",
    "compose.yml",
    "compose.yaml",
  ];

  for (const file of possibleFiles) {
    if (await fileExists(file)) {
      return {
        startCommands: [
          {
            command: "docker compose up",
            keepAlive: true,
          },
        ],
        stopCommands: [
          {
            command: "docker compose down -v",
          },
        ],
      };
    }
  }

  return null;
}
