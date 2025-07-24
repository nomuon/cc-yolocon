import * as vscode from 'vscode';
import { WorktreeTreeItem, WorktreeProvider } from '../treeView';
import {
  hasUncommittedChanges,
  mergeBranch,
  removeWorktree,
} from '../utils/git';

export async function mergeWorktree(
  item: WorktreeTreeItem | undefined,
  provider: WorktreeProvider,
): Promise<void> {
  try {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    if (!item) {
      vscode.window.showErrorMessage('No worktree selected');
      return;
    }

    const worktree = item.worktree;

    if (worktree.isCurrent) {
      vscode.window.showErrorMessage('Cannot merge the current worktree');
      return;
    }

    const hasChanges = await hasUncommittedChanges(worktree.path);
    if (hasChanges) {
      const proceed = await vscode.window.showWarningMessage(
        `Worktree "${worktree.name}" has uncommitted changes. Do you want to proceed?`,
        'Yes, Proceed',
        'No, Cancel',
      );

      if (proceed !== 'Yes, Proceed') {
        return;
      }
    }

    const targetBranch = await vscode.window.showInputBox({
      prompt: 'Enter target branch to merge into',
      placeHolder: 'main',
      value: 'main',
    });

    if (!targetBranch) {
      return;
    }

    const confirmMessage = `Merge branch "${worktree.branch}" into "${targetBranch}"?`;
    const confirm = await vscode.window.showWarningMessage(
      confirmMessage,
      'Yes, Merge',
      'No, Cancel',
    );

    if (confirm !== 'Yes, Merge') {
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Merging worktree...',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 0, message: 'Performing merge...' });

        try {
          await mergeBranch(
            workspaceFolder.uri.fsPath,
            worktree.branch,
            targetBranch,
          );

          progress.report({ increment: 50, message: 'Merge complete!' });

          const deleteWorktreeOption = await vscode.window.showQuickPick(
            ['Yes, Delete Worktree', 'No, Keep Worktree'],
            { placeHolder: 'Delete the worktree after merge?' },
          );

          if (deleteWorktreeOption === 'Yes, Delete Worktree') {
            progress.report({ increment: 75, message: 'Removing worktree...' });
            await removeWorktree(worktree.path);
          }

          progress.report({ increment: 100, message: 'Done!' });
        } catch (mergeError) {
          throw new Error(
            `Merge failed: ${mergeError instanceof Error ? mergeError.message : 'Unknown error'}`,
          );
        }
      },
    );

    provider.refresh();
    vscode.window.showInformationMessage(
      `Successfully merged "${worktree.branch}" into "${targetBranch}"`,
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to merge worktree: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
