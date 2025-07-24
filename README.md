# Claude Worktree Manager

🚀 **Vibe Coding with Claude Code!** Experience the ultimate development flow with safe YOLO mode through the perfect combination of **devcontainers** and **Git worktrees**.

VS Code extension for managing Git worktrees for Claude Code YOLO mode safely and easily.

## Overview

Claude Worktree Manager unlocks the power of **Vibe Coding** by combining two best practices:
- 🐳 **Devcontainers** for safe Claude Code YOLO mode environments
- 🌳 **Git Worktrees** for seamless parallel development workflows

This extension provides an intuitive sidebar interface for worktree operations with automatic .devcontainer setup, enabling you to code with confidence and creativity. Perfect for experimental development, feature isolation, and maintaining clean main branches while exploring new ideas with Claude Code.

## Features

- 🌳 **Smart Worktree Management**: Create, merge, and delete Git worktrees with visual distinction between main repo and worktrees
- 🐳 **Devcontainer Integration**: Automatically generate .devcontainer configuration with environment variables for isolated development
- 🔧 **Safety-First Operations**: Built-in safety checks for uncommitted changes and confirmation dialogs
- 📱 **Intuitive Sidebar Interface**: Tree view with colored icons (🏠 main repo, 🌿 worktrees, ✅ current branch)
- 🚀 **One-Click Setup**: Instant worktree creation with optional devcontainer and CLAUDE.md setup
- 🎯 **Vibe Coding Ready**: Perfect combination of isolation and parallel development for creative coding sessions

## Quick Start

1. **Install the Extension**
   - Download the `.vsix` file
   - Install via `code --install-extension claude-worktree-manager-0.0.1.vsix`

2. **Open a Git Repository**
   - Open any Git repository in VS Code
   - The Claude Worktree Manager sidebar will appear

3. **Create Your First Worktree**
   - Click "Create New Worktree" in the sidebar
   - Enter branch name (e.g., `feature/my-feature`)
   - Choose options for .devcontainer and CLAUDE.md
   - Click through the setup wizard

4. **Start Coding with Claude**
   - Open the worktree in a new window or devcontainer
   - Your environment variables are automatically available
   - Use Claude Code safely in an isolated environment

## Commands

| Command | Description |
|---------|-------------|
| `Claude: Create New Worktree` | Create a new Git worktree with optional setup |
| `Claude: Merge Worktree` | Merge worktree branch into target branch |
| `Claude: Delete Worktree` | Safely delete a worktree |
| `Claude: Generate .devcontainer` | Generate devcontainer configuration for main repo |
| `Claude: Open in Devcontainer` | Open worktree or main repo in devcontainer |
| `Claude: Refresh Worktrees` | Refresh the worktree list |

## Sidebar Interface

The extension adds a "Claude Worktree Manager" view to your VS Code sidebar:

```
Claude Worktree Manager
├─ 🏠 workspace (Main)     develop • Main     [🐳][⚙️]
├─ 🌿 feature-auth         feature/auth • Worktree     [🗑️][⇄][🐳]
└─ ✅ bugfix-login         bugfix/login • Worktree     [🗑️][⇄][🐳]
    
Actions: [🐳] Open DevContainer [⚙️] Generate DevContainer [🗑️] Delete [⇄] Merge
```

## Environment Variables

The extension automatically configures the following environment variables in devcontainers:

- **Claude/Anthropic**: `ANTHROPIC_API_KEY`, `CLAUDE_API_KEY`, etc.
- **GitHub**: `GH_TOKEN`, `GITHUB_TOKEN`
- **Cloud Providers**: AWS, Azure, Google Cloud
- **Databases**: PostgreSQL, MySQL, MongoDB, Redis
- **APIs**: OpenAI, Stripe, Twilio, and many more

## Safety Features

- **Uncommitted Changes Warning**: Alerts when trying to merge/delete worktrees with uncommitted changes
- **Path Validation**: Prevents overwriting existing directories
- **Branch Validation**: Ensures proper branch naming conventions
- **Confirmation Dialogs**: Double-confirmation for destructive operations

## Requirements

- VS Code 1.89.0 or higher
- Git installed and available in PATH
- Node.js 18+ (for devcontainer features)

## FAQ

### Why use worktrees with Claude Code?

Experience **Vibe Coding** - the perfect development flow where creativity meets safety! Git worktrees combined with devcontainers create the ultimate Claude Code YOLO mode experience:

- 🎨 **Creative Freedom**: Experiment boldly without fear of breaking main branch
- 🔒 **Isolated Environments**: Each worktree gets its own devcontainer for complete isolation
- ⚡ **Parallel Development**: Work on multiple features simultaneously without context switching
- 🛡️ **Safe YOLO Mode**: Let Claude Code be creative while maintaining project stability
- 🌊 **Flow State**: Seamless switching between ideas and implementations

### What if I don't have Docker?

The extension will still create worktrees and manage Git operations. The devcontainer features simply won't be available, but you can use Claude Code directly in the worktree.

### Can I customize the environment variables?

Yes! Edit the generated `.devcontainer/devcontainer.json` file to add or remove environment variables as needed.

### How do I uninstall?

```bash
code --uninstall-extension claude-worktree-manager
```

## Contributing

This is an open-source project. Contributions are welcome!

## License

MIT License - see LICENSE file for details.

---

## 日本語紹介

### Claude Worktree Manager について

🚀 **Claude Code で Vibe Coding を体験しよう！** **devcontainer** と **Git worktree** の完璧な組み合わせで、安全な YOLO モードによる究極の開発フローを実現します。

### 概要

Claude Worktree Manager は **Vibe Coding** の力を解放する2つのベストプラクティスを組み合わせています：
- 🐳 **Devcontainer**: Claude Code の YOLO モードを安全に利用するための分離環境
- 🌳 **Git Worktree**: シームレスな並列開発ワークフローの実現

直感的なサイドバーインターフェースでworktree操作と自動devcontainer設定を提供し、自信と創造性を持ってコーディングできます。実験的な開発、機能の分離、Claude Code で新しいアイデアを探索しながらメインブランチをクリーンに保つのに最適です。

### 主な特徴

- 🌳 **スマートなWorktree管理**: メインリポジトリとworktreeを視覚的に区別して作成・マージ・削除
- 🐳 **Devcontainer統合**: 分離開発用の環境変数付きdevcontainer設定を自動生成
- 🔧 **安全第一の操作**: 未コミット変更の検知と確認ダイアログによる安全性チェック
- 📱 **直感的なサイドバー**: カラーアイコン付きツリービュー（🏠 メインリポジトリ、🌿 worktree、✅ 現在のブランチ）
- 🚀 **ワンクリック設定**: devcontainerとCLAUDE.mdオプション付きの即座のworktree作成
- 🎯 **Vibe Coding対応**: 創造的なコーディングセッションのための分離と並列開発の完璧な組み合わせ

### なぜ Claude Code で worktree を使うのか？

**Vibe Coding** を体験しよう - 創造性と安全性が出会う完璧な開発フロー！Git worktree と devcontainer の組み合わせが、究極の Claude Code YOLO モード体験を創造します：

- 🎨 **創造の自由**: メインブランチを壊す心配なく大胆に実験
- 🔒 **分離環境**: 各worktreeが独自のdevcontainerで完全分離
- ⚡ **並列開発**: コンテキストスイッチなしで複数機能を同時開発
- 🛡️ **安全なYOLOモード**: プロジェクトの安定性を保ちながらClaude Codeの創造性を発揮
- 🌊 **フロー状態**: アイデアと実装の間をシームレスに切り替え

### システム要件

- VS Code 1.89.0 以上
- Git がPATHで利用可能
- Node.js 18+ (devcontainer機能用)

Claude Worktree Manager で、安全で創造的な開発体験をお楽しみください！