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

  // プロジェクトルートのパス
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    throw new Error('No workspace folder found');
  }
  const projectRootPath = workspaceFolder.uri.fsPath;
  const projectDevcontainerPath = path.join(projectRootPath, '.devcontainer');

  // プロジェクトルートに .devcontainer が存在しない場合は作成
  if (!(await fs.pathExists(projectDevcontainerPath))) {
    await createProjectDevcontainer(projectRootPath);
  }

  // worktree 用の devcontainer.json を作成（プロジェクトルートの Dockerfile を参照）
  const templatePath = path.join(__dirname, '..', '..', 'templates');
  const templateDevcontainerPath = path.join(templatePath, 'devcontainer.json');

  if (await fs.pathExists(templateDevcontainerPath)) {
    // テンプレートを読み込み
    const devcontainerJson = await fs.readJson(templateDevcontainerPath);

    // buildセクションを使用してビルドコンテキストを明示的に指定
    // これにより、すべてのworktreeで同じイメージIDが生成される
    delete devcontainerJson.dockerFile; // 古い形式を削除

    devcontainerJson.build = {
      dockerfile: path.join(projectDevcontainerPath, 'Dockerfile'),
      context: projectDevcontainerPath,
    };

    // プロジェクト名をベースにしたイメージ名を設定（再利用を促進）
    const projectName = path.basename(projectRootPath);
    devcontainerJson.name = `${projectName}-devcontainer`;

    // 環境変数は動的に生成
    const { generateContainerEnv } = require('../utils/env');
    devcontainerJson.containerEnv = generateContainerEnv();

    await fs.writeJson(
      path.join(devcontainerPath, 'devcontainer.json'),
      devcontainerJson,
      { spaces: 2 },
    );
  }

  vscode.window.showInformationMessage(
    'Devcontainer files generated successfully',
  );
}

async function createProjectDevcontainer(
  projectRootPath: string,
): Promise<void> {
  const projectDevcontainerPath = path.join(projectRootPath, '.devcontainer');
  const templatePath = path.join(__dirname, '..', '..', 'templates');

  await fs.ensureDir(projectDevcontainerPath);

  // Dockerfile をコピー
  const dockerfileSource = path.join(templatePath, 'Dockerfile');
  if (await fs.pathExists(dockerfileSource)) {
    await fs.copy(
      dockerfileSource,
      path.join(projectDevcontainerPath, 'Dockerfile'),
      {
        overwrite: true,
      },
    );
  }

  // init-firewall.sh をコピー
  const initScriptSource = path.join(templatePath, 'init-firewall.sh');
  if (await fs.pathExists(initScriptSource)) {
    await fs.copy(
      initScriptSource,
      path.join(projectDevcontainerPath, 'init-firewall.sh'),
      { overwrite: true },
    );
    await fs.chmod(
      path.join(projectDevcontainerPath, 'init-firewall.sh'),
      '755',
    );
  }
}
