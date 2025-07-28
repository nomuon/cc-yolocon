import * as shell from 'shelljs';
import * as path from 'path';
import { WorktreeItem } from '../treeView';

export async function getWorktrees(repoPath: string): Promise<WorktreeItem[]> {
  return new Promise((resolve, reject) => {
    // Mac環境でPATHが正しく設定されていない場合に備えてPATHを補強
    if (process.platform === 'darwin') {
      shell.env['PATH'] =
        shell.env['PATH'] + ':/usr/local/bin:/opt/homebrew/bin';
    }

    shell.cd(repoPath);

    const result = shell.exec('git worktree list --porcelain', {
      silent: true,
    });

    if (!result || result.code !== 0) {
      const errorMsg = result ? result.stderr : 'Shell command returned null';
      reject(new Error(`Failed to list worktrees: ${errorMsg}`));
      return;
    }

    const worktrees: WorktreeItem[] = [];
    const lines = result.stdout.split('\n').filter((line) => line.trim());

    let currentWorktree: Partial<WorktreeItem & { isMainRepo: boolean }> = {};

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        currentWorktree.path = line.substring('worktree '.length);
        // メインリポジトリかどうかを判定（現在のrepoPathと同じかどうか）
        currentWorktree.isMainRepo =
          path.resolve(currentWorktree.path) === path.resolve(repoPath);
      } else if (line.startsWith('branch ')) {
        currentWorktree.branch = line
          .substring('branch '.length)
          .replace('refs/heads/', '');
      } else if (line === 'bare') {
        continue;
      } else if (line === '') {
        if (currentWorktree.path && currentWorktree.branch) {
          const name = currentWorktree.isMainRepo
            ? `${path.basename(currentWorktree.path)} (Main)`
            : path.basename(currentWorktree.path);
          worktrees.push({
            name,
            path: currentWorktree.path,
            branch: currentWorktree.branch,
            isCurrent: false,
            isMainRepo: currentWorktree.isMainRepo || false,
          });
        }
        currentWorktree = {};
      }
    }

    if (currentWorktree.path && currentWorktree.branch) {
      const name = currentWorktree.isMainRepo
        ? `${path.basename(currentWorktree.path)} (Main)`
        : path.basename(currentWorktree.path);
      worktrees.push({
        name,
        path: currentWorktree.path,
        branch: currentWorktree.branch,
        isCurrent: false,
        isMainRepo: currentWorktree.isMainRepo || false,
      });
    }

    const currentBranchResult = shell.exec('git branch --show-current', {
      silent: true,
    });
    if (currentBranchResult && currentBranchResult.code === 0) {
      const currentBranch = currentBranchResult.stdout.trim();
      worktrees.forEach((wt) => {
        if (
          wt.branch === currentBranch &&
          path.resolve(wt.path) === path.resolve(repoPath)
        ) {
          wt.isCurrent = true;
        }
      });
    }

    resolve(worktrees);
  });
}

export async function createNewWorktree(
  repoPath: string,
  branchName: string,
  worktreePath: string,
  baseBranch?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    shell.cd(repoPath);

    const branchCheckResult = shell.exec(
      `git rev-parse --verify ${branchName}`,
      { silent: true },
    );
    const branchExists = branchCheckResult && branchCheckResult.code === 0;

    let command: string;
    if (branchExists) {
      command = `git worktree add "${worktreePath}" "${branchName}"`;
    } else {
      const base = baseBranch || 'HEAD';
      command = `git worktree add -b "${branchName}" "${worktreePath}" "${base}"`;
    }

    const result = shell.exec(command, { silent: false });

    if (!result || result.code !== 0) {
      const errorMsg = result ? result.stderr : 'Shell command returned null';
      reject(new Error(`Failed to create worktree: ${errorMsg}`));
      return;
    }

    resolve();
  });
}

export async function removeWorktree(worktreePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const result = shell.exec(`git worktree remove "${worktreePath}" --force`, {
      silent: false,
    });

    if (!result || result.code !== 0) {
      const errorMsg = result ? result.stderr : 'Shell command returned null';
      reject(new Error(`Failed to remove worktree: ${errorMsg}`));
      return;
    }

    resolve();
  });
}

export async function hasUncommittedChanges(
  worktreePath: string,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    shell.cd(worktreePath);

    const result = shell.exec('git status --porcelain', { silent: true });

    if (!result || result.code !== 0) {
      const errorMsg = result ? result.stderr : 'Shell command returned null';
      reject(new Error(`Failed to check git status: ${errorMsg}`));
      return;
    }

    resolve(result.stdout.trim().length > 0);
  });
}

export async function getCurrentBranch(worktreePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    shell.cd(worktreePath);

    const result = shell.exec('git branch --show-current', { silent: true });

    if (!result || result.code !== 0) {
      const errorMsg = result ? result.stderr : 'Shell command returned null';
      reject(new Error(`Failed to get current branch: ${errorMsg}`));
      return;
    }

    resolve(result.stdout.trim());
  });
}

export async function mergeBranch(
  targetPath: string,
  sourceBranch: string,
  targetBranch: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    shell.cd(targetPath);

    const checkoutResult = shell.exec(`git checkout ${targetBranch}`, {
      silent: false,
    });
    if (!checkoutResult || checkoutResult.code !== 0) {
      reject(
        new Error(
          `Failed to checkout ${targetBranch}: ${checkoutResult ? checkoutResult.stderr : 'Shell command returned null'}`,
        ),
      );
      return;
    }

    const mergeResult = shell.exec(`git merge ${sourceBranch}`, {
      silent: false,
    });
    if (!mergeResult || mergeResult.code !== 0) {
      reject(
        new Error(
          `Failed to merge ${sourceBranch}: ${mergeResult ? mergeResult.stderr : 'Shell command returned null'}`,
        ),
      );
      return;
    }

    resolve();
  });
}
