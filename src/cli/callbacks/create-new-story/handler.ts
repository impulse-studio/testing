import chalk from 'chalk';
import { createStoryOnboarding, createStoryFile } from './create-story.js';
import { startRecording } from '@/recorder';

export async function handleCreateNewStory(): Promise<void> {
  console.log(chalk.bold('\n📝 Create New Story\n'));

  const config = await createStoryOnboarding();
  const storyPath = await createStoryFile(config);

  console.log(chalk.blue('🎬 Opening recorder...'));

  try {
    await startRecording(config.id);
    console.log(chalk.green(`\n✓ Story created at ${storyPath}\n`));
  } catch (error) {
    console.error(chalk.red('\n✗ Recording failed:'), error);
    process.exit(1);
  }
}
