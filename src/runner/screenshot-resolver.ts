import { execa, type ResultPromise } from 'execa';
import { copyFile } from 'node:fs/promises';
import { select } from '@inquirer/prompts';

/**
 * Represents a screenshot mismatch that needs resolution
 */
export interface ScreenshotMismatch {
  /**
   * Name of the screenshot (for display purposes)
   */
  name: string;
  /**
   * Path to the old/baseline screenshot
   */
  oldPath: string;
  /**
   * Path to the new screenshot from test result
   */
  newPath: string;
}

/**
 * User's choice for resolving a screenshot mismatch
 */
export type ResolutionChoice = 'KEEP_OLD' | 'KEEP_NEW';

/**
 * Result of resolving a screenshot mismatch
 */
export interface ResolutionResult {
  /**
   * Name of the screenshot that was resolved
   */
  name: string;
  /**
   * User's choice for resolution
   */
  choice: ResolutionChoice;
  /**
   * Whether the baseline screenshot was updated
   */
  updated: boolean;
}

/**
 * Options for screenshot resolution
 */
export interface ResolveScreenshotsOptions {
  /**
   * Timeout in milliseconds for interactive prompt
   * @default 300000 (5 minutes)
   */
  timeout?: number;
}

/**
 * Open VS Code diff viewer for the two screenshots
 * Returns the subprocess so it can be killed after user makes their choice
 */
function openDiffViewer(
  oldPath: string,
  newPath: string,
): ResultPromise | null {
  try {
    // Launch VS Code with diff view (attached to parent process)
    const subprocess = execa('code', ['--diff', oldPath, newPath]);
    return subprocess;
  } catch (error) {
    // Silently fail if VS Code is not available
    // User will still see the interactive prompt
    console.warn('Could not open VS Code diff viewer. Continuing with prompt...');
    return null;
  }
}

/**
 * Prompt user to choose resolution for screenshot mismatch
 * Uses @inquirer/prompts for interactive CLI selection
 */
async function promptUserChoice(
  mismatchName: string,
  timeout: number,
): Promise<ResolutionChoice> {
  const timeoutPromise = new Promise<ResolutionChoice>((resolve) => {
    setTimeout(() => {
      console.warn(`\nTimeout reached for ${mismatchName}. Defaulting to KEEP_OLD (fail test).`);
      resolve('KEEP_OLD');
    }, timeout);
  });

  const promptPromise = select<ResolutionChoice>({
    message: `Resolve screenshot mismatch: ${mismatchName}`,
    choices: [
      {
        name: 'Keep old screenshot (fail test)',
        value: 'KEEP_OLD',
        description: 'Keep the baseline screenshot and mark this test as failed',
      },
      {
        name: 'Accept new screenshot (update baseline)',
        value: 'KEEP_NEW',
        description: 'Replace the baseline with the new screenshot',
      },
    ],
  });

  // Race between user selection and timeout
  return Promise.race([promptPromise, timeoutPromise]);
}

/**
 * Resolve a single screenshot mismatch using VS Code diff viewer and interactive prompt
 */
async function resolveSingleMismatch(
  mismatch: ScreenshotMismatch,
  options: ResolveScreenshotsOptions,
): Promise<ResolutionResult> {
  const { timeout = 300000 } = options;

  // Open VS Code diff viewer and capture subprocess reference
  const vscodeProcess = openDiffViewer(mismatch.oldPath, mismatch.newPath);

  try {
    // Show interactive prompt and wait for user choice
    const choice = await promptUserChoice(mismatch.name, timeout);

    // Handle the choice
    if (choice === 'KEEP_NEW') {
      // Copy new screenshot over old one
      await copyFile(mismatch.newPath, mismatch.oldPath);
      return {
        name: mismatch.name,
        choice: 'KEEP_NEW',
        updated: true,
      };
    }

    // KEEP_OLD - mark as failed (no update needed)
    return {
      name: mismatch.name,
      choice: 'KEEP_OLD',
      updated: false,
    };
  } finally {
    // Kill VS Code subprocess after user has made their choice
    if (vscodeProcess) {
      try {
        vscodeProcess.kill();
      } catch (error) {
        // Gracefully handle errors if process is already terminated
        // This can happen if user manually closed VS Code
      }
    }
  }
}

/**
 * Resolve screenshot mismatches interactively using VS Code diff viewer
 *
 * For each mismatch:
 * 1. Opens VS Code with --diff to show visual comparison (non-blocking)
 * 2. Shows interactive prompt asking user to choose resolution
 * 3. If KEEP_OLD: marks as failed (no changes)
 * 4. If KEEP_NEW: copies new screenshot over old one
 * 5. If timeout occurs: defaults to KEEP_OLD (fail)
 *
 * @param mismatches - Array of screenshot mismatches to resolve
 * @param options - Resolution options (timeout for interactive prompt)
 * @returns Array of resolution results
 *
 * @example
 * ```ts
 * const mismatches = [
 *   {
 *     name: 'homepage-hero',
 *     oldPath: '.testing/screenshots/story1/homepage-hero.png',
 *     newPath: '.testing/temp/homepage-hero.png'
 *   }
 * ];
 *
 * const results = await resolveScreenshots(mismatches);
 * console.log(results[0]); // { name: 'homepage-hero', choice: 'KEEP_NEW', updated: true }
 * ```
 */
export async function resolveScreenshots(
  mismatches: ScreenshotMismatch[],
  options: ResolveScreenshotsOptions = {},
): Promise<ResolutionResult[]> {
  const results: ResolutionResult[] = [];

  // Resolve each mismatch sequentially (interactive process)
  for (const mismatch of mismatches) {
    const result = await resolveSingleMismatch(mismatch, options);
    results.push(result);
  }

  return results;
}
