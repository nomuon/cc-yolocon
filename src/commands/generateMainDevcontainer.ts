import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { WorktreeTreeItem } from '../treeView';
import { generateContainerEnv } from '../utils/env';

export async function generateMainDevcontainer(
  item: WorktreeTreeItem,
  context: vscode.ExtensionContext,
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
        await copyTemplateFiles(devcontainerPath, context);

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

async function copyTemplateFiles(
  devcontainerPath: string,
  context: vscode.ExtensionContext,
): Promise<void> {
  // ExtensionContextを使用してテンプレートパスを解決
  const templatePath = path.join(context.extensionPath, 'templates');

  // デバッグ情報の追加
  console.log('Template path:', templatePath);
  console.log('__dirname:', __dirname);

  // テンプレートディレクトリの存在確認
  if (!(await fs.pathExists(templatePath))) {
    throw new Error(`Template directory not found at: ${templatePath}`);
  }

  // devcontainer.jsonを読み込み、containerEnvを追加してコピー
  const devcontainerJsonSource = path.join(templatePath, 'devcontainer.json');
  console.log('Checking devcontainer.json at:', devcontainerJsonSource);
  if (await fs.pathExists(devcontainerJsonSource)) {
    console.log('Reading and modifying devcontainer.json...');
    const devcontainerJson = await fs.readJson(devcontainerJsonSource);

    // containerEnvを動的に生成
    devcontainerJson.containerEnv = generateContainerEnv();

    // 修正したJSONを書き込み
    await fs.writeJson(
      path.join(devcontainerPath, 'devcontainer.json'),
      devcontainerJson,
      { spaces: 2 },
    );
    console.log('devcontainer.json written successfully');
  } else {
    console.error('devcontainer.json not found');
    throw new Error('devcontainer.json template not found');
  }

  // Dockerfileをコピー
  const dockerfileSource = path.join(templatePath, 'Dockerfile');
  console.log('Checking Dockerfile at:', dockerfileSource);
  if (await fs.pathExists(dockerfileSource)) {
    console.log('Copying Dockerfile...');
    await fs.copy(dockerfileSource, path.join(devcontainerPath, 'Dockerfile'), {
      overwrite: true,
    });
  } else {
    console.error('Dockerfile not found');
    throw new Error('Dockerfile template not found');
  }

  // init-firewall.shをコピー
  const initScriptSource = path.join(templatePath, 'init-firewall.sh');
  console.log('Checking init-firewall.sh at:', initScriptSource);
  if (await fs.pathExists(initScriptSource)) {
    console.log('Copying init-firewall.sh...');
    await fs.copy(
      initScriptSource,
      path.join(devcontainerPath, 'init-firewall.sh'),
      { overwrite: true },
    );

    // ファイルの権限設定
    await fs.chmod(path.join(devcontainerPath, 'init-firewall.sh'), '755');
  } else {
    console.error('init-firewall.sh not found');
    throw new Error('init-firewall.sh template not found');
  }

  // コピー後の確認
  const copiedFiles = await fs.readdir(devcontainerPath);
  console.log('Files in .devcontainer after copy:', copiedFiles);
}
