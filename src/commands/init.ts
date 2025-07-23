import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import * as fs from '../lib/fs.js';
import { DEVCONTAINER_JSON, DOCKERFILE, INIT_FIREWALL_SH } from '../lib/templates.js';

interface InitOptions {
  force?: boolean;
  env?: string[];
  envFile?: string;
}

export async function init(options: InitOptions): Promise<void> {
  const spinner = ora('Initializing devcontainer template...').start();
  
  try {
    const currentDir = fs.getCurrentDirectory();
    const devcontainerPath = path.join(currentDir, '.devcontainer');
    
    // Check if .devcontainer already exists
    if (await fs.pathExists(devcontainerPath)) {
      if (!options.force) {
        spinner.fail('.devcontainer directory already exists. Use --force to overwrite.');
        return;
      }
      spinner.text = 'Removing existing .devcontainer directory...';
      await fs.removeDirectory(devcontainerPath);
    }
    
    // Create template files from embedded templates
    spinner.text = 'Creating devcontainer template...';
    await fs.ensureDirectory(devcontainerPath);
    
    // Write template files
    await fs.writeFile(path.join(devcontainerPath, 'devcontainer.json'), DEVCONTAINER_JSON);
    await fs.writeFile(path.join(devcontainerPath, 'Dockerfile'), DOCKERFILE);
    await fs.writeFile(path.join(devcontainerPath, 'init-firewall.sh'), INIT_FIREWALL_SH);
    
    // Handle environment variables (optional .env file)
    if (options.envFile) {
      spinner.text = 'Copying environment file...';
      const envPath = path.join(devcontainerPath, '.env');
      await fs.copyDirectory(options.envFile, envPath);
      console.log(chalk.yellow('\n⚠️  Note: When using Docker, replace localhost URLs with host.docker.internal'));
      console.log(chalk.gray('  Example: localhost:3000 → host.docker.internal:3000'));
    } else if (options.env && options.env.length > 0) {
      spinner.text = 'Creating .env file...';
      const envPath = path.join(devcontainerPath, '.env');
      const envContent = options.env.join('\n') + '\n';
      await fs.writeFile(envPath, envContent);
      
      // Check for localhost references
      if (options.env.some(e => e.includes('localhost:'))) {
        console.log(chalk.yellow('\n⚠️  Note: When using Docker, replace localhost URLs with host.docker.internal'));
        console.log(chalk.gray('  Example: localhost:3000 → host.docker.internal:3000'));
      }
    }
    
    spinner.succeed('Devcontainer template initialized successfully!');
    console.log(chalk.green('\n✓ Created .devcontainer directory'));
    console.log(chalk.gray('  - devcontainer.json (with VS Code integration)'));
    console.log(chalk.gray('  - Dockerfile (Node.js 20 with security tools)'));
    console.log(chalk.gray('  - init-firewall.sh (network security script)'));
    if (options.env || options.envFile) {
      console.log(chalk.gray('  - .env (environment variables)'));
    }
    console.log(chalk.cyan('\nNext step: Run "yolocon start" to launch Claude Code in YOLO mode'));
    console.log(chalk.cyan('Or run "yolocon start --open" to automatically open VS Code'));
    
  } catch (error) {
    spinner.fail('Failed to initialize devcontainer template');
    throw error;
  }
}