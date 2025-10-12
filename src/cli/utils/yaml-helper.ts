import { parse, stringify } from 'yaml';
import { readFile, writeFile } from 'node:fs/promises';

export async function readYamlFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, 'utf-8');
  return parse(content) as T;
}

export async function writeYamlFile(filePath: string, data: unknown): Promise<void> {
  const content = stringify(data);
  await writeFile(filePath, content, 'utf-8');
}

