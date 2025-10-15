import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { input } from "@inquirer/prompts";
import { slugify } from "@/cli/utils/slugify";
import { writeYamlFile } from "@/cli/utils/yaml-helper";

interface StoryConfig {
  id: string;
  name: string;
  startUrl: string;
}

export async function createStoryOnboarding(): Promise<StoryConfig> {
  const name = await input({
    message: "Story name:",
    validate: (value) => value.length > 0 || "Name is required",
  });

  const suggestedId = slugify(name);
  const id = await input({
    message: "Story ID:",
    default: suggestedId,
    validate: (value) => value.length > 0 || "ID is required",
  });

  const startUrl = await input({
    message: "Start URL:",
    default: "http://localhost:3000",
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return "Invalid URL";
      }
    },
  });

  return { id, name, startUrl };
}

export async function createStoryFile(config: StoryConfig): Promise<string> {
  const storyDir = join(process.cwd(), ".testing", "stories", config.id);
  const storyFilePath = join(storyDir, "story.yml");

  await mkdir(storyDir, { recursive: true });

  const storyData = {
    id: config.id,
    name: config.name,
    start: {
      url: config.startUrl,
    },
    actions: [],
  };

  await writeYamlFile(storyFilePath, storyData);

  return storyFilePath;
}
