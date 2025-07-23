import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import * as fs from '../lib/fs.js';
import * as docker from '../lib/docker.js';

interface StartOptions {
  name: string;
  mode: 'yolo' | 'normal';
  wait?: boolean;
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
      spinner.fail('.devcontainer directory not found. Run "yolo init" first.');
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
    
    // Start devcontainer
    spinner.text = 'Starting devcontainer...';
    const composeResult = await docker.dockerComposeUp(currentDir, true);
    
    if (!composeResult.success) {
      spinner.fail(`Failed to start devcontainer: ${composeResult.stderr}`);
      return;
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
    console.log(chalk.cyan('\nTo stop: Run "yolo stop"'));
    
  } catch (error) {
    spinner.fail('Failed to start Claude Code environment');
    throw error;
  }
}