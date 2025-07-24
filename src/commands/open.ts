import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import * as fs from '../lib/fs.js';
import * as docker from '../lib/docker.js';
import * as vscode from '../lib/vscode.js';

interface OpenOptions {
  name: string;
  mode?: 'yolo' | 'normal';
  newWindow?: boolean;
}

export async function open(options: OpenOptions): Promise<void> {
  const spinner = ora('Opening devcontainer in VS Code...').start();
  
  try {
    // Check if VS Code is available
    spinner.text = 'Checking VS Code availability...';
    if (!await vscode.isVSCodeAvailable()) {
      spinner.fail('VS Code is not available. Please install VS Code and ensure "code" command is in PATH.');
      return;
    }

    // Check if Docker is running
    spinner.text = 'Checking Docker...';
    if (!await docker.isDockerRunning()) {
      spinner.fail('Docker is not running. Please start Docker first.');
      return;
    }
    
    // Check if .devcontainer exists
    const currentDir = fs.getCurrentDirectory();
    const devcontainerPath = path.join(currentDir, '.devcontainer');
    
    if (!await fs.pathExists(devcontainerPath)) {
      spinner.fail('.devcontainer directory not found. Run "yolocon init" first.');
      return;
    }
    
    // Check if container is running
    const containerName = `devcontainer-${options.name}-1`;
    if (!await docker.isContainerRunning(containerName)) {
      spinner.fail(`Container "${containerName}" is not running. Run "yolocon start" first.`);
      return;
    }
    
    // Check Claude Code status and start if needed
    const mode = options.mode || 'yolo';
    spinner.text = 'Checking Claude Code status...';
    
    const isClaudeRunning = await vscode.isClaudeCodeRunning(containerName);
    if (!isClaudeRunning) {
      spinner.text = `Starting Claude Code in ${mode} mode...`;
      const claudeStarted = await vscode.startClaudeCodeInContainer(containerName, mode);
      
      if (!claudeStarted) {
        spinner.warn('Failed to start Claude Code, but continuing with VS Code launch');
      } else {
        console.log(chalk.green(`✓ Claude Code started in ${mode} mode`));
      }
    } else {
      console.log(chalk.green('✓ Claude Code is already running'));
    }
    
    // Open in VS Code
    spinner.text = 'Opening VS Code...';
    const workspacePath = vscode.getContainerWorkspacePath();
    const success = await vscode.openInVSCode({
      containerName,
      hostPath: currentDir,
      workspacePath,
      newWindow: options.newWindow !== false, // デフォルトで新しいウィンドウで開く
      wait: false
    });
    
    if (!success) {
      spinner.fail('Failed to open VS Code');
      return;
    }
    
    spinner.succeed('VS Code opened successfully in new window!');
    console.log(chalk.green(`✓ Opened container "${containerName}" in new VS Code window`));
    console.log(chalk.green(`✓ Claude Code is ready in ${mode} mode`));
    console.log(chalk.cyan(`✓ Workspace: ${workspacePath}`));
    console.log(chalk.gray('\n💡 Tip: You can also use VS Code Command Palette (Cmd/Ctrl+Shift+P) →'));
    console.log(chalk.gray('   "Dev Containers: Reopen in Container" to open the container'));
    
  } catch (error) {
    spinner.fail('Failed to open devcontainer in VS Code');
    throw error;
  }
}