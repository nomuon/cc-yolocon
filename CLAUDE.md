# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

cc-YOLOCON is a VS Code extension that provides safe Git worktree management specifically designed for Claude Code YOLO mode. It creates isolated development environments with automatic devcontainer setup and environment variable management.

## Development Commands

**Build and Testing:**
```bash
# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Run linting
npm run lint

# Run tests
npm test

# Full pre-test pipeline (compile + lint)
npm run pretest
```

**Extension Packaging:**
```bash
# Package extension as .vsix
npm run package

# Publish to VS Code marketplace
npm run publish
```

## Architecture Overview

### Core Components

**Extension Entry Point (`src/extension.ts`)**
- Registers all VS Code commands and tree data providers
- Initializes the `WorktreeProvider` for the sidebar tree view
- Maps command IDs to their respective handler functions

**Tree View System (`src/treeView.ts`)**
- `WorktreeItem`: Interface defining worktree data structure with `isMainRepo` flag for visual distinction
- `WorktreeTreeItem`: VS Code tree item with context-aware icons (green check for current, blue home for main repo, yellow branch for worktrees)
- `WorktreeProvider`: Implements `TreeDataProvider` to populate the sidebar with worktree list

**Git Operations (`src/utils/git.ts`)**
- `getWorktrees()`: Parses `git worktree list --porcelain` output to distinguish main repository from actual worktrees
- `createNewWorktree()`: Handles both new branch creation and existing branch checkout
- Safety utilities: `hasUncommittedChanges()`, `getCurrentBranch()`, `mergeBranch()`

### Command Architecture

All commands are in `src/commands/` with consistent patterns:

**Worktree Lifecycle:**
- `createWorktree.ts`: Interactive wizard for worktree creation with devcontainer/CLAUDE.md options
- `deleteWorktree.ts`: Safe deletion with uncommitted changes detection
- `mergeWorktree.ts`: Branch merging with optional worktree cleanup

**Devcontainer Management:**
- `generateDevcontainer.ts`: General devcontainer generation
- `generateMainDevcontainer.ts`: Main repository devcontainer with overwrite confirmation
- `openDevcontainer.ts`: Current workspace devcontainer opening
- `openWorktreeDevcontainer.ts`: Worktree-specific devcontainer opening in new windows

### UI Context System

The extension uses VS Code's `contextValue` system to show different actions:
- `viewItem == mainRepo`: Shows devcontainer generation actions only
- `viewItem == worktree`: Shows merge/delete actions (restricted from main repo)
- Both contexts support devcontainer opening

### Template System

Templates in `/templates/` directory:
- `devcontainer.json`: Base devcontainer configuration with environment variable placeholders
- `Dockerfile`: Container setup with development tools
- `init-firewall.sh`: Firewall configuration script
- `CLAUDE.md`: Template for new worktrees

## Key Technical Decisions

**Path Resolution:** Uses `path.resolve()` to distinguish main repository from worktrees by comparing absolute paths.

**Safety First:** All destructive operations (delete, merge) include confirmation dialogs and check for uncommitted changes.

**Visual Distinction:** Main repository items show "(Main)" suffix and blue home icons vs yellow branch icons for worktrees.

**Isolated Environments:** Each worktree can have independent devcontainer configurations for true isolation.

## Development Notes

- Uses `shelljs` for Git command execution with proper error handling
- TypeScript strict mode enabled with comprehensive ESLint + Prettier configuration
- Vitest for testing framework
- All async operations use VS Code's progress reporting for user feedback
- Extension follows VS Code's activation event patterns for performance