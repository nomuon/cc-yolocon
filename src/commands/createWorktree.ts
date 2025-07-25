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
      workspaceFolder.uri.fsPath,
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

  // プロジェクトルートのパス（worktreeの親ディレクトリではなく、元のプロジェクトルート）
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

async function copyClaudeMd(
  sourcePath: string,
  targetPath: string,
): Promise<void> {
  const sourceClaudeMd = path.join(sourcePath, 'CLAUDE.md');
  const targetClaudeMd = path.join(targetPath, 'CLAUDE.md');
  const globalClaudeMdPath = path.join(
    process.env.HOME || process.env.USERPROFILE || '',
    '.claude',
    'CLAUDE.md',
  );

  let baseContent = '';

  // ベースとなる CLAUDE.md の内容を取得
  if (await fs.pathExists(sourceClaudeMd)) {
    baseContent = await fs.readFile(sourceClaudeMd, 'utf8');
  } else {
    const templateClaudeMd = path.join(
      __dirname,
      '..',
      '..',
      'templates',
      'CLAUDE.md',
    );
    if (await fs.pathExists(templateClaudeMd)) {
      baseContent = await fs.readFile(templateClaudeMd, 'utf8');
    }
  }

  // グローバル CLAUDE.md が存在する場合、追加するかユーザーに尋ねる
  if (await fs.pathExists(globalClaudeMdPath)) {
    const appendGlobal = await vscode.window.showQuickPick(['Yes', 'No'], {
      placeHolder: 'Append global ~/.claude/CLAUDE.md content to CLAUDE.md?',
    });

    if (appendGlobal === 'Yes') {
      const globalContent = await fs.readFile(globalClaudeMdPath, 'utf8');

      // 水平線で区切ってグローバルコンテンツを追加
      const finalContent =
        baseContent.trim() + '\n\n---\n\n' + globalContent.trim();
      await fs.writeFile(targetClaudeMd, finalContent, 'utf8');
    } else {
      // グローバル追加しない場合は、ベースコンテンツのみ
      if (baseContent) {
        await fs.writeFile(targetClaudeMd, baseContent, 'utf8');
      }
    }
  } else {
    // グローバル CLAUDE.md が存在しない場合は、ベースコンテンツのみ
    if (baseContent) {
      await fs.writeFile(targetClaudeMd, baseContent, 'utf8');
    }
  }
}
