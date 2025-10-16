import chalk from "chalk";
import type { Action } from "@/core/types";
import { type ActionResult, type ExecutionResult, runStory } from "@/runner";

/**
 * Format an action for display with its details
 */
function formatAction(action: Action): string {
  switch (action.type) {
    case "click":
      return `click ${chalk.gray(action.selector)}`;
    case "input":
      return `input ${chalk.gray(action.selector)} ${chalk.gray(`(${action.value})`)}`;
    case "select":
      return `select ${chalk.gray(action.selector)} ${chalk.gray(`(${action.value})`)}`;
    case "check":
    case "uncheck":
      return `${action.type} ${chalk.gray(action.selector)}`;
    case "navigate":
      return `navigate ${chalk.gray(action.url)}`;
    case "waitForNavigation":
      return `wait for navigation`;
    case "screenshot":
      return `screenshot ${chalk.gray(action.name)}`;
    default: {
      // This should never happen if all action types are handled
      const exhaustiveCheck: never = action;
      return String((exhaustiveCheck as Action).type);
    }
  }
}

/**
 * Display a single action as it completes (real-time display)
 * For screenshot mismatches, shows a warning since resolution happens later
 */
function displayActionInProgress(result: ActionResult): void {
  const actionDisplay = formatAction(result.action);

  if (result.passed) {
    // Action passed
    console.log(`   ${chalk.green("✓")} ${actionDisplay}`);
  } else if (result.action.type === "screenshot" && result.comparisonResult) {
    // Screenshot mismatch - show as warning (will be resolved later)
    console.log(`   ${chalk.yellow("⚠")} ${actionDisplay} ${chalk.yellow("(mismatch detected)")}`);
  } else {
    // Action failed
    console.log(`   ${chalk.red("✗")} ${actionDisplay}`);

    if (result.error) {
      console.log(`      ${chalk.red("Error:")} ${result.error.message}`);
      if (result.error.screenshotPath) {
        console.log(`      ${chalk.gray("Screenshot:")} ${result.error.screenshotPath}`);
      }
    }
  }
}

/**
 * Display results for a single story execution
 * Handles the story header, screenshot resolutions, and final summary
 */
function displayStoryResult(result: ExecutionResult): void {
  // Display screenshot resolutions if any occurred
  if (result.screenshotResolutions.length > 0) {
    console.log();
    console.log(chalk.blue("Screenshot resolutions:"));
    for (const resolution of result.screenshotResolutions) {
      if (resolution.accepted) {
        console.log(
          `   ${chalk.green("✓")} ${chalk.gray(resolution.name)} ${chalk.yellow("(updated baseline)")}`,
        );
      } else {
        console.log(
          `   ${chalk.yellow("⚠")} ${chalk.gray(resolution.name)} ${chalk.yellow("(kept old baseline)")}`,
        );
      }
    }
  }

  // Display final summary
  console.log();
  if (result.success) {
    console.log(chalk.green(`✅ Story "${result.storyId}" passed`));
  } else {
    console.log(chalk.red(`❌ Story "${result.storyId}" failed`));

    // Show global error if present
    if (result.error) {
      console.log(chalk.red(`   Error: ${result.error}`));
    }
  }
  console.log();
}

/**
 * Display summary of all story executions
 */
function displaySummary(results: ExecutionResult[]): void {
  const passedCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  console.log(chalk.bold("\n📊 Summary\n"));
  console.log(`   Total: ${results.length}`);
  console.log(`   ${chalk.green("Passed:")} ${passedCount}`);
  console.log(`   ${chalk.red("Failed:")} ${failedCount}`);
  console.log();
}

/**
 * Run multiple stories sequentially and display results
 *
 * @param storyIds - Array of story IDs to run
 * @returns Promise that resolves when all stories complete
 */
export async function handleRunMultipleStories(storyIds: string[]): Promise<void> {
  const results: ExecutionResult[] = [];

  // Run each story sequentially
  for (const storyId of storyIds) {
    try {
      // Display story header before execution starts
      console.log(chalk.blue(`\n▶ Running story: ${storyId}\n`));

      // Run the story with real-time action display
      const result = await runStory(storyId, {
        // Display each action as it completes
        onActionComplete: (actionResult) => {
          displayActionInProgress(actionResult);
        },
      });

      results.push(result);
      displayStoryResult(result);
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log();
      console.log(chalk.red(`❌ Story "${storyId}" failed`));
      console.log(chalk.red(`   Unexpected error: ${errorMessage}`));
      console.log();

      // Create a failed result for summary
      results.push({
        storyId,
        success: false,
        actionResults: [],
        screenshotResolutions: [],
        error: errorMessage,
      });
    }
  }

  // Display summary
  displaySummary(results);

  // Exit with appropriate code
  const hasFailures = results.some((r) => !r.success);
  if (hasFailures) {
    process.exit(1);
  }
}
