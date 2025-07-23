import { spawn } from 'bun';
import path from 'path';

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function runCommand(command: string, args: string[], cwd?: string): Promise<CommandResult> {
  const proc = spawn({
    cmd: [command, ...args],
    cwd: cwd || process.cwd(),
    stdout: 'pipe',
    stderr: 'pipe'
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text()
  ]);

  const exitCode = await proc.exited;

  return {
    success: exitCode === 0,
    stdout,
    stderr,
    exitCode
  };
}

export async function dockerComposeUp(projectPath: string, detached: boolean = true): Promise<CommandResult> {
  const args = [
    'compose',
    '-f',
    path.join(projectPath, '.devcontainer', 'docker-compose.yml'),
    'up'
  ];
  
  if (detached) {
    args.push('-d');
  }

  return await runCommand('docker', args, projectPath);
}

export async function dockerComposeDown(projectPath: string): Promise<CommandResult> {
  const args = [
    'compose',
    '-f',
    path.join(projectPath, '.devcontainer', 'docker-compose.yml'),
    'down'
  ];

  return await runCommand('docker', args, projectPath);
}

export async function dockerExec(containerName: string, command: string[], detached: boolean = false): Promise<CommandResult> {
  const args = ['exec'];
  
  if (detached) {
    args.push('-d');
  }
  
  args.push(containerName, ...command);

  return await runCommand('docker', args);
}

export async function isDockerRunning(): Promise<boolean> {
  try {
    const result = await runCommand('docker', ['info']);
    return result.success;
  } catch {
    return false;
  }
}

export async function containerExists(containerName: string): Promise<boolean> {
  const result = await runCommand('docker', ['ps', '-a', '--format', '{{.Names}}']);
  return result.stdout.split('\n').includes(containerName);
}

export async function isContainerRunning(containerName: string): Promise<boolean> {
  const result = await runCommand('docker', ['ps', '--format', '{{.Names}}']);
  return result.stdout.split('\n').includes(containerName);
}