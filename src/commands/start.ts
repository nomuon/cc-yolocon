import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import * as fs from '../lib/fs.js';
import * as docker from '../lib/docker.js';
import * as vscode from '../lib/vscode.js';

interface StartOptions {
  name: string;
  mode: 'yolo' | 'normal';
  wait?: boolean;
  open?: boolean;
}

export async function start(options: StartOptions): Promise<void> {
  const spinner = ora('Starting Claude Code environment...').start();
  
  try {
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
    
    // Check if container is already running (handle devcontainer naming pattern)
    const containerName = `devcontainer-${options.name}-1`;
    if (await docker.isContainerRunning(containerName)) {
      spinner.info(`Container "${containerName}" is already running.`);
      
      // Start Claude Code if needed
      spinner.start(`Starting Claude Code in ${options.mode} mode...`);
      const claudeCommand = options.mode === 'yolo' ? ['bash', '-c', 'export PATH="~/.local/bin:$PATH" && claude --yolo'] : ['bash', '-c', 'export PATH="~/.local/bin:$PATH" && claude'];
      const execResult = await docker.dockerExec(containerName, claudeCommand, true);
      
      if (execResult.success) {
        spinner.succeed(`Claude Code started in ${options.mode} mode!`);
      } else {
        spinner.fail(`Failed to start Claude Code: ${execResult.stderr}`);
      }
      return;
    }
    
    // Build and start devcontainer
    spinner.text = 'Building devcontainer image...';
    const buildResult = await docker.dockerBuildDevcontainer(currentDir, containerName);
    
    if (!buildResult.success) {
      spinner.fail(`Failed to build devcontainer: ${buildResult.stderr}`);
      return;
    }
    
    spinner.text = 'Starting devcontainer...';
    const runResult = await docker.dockerRunDevcontainer(currentDir, containerName);
    
    if (!runResult.success) {
      spinner.fail(`Failed to start devcontainer: ${runResult.stderr}`);
      return;
    }
    
    // Execute post-create command (firewall setup)
    spinner.text = 'Setting up firewall...';
    const postCreateResult = await docker.dockerExecPostCreate(containerName);
    
    if (!postCreateResult.success) {
      spinner.warn(`Failed to setup firewall: ${postCreateResult.stderr}`);
    }
    
    // Wait for container to be ready
    if (options.wait) {
      spinner.text = 'Waiting for container to be ready...';
      let retries = 30; // 30 seconds timeout
      while (retries > 0) {
        if (await docker.isContainerRunning(containerName)) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      }
      
      if (retries === 0) {
        spinner.fail('Container failed to start within timeout.');
        return;
      }
      
      // Additional wait for container initialization
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Start Claude Code
    spinner.text = `Starting Claude Code in ${options.mode} mode...`;
    const claudeCommand = options.mode === 'yolo' ? ['bash', '-c', 'export PATH="~/.local/bin:$PATH" && claude --yolo'] : ['bash', '-c', 'export PATH="~/.local/bin:$PATH" && claude'];
    const execResult = await docker.dockerExec(containerName, claudeCommand, true);
    
    if (!execResult.success) {
      spinner.fail(`Failed to start Claude Code: ${execResult.stderr}`);
      return;
    }
    
    spinner.succeed('Claude Code environment started successfully!');
    console.log(chalk.green(`\n✓ Container "${containerName}" is running`));
    console.log(chalk.green(`✓ Claude Code started in ${options.mode} mode`));
    
    // Open in VS Code if requested
    if (options.open) {
      spinner.start('Opening VS Code...');
      
      if (!await vscode.isVSCodeAvailable()) {
        spinner.warn('VS Code is not available. Install VS Code and ensure "code" command is in PATH.');
      } else {
        const workspacePath = vscode.getContainerWorkspacePath();
        const success = await vscode.openInVSCode({
          containerName,
          hostPath: currentDir,
          workspacePath,
          newWindow: true, // startコマンドからは新しいウィンドウで開く
          wait: false
        });
        
        if (success) {
          spinner.succeed('VS Code opened successfully!');
          console.log(chalk.green(`✓ Opened in VS Code: ${workspacePath}`));
        } else {
          spinner.warn('Failed to open VS Code');
        }
      }
    }
    
    console.log(chalk.cyan('\nTo stop: Run "yolocon stop"'));
    if (!options.open) {
      console.log(chalk.cyan('To open in VS Code: Run "yolocon open"'));
      console.log(chalk.gray('\n💡 Tip: You can also use VS Code Command Palette (Cmd/Ctrl+Shift+P) →'));
      console.log(chalk.gray('   "Dev Containers: Reopen in Container" to open the container'));
    }
    
    // Display YOLO usage instructions for YOLO mode
    if (options.mode === 'yolo') {
      console.log(chalk.green('\n🚀 Open VS Code terminal and run `claude --dangerously-skip-permissions` to enjoy YOLO mode!'));
    }
    
  } catch (error) {
    spinner.fail('Failed to start Claude Code environment');
    throw error;
  }
}