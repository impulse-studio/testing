import chalk from 'chalk';
import { createStoryOnboarding, createStoryFile } from './create-story.js';

export async function handleCreateNewStory(): Promise<void> {
  console.log(chalk.bold('\n📝 Create New Story\n'));

  const config = await createStoryOnboarding();
  const storyPath = await createStoryFile(config);

  console.log(chalk.green(`\n✓ Story created at ${storyPath}\n`));
  console.log(chalk.blue('🎬 Opening recorder...\n'));

  // TODO: Open recorder with story path
  console.log(chalk.yellow('⚠ Recorder not implemented yet'));
}
