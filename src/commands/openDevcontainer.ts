import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';

export async function openDevcontainer(): Promise<void> {
  try {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    const devcontainerPath = path.join(
      workspaceFolder.uri.fsPath,
      '.devcontainer',
      'devcontainer.json',
    );

    if (!(await fs.pathExists(devcontainerPath))) {
      const generate = await vscode.window.showErrorMessage(
        'No .devcontainer found in this workspace',
        'Generate .devcontainer',
        'Cancel',
      );

      if (generate === 'Generate .devcontainer') {
        await vscode.commands.executeCommand('claude.generateDevcontainer');
      }
      return;
    }

    const openMode = await vscode.window.showQuickPick(
      ['Reopen in Container', 'Clone in Container Volume'],
      { placeHolder: 'How would you like to open the devcontainer?' },
    );

    if (!openMode) {
      return;
    }

    if (openMode === 'Reopen in Container') {
      await vscode.commands.executeCommand(
        'remote-containers.reopenInContainer',
      );
    } else {
      await vscode.commands.executeCommand('remote-containers.cloneInVolume');
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to open in devcontainer: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
