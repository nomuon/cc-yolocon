import * as vscode from 'vscode';
import * as path from 'path';
import { WorktreeTreeItem, WorktreeProvider } from '../treeView';
import { removeWorktree, hasUncommittedChanges } from '../utils/git';
import { exec } from 'child_process';
import { promisify } from 'util';

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

        progress.report({
          increment: 50,
          message: 'Cleaning up Docker resources...',
        });

        // Docker リソースのクリーンアップ
        await cleanupDockerResources(worktree.path, worktree.name);

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

const execAsync = promisify(exec);

async function cleanupDockerResources(
  worktreePath: string,
  worktreeName: string,
): Promise<void> {
  try {
    // Docker が利用可能かチェック
    try {
      await execAsync('docker --version');
    } catch {
      // Docker が利用できない場合はスキップ
      return;
    }

    console.log(
      `Starting Docker cleanup for worktree: ${worktreeName} at ${worktreePath}`,
    );

    // Step 1: 全てのコンテナを停止・削除
    console.log('Looking for containers to clean up...');

    // DevContainerの命名規則: vsc-{フォルダ名}-{ハッシュ}-uid
    // worktreeのフォルダ名を取得
    const worktreeFolderName = path.basename(worktreePath);

    try {
      // パターン1: vsc-{worktreeFolderName} で始まるコンテナ
      const { stdout: vscContainers } = await execAsync(
        `docker ps -a --format "{{.Names}}" | grep "^vsc-${worktreeFolderName}" || true`,
      );

      // パターン2: vsc-{worktreeName} で始まるコンテナ（別名の場合）
      const { stdout: vscWorktreeContainers } = await execAsync(
        `docker ps -a --format "{{.Names}}" | grep "^vsc-${worktreeName}" || true`,
      );

      // パターン3: worktree名を含むコンテナ（より広範囲）
      const { stdout: worktreeContainers } = await execAsync(
        `docker ps -a --format "{{.Names}}" | grep "${worktreeName}" || true`,
      );

      // 重複を除いてコンテナ名を収集
      const containerSet = new Set<string>();

      if (vscContainers.trim()) {
        vscContainers
          .trim()
          .split('\n')
          .forEach((name) => containerSet.add(name));
      }
      if (vscWorktreeContainers.trim()) {
        vscWorktreeContainers
          .trim()
          .split('\n')
          .forEach((name) => containerSet.add(name));
      }
      if (worktreeContainers.trim()) {
        worktreeContainers
          .trim()
          .split('\n')
          .forEach((name) => {
            // vsc- で始まるコンテナのみを対象とする（他のコンテナを誤って削除しない）
            if (name.startsWith('vsc-')) {
              containerSet.add(name);
            }
          });
      }

      // コンテナを停止・削除
      for (const containerName of containerSet) {
        if (containerName.trim()) {
          console.log(`Found container: ${containerName}`);

          // docker rm -f で停止と削除を同時に実行（より確実）
          console.log(
            `Forcefully stopping and removing container: ${containerName}`,
          );
          try {
            // -f オプションで実行中のコンテナも強制的に削除
            await execAsync(`docker rm -f "${containerName}"`);
            console.log(`Container forcefully removed: ${containerName}`);
          } catch (error) {
            // それでも失敗した場合は、個別に停止・削除を試みる
            console.log(
              `Force removal failed, trying stop then remove: ${containerName}`,
            );
            try {
              // タイムアウト付きで停止（10秒）
              await execAsync(`docker stop -t 10 "${containerName}"`);
              await execAsync(`docker rm "${containerName}"`);
              console.log(`Container removed after stop: ${containerName}`);
            } catch (fallbackError) {
              console.warn(
                `Failed to remove container ${containerName}:`,
                fallbackError,
              );
            }
          }
        }
      }

      if (containerSet.size === 0) {
        console.log('No containers found to clean up');
      }
    } catch (error) {
      console.warn('Error during container cleanup:', error);
    }

    // Step 2: DevContainer イメージのクリーンアップ（コンテナ削除後）
    console.log('Cleaning up DevContainer images...');

    try {
      // パターン1: vsc-{worktreeFolderName} で始まるイメージ
      const { stdout: vscImages } = await execAsync(
        `docker images --format "{{.Repository}}:{{.Tag}}" | grep "^vsc-${worktreeFolderName}" || true`,
      );

      // パターン2: vsc-{worktreeName} で始まるイメージ
      const { stdout: vscWorktreeImages } = await execAsync(
        `docker images --format "{{.Repository}}:{{.Tag}}" | grep "^vsc-${worktreeName}" || true`,
      );

      // 重複を除いてイメージ名を収集
      const imageSet = new Set<string>();

      if (vscImages.trim()) {
        vscImages
          .trim()
          .split('\n')
          .forEach((name) => imageSet.add(name));
      }
      if (vscWorktreeImages.trim()) {
        vscWorktreeImages
          .trim()
          .split('\n')
          .forEach((name) => imageSet.add(name));
      }

      // イメージを削除
      for (const imageName of imageSet) {
        if (imageName.trim()) {
          console.log(`Found image: ${imageName}`);
          console.log(`Removing image: ${imageName}`);
          try {
            await execAsync(`docker rmi "${imageName}"`);
            console.log(`Image removed: ${imageName}`);
          } catch (error) {
            // 使用中の場合は強制削除
            try {
              await execAsync(`docker rmi -f "${imageName}"`);
              console.log(`Image force removed: ${imageName}`);
            } catch (forceError) {
              console.warn(`Failed to remove image ${imageName}:`, forceError);
            }
          }
        }
      }

      if (imageSet.size === 0) {
        console.log('No images found to clean up');
      }
    } catch (error) {
      console.warn('Error during image cleanup:', error);
    }

    // 不要になったイメージとボリュームのクリーンアップ
    try {
      await execAsync('docker image prune -f 2>/dev/null || true');
      await execAsync('docker volume prune -f 2>/dev/null || true');
    } catch (error) {
      console.warn('Failed to prune dangling resources:', error);
    }

    console.log('Docker cleanup completed');
  } catch (error) {
    // Docker関連のクリーンアップで問題が発生してもワークツリー削除は成功とする
    console.warn(
      'Docker cleanup failed, but worktree was deleted successfully:',
      error,
    );
  }
}
