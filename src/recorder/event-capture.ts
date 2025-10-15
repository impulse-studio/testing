import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "puppeteer";
import type { Action } from "@/core/types";

interface CapturedEvent {
  type: "click" | "input" | "change" | "navigate";
  selector?: string;
  value?: string;
  inputType?: string;
  checked?: boolean;
  url?: string;
}

/**
 * Browser-side code for event capture
 * This must be a string to avoid TypeScript compilation artifacts like __name
 */
const getBrowserSideCode = (): string => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return readFileSync(join(__dirname, "injected", "event-capture-client.js"), "utf-8");
};

/**
 * Event capture system that tracks user interactions and converts them to Actions
 */
export class EventCapture {
  private page: Page;
  private pendingActions: Action[] = [];
  private inputTracking = new Map<string, string>();
  private lastUrl = "";

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Start capturing events from the page
   */
  async startCapture(): Promise<void> {
    // Get initial URL
    this.lastUrl = this.page.url();

    // Expose function to receive events from page context
    await this.page.exposeFunction("__impulse_captureEvent", (event: CapturedEvent) => {
      this.handleEvent(event);
    });

    // Inject event listeners into page context using evaluateOnNewDocument
    // This ensures listeners are added to all pages including after navigation
    // Pass code as string to avoid TypeScript compilation artifacts
    await this.page.evaluateOnNewDocument(getBrowserSideCode());

    // Re-inject listeners on the current page (since evaluateOnNewDocument only affects future navigations)
    await this.injectListeners();

    // Set up navigation tracking
    this.page.on("framenavigated", async (frame) => {
      if (frame === this.page.mainFrame()) {
        const newUrl = this.page.url();
        if (newUrl !== this.lastUrl) {
          this.pendingActions.push({
            type: "navigate",
            url: newUrl,
          });
          this.lastUrl = newUrl;

          // Re-inject listeners after navigation
          await this.injectListeners();
        }
      }
    });
  }

  /**
   * Inject event listeners into the current page
   * Pass code as string to avoid TypeScript compilation artifacts
   */
  private async injectListeners(): Promise<void> {
    await this.page.evaluate(getBrowserSideCode());
  }

  /**
   * Handle events captured from the page
   */
  private handleEvent(event: CapturedEvent): void {
    switch (event.type) {
      case "click":
        if (event.selector) {
          this.pendingActions.push({
            type: "click",
            selector: event.selector,
          });
        }
        break;

      case "input":
        if (event.selector && event.value !== undefined) {
          // Update input tracking map
          this.inputTracking.set(event.selector, event.value);
        }
        break;

      case "change":
        if (event.selector) {
          if (event.inputType === "select" && event.value !== undefined) {
            this.pendingActions.push({
              type: "select",
              selector: event.selector,
              value: event.value,
            });
          } else if (
            (event.inputType === "checkbox" || event.inputType === "radio") &&
            event.checked !== undefined
          ) {
            this.pendingActions.push({
              type: event.checked ? "check" : "uncheck",
              selector: event.selector,
            });
          }
        }
        break;

      case "navigate":
        if (event.url) {
          this.pendingActions.push({
            type: "navigate",
            url: event.url,
          });
        }
        break;
    }
  }

  /**
   * Called when user takes a snapshot
   * Flushes input tracking and adds screenshot action
   * Returns all pending actions and clears the array
   * @param screenshotName - The filename of the screenshot that was taken
   */
  async onSnapshot(screenshotName: string): Promise<Action[]> {
    // Flush all tracked inputs to actions
    this.flushInputTracking();

    // Add screenshot action
    this.pendingActions.push({
      type: "screenshot",
      name: screenshotName,
    });

    // Return copy of actions and clear pending
    const actions = [...this.pendingActions];
    this.pendingActions = [];

    return actions;
  }

  /**
   * Get current pending actions without clearing them
   */
  getPendingActions(): Action[] {
    // Flush input tracking before returning
    this.flushInputTracking();
    return [...this.pendingActions];
  }

  /**
   * Flush all tracked inputs to InputActions
   */
  private flushInputTracking(): void {
    this.inputTracking.forEach((value, selector) => {
      this.pendingActions.push({
        type: "input",
        selector,
        value,
      });
    });
    this.inputTracking.clear();
  }
}
