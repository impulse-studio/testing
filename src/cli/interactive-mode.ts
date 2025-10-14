import { select, Separator } from '@inquirer/prompts';
import chalk from 'chalk';
import { listStories } from './list-stories.js';
import { handleCreateNewStory } from './callbacks/create-new-story/handler.js';
import { handleExistingStory } from './callbacks/existing-story/handler.js';

const CREATE_NEW_OPTION = '__create_new__';

export async function runInteractiveMode(): Promise<void> {
  console.log(chalk.bold.blue('\n🎭 Impulse Testing\n'));

  const stories = await listStories();

  const choices: Array<{ name: string; value: string } | Separator> = [
    { name: chalk.green('✨ Create new story'), value: CREATE_NEW_OPTION },
  ];

  if (stories.length === 0) {
    choices.push(new Separator('  Your stories will appear here'));
  } else {
    choices.push(
      ...stories.map((story) => ({
        name: `${story.name} ${chalk.dim(`(${story.id})`)}`,
        value: story.id,
      }))
    );
  }

  const selection = await select({
    message: 'Select a story:',
    choices,
  });

  if (selection === CREATE_NEW_OPTION) {
    await handleCreateNewStory();
  } else {
    await handleExistingStory(selection);
  }
}

