import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { WorktreeTreeItem } from '../treeView';

export async function openWorktreeDevcontainer(
  item: WorktreeTreeItem,
): Promise<void> {
  try {
    const worktreePath = item.worktree.path;
    const devcontainerPath = path.join(
      worktreePath,
      '.devcontainer',
      'devcontainer.json',
    );

    if (!(await fs.pathExists(devcontainerPath))) {
      const generate = await vscode.window.showErrorMessage(
        `No .devcontainer found in worktree: ${item.worktree.name}`,
        'Generate .devcontainer',
        'Cancel',
      );

      if (generate === 'Generate .devcontainer') {
        // Generate devcontainer for this worktree
        await generateDevcontainerForWorktree(worktreePath);
      } else {
        return;
      }
    }

    // Open the worktree folder in a new window
    const folderUri = vscode.Uri.file(worktreePath);
    await vscode.commands.executeCommand(
      'vscode.openFolder',
      folderUri,
      true, // forceNewWindow = true
    );

    // Show detailed notification with action button
    const message = `新しいウィンドウで worktree "${item.worktree.name}" を開きました。`;
    const detail = `devcontainer を起動するには、新しいウィンドウで以下のいずれかの操作を行ってください：

1. 左下の緑色のリモートアイコン (><) をクリックして「Reopen in Container」を選択
2. コマンドパレット (Ctrl/Cmd+Shift+P) で「Dev Containers: Reopen in Container」を実行

または、この通知の「手順をコピー」ボタンでクリップボードにコピーできます。`;

    const action = await vscode.window.showInformationMessage(
      message,
      { modal: true, detail },
      '手順をコピー',
      'OK',
    );

    if (action === '手順をコピー') {
      await vscode.env.clipboard.writeText(
        'Dev Containers: Reopen in Container',
      );
      vscode.window.showInformationMessage(
        'コマンド名をクリップボードにコピーしました。新しいウィンドウのコマンドパレットに貼り付けてください。',
      );
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to open worktree in devcontainer: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

async function generateDevcontainerForWorktree(
  worktreePath: string,
): Promise<void> {
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

  vscode.window.showInformationMessage(
    'Devcontainer files generated successfully',
  );
}
