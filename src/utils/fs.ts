import * as fs from 'fs-extra';
import * as path from 'path';

export async function copyTemplate(
  templateName: string,
  targetPath: string,
  replacements?: Record<string, string>,
): Promise<void> {
  const templatePath = path.join(
    __dirname,
    '..',
    '..',
    'templates',
    templateName,
  );

  if (!(await fs.pathExists(templatePath))) {
    throw new Error(`Template ${templateName} not found`);
  }

  if (replacements && Object.keys(replacements).length > 0) {
    let content = await fs.readFile(templatePath, 'utf-8');

    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      content = content.replace(regex, value);
    }

    await fs.writeFile(targetPath, content, 'utf-8');
  } else {
    await fs.copy(templatePath, targetPath);
  }
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

export async function createFileFromTemplate(
  templateName: string,
  targetPath: string,
  variables?: Record<string, string>,
): Promise<void> {
  const templatePath = path.join(
    __dirname,
    '..',
    '..',
    'templates',
    templateName,
  );

  if (!(await fs.pathExists(templatePath))) {
    throw new Error(`Template ${templateName} not found`);
  }

  let content = await fs.readFile(templatePath, 'utf-8');

  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    }
  }

  await fs.writeFile(targetPath, content, 'utf-8');
}

export async function pathExists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath);
}

export async function removeDirectory(dirPath: string): Promise<void> {
  if (await fs.pathExists(dirPath)) {
    await fs.remove(dirPath);
  }
}

export async function makeExecutable(filePath: string): Promise<void> {
  await fs.chmod(filePath, '755');
}
