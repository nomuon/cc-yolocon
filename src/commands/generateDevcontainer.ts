import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { generateContainerEnv } from '../utils/env';

export async function generateDevcontainer(): Promise<void> {
  try {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    const devcontainerPath = path.join(
      workspaceFolder.uri.fsPath,
      '.devcontainer',
    );

    if (await fs.pathExists(devcontainerPath)) {
      const overwrite = await vscode.window.showWarningMessage(
        '.devcontainer already exists. Overwrite?',
        'Yes, Overwrite',
        'No, Cancel',
      );

      if (overwrite !== 'Yes, Overwrite') {
        return;
      }
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Generating .devcontainer...',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 0, message: 'Creating directory...' });
        await fs.ensureDir(devcontainerPath);

        progress.report({ increment: 25, message: 'Copying templates...' });
        const templatePath = path.join(__dirname, '..', '..', 'templates');

        const devcontainerJsonPath = path.join(
          templatePath,
          'devcontainer.json',
        );
        if (await fs.pathExists(devcontainerJsonPath)) {
          const devcontainerJson = await fs.readJson(devcontainerJsonPath);

          devcontainerJson.containerEnv = generateContainerEnv();

          await fs.writeJson(
            path.join(devcontainerPath, 'devcontainer.json'),
            devcontainerJson,
            { spaces: 2 },
          );
        }

        const dockerfilePath = path.join(templatePath, 'Dockerfile');
        if (await fs.pathExists(dockerfilePath)) {
          await fs.copy(
            dockerfilePath,
            path.join(devcontainerPath, 'Dockerfile'),
          );
        }

        const initScriptPath = path.join(templatePath, 'init-firewall.sh');
        if (await fs.pathExists(initScriptPath)) {
          await fs.copy(
            initScriptPath,
            path.join(devcontainerPath, 'init-firewall.sh'),
          );

          await fs.chmod(
            path.join(devcontainerPath, 'init-firewall.sh'),
            '755',
          );
        }

        progress.report({ increment: 100, message: 'Complete!' });
      },
    );

    vscode.window.showInformationMessage(
      '.devcontainer generated successfully',
    );

    const openInContainer = await vscode.window.showQuickPick(['Yes', 'No'], {
      placeHolder: 'Open in devcontainer now?',
    });

    if (openInContainer === 'Yes') {
      await vscode.commands.executeCommand('claude.openDevcontainer');
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to generate .devcontainer: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
