import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import type { Page } from "puppeteer";
import { SCREENSHOTS_DIR, TESTING_DIR } from "@/core/constants";

/**
 * Result of a screenshot comparison
 */
export interface ComparisonResult {
  /**
   * Whether the screenshots match within the diff threshold
   */
  matches: boolean;
  /**
   * Percentage of pixels that differ (0-100)
   */
  diffPercentage: number;
  /**
   * Path to the new screenshot if there was a mismatch
   */
  newScreenshotPath?: string;
}

/**
 * Parameters for screenshot comparison
 */
export interface CompareScreenshotParams {
  /**
   * Puppeteer page instance to take the screenshot from
   */
  page: Page;
  /**
   * Story identifier for organizing screenshots
   */
  storyId: string;
  /**
   * Name of the screenshot (used for baseline and temp filenames)
   */
  screenshotName: string;
  /**
   * Diff threshold as a percentage (0-100). Default: 0.1%
   */
  diffThreshold?: number;
}

/**
 * Take a screenshot of the viewport
 * @param page - Puppeteer page instance
 * @returns Screenshot buffer
 */
async function takeViewportScreenshot(page: Page): Promise<Buffer> {
  // Hide the recording UI before taking screenshot
  await page.evaluate(() => {
    const ui = document.getElementById("__impulse-testing__ui");
    if (ui) ui.style.display = "none";
  });

  // Take screenshot (viewport only, not full page)
  const screenshot = await page.screenshot({
    fullPage: false,
    type: "png",
  });

  // Show the recording UI again after taking screenshot
  await page.evaluate(() => {
    const ui = document.getElementById("__impulse-testing__ui");
    if (ui) ui.style.display = "";
  });

  return screenshot as Buffer;
}

/**
 * Ensure two PNG images have the same dimensions by padding with transparent pixels
 * @param img1 - First PNG image
 * @param img2 - Second PNG image
 * @returns Tuple of [img1, img2] with matching dimensions
 */
function ensureSameDimensions(img1: PNG, img2: PNG): [PNG, PNG] {
  if (img1.width === img2.width && img1.height === img2.height) {
    return [img1, img2];
  }

  const maxWidth = Math.max(img1.width, img2.width);
  const maxHeight = Math.max(img1.height, img2.height);

  // Pad first image if needed
  const padded1 = new PNG({ width: maxWidth, height: maxHeight });
  PNG.bitblt(img1, padded1, 0, 0, img1.width, img1.height, 0, 0);

  // Pad second image if needed
  const padded2 = new PNG({ width: maxWidth, height: maxHeight });
  PNG.bitblt(img2, padded2, 0, 0, img2.width, img2.height, 0, 0);

  return [padded1, padded2];
}

/**
 * Compare a new screenshot against a baseline screenshot
 *
 * This function:
 * 1. Takes a new screenshot of the viewport
 * 2. Loads the baseline screenshot from disk
 * 3. Performs pixel-by-pixel comparison using pixelmatch
 * 4. Calculates the diff percentage
 * 5. If mismatch detected, saves new screenshot to temp directory
 *
 * @param params - Comparison parameters
 * @returns Comparison result with match status and diff percentage
 */
export async function compareScreenshot(
  params: CompareScreenshotParams,
): Promise<ComparisonResult> {
  const { page, storyId, screenshotName, diffThreshold = 0.1 } = params;

  // Take new screenshot
  const newScreenshotBuffer = await takeViewportScreenshot(page);

  // Load and parse new screenshot
  const newImg = PNG.sync.read(newScreenshotBuffer);

  // Try to load baseline screenshot
  const baselinePath = join(SCREENSHOTS_DIR, storyId, screenshotName);

  let baselineImg: PNG;
  try {
    const baselineBuffer = await readFile(baselinePath);
    baselineImg = PNG.sync.read(baselineBuffer);
  } catch (_error) {
    // Baseline doesn't exist - treat as mismatch
    const tempDir = join(TESTING_DIR, "temp");
    await mkdir(tempDir, { recursive: true });

    const tempPath = join(tempDir, screenshotName);
    await writeFile(tempPath, newScreenshotBuffer);

    return {
      matches: false,
      diffPercentage: 100,
      newScreenshotPath: tempPath,
    };
  }

  // Ensure images have the same dimensions
  const [paddedBaseline, paddedNew] = ensureSameDimensions(baselineImg, newImg);

  // Perform pixel-by-pixel comparison
  const { width, height } = paddedNew;
  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    paddedBaseline.data,
    paddedNew.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }, // Pixel-level sensitivity (0.1 is fairly strict)
  );

  // Calculate diff percentage
  const totalPixels = width * height;
  const diffPercentage = (numDiffPixels / totalPixels) * 100;

  // Check if diff is within threshold
  const matches = diffPercentage <= diffThreshold;

  // If mismatch, save new screenshot to temp directory
  if (!matches) {
    const tempDir = join(TESTING_DIR, "temp");
    await mkdir(tempDir, { recursive: true });

    const tempPath = join(tempDir, screenshotName);
    await writeFile(tempPath, newScreenshotBuffer);

    return {
      matches: false,
      diffPercentage,
      newScreenshotPath: tempPath,
    };
  }

  return {
    matches: true,
    diffPercentage,
  };
}
