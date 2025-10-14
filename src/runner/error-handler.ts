import type { Page } from 'puppeteer';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TESTING_DIR } from '@/core/constants';

/**
 * Structured error result containing diagnostic information
 */
export interface ErrorResult {
  /** The original error message */
  message: string;
  /** The action type that failed */
  actionType: string;
  /** The selector used (if applicable) */
  selector?: string | undefined;
  /** Path to the diagnostic screenshot */
  screenshotPath: string;
  /** ISO timestamp when the error occurred */
  timestamp: string;
}

/**
 * Context information about the failed action
 */
export interface ErrorContext {
  /** Type of action that failed (e.g., 'click', 'input', 'navigate') */
  actionType: string;
  /** CSS selector involved in the action (if applicable) */
  selector?: string | undefined;
  /** The error message from the failure */
  errorMessage: string;
}

/**
 * Captures a diagnostic screenshot when an action fails during test execution
 *
 * This handler:
 * - Takes a full-page screenshot of the current page state
 * - Saves it to `.testing/temp/error-{timestamp}.png`
 * - Returns structured error information including the screenshot path
 * - Automatically creates the temp directory if needed
 *
 * @param page - Puppeteer page instance
 * @param context - Error context with action type, selector, and error message
 * @returns Structured error object with screenshot path and error details
 *
 * @example
 * ```typescript
 * try {
 *   await page.click(selector);
 * } catch (error) {
 *   const errorResult = await captureErrorScreenshot(page, {
 *     actionType: 'click',
 *     selector: selector,
 *     errorMessage: error.message
 *   });
 *   console.error('Action failed:', errorResult);
 * }
 * ```
 */
export async function captureErrorScreenshot(
  page: Page,
  context: ErrorContext,
): Promise<ErrorResult> {
  const timestamp = new Date().toISOString();
  const timestampForFilename = Date.now();

  // Ensure the temp directory exists
  const tempDir = join(TESTING_DIR, 'temp');
  await mkdir(tempDir, { recursive: true });

  // Take a full-page screenshot to capture the entire error state
  const screenshot = await page.screenshot({
    fullPage: true,
    type: 'png',
  });

  // Save the screenshot with a timestamp
  const screenshotFilename = `error-${timestampForFilename}.png`;
  const screenshotPath = join(tempDir, screenshotFilename);
  await writeFile(screenshotPath, screenshot);

  // Return structured error information
  return {
    message: context.errorMessage,
    actionType: context.actionType,
    selector: context.selector,
    screenshotPath,
    timestamp,
  };
}
