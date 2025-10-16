import type { Page } from "puppeteer";
import type { Action } from "@/core/types";

/**
 * Default timeout for waiting for selectors (in milliseconds)
 */
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Executes a single action on the Puppeteer page
 *
 * This function handles all action types defined in the Action union type:
 * - `click`: Waits for selector, then clicks the element
 * - `input`: Clears existing value, then types new value
 * - `select`: Selects dropdown option by value
 * - `check`/`uncheck`: Clicks checkbox/radio only if current state differs from desired state
 * - `navigate`: Navigates to the specified URL
 * - `screenshot`: Takes a screenshot (handled externally, throws error here)
 *
 * @param page - Puppeteer page instance
 * @param action - The action to execute
 * @throws Error with descriptive context (action type, selector, etc.) on failure
 *
 * @example
 * ```typescript
 * await executeAction(page, {
 *   type: 'click',
 *   selector: 'button.submit'
 * });
 *
 * await executeAction(page, {
 *   type: 'input',
 *   selector: '#email',
 *   value: 'user@example.com'
 * });
 * ```
 */
export async function executeAction(page: Page, action: Action): Promise<void> {
  try {
    switch (action.type) {
      case "click": {
        // Wait for the element to be present in the DOM
        await page.waitForSelector(action.selector, {
          timeout: DEFAULT_TIMEOUT,
          visible: true,
        });

        // Click the element
        await page.click(action.selector);
        break;
      }

      case "input": {
        // Wait for the input element to be present
        await page.waitForSelector(action.selector, {
          timeout: DEFAULT_TIMEOUT,
          visible: true,
        });

        // Clear the existing value using triple-click + delete approach
        // This is more reliable than page.evaluate for various input types
        await page.click(action.selector, { clickCount: 3 });
        await page.keyboard.press("Backspace");

        // Type the new value
        await page.type(action.selector, action.value);
        break;
      }

      case "select": {
        // Wait for the select element to be present
        await page.waitForSelector(action.selector, {
          timeout: DEFAULT_TIMEOUT,
          visible: true,
        });

        // Select the option by value
        await page.select(action.selector, action.value);
        break;
      }

      case "check":
      case "uncheck": {
        const desiredState = action.type === "check";

        // Wait for the checkbox/radio element to be present
        await page.waitForSelector(action.selector, {
          timeout: DEFAULT_TIMEOUT,
          visible: true,
        });

        // Get the current checked state of the element
        const currentState = await page.$eval(
          action.selector,
          (el) => (el as HTMLInputElement).checked,
        );

        // Only click if the current state differs from the desired state
        // This prevents unnecessary toggling
        if (currentState !== desiredState) {
          await page.click(action.selector);
        }
        break;
      }

      case "navigate": {
        // Navigate to the specified URL
        // Wait until network is idle to ensure page is fully loaded
        await page.goto(action.url, {
          waitUntil: "networkidle2",
          timeout: DEFAULT_TIMEOUT,
        });
        break;
      }

      case "waitForNavigation": {
        // Wait for navigation that was triggered by a previous action
        // This is used for automatic redirects (e.g., post-login redirects)
        // The previous action (click/input) already triggered the navigation
        // We just need to wait for it to complete to preserve cookies
        await page.waitForNavigation({
          waitUntil: "networkidle2",
          timeout: DEFAULT_TIMEOUT,
        });
        break;
      }

      case "screenshot": {
        // Screenshot actions are handled externally by the runner
        // This should not be called directly through executeAction
        throw new Error("Screenshot actions should be handled by the runner, not by executeAction");
      }

      default: {
        // TypeScript exhaustiveness check
        const _exhaustive: never = action;
        throw new Error(`Unknown action type: ${(_exhaustive as Action).type}`);
      }
    }
  } catch (error) {
    // Create a descriptive error message with context
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Extract selector if available
    const selector = "selector" in action ? action.selector : undefined;

    // Build error context string
    const contextParts: string[] = [`Action type: ${action.type}`];

    if (selector) {
      contextParts.push(`Selector: ${selector}`);
    }

    if (action.type === "navigate") {
      contextParts.push(`URL: ${action.url}`);
    }

    if (action.type === "input" || action.type === "select") {
      contextParts.push(`Value: ${action.value}`);
    }

    // Throw a new error with full context
    throw new Error(`Failed to execute action: ${errorMessage}\n${contextParts.join("\n")}`);
  }
}
