import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { readYamlFile } from "./utils/yaml-helper.js";

interface StoryMetadata {
  id: string;
  name: string;
  path: string;
}

export async function listStories(): Promise<StoryMetadata[]> {
  const storiesDir = join(process.cwd(), ".testing", "stories");

  try {
    const entries = await readdir(storiesDir);
    const stories: StoryMetadata[] = [];

    for (const entry of entries) {
      const storyPath = join(storiesDir, entry);
      const storyFilePath = join(storyPath, "story.yml");

      try {
        const stats = await stat(storyPath);
        if (!stats.isDirectory()) continue;

        const storyData = await readYamlFile<{ id: string; name: string }>(storyFilePath);

        stories.push({
          id: storyData.id,
          name: storyData.name,
          path: storyPath,
        });
      } catch {}
    }

    return stories;
  } catch {
    return [];
  }
}
