import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import * as fs from '../lib/fs.js';
import * as docker from '../lib/docker.js';

interface StopOptions {
  name: string;
  clean?: boolean;
}

export async function stop(options: StopOptions): Promise<void> {
  const spinner = ora('Stopping Claude Code environment...').start();
  
  try {
    // Check if Docker is running
    spinner.text = 'Checking Docker...';
    if (!await docker.isDockerRunning()) {
      spinner.fail('Docker is not running.');
      return;
    }
    
    const currentDir = fs.getCurrentDirectory();
    const devcontainerPath = path.join(currentDir, '.devcontainer');
    
    // Check if .devcontainer exists
    if (!await fs.pathExists(devcontainerPath)) {
      spinner.info('.devcontainer directory not found.');
      return;
    }
    
    // Check if container exists (handle devcontainer naming pattern)
    const containerName = `devcontainer-${options.name}-1`;
    if (!await docker.containerExists(containerName)) {
      spinner.info(`Container "${containerName}" not found.`);
    } else {
      // Stop and remove container
      spinner.text = 'Stopping devcontainer...';
      const stopResult = await docker.dockerStopContainer(containerName);
      
      if (!stopResult.success) {
        spinner.fail(`Failed to stop devcontainer: ${stopResult.stderr}`);
        return;
      }
      
      spinner.text = 'Removing devcontainer...';
      const removeResult = await docker.dockerRemoveContainer(containerName);
      
      if (!removeResult.success) {
        spinner.warn(`Failed to remove devcontainer: ${removeResult.stderr}`);
      }
      
      spinner.succeed(`Container "${containerName}" stopped successfully!`);
    }
    
    // Clean up .devcontainer if requested
    if (options.clean) {
      spinner.start('Removing .devcontainer directory...');
      await fs.removeDirectory(devcontainerPath);
      spinner.succeed('.devcontainer directory removed!');
    }
    
    console.log(chalk.green('\n✓ Claude Code environment stopped'));
    if (options.clean) {
      console.log(chalk.green('✓ .devcontainer directory cleaned up'));
    }
    
  } catch (error) {
    spinner.fail('Failed to stop Claude Code environment');
    throw error;
  }
}