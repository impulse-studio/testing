import puppeteer, { type Browser, type Page } from "puppeteer";
import type { Story } from "@/core/types";

export interface BrowserInstance {
  browser: Browser;
  page: Page;
}

export async function launchBrowser(story: Story): Promise<BrowserInstance> {
  // Extract resolution settings with defaults
  const width = story.start.resolution?.width ?? 800;
  const height = story.start.resolution?.height ?? 600;
  const deviceScaleFactor = story.start.deviceScaleFactor ?? 1;
  const pixelRatio = story.start.pixelRatio ?? 1;

  // Launch browser in headless mode
  let browser: Browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: {
        width,
        height,
        deviceScaleFactor,
      },
    });
  } catch (launchError) {
    throw new Error(
      `Failed to launch Chrome browser: ${launchError instanceof Error ? launchError.message : String(launchError)}`,
    );
  }

  const page = await browser.newPage();

  // Apply pixel ratio if specified
  if (pixelRatio !== 1) {
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: pixelRatio,
    });
  }

  // Navigate to the starting URL
  await page.goto(story.start.url, {
    waitUntil: "networkidle2",
  });

  return { browser, page };
}
