import type { Page } from 'puppeteer';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

export interface RecordingUICallbacks {
  onStop: () => void;
  onSnapshot: () => void;
}

/**
 * Get the recording UI client-side code
 */
const getRecordingUICode = (): string => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return readFileSync(join(__dirname, 'injected', 'recording-ui-client.js'), 'utf-8');
};

/**
 * Inject a floating recording UI into the page with Stop and Snapshot buttons
 */
export async function injectRecordingUI(
  page: Page,
  callbacks: RecordingUICallbacks
): Promise<void> {
  // Expose callback functions to page context
  await page.exposeFunction('__impulse_onStop', callbacks.onStop);
  await page.exposeFunction('__impulse_onSnapshot', callbacks.onSnapshot);

  // Inject the UI HTML and CSS into the page
  await page.evaluate(getRecordingUICode());
}

/**
 * Remove the recording UI from the page
 */
export async function removeRecordingUI(page: Page): Promise<void> {
  await page.evaluate(() => {
    const ui = document.getElementById('__impulse-testing__ui');
    if (ui) {
      ui.remove();
    }
  });
}
