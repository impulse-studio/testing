/**
 * Wait for a URL to become available by polling with fetch
 * @param url The URL to check (e.g., "http://localhost:3000")
 * @param timeout Maximum time to wait in milliseconds (default: 30000)
 * @throws Error if URL doesn't become available within timeout
 */
export async function waitForUrl(url: string, timeout: number = 30000): Promise<void> {
  const startTime = Date.now();
  const interval = 1000; // Poll every 1 second

  while (Date.now() - startTime < timeout) {
    try {
      // Use AbortSignal.timeout for per-request timeout (2 seconds)
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });

      // Consider 2xx-4xx as "available" - only 5xx errors mean server isn't ready
      // This handles cases where the app redirects or returns 404 before fully loading
      if (response.ok || response.status < 500) {
        return;
      }
    } catch (_error) {
      // Suppress errors during polling - connection errors are expected while server starts
      // Errors include: connection refused, timeout, DNS errors, etc.
    }

    // Wait before next poll attempt
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  // Timeout reached without successful connection
  throw new Error(`Timeout: ${url} did not become available within ${timeout}ms`);
}
