import fs from 'fs-extra';
import path from 'path';

export async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.copy(src, dest, {
    overwrite: true,
    errorOnExist: false
  });
}

export async function removeDirectory(dir: string): Promise<void> {
  await fs.remove(dir);
}

export async function ensureDirectory(dir: string): Promise<void> {
  await fs.ensureDir(dir);
}

export async function pathExists(path: string): Promise<boolean> {
  return await fs.pathExists(path);
}

export async function readJson(file: string): Promise<any> {
  return await fs.readJson(file);
}

export async function writeJson(file: string, data: any): Promise<void> {
  await fs.writeJson(file, data, { spaces: 2 });
}

export async function readFile(file: string): Promise<string> {
  return await fs.readFile(file, 'utf-8');
}

export async function writeFile(file: string, data: string): Promise<void> {
  await fs.writeFile(file, data, 'utf-8');
}

export function getCurrentDirectory(): string {
  return process.cwd();
}

export function getBaseName(filePath: string): string {
  return path.basename(filePath);
}