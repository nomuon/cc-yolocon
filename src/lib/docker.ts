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

// New devcontainer functions (non-compose)

export async function dockerBuildDevcontainer(projectPath: string, containerName: string): Promise<CommandResult> {
  const devcontainerPath = path.join(projectPath, '.devcontainer');
  const args = [
    'build',
    '-f', path.join(devcontainerPath, 'Dockerfile'),
    '-t', containerName,
    '--build-arg', `TZ=${process.env.TZ || 'America/Los_Angeles'}`,
    devcontainerPath
  ];

  return await runCommand('docker', args, projectPath);
}

export async function dockerRunDevcontainer(projectPath: string, containerName: string): Promise<CommandResult> {
  const workspaceName = path.basename(projectPath);
  
  const args = [
    'run',
    '-d',
    '--name', containerName,
    '--cap-add=NET_ADMIN',
    '--cap-add=NET_RAW',
    '-v', `${projectPath}:/workspace:cached`,
    '-v', `claude-code-bashhistory-${containerName}:/commandhistory`,
    '-v', `${process.env.HOME}/.claude:/home/node/.claude:cached`,
    '-e', `NODE_OPTIONS=--max-old-space-size=4096`,
    '-e', `CLAUDE_CONFIG_DIR=/home/node/.claude`,
    '-e', `POWERLEVEL9K_DISABLE_GITSTATUS=true`
  ];

  // Add environment variables from host
  const envVars = [
    'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_CUSTOM_HEADERS',
    'ANTHROPIC_MODEL', 'ANTHROPIC_SMALL_FAST_MODEL', 'BASH_DEFAULT_TIMEOUT_MS',
    'BASH_MAX_TIMEOUT_MS', 'BASH_MAX_OUTPUT_LENGTH', 'CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR',
    'CLAUDE_CODE_API_KEY_HELPER_TTL_MS', 'CLAUDE_CODE_MAX_OUTPUT_TOKENS',
    'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX', 'CLAUDE_CODE_SKIP_BEDROCK_AUTH',
    'CLAUDE_CODE_SKIP_VERTEX_AUTH', 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC',
    'DISABLE_AUTOUPDATER', 'DISABLE_BUG_COMMAND', 'DISABLE_COST_WARNINGS',
    'DISABLE_ERROR_REPORTING', 'DISABLE_NON_ESSENTIAL_MODEL_CALLS', 'DISABLE_TELEMETRY',
    'HTTP_PROXY', 'HTTPS_PROXY', 'MAX_THINKING_TOKENS', 'MCP_TIMEOUT',
    'MCP_TOOL_TIMEOUT', 'MAX_MCP_OUTPUT_TOKENS', 'AWS_REGION',
    'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN',
    'ANTHROPIC_BEDROCK_BASE_URL', 'ANTHROPIC_VERTEX_PROJECT_ID',
    'ANTHROPIC_VERTEX_BASE_URL', 'API_TIMEOUT_MS'
  ];

  envVars.forEach(envVar => {
    if (process.env[envVar]) {
      args.push('-e', `${envVar}=${process.env[envVar]}`);
    }
  });

  args.push(containerName);
  args.push('sleep', 'infinity');

  return await runCommand('docker', args, projectPath);
}

export async function dockerStopContainer(containerName: string): Promise<CommandResult> {
  return await runCommand('docker', ['stop', containerName]);
}

export async function dockerRemoveContainer(containerName: string): Promise<CommandResult> {
  return await runCommand('docker', ['rm', containerName]);
}

export async function dockerExecPostCreate(containerName: string): Promise<CommandResult> {
  return await runCommand('docker', ['exec', containerName, 'sudo', '/usr/local/bin/init-firewall.sh']);
}