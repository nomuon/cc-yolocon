import * as vscode from 'vscode';
import { getWorktrees } from './utils/git';

export interface WorktreeItem {
  name: string;
  path: string;
  branch: string;
  isCurrent: boolean;
}

export class WorktreeTreeItem extends vscode.TreeItem {
  constructor(
    public readonly worktree: WorktreeItem,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(worktree.name, collapsibleState);
    this.tooltip = `${this.worktree.branch} - ${this.worktree.path}`;
    this.description = this.worktree.path;
    this.contextValue = 'worktree';

    if (this.worktree.isCurrent) {
      this.iconPath = new vscode.ThemeIcon('check');
    }
  }
}

export class WorktreeProvider
  implements vscode.TreeDataProvider<WorktreeTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    WorktreeTreeItem | undefined | null | void
  > = new vscode.EventEmitter<WorktreeTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    WorktreeTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: WorktreeTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: WorktreeTreeItem): Promise<WorktreeTreeItem[]> {
    if (!element) {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showInformationMessage('No workspace folder open');
        return [];
      }

      try {
        const worktrees = await getWorktrees(workspaceFolder.uri.fsPath);
        return worktrees.map(
          (wt) =>
            new WorktreeTreeItem(wt, vscode.TreeItemCollapsibleState.None),
        );
      } catch (error) {
        console.error('Error getting worktrees:', error);
        vscode.window.showErrorMessage(
          `Failed to get worktrees: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        return [];
      }
    }
    return [];
  }
}
