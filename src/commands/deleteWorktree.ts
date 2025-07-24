import * as vscode from 'vscode';
import { WorktreeTreeItem, WorktreeProvider } from '../treeView';
import { removeWorktree, hasUncommittedChanges } from '../utils/git';

export async function deleteWorktree(
  item: WorktreeTreeItem | undefined,
  provider: WorktreeProvider,
): Promise<void> {
  try {
    if (!item) {
      vscode.window.showErrorMessage('No worktree selected');
      return;
    }

    const worktree = item.worktree;

    if (worktree.isCurrent) {
      vscode.window.showErrorMessage('Cannot delete the current worktree');
      return;
    }

    const hasChanges = await hasUncommittedChanges(worktree.path);
    let warningMessage = `Are you sure you want to delete the worktree "${worktree.name}"?`;

    if (hasChanges) {
      warningMessage = `Worktree "${worktree.name}" has uncommitted changes. Are you sure you want to delete it?`;
    }

    const confirm = await vscode.window.showWarningMessage(
      warningMessage,
      'Yes, Delete',
      'No, Cancel',
    );

    if (confirm !== 'Yes, Delete') {
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Deleting worktree...',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 0, message: 'Removing worktree...' });

        await removeWorktree(worktree.path);

        progress.report({ increment: 100, message: 'Complete!' });
      },
    );

    provider.refresh();
    vscode.window.showInformationMessage(
      `Worktree "${worktree.name}" deleted successfully`,
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to delete worktree: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
