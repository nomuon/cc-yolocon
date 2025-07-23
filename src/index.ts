#!/usr/bin/env bun
import { Command } from 'commander';
import chalk from 'chalk';
import { init } from './commands/init.js';
import { start } from './commands/start.js';
import { stop } from './commands/stop.js';
import { open } from './commands/open.js';

const program = new Command();

program
  .name('yolo')
  .description('Claude Code YOLO mode CLI tool with Devcontainer isolation')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize devcontainer template in current directory')
  .option('-f, --force', 'Overwrite existing .devcontainer directory')
  .option('--env <KEY=VALUE...>', 'Add environment variables to .devcontainer/.env', (value: string, previous: string[]) => {
    return previous ? [...previous, value] : [value];
  }, [] as string[])
  .option('--env-file <path>', 'Path to environment file')
  .action(async (options) => {
    try {
      await init(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('start')
  .description('Start devcontainer and Claude Code')
  .option('--name <container-name>', 'Container name', 'claude-yolo')
  .option('--mode <mode>', 'Launch mode (yolo|normal)', 'yolo')
  .option('--wait', 'Wait for startup completion')
  .option('--open', 'Open VS Code after starting')
  .action(async (options) => {
    try {
      await start(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('open')
  .description('Open devcontainer in VS Code')
  .option('--name <container-name>', 'Container name', 'claude-yolo')
  .option('--mode <mode>', 'Claude Code mode (yolo|normal)', 'yolo')
  .option('--no-new-window', 'Open in existing VS Code window instead of new window')
  .action(async (options) => {
    try {
      await open(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('stop')
  .description('Stop devcontainer')
  .option('--name <container-name>', 'Container name', 'claude-yolo')
  .option('-c, --clean', 'Remove .devcontainer directory')
  .action(async (options) => {
    try {
      await stop(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();