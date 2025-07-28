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

    // プロジェクトルートのフォルダ名も取得（親ディレクトリ）
    const projectRootName = path.basename(path.dirname(worktreePath));

    // ブランチ名のスラッシュをハイフンに置換（DevContainerの命名規則に従う）
    const sanitizedWorktreeName = worktreeName.replace(/\//g, '-');

    console.log('Search patterns:');
    console.log(`  - Worktree folder name: ${worktreeFolderName}`);
    console.log(`  - Worktree name: ${worktreeName}`);
    console.log(`  - Sanitized worktree name: ${sanitizedWorktreeName}`);
    console.log(`  - Project root name: ${projectRootName}`);

    try {
      // 複数のパターンで包括的に検索
      const searchPatterns = [
        `vsc-${worktreeFolderName}`,
        `vsc-${sanitizedWorktreeName}`,
        `vsc-${worktreeName}`,
        `vsc-${projectRootName}-${worktreeFolderName}`,
        `vsc-${projectRootName}-${sanitizedWorktreeName}`,
      ];

      // 重複を除いてコンテナ名を収集
      const containerSet = new Set<string>();

      // 1. 名前ベースの検索（既存）
      for (const pattern of searchPatterns) {
        try {
          const { stdout } = await execAsync(
            `docker ps -a --format "{{.Names}}" | grep "^${pattern}" || true`,
          );

          if (stdout.trim()) {
            const containers = stdout.trim().split('\n');
            console.log(
              `Found containers with pattern "${pattern}":`,
              containers,
            );
            containers.forEach((name) => containerSet.add(name));
          }
        } catch (error) {
          console.warn(`Error searching with pattern "${pattern}":`, error);
        }
      }

      // 2. ラベルベースの検索（DevContainerが使用するラベル）
      console.log('\nSearching containers by DevContainer labels...');
      try {
        // devcontainer.local_folder ラベルを使用した検索
        const { stdout: labeledContainers } = await execAsync(
          `docker ps -a --filter "label=devcontainer.local_folder=${worktreePath}" --format "{{.Names}}" || true`,
        );

        if (labeledContainers.trim()) {
          const containers = labeledContainers.trim().split('\n');
          console.log(
            `Found containers with devcontainer.local_folder label:`,
            containers,
          );
          containers.forEach((name) => containerSet.add(name));
        }

        // 追加のラベル検索パターン（部分一致）
        const { stdout: partialLabeledContainers } = await execAsync(
          `docker ps -a --format "{{.Names}}" --filter "label=devcontainer.local_folder" | xargs -I {} sh -c 'docker inspect {} | grep -q "${worktreeFolderName}" && echo {}' 2>/dev/null || true`,
        );

        if (partialLabeledContainers.trim()) {
          const containers = partialLabeledContainers.trim().split('\n');
          console.log(`Found containers with partial label match:`, containers);
          containers.forEach((name) => containerSet.add(name));
        }
      } catch (error) {
        console.warn('Error in label-based container search:', error);
      }

      // 3. 追加の検索: worktree名を含むすべてのvsc-コンテナ
      try {
        const { stdout: additionalContainers } = await execAsync(
          `docker ps -a --format "{{.Names}}" | grep "^vsc-" | grep -E "${worktreeFolderName}|${sanitizedWorktreeName}" || true`,
        );

        if (additionalContainers.trim()) {
          const containers = additionalContainers.trim().split('\n');
          console.log('Found additional vsc- containers:', containers);
          containers.forEach((name) => containerSet.add(name));
        }
      } catch (error) {
        console.warn('Error in additional container search:', error);
      }

      // コンテナを停止・削除
      if (containerSet.size > 0) {
        console.log(`Total containers found: ${containerSet.size}`);
        console.log('Containers to be removed:', Array.from(containerSet));
      }

      for (const containerName of containerSet) {
        if (containerName.trim()) {
          console.log(`Processing container: ${containerName}`);

          // docker rm -f で停止と削除を同時に実行（より確実）
          console.log(
            `Forcefully stopping and removing container: ${containerName}`,
          );
          try {
            // -f オプションで実行中のコンテナも強制的に削除
            await execAsync(`docker rm -f "${containerName}"`);
            console.log(`✓ Container forcefully removed: ${containerName}`);
          } catch (error) {
            // それでも失敗した場合は、個別に停止・削除を試みる
            console.log(
              `Force removal failed, trying stop then remove: ${containerName}`,
            );
            try {
              // タイムアウト付きで停止（10秒）
              await execAsync(`docker stop -t 10 "${containerName}"`);
              await execAsync(`docker rm "${containerName}"`);
              console.log(`✓ Container removed after stop: ${containerName}`);
            } catch (fallbackError) {
              console.warn(
                `✗ Failed to remove container ${containerName}:`,
                fallbackError,
              );
            }
          }
        }
      }

      if (containerSet.size === 0) {
        console.log('No containers found to clean up');
      } else {
        console.log(
          `Container cleanup completed. Processed ${containerSet.size} container(s).`,
        );
      }
    } catch (error) {
      console.warn('Error during container cleanup:', error);
    }

    // Step 2: DevContainer イメージのクリーンアップ（コンテナ削除後）
    console.log('\nCleaning up DevContainer images...');

    try {
      // イメージも同様のパターンで検索
      const imageSearchPatterns = [
        `vsc-${worktreeFolderName}`,
        `vsc-${sanitizedWorktreeName}`,
        `vsc-${worktreeName}`,
        `vsc-${projectRootName}-${worktreeFolderName}`,
        `vsc-${projectRootName}-${sanitizedWorktreeName}`,
      ];

      // 重複を除いてイメージ名を収集
      const imageSet = new Set<string>();

      for (const pattern of imageSearchPatterns) {
        try {
          const { stdout } = await execAsync(
            `docker images --format "{{.Repository}}:{{.Tag}}" | grep "^${pattern}" || true`,
          );

          if (stdout.trim()) {
            const images = stdout.trim().split('\n');
            console.log(`Found images with pattern "${pattern}":`, images);
            images.forEach((name) => imageSet.add(name));
          }
        } catch (error) {
          console.warn(
            `Error searching images with pattern "${pattern}":`,
            error,
          );
        }
      }

      // イメージを削除
      if (imageSet.size > 0) {
        console.log(`Total images found: ${imageSet.size}`);
        console.log('Images to be removed:', Array.from(imageSet));
      }

      for (const imageName of imageSet) {
        if (imageName.trim()) {
          console.log(`Processing image: ${imageName}`);
          try {
            await execAsync(`docker rmi "${imageName}"`);
            console.log(`✓ Image removed: ${imageName}`);
          } catch (error) {
            // 使用中の場合は強制削除
            try {
              await execAsync(`docker rmi -f "${imageName}"`);
              console.log(`✓ Image force removed: ${imageName}`);
            } catch (forceError) {
              console.warn(
                `✗ Failed to remove image ${imageName}:`,
                forceError,
              );
            }
          }
        }
      }

      if (imageSet.size === 0) {
        console.log('No images found to clean up');
      } else {
        console.log(
          `Image cleanup completed. Processed ${imageSet.size} image(s).`,
        );
      }
    } catch (error) {
      console.warn('Error during image cleanup:', error);
    }

    // 不要になったイメージとボリュームのクリーンアップ
    console.log('\nCleaning up dangling Docker resources...');
    try {
      const { stdout: prunedImages } = await execAsync(
        'docker image prune -f 2>/dev/null || true',
      );
      if (prunedImages && prunedImages.includes('Total reclaimed space')) {
        console.log('✓ Dangling images pruned');
      }

      const { stdout: prunedVolumes } = await execAsync(
        'docker volume prune -f 2>/dev/null || true',
      );
      if (prunedVolumes && prunedVolumes.includes('Total reclaimed space')) {
        console.log('✓ Dangling volumes pruned');
      }
    } catch (error) {
      console.warn('Failed to prune dangling resources:', error);
    }

    console.log('\n✅ Docker cleanup completed successfully');
  } catch (error) {
    // Docker関連のクリーンアップで問題が発生してもワークツリー削除は成功とする
    console.warn(
      'Docker cleanup failed, but worktree was deleted successfully:',
      error,
    );
  }
}
