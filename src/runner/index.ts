import { join } from "node:path";
import type { Page } from "puppeteer";
import { loadConfig } from "@/core/config-loader";
import { SCREENSHOTS_DIR } from "@/core/constants";
import { startApp } from "@/core/start-app";
import { stopApp } from "@/core/stop-app";
import type { Action, ScreenshotAction } from "@/core/types";
import { loadStory } from "@/recorder/story-updater";
import { executeAction } from "./action-executor.js";
import { type BrowserInstance, launchBrowser } from "./browser-manager.js";
import { captureErrorScreenshot, type ErrorResult } from "./error-handler.js";
import { type ComparisonResult, compareScreenshot } from "./screenshot-comparator.js";
import {
  type ResolutionResult,
  resolveScreenshots,
  type ScreenshotMismatch,
} from "./screenshot-resolver.js";

/**
 * Result of executing a single action
 */
export interface ActionResult {
  /** Zero-based index of the action */
  index: number;
  /** The action that was executed */
  action: Action;
  /** Whether the action passed */
  passed: boolean;
  /** Error information if the action failed */
  error?: ErrorResult;
  /** Screenshot comparison result (for screenshot actions only) */
  comparisonResult?: ComparisonResult;
}

/**
 * Result of a screenshot resolution
 */
export interface ScreenshotResolutionResult {
  /** Name of the screenshot */
  name: string;
  /** Whether the mismatch was accepted (KEEP_NEW) */
  accepted: boolean;
}

/**
 * Complete result of a story execution
 */
export interface ExecutionResult {
  /** Story ID that was executed */
  storyId: string;
  /** Whether the overall execution was successful */
  success: boolean;
  /** Results for each action */
  actionResults: ActionResult[];
  /** Results from screenshot resolution (if any mismatches occurred) */
  screenshotResolutions: ScreenshotResolutionResult[];
  /** Global error if execution failed before completing all actions */
  error?: string;
}

/**
 * Execute a single non-screenshot action with error handling
 * @param page - Puppeteer page instance
 * @param action - The action to execute
 * @param index - Zero-based index of the action
 * @returns Action result with pass/fail status
 */
async function executeNonScreenshotAction(
  page: Page,
  action: Exclude<Action, ScreenshotAction>,
  index: number,
): Promise<ActionResult> {
  try {
    await executeAction(page, action);
    return {
      index,
      action,
      passed: true,
    };
  } catch (error) {
    // Capture diagnostic screenshot on error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const selector = "selector" in action ? action.selector : undefined;

    const errorResult = await captureErrorScreenshot(page, {
      actionType: action.type,
      selector,
      errorMessage,
    });

    return {
      index,
      action,
      passed: false,
      error: errorResult,
    };
  }
}

/**
 * Execute a screenshot action with comparison
 * @param page - Puppeteer page instance
 * @param action - The screenshot action to execute
 * @param storyId - Story ID for organizing screenshots
 * @param index - Zero-based index of the action
 * @param diffThreshold - Diff threshold as a percentage (0-100). Default: 0.1%
 * @returns Action result with comparison information
 */
async function executeScreenshotAction(
  page: Page,
  action: ScreenshotAction,
  storyId: string,
  index: number,
  diffThreshold: number = 0.1,
): Promise<ActionResult> {
  try {
    const comparisonResult = await compareScreenshot({
      page,
      storyId,
      screenshotName: action.name,
      diffThreshold,
    });

    return {
      index,
      action,
      passed: comparisonResult.matches,
      comparisonResult,
    };
  } catch (error) {
    // Capture diagnostic screenshot on error
    const errorMessage = error instanceof Error ? error.message : String(error);

    const errorResult = await captureErrorScreenshot(page, {
      actionType: action.type,
      errorMessage,
    });

    return {
      index,
      action,
      passed: false,
      error: errorResult,
    };
  }
}

/**
 * Options for running a story
 */
export interface RunStoryOptions {
  /**
   * CI mode: automatically fail on screenshot mismatches (no interactive prompts)
   * @default false
   */
  ciMode?: boolean;
  /**
   * Optional callback that is called after each action completes
   * Useful for real-time logging or progress tracking
   * @param result - The result of the completed action
   */
  onActionComplete?: (result: ActionResult) => void | Promise<void>;
}

/**
 * Run a complete story execution flow
 *
 * This function orchestrates:
 * 1. Loading configuration and story
 * 2. Starting the application
 * 3. Launching the browser
 * 4. Executing all actions sequentially
 * 5. Resolving screenshot mismatches (if any)
 * 6. Determining final pass/fail status
 * 7. Cleaning up resources
 *
 * @param storyId - ID of the story to execute
 * @param options - Optional configuration for story execution
 * @returns Execution result with success status and detailed action results
 *
 * @example
 * ```typescript
 * const result = await runStory('login-flow');
 * if (result.success) {
 *   console.log('Story passed!');
 * } else {
 *   console.error('Story failed:', result.error);
 *   result.actionResults.forEach(ar => {
 *     if (!ar.passed) {
 *       console.error(`Action ${ar.index} failed:`, ar.error);
 *     }
 *   });
 * }
 * ```
 */
export async function runStory(
  storyId: string,
  options: RunStoryOptions = {},
): Promise<ExecutionResult> {
  let browserInstance: BrowserInstance | null = null;
  let cleanup: (() => Promise<void>) | null = null;
  const actionResults: ActionResult[] = [];
  const screenshotMismatches: ScreenshotMismatch[] = [];

  try {
    // 1. Load configuration
    const config = await loadConfig();

    // 2. Load story
    const story = await loadStory(storyId);

    // 3. Start application
    cleanup = await startApp(config, story.start.url);

    // 4. Launch browser
    browserInstance = await launchBrowser(story);
    const { page } = browserInstance;

    // 5. Execute actions sequentially
    for (let i = 0; i < story.actions.length; i++) {
      const action = story.actions[i];

      // Type guard: ensure action exists (it should always exist when i < length)
      if (!action) continue;

      if (action.type === "screenshot") {
        // Handle screenshot action with comparison
        const result = await executeScreenshotAction(
          page,
          action,
          storyId,
          i,
          config.screenshots?.diffThreshold ?? 0.1,
        );
        actionResults.push(result);

        // Call the callback if provided
        if (options.onActionComplete) {
          await options.onActionComplete(result);
        }

        // If screenshot mismatch, queue for later resolution
        if (!result.passed && result.comparisonResult?.newScreenshotPath) {
          const baselinePath = join(SCREENSHOTS_DIR, storyId, action.name);

          screenshotMismatches.push({
            name: action.name,
            oldPath: baselinePath,
            newPath: result.comparisonResult.newScreenshotPath,
          });
        }
      } else {
        // Handle non-screenshot action
        const result = await executeNonScreenshotAction(page, action, i);
        actionResults.push(result);

        // Call the callback if provided
        if (options.onActionComplete) {
          await options.onActionComplete(result);
        }

        // If action failed, we continue with remaining actions
        // (but the story will ultimately fail)
      }
    }

    // 6. Resolve screenshot mismatches if any exist
    let screenshotResolutions: ScreenshotResolutionResult[] = [];
    if (screenshotMismatches.length > 0) {
      const resolverOptions = options.ciMode !== undefined ? { ciMode: options.ciMode } : {};
      const resolutionResults = await resolveScreenshots(screenshotMismatches, resolverOptions);
      screenshotResolutions = resolutionResults.map((result: ResolutionResult) => ({
        name: result.name,
        accepted: result.choice === "KEEP_NEW",
      }));
    }

    // 7. Determine final pass/fail status
    // - All non-screenshot actions must pass
    // - All screenshot mismatches must be accepted (KEEP_NEW)
    const allActionsPass = actionResults.every((result) => {
      if (result.action.type === "screenshot") {
        // For screenshots, check if it was resolved as KEEP_NEW
        const resolution = screenshotResolutions.find(
          (r) => r.name === (result.action as ScreenshotAction).name,
        );
        // Passed if: (1) originally matched, or (2) was resolved and accepted
        return result.passed || resolution?.accepted;
      }
      // For non-screenshot actions, just check if it passed
      return result.passed;
    });

    const success = allActionsPass;

    return {
      storyId,
      success,
      actionResults,
      screenshotResolutions,
    };
  } catch (error) {
    // Global error during execution
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      storyId,
      success: false,
      actionResults,
      screenshotResolutions: [],
      error: errorMessage,
    };
  } finally {
    // 8. Clean up resources
    // Close browser first
    if (browserInstance) {
      try {
        await browserInstance.browser.close();
      } catch (error) {
        console.error("Failed to close browser:", error);
      }
    }

    // Then stop the application
    if (cleanup) {
      try {
        const config = await loadConfig();
        await stopApp(cleanup, config);
      } catch (error) {
        console.error("Failed to stop application:", error);
      }
    }
  }
}
