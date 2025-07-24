import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { WorktreeTreeItem } from '../treeView';

export async function generateMainDevcontainer(
  item: WorktreeTreeItem,
): Promise<void> {
  try {
    if (!item.worktree.isMainRepo) {
      vscode.window.showErrorMessage(
        'This action is only available for the main repository',
      );
      return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    const mainRepoPath = workspaceFolder.uri.fsPath;
    const devcontainerPath = path.join(mainRepoPath, '.devcontainer');
    const devcontainerJsonPath = path.join(
      devcontainerPath,
      'devcontainer.json',
    );

    // 既存の.devcontainerディレクトリの確認
    const devcontainerExists = await fs.pathExists(devcontainerJsonPath);

    if (devcontainerExists) {
      const overwrite = await vscode.window.showWarningMessage(
        'A .devcontainer already exists in this repository. Do you want to overwrite it?',
        { modal: true },
        'Overwrite',
        'Cancel',
      );

      if (overwrite !== 'Overwrite') {
        return;
      }
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Generating .devcontainer files...',
        cancellable: false,
      },
      async (progress) => {
        progress.report({
          increment: 0,
          message: 'Creating .devcontainer directory...',
        });

        // .devcontainerディレクトリを作成
        await fs.ensureDir(devcontainerPath);

        progress.report({
          increment: 25,
          message: 'Copying template files...',
        });

        // テンプレートファイルをコピー
        await copyTemplateFiles(devcontainerPath);

        progress.report({ increment: 100, message: 'Complete!' });
      },
    );

    vscode.window.showInformationMessage(
      '.devcontainer files generated successfully in the main repository',
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to generate .devcontainer: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

async function copyTemplateFiles(devcontainerPath: string): Promise<void> {
  const templatePath = path.join(__dirname, '..', '..', 'templates');

  // devcontainer.jsonをコピー
  if (await fs.pathExists(path.join(templatePath, 'devcontainer.json'))) {
    await fs.copy(
      path.join(templatePath, 'devcontainer.json'),
      path.join(devcontainerPath, 'devcontainer.json'),
    );
  }

  // Dockerfileをコピー
  if (await fs.pathExists(path.join(templatePath, 'Dockerfile'))) {
    await fs.copy(
      path.join(templatePath, 'Dockerfile'),
      path.join(devcontainerPath, 'Dockerfile'),
    );
  }

  // init-firewall.shをコピー
  if (await fs.pathExists(path.join(templatePath, 'init-firewall.sh'))) {
    await fs.copy(
      path.join(templatePath, 'init-firewall.sh'),
      path.join(devcontainerPath, 'init-firewall.sh'),
    );
  }
}
