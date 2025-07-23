import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import * as fs from '../lib/fs.js';
import { DEVCONTAINER_JSON, DOCKERFILE, DOCKER_COMPOSE_YML } from '../lib/templates.js';

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
    await fs.writeFile(path.join(devcontainerPath, 'docker-compose.yml'), DOCKER_COMPOSE_YML);
    
    // Update devcontainer.json with workspace folder
    spinner.text = 'Configuring devcontainer.json...';
    const devcontainerJsonPath = path.join(devcontainerPath, 'devcontainer.json');
    const devcontainerJson = await fs.readJson(devcontainerJsonPath);
    
    const workspaceName = fs.getBaseName(currentDir);
    devcontainerJson.workspaceFolder = `/workspaces/${workspaceName}`;
    
    await fs.writeJson(devcontainerJsonPath, devcontainerJson);
    
    // Update docker-compose.yml with workspace folder name
    spinner.text = 'Configuring docker-compose.yml...';
    const dockerComposePath = path.join(devcontainerPath, 'docker-compose.yml');
    let dockerComposeContent = await fs.readFile(dockerComposePath);
    dockerComposeContent = dockerComposeContent.replace(/\${WORKSPACE_FOLDER_NAME}/g, workspaceName);
    await fs.writeFile(dockerComposePath, dockerComposeContent);
    
    // Handle environment variables
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
    console.log(chalk.gray('  - devcontainer.json'));
    console.log(chalk.gray('  - Dockerfile'));
    console.log(chalk.gray('  - docker-compose.yml'));
    if (options.env || options.envFile) {
      console.log(chalk.gray('  - .env'));
    }
    console.log(chalk.cyan('\nNext step: Run "yolo start" to launch Claude Code in YOLO mode'));
    
  } catch (error) {
    spinner.fail('Failed to initialize devcontainer template');
    throw error;
  }
}