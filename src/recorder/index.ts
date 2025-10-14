import chalk from 'chalk';
import { loadConfig } from '@/core/config-loader';
import { startApp } from '@/core/start-app';
import { stopApp } from '@/core/stop-app';
import { loadStory, appendActions } from './story-updater.js';
import { launchBrowser, type BrowserInstance } from './browser-manager.js';
import { EventCapture } from './event-capture.js';
import { injectRecordingUI, removeRecordingUI } from './recording-ui.js';
import { takeScreenshot } from './screenshot-manager.js';
import type { Config } from '@/core/types';

/**
 * Main recording orchestrator that coordinates all recorder components
 * @param storyId - The story identifier to record
 */
export async function startRecording(storyId: string): Promise<void> {
  let cleanup: (() => Promise<void>) | null = null;
  let browserInstance: BrowserInstance | null = null;
  let config: Config | null = null;

  try {
    config = await loadConfig();
    const story = await loadStory(storyId);
    cleanup = await startApp(config);
    browserInstance = await launchBrowser(story);
    const { browser, page } = browserInstance;

    const eventCapture = new EventCapture(page);
    await eventCapture.startCapture();

    await injectRecordingUI(page, {
      onSnapshot: async () => {
        try {
          // Take screenshot first and get the filename
          const screenshotName = await takeScreenshot(page, storyId);

          // Get pending actions from EventCapture (including screenshot action with the name)
          const actions = await eventCapture.onSnapshot(screenshotName);

          // Append actions to story.yml
          await appendActions(storyId, actions);
        } catch (error) {
          console.error(
            chalk.red('Failed to capture snapshot:'),
            error instanceof Error ? error.message : error
          );
        }
      },

      onStop: async () => {
        try {
          // Get any remaining pending actions
          const pendingActions = eventCapture.getPendingActions();

          // If actions exist, append to story.yml
          if (pendingActions.length > 0) {
            await appendActions(storyId, pendingActions);
          }

          // Remove recording UI
          await removeRecordingUI(page);

          // Close browser
          await browser.close();
          browserInstance = null;

          // Stop app
          if (cleanup && config) {
            await stopApp(cleanup, config);
            cleanup = null;
          }

          // Show completion message
          console.log(chalk.green('✓ Recording saved to story.yml'));
          console.log(chalk.green('✓ Recording session completed'));
        } catch (error) {
          console.error(
            chalk.red('Error during stop:'),
            error instanceof Error ? error.message : error
          );
          throw error;
        }
      },
    });

    console.log(
      chalk.gray(
        'Use the recording UI in the browser to take snapshots or stop recording.\n'
      )
    );

    // 8. Wait for browser to close (user closes or clicks stop)
    await new Promise<void>((resolve) => {
      browser.on('disconnected', async () => {
        try {
          // 9. Auto-save any remaining actions before exit
          const pendingActions = eventCapture.getPendingActions();
          if (pendingActions.length > 0) {
            await appendActions(storyId, pendingActions);
          }
          resolve();
        } catch (error) {
          console.error(
            chalk.red('Error auto-saving on browser close:'),
            error instanceof Error ? error.message : error
          );
          resolve();
        }
      });
    });

    // 10. Clean up: stop app (browser already closed)
    if (cleanup && config) {
      console.log(chalk.blue('🛑 Stopping app...'));
      await stopApp(cleanup, config);
      cleanup = null;
    }

    console.log(chalk.green('✓ App stopped successfully'));
  } catch (error) {
    // Error handling: Always attempt cleanup even on errors
    console.error(
      chalk.red('❌ Recording failed:'),
      error instanceof Error ? error.message : error
    );

    // Attempt cleanup
    try {
      if (browserInstance) {
        console.log(chalk.yellow('Closing browser...'));
        await browserInstance.browser.close();
      }
    } catch (cleanupError) {
      console.error(
        chalk.red('Failed to close browser:'),
        cleanupError instanceof Error ? cleanupError.message : cleanupError
      );
    }

    try {
      if (cleanup && config) {
        console.log(chalk.yellow('Stopping app...'));
        await stopApp(cleanup, config);
      }
    } catch (cleanupError) {
      console.error(
        chalk.red('Failed to stop app:'),
        cleanupError instanceof Error ? cleanupError.message : cleanupError
      );
    }

    // Re-throw the original error
    throw error;
  }
}
