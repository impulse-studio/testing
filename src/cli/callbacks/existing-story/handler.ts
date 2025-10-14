import chalk from 'chalk';
import { runStory, type ExecutionResult, type ActionResult } from '@/runner';
import type { Action, ScreenshotAction } from '@/core/types';

/**
 * Format an action for display with its details
 */
function formatAction(action: Action): string {
  switch (action.type) {
    case 'click':
      return `click ${chalk.gray(action.selector)}`;
    case 'input':
      return `input ${chalk.gray(action.selector)} ${chalk.gray(`(${action.value})`)}`;
    case 'select':
      return `select ${chalk.gray(action.selector)} ${chalk.gray(`(${action.value})`)}`;
    case 'check':
    case 'uncheck':
      return `${action.type} ${chalk.gray(action.selector)}`;
    case 'navigate':
      return `navigate ${chalk.gray(action.url)}`;
    case 'screenshot':
      return `screenshot ${chalk.gray(action.name)}`;
    default:
      // This should never happen if all action types are handled
      const exhaustiveCheck: never = action;
      return String((exhaustiveCheck as Action).type);
  }
}

/**
 * Display a single action result with appropriate formatting
 */
function displayActionResult(result: ActionResult, screenshotResolutions: ExecutionResult['screenshotResolutions']): void {
  const actionDisplay = formatAction(result.action);

  if (result.passed) {
    // Action passed
    console.log(`   ${chalk.green('✓')} ${actionDisplay}`);
  } else if (result.action.type === 'screenshot' && result.comparisonResult) {
    // Screenshot mismatch - check if it was resolved
    const screenshotAction = result.action as ScreenshotAction;
    const resolution = screenshotResolutions.find(r => r.name === screenshotAction.name);

    if (resolution) {
      if (resolution.accepted) {
        // Mismatch was accepted (KEEP_NEW)
        console.log(`   ${chalk.green('✓')} ${actionDisplay} ${chalk.yellow('(updated baseline)')}`);
      } else {
        // Mismatch was rejected (KEEP_OLD)
        console.log(`   ${chalk.yellow('⚠')} ${actionDisplay} ${chalk.yellow('(kept old baseline)')}`);
      }
    } else {
      // Mismatch not yet resolved (shouldn't happen in normal flow)
      console.log(`   ${chalk.yellow('⚠')} ${actionDisplay} ${chalk.yellow('(mismatch detected)')}`);
    }
  } else {
    // Action failed
    console.log(`   ${chalk.red('✗')} ${actionDisplay}`);

    if (result.error) {
      console.log(`      ${chalk.red('Error:')} ${result.error.message}`);
      if (result.error.screenshotPath) {
        console.log(`      ${chalk.gray('Screenshot:')} ${result.error.screenshotPath}`);
      }
    }
  }
}

export async function handleExistingStory(storyId: string): Promise<void> {
  console.log(chalk.blue(`\n▶ Running story: ${storyId}\n`));

  try {
    // Run the story
    const result = await runStory(storyId);

    // Display action-by-action results
    for (const actionResult of result.actionResults) {
      displayActionResult(actionResult, result.screenshotResolutions);
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
    console.log(chalk.red(`   Unexpected error: ${error instanceof Error ? error.message : String(error)}`));
    console.log();
    process.exit(1);
  }
}
