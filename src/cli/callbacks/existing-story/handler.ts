import chalk from 'chalk';

export async function handleExistingStory(storyId: string): Promise<void> {
  console.log(chalk.blue(`\n▶ Running story: ${storyId}\n`));

  // TODO: Run the selected story
  console.log(chalk.yellow('⚠ Story runner not implemented yet'));
}
