import type { Page } from 'puppeteer';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SCREENSHOTS_DIR } from '@/core/constants';

/**
 * Take a screenshot and save it to the story's screenshot directory
 * @param page - Puppeteer page instance
 * @param storyId - Story identifier
 * @returns The generated screenshot filename (not the full path)
 */
export async function takeScreenshot(
  page: Page,
  storyId: string,
): Promise<string> {
  // Ensure the screenshots directory exists
  const screenshotsPath = join(SCREENSHOTS_DIR, storyId);
  await mkdir(screenshotsPath, { recursive: true });

  // Hide the recording UI before taking screenshot
  await page.evaluate(() => {
    const ui = document.getElementById('__impulse-testing__ui');
    if (ui) ui.style.display = 'none';
  });

  // Take screenshot (viewport only, not full page)
  const screenshot = await page.screenshot({
    fullPage: false,
    type: 'png',
  });

  // Show the recording UI again after taking screenshot
  await page.evaluate(() => {
    const ui = document.getElementById('__impulse-testing__ui');
    if (ui) ui.style.display = '';
  });

  const screenshotName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`;
  const screenshotPath = join(screenshotsPath, screenshotName);
  await writeFile(screenshotPath, screenshot);

  return screenshotName;
}
