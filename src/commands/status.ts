import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import * as fs from '../lib/fs.js';
import * as docker from '../lib/docker.js';
import * as vscode from '../lib/vscode.js';

interface StatusOptions {
	name: string;
}

export async function status(options: StatusOptions): Promise<void> {
	const spinner = ora('Checking Claude Code environment status...').start();

	try {
		console.log(chalk.cyan(`\n🔍 Claude Code Environment Status\n`));

		// Check Docker status
		spinner.text = 'Checking Docker...';
		const dockerRunning = await docker.isDockerRunning();
		if (dockerRunning) {
			console.log(chalk.green('✓ Docker: Running'));
		} else {
			console.log(chalk.red('✗ Docker: Not running'));
		}

		// Check .devcontainer directory
		spinner.text = 'Checking devcontainer configuration...';
		const currentDir = fs.getCurrentDirectory();
		const devcontainerPath = path.join(currentDir, '.devcontainer');
		const devcontainerExists = await fs.pathExists(devcontainerPath);

		if (devcontainerExists) {
			console.log(chalk.green('✓ Devcontainer: Configuration found'));

			// Check for required files
			const dockerfilePath = path.join(devcontainerPath, 'Dockerfile');
			const devcontainerJsonPath = path.join(
				devcontainerPath,
				'devcontainer.json'
			);
			const firewallScriptPath = path.join(
				devcontainerPath,
				'init-firewall.sh'
			);

			const dockerfileExists = await fs.pathExists(dockerfilePath);
			const devcontainerJsonExists = await fs.pathExists(devcontainerJsonPath);
			const firewallScriptExists = await fs.pathExists(firewallScriptPath);

			console.log(
				`  - Dockerfile: ${dockerfileExists ? chalk.green('✓') : chalk.red('✗')}`
			);
			console.log(
				`  - devcontainer.json: ${devcontainerJsonExists ? chalk.green('✓') : chalk.red('✗')}`
			);
			console.log(
				`  - init-firewall.sh: ${firewallScriptExists ? chalk.green('✓') : chalk.red('✗')}`
			);
		} else {
			console.log(
				chalk.red(
					'✗ Devcontainer: Configuration not found (run "yolocon init")'
				)
			);
		}

		// Check container status
		spinner.text = 'Checking container status...';
		const containerName = `devcontainer-${options.name}-1`;
		const containerRunning = await docker.isContainerRunning(containerName);

		if (containerRunning) {
			console.log(chalk.green(`✓ Container: Running (${containerName})`));

			// Check Claude Code status
			spinner.text = 'Checking Claude Code status...';
			const claudeRunning = await vscode.isClaudeCodeRunning(containerName);

			if (claudeRunning) {
				console.log(chalk.green('✓ Claude Code: Running'));
			} else {
				console.log(chalk.yellow('⚠ Claude Code: Not running'));
			}
		} else {
			console.log(chalk.red(`✗ Container: Not running (${containerName})`));
			console.log(chalk.gray('  Claude Code: N/A (container not running)'));
		}

		// Check VS Code availability
		spinner.text = 'Checking VS Code availability...';
		const vscodeAvailable = await vscode.isVSCodeAvailable();
		if (vscodeAvailable) {
			console.log(chalk.green('✓ VS Code: Available'));
		} else {
			console.log(chalk.yellow('⚠ VS Code: Not available in PATH'));
		}

		spinner.succeed('Status check completed');

		// Show summary and next steps
		console.log(chalk.cyan('\n📋 Summary:'));
		if (!dockerRunning) {
			console.log(chalk.yellow('• Start Docker first'));
		} else if (!devcontainerExists) {
			console.log(chalk.yellow('• Run "yolocon init" to setup devcontainer'));
		} else if (!containerRunning) {
			console.log(chalk.yellow('• Run "yolocon start" to launch environment'));
		} else {
			// Check Claude Code status for final recommendation
			const claudeRunning = await vscode.isClaudeCodeRunning(containerName);
			if (!claudeRunning) {
				console.log(chalk.yellow('• Claude Code is ready but not running'));
				console.log(
					chalk.yellow('• Run "yolocon open" to start VS Code and Claude Code')
				);
				console.log(
					chalk.gray(
						'\n💡 Tip: You can also use VS Code Command Palette (Cmd/Ctrl+Shift+P) →'
					)
				);
				console.log(
					chalk.gray(
						'   "Dev Containers: Reopen in Container" to open the container'
					)
				);
			} else {
				console.log(chalk.green('• Environment is fully operational! 🚀'));
				console.log(chalk.green('• Run "yolocon open" to access VS Code'));
				console.log(
					chalk.gray(
						'\n💡 Tip: You can also use VS Code Command Palette (Cmd/Ctrl+Shift+P) →'
					)
				);
				console.log(
					chalk.gray(
						'   "Dev Containers: Reopen in Container" to open the container'
					)
				);
			}
		}
	} catch (error) {
		spinner.fail('Failed to check environment status');
		throw error;
	}
}
