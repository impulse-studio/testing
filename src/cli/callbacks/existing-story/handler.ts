import chalk from "chalk";
import type { Action } from "@/core/types";
import { type ActionResult, runStory } from "@/runner";

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

export async function handleExistingStory(storyId: string): Promise<void> {
  console.log(chalk.blue(`\n▶ Running story: ${storyId}\n`));

  try {
    // Run the story with real-time action display
    const result = await runStory(storyId, {
      // Display each action as it completes
      onActionComplete: (actionResult) => {
        displayActionInProgress(actionResult);
      },
    });

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
      console.log(chalk.green(`✅ Story "${storyId}" passed`));
    } else {
      console.log(chalk.red(`❌ Story "${storyId}" failed`));

      // Show global error if present
      if (result.error) {
        console.log(chalk.red(`   Error: ${result.error}`));
      }
    }
    console.log();

    // Exit with appropriate code
    if (!result.success) {
      process.exit(1);
    }
  } catch (error) {
    // Handle unexpected errors
    console.log();
    console.log(chalk.red(`❌ Story "${storyId}" failed`));
    console.log(
      chalk.red(`   Unexpected error: ${error instanceof Error ? error.message : String(error)}`),
    );
    console.log();
    process.exit(1);
  }
}
