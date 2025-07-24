import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { createNewWorktree } from '../utils/git';
import { WorktreeProvider } from '../treeView';

export async function createWorktree(
  provider: WorktreeProvider,
): Promise<void> {
  try {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    const branchName = await vscode.window.showInputBox({
      prompt: 'Enter branch name for the new worktree',
      placeHolder: 'feature/my-feature',
      validateInput: (value) => {
        if (!value || value.trim() === '') {
          return 'Branch name is required';
        }
        if (!/^[a-zA-Z0-9\-_\/]+$/.test(value)) {
          return 'Invalid branch name. Use only letters, numbers, hyphens, underscores, and slashes';
        }
        return null;
      },
    });

    if (!branchName) {
      return;
    }

    const defaultPath = path.join(
      path.dirname(workspaceFolder.uri.fsPath),
      branchName.replace(/\//g, '-'),
    );
    const worktreePath = await vscode.window.showInputBox({
      prompt: 'Enter path for the new worktree',
      value: defaultPath,
      valueSelection: [
        defaultPath.length - branchName.replace(/\//g, '-').length,
        defaultPath.length,
      ],
      validateInput: (value) => {
        if (!value || value.trim() === '') {
          return 'Path is required';
        }
        if (fs.existsSync(value)) {
          return 'Path already exists';
        }
        return null;
      },
    });

    if (!worktreePath) {
      return;
    }

    const baseBranch = await vscode.window.showInputBox({
      prompt: 'Base branch (leave empty for current HEAD)',
      placeHolder: 'main',
    });

    const withDevcontainer =
      (await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: 'Generate .devcontainer?',
      })) === 'Yes';

    const withClaudeMd =
      (await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: 'Copy CLAUDE.md?',
      })) === 'Yes';

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Creating worktree...',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 0, message: 'Creating git worktree...' });

        await createNewWorktree(
          workspaceFolder.uri.fsPath,
          branchName,
          worktreePath,
          baseBranch || undefined,
        );

        progress.report({ increment: 50, message: 'Setting up files...' });

        if (withDevcontainer) {
          await generateDevcontainerFiles(worktreePath);
        }

        if (withClaudeMd) {
          await copyClaudeMd(workspaceFolder.uri.fsPath, worktreePath);
        }

        progress.report({ increment: 100, message: 'Complete!' });
      },
    );

    provider.refresh();

    const openInNewWindow = await vscode.window.showQuickPick(
      ['Open in New Window', 'Stay in Current Window'],
      { placeHolder: 'How would you like to open the worktree?' },
    );

    if (openInNewWindow === 'Open in New Window') {
      await vscode.commands.executeCommand(
        'vscode.openFolder',
        vscode.Uri.file(worktreePath),
        true,
      );
    }

    vscode.window.showInformationMessage(
      `Worktree created successfully at ${worktreePath}`,
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to create worktree: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

async function generateDevcontainerFiles(worktreePath: string): Promise<void> {
  const devcontainerPath = path.join(worktreePath, '.devcontainer');
  await fs.ensureDir(devcontainerPath);

  const templatePath = path.join(__dirname, '..', '..', 'templates');

  if (await fs.pathExists(path.join(templatePath, 'devcontainer.json'))) {
    await fs.copy(
      path.join(templatePath, 'devcontainer.json'),
      path.join(devcontainerPath, 'devcontainer.json'),
    );
  }

  if (await fs.pathExists(path.join(templatePath, 'Dockerfile'))) {
    await fs.copy(
      path.join(templatePath, 'Dockerfile'),
      path.join(devcontainerPath, 'Dockerfile'),
    );
  }

  if (await fs.pathExists(path.join(templatePath, 'init-firewall.sh'))) {
    await fs.copy(
      path.join(templatePath, 'init-firewall.sh'),
      path.join(devcontainerPath, 'init-firewall.sh'),
    );
  }
}

async function copyClaudeMd(
  sourcePath: string,
  targetPath: string,
): Promise<void> {
  const sourceClaudeMd = path.join(sourcePath, 'CLAUDE.md');
  const targetClaudeMd = path.join(targetPath, 'CLAUDE.md');

  if (await fs.pathExists(sourceClaudeMd)) {
    await fs.copy(sourceClaudeMd, targetClaudeMd);
  } else {
    const templateClaudeMd = path.join(
      __dirname,
      '..',
      '..',
      'templates',
      'CLAUDE.md',
    );
    if (await fs.pathExists(templateClaudeMd)) {
      await fs.copy(templateClaudeMd, targetClaudeMd);
    }
  }
}
