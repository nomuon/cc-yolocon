import * as shell from 'shelljs';
import * as path from 'path';
import { WorktreeItem } from '../treeView';

export async function getWorktrees(repoPath: string): Promise<WorktreeItem[]> {
  return new Promise((resolve, reject) => {
    shell.cd(repoPath);

    const result = shell.exec('git worktree list --porcelain', {
      silent: true,
    });

    if (result.code !== 0) {
      reject(new Error(`Failed to list worktrees: ${result.stderr}`));
      return;
    }

    const worktrees: WorktreeItem[] = [];
    const lines = result.stdout.split('\n').filter((line) => line.trim());

    let currentWorktree: Partial<WorktreeItem> = {};

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        currentWorktree.path = line.substring('worktree '.length);
      } else if (line.startsWith('branch ')) {
        currentWorktree.branch = line
          .substring('branch '.length)
          .replace('refs/heads/', '');
      } else if (line === 'bare') {
        continue;
      } else if (line === '') {
        if (currentWorktree.path && currentWorktree.branch) {
          const name = path.basename(currentWorktree.path);
          worktrees.push({
            name,
            path: currentWorktree.path,
            branch: currentWorktree.branch,
            isCurrent: false,
          });
        }
        currentWorktree = {};
      }
    }

    if (currentWorktree.path && currentWorktree.branch) {
      const name = path.basename(currentWorktree.path);
      worktrees.push({
        name,
        path: currentWorktree.path,
        branch: currentWorktree.branch,
        isCurrent: false,
      });
    }

    const currentBranchResult = shell.exec('git branch --show-current', {
      silent: true,
    });
    if (currentBranchResult.code === 0) {
      const currentBranch = currentBranchResult.stdout.trim();
      worktrees.forEach((wt) => {
        if (wt.branch === currentBranch) {
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

    const branchExists =
      shell.exec(`git rev-parse --verify ${branchName}`, { silent: true })
        .code === 0;

    let command: string;
    if (branchExists) {
      command = `git worktree add "${worktreePath}" "${branchName}"`;
    } else {
      const base = baseBranch || 'HEAD';
      command = `git worktree add -b "${branchName}" "${worktreePath}" "${base}"`;
    }

    const result = shell.exec(command, { silent: false });

    if (result.code !== 0) {
      reject(new Error(`Failed to create worktree: ${result.stderr}`));
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

    if (result.code !== 0) {
      reject(new Error(`Failed to remove worktree: ${result.stderr}`));
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

    if (result.code !== 0) {
      reject(new Error(`Failed to check git status: ${result.stderr}`));
      return;
    }

    resolve(result.stdout.trim().length > 0);
  });
}

export async function getCurrentBranch(worktreePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    shell.cd(worktreePath);

    const result = shell.exec('git branch --show-current', { silent: true });

    if (result.code !== 0) {
      reject(new Error(`Failed to get current branch: ${result.stderr}`));
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
    if (checkoutResult.code !== 0) {
      reject(
        new Error(
          `Failed to checkout ${targetBranch}: ${checkoutResult.stderr}`,
        ),
      );
      return;
    }

    const mergeResult = shell.exec(`git merge ${sourceBranch}`, {
      silent: false,
    });
    if (mergeResult.code !== 0) {
      reject(
        new Error(`Failed to merge ${sourceBranch}: ${mergeResult.stderr}`),
      );
      return;
    }

    resolve();
  });
}
