import * as fs from 'fs/promises';
import * as path from 'path';
import { Dirent } from 'fs';
import * as yaml from 'yaml';
import { yamlOverwrite } from 'yaml-diff-patch';
import prettier from 'prettier';
import { errorFrom } from './errors';

/**
 * Formats a yaml source with `prettier`.
 */
async function formatYaml(code: string, filePath: string): Promise<string> {
  try {
    const readConfig = await prettier.resolveConfig(filePath);
    return prettier.format(code, {
      ...readConfig,
      parser: 'yaml',
    });
  } catch (rawError) {
    const error = errorFrom(rawError);
    console.error(error.message);
    throw error;
  }
}

export type Reviver = NonNullable<Parameters<typeof JSON.parse>[1]>;

/**
 * Like `fs.readFile`, but for JSON files specifically. Will throw on malformed JSON.
 */
export async function readJsonFile(filePath: string, reviver?: Reviver): Promise<unknown> {
  const content = await fs.readFile(filePath, { encoding: 'utf-8' });
  return JSON.parse(content, reviver);
}

export async function readMaybeFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, { encoding: 'utf-8' });
  } catch (rawError) {
    const error = errorFrom(rawError);
    if (error.code === 'ENOENT' || error.code === 'EISDIR') {
      return null;
    }
    throw error;
  }
}

export async function readMaybeDir(dirPath: string): Promise<Dirent[]> {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch (rawError: unknown) {
    const error = errorFrom(rawError);
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return [];
    }
    throw error;
  }
}

export type WriteFileOptions = Parameters<typeof fs.writeFile>[2];

export async function writeFileRecursive(
  filePath: string,
  content: string | Buffer,
  options?: WriteFileOptions,
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, options);
}

export interface UpdateYamlOptions {
  schemaUrl?: string;
}

export async function updateYamlFile(
  filePath: string,
  content: object,
  options?: UpdateYamlOptions,
) {
  const oldContent = await readMaybeFile(filePath);

  let newContent = oldContent ? yamlOverwrite(oldContent, content) : yaml.stringify(content);

  if (options?.schemaUrl) {
    const yamlDoc = yaml.parseDocument(newContent);
    yamlDoc.commentBefore = ` yaml-language-server: $schema=${options.schemaUrl}`;
    newContent = yamlDoc.toString();
  }

  newContent = await formatYaml(newContent, filePath);
  if (newContent !== oldContent) {
    await writeFileRecursive(filePath, newContent);
  }
}

export async function fileExists(filepath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filepath);
    return stat.isFile();
  } catch (err) {
    if (errorFrom(err).code === 'ENOENT') {
      return false;
    }
    throw err;
  }
}

export async function folderExists(folderpath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(folderpath);
    return stat.isDirectory();
  } catch (err) {
    if (errorFrom(err).code === 'ENOENT') {
      return false;
    }
    throw err;
  }
}

export async function fileReplace(
  filePath: string,
  searchValue: string | RegExp,
  replaceValue: string,
): Promise<void> {
  const queriesFileContent = await fs.readFile(filePath, { encoding: 'utf-8' });
  const updatedFileContent = queriesFileContent.replace(searchValue, () => replaceValue);
  await fs.writeFile(filePath, updatedFileContent);
}

export async function fileReplaceAll(
  filePath: string,
  searchValue: string | RegExp,
  replaceValue: string,
) {
  const queriesFileContent = await fs.readFile(filePath, { encoding: 'utf-8' });
  const updatedFileContent = queriesFileContent.replaceAll(searchValue, () => replaceValue);
  await fs.writeFile(filePath, updatedFileContent);
}
