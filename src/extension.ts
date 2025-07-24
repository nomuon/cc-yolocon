import * as vscode from 'vscode';
import { WorktreeProvider } from './treeView';
import { createWorktree } from './commands/createWorktree';
import { mergeWorktree } from './commands/mergeWorktree';
import { deleteWorktree } from './commands/deleteWorktree';
import { generateDevcontainer } from './commands/generateDevcontainer';
import { openDevcontainer } from './commands/openDevcontainer';
import { openWorktreeDevcontainer } from './commands/openWorktreeDevcontainer';

export function activate(context: vscode.ExtensionContext): void {
  console.log('Claude Worktree Manager is now active!');

  const worktreeProvider = new WorktreeProvider();

  vscode.window.registerTreeDataProvider('worktreeView', worktreeProvider);

  const disposables = [
    vscode.commands.registerCommand('claude.createWorktree', () =>
      createWorktree(worktreeProvider),
    ),
    vscode.commands.registerCommand('claude.mergeWorktree', (item) =>
      mergeWorktree(item, worktreeProvider),
    ),
    vscode.commands.registerCommand('claude.deleteWorktree', (item) =>
      deleteWorktree(item, worktreeProvider),
    ),
    vscode.commands.registerCommand(
      'claude.generateDevcontainer',
      generateDevcontainer,
    ),
    vscode.commands.registerCommand(
      'claude.openDevcontainer',
      openDevcontainer,
    ),
    vscode.commands.registerCommand('claude.openWorktreeDevcontainer', (item) =>
      openWorktreeDevcontainer(item),
    ),
    vscode.commands.registerCommand('claude.refreshWorktrees', () =>
      worktreeProvider.refresh(),
    ),
  ];

  disposables.forEach((d) => context.subscriptions.push(d));
}

export function deactivate(): void {
  console.log('Claude Worktree Manager has been deactivated');
}
