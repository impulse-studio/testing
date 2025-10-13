import { readYamlFile, writeYamlFile } from '@/cli/utils/yaml-helper';
import { join } from 'node:path';
import { STORIES_DIR, STORY_FILE } from '@/core/constants';
import type { Story, Action } from '@/core/types';

/**
 * Load a story from its story.yml file
 * @param storyId - Story identifier
 * @returns The complete story object
 */
export async function loadStory(storyId: string): Promise<Story> {
  const storyPath = join(STORIES_DIR, storyId, STORY_FILE);
  return await readYamlFile<Story>(storyPath);
}

/**
 * Append new actions to an existing story and save back to story.yml
 * Preserves all other fields (id, name, start)
 * @param storyId - Story identifier
 * @param actions - Array of actions to append
 */
export async function appendActions(
  storyId: string,
  actions: Action[]
): Promise<void> {
  // Load existing story
  const story = await loadStory(storyId);

  // Append new actions to the existing actions array
  story.actions = [...story.actions, ...actions];

  // Write back to story.yml
  const storyPath = join(STORIES_DIR, storyId, STORY_FILE);
  await writeYamlFile(storyPath, story);
}
