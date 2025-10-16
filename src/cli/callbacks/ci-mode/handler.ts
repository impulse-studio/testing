import chalk from "chalk";
import { listStories } from "@/cli/list-stories";
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
 * In CI mode, screenshot mismatches are always shown as failures (no resolution UI)
 */
function displayActionInProgress(result: ActionResult): void {
  const actionDisplay = formatAction(result.action);

  if (result.passed) {
    // Action passed
    console.log(`   ${chalk.green("✓")} ${actionDisplay}`);
  } else if (result.action.type === "screenshot" && result.comparisonResult) {
    // Screenshot mismatch - in CI mode, these are always failed
    console.log(`   ${chalk.red("✗")} ${actionDisplay} ${chalk.red("(screenshot mismatch)")}`);
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
 * Display final summary for a story execution (CI mode)
 * Actions are displayed in real-time via callback, this only shows the final result
 */
function displayStoryResult(result: ExecutionResult): void {
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

  console.log(chalk.bold("\n📊 CI Summary\n"));
  console.log(`   Total: ${results.length}`);
  console.log(`   ${chalk.green("Passed:")} ${passedCount}`);
  console.log(`   ${chalk.red("Failed:")} ${failedCount}`);
  console.log();

  if (failedCount > 0) {
    console.log(chalk.red("❌ Some stories failed. See details above."));
  } else {
    console.log(chalk.green("✅ All stories passed!"));
  }
  console.log();
}

/**
 * Run stories in CI mode (non-interactive)
 *
 * If story IDs are provided, runs only those stories.
 * If no story IDs are provided, runs all available stories.
 *
 * In CI mode:
 * - No interactive prompts
 * - Screenshot mismatches automatically fail the test (KEEP_OLD behavior)
 * - Exit code 0 if all pass, 1 if any fail
 *
 * @param storyIds - Optional array of story IDs to run. If empty, runs all stories.
 * @returns Promise that resolves when all stories complete
 */
export async function handleCIMode(storyIds: string[]): Promise<void> {
  console.log(chalk.bold.blue("\n🤖 Running in CI Mode\n"));

  // Determine which stories to run
  let storiesToRun: string[];

  if (storyIds.length > 0) {
    // Run specified stories
    storiesToRun = storyIds;
    console.log(chalk.blue(`Running ${storiesToRun.length} specified story/stories:`));
    storiesToRun.forEach((id) => {
      console.log(`   - ${id}`);
    });
    console.log();
  } else {
    // Run all available stories
    const allStories = await listStories();

    if (allStories.length === 0) {
      console.log(chalk.yellow("⚠ No stories found. Nothing to run."));
      console.log();
      process.exit(0);
    }

    storiesToRun = allStories.map((s) => s.id);
    console.log(chalk.blue(`Running all ${storiesToRun.length} available stories:`));
    storiesToRun.forEach((id) => {
      console.log(`   - ${id}`);
    });
    console.log();
  }

  const results: ExecutionResult[] = [];

  // Run each story sequentially
  for (const storyId of storiesToRun) {
    try {
      // Display story header before execution starts
      console.log(chalk.blue(`\n▶ Running story: ${storyId}\n`));

      // Run the story with real-time action display
      const result = await runStory(storyId, {
        ciMode: true,
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
