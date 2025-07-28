# cc-YOLOCON

🚀 **Supercharge Your Development with Claude Code!** Experience the ultimate development flow with safe YOLO mode through the perfect combination of **devcontainers** and **Git worktrees**.

A VS Code extension that makes Git worktree management simple and safe for Claude Code YOLO mode development.

---

## 🎯 Quick Start

**Ready to code? Get started in 3 steps:**

### 1. Install the Extension
- Download the latest `.vsix` file from [GitHub Releases](https://github.com/nomuon/cc-yolocon/releases)
- Install via command: `code --install-extension claude-worktree-manager-x.x.x.vsix`
- Or install from VS Code: `Extensions` → `Install from VSIX...`

### 2. Open Your Project
- Open any Git repository in VS Code
- Look for the **cc-YOLOCON** icon in the sidebar (left panel)

### 3. Create Your First Worktree
- Click **"Create New Worktree"** in the cc-YOLOCON sidebar
- Enter a branch name (e.g., `feature/awesome-idea`)
- ✅ Check **"Generate .devcontainer"** for safe Claude Code environment
- ✅ Check **"Generate CLAUDE.md"** for project context
- Click **"Create"** and start coding!

🎉 **You're all set!** Open the worktree in a devcontainer and let Claude Code work its magic safely.

---

## 🌟 Why cc-YOLOCON?

Experience **Vibe Coding** - the perfect development flow where creativity meets safety!

### 🎨 Creative Freedom
- Experiment boldly without fear of breaking your main branch
- Let Claude Code be creative while your project stays stable
- Test radical ideas in complete isolation

### 🔒 Safe Environment
- Each worktree gets its own devcontainer for complete isolation
- Automatic environment variable setup - no manual configuration
- Built-in safety checks prevent data loss

### ⚡ Parallel Development
- Work on multiple features simultaneously
- No context switching - each worktree preserves its state
- Seamless switching between ideas and implementations

### 🛡️ Claude Code Ready
- Pre-configured devcontainers with all necessary tools
- Automatic `host.docker.internal` setup for localhost services
- Environment variables passed through securely

---

## 🎮 Features Overview

| Feature | Description | Perfect For |
|---------|-------------|-------------|
| **🌳 Smart Worktree Management** | Visual sidebar with colored icons for easy identification | Managing multiple feature branches |
| **🐳 Devcontainer Integration** | One-click setup with environment variables | Safe Claude Code YOLO mode |
| **🔧 Safety-First Operations** | Uncommitted changes detection and confirmations | Preventing accidental data loss |
| **🚀 One-Click Setup** | Create worktree + devcontainer + CLAUDE.md in seconds | Quick experimentation |
| **🧹 Smart Cleanup** | Automatic Docker container and image cleanup | Keeping your system clean |

---

## 📺 How It Works

### Sidebar Interface
```
cc-YOLOCON
├─ 🏠 my-project (Main)     develop • Current     [🐳][⚙️]
├─ 🌿 feature-auth          feature/auth • Worktree     [🗑️][⇄][🐳]
├─ 🌿 bugfix-login          bugfix/login • Worktree     [🗑️][⇄][🐳]
└─ ✅ experiment-ai         experiment/ai • Worktree     [🗑️][⇄][🐳]
```

**Icons Guide:**
- 🏠 = Main repository
- 🌿 = Worktree branch  
- ✅ = Currently active worktree
- 🐳 = Open in Devcontainer
- ⚙️ = Generate Devcontainer
- 🗑️ = Delete Worktree
- ⇄ = Merge Worktree

---

## 🔧 Available Commands

| Command | Where to Find It | What It Does |
|---------|------------------|--------------|
| **Create New Worktree** | Sidebar top button | Creates new isolated development environment |
| **Generate .devcontainer** | Main repo context menu | Sets up devcontainer for current workspace |
| **Open in Devcontainer** | Any item context menu | Opens worktree/repo in devcontainer |
| **Merge Worktree** | Worktree context menu | Merges changes back to main branch |
| **Delete Worktree** | Worktree context menu | Safely removes worktree and cleanup |
| **Refresh Worktrees** | Sidebar refresh button | Updates the worktree list |

---

## ⚠️ Important DevContainer Notes

### Environment Variables Setup

When using devcontainers, if your environment variables reference `localhost`, you **must** replace them with `host.docker.internal`:

**❌ Won't work in devcontainer:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
API_ENDPOINT=http://localhost:3000/api
```

**✅ Works in devcontainer:**
```bash
DATABASE_URL=postgresql://user:password@host.docker.internal:5432/mydb
API_ENDPOINT=http://host.docker.internal:3000/api
```

**Why?** Devcontainers run inside Docker, where `localhost` refers to the container itself, not your host machine.

### Supported Environment Variables

The extension automatically configures 140+ environment variables including:
- **Claude/Anthropic**: `ANTHROPIC_API_KEY`, `CLAUDE_API_KEY`
- **Development**: `GH_TOKEN`, `GITHUB_TOKEN`, `NPM_TOKEN`
- **Cloud**: AWS, Azure, Google Cloud credentials
- **Databases**: PostgreSQL, MySQL, MongoDB, Redis
- **APIs**: OpenAI, Stripe, Twilio, and many more

---

## 🛡️ Safety Features

### Automatic Protection
- ✅ **Uncommitted Changes Detection**: Warns before destructive operations
- ✅ **Path Validation**: Prevents overwriting existing directories  
- ✅ **Branch Validation**: Ensures proper branch naming conventions
- ✅ **Confirmation Dialogs**: Double-confirmation for deletions
- ✅ **Docker Cleanup**: Removes containers and images when deleting worktrees

### Smart Error Handling
- Clear error messages with suggested solutions
- Graceful fallbacks when tools are unavailable
- Detailed logging for troubleshooting

---

## 💡 Common Use Cases

### 🧪 Experimenting with Claude Code
```
1. Create worktree: "experiment/new-feature"
2. Generate devcontainer with environment variables
3. Let Claude Code implement crazy ideas safely
4. Keep or discard based on results
```

### 🚀 Feature Development
```
1. Create worktree: "feature/user-auth"
2. Develop feature in isolation
3. Test thoroughly in devcontainer
4. Merge back to main when ready
```

### 🐛 Bug Fixes
```
1. Create worktree: "bugfix/critical-issue"
2. Fix bug without touching main branch
3. Test fix in isolated environment
4. Merge and delete worktree
```

### 🔬 Research & Prototyping
```
1. Create multiple worktrees for different approaches
2. Compare solutions side by side
3. Keep the best, discard the rest
```

---

## 🔧 Requirements

| Requirement | Version | Why Needed |
|-------------|---------|------------|
| **VS Code** | 1.89.0+ | Extension APIs |
| **Git** | Any recent version | Worktree operations |
| **Docker** | Optional | Devcontainer features |
| **Node.js** | 18+ | Devcontainer tooling |

**Note:** Docker is optional - the extension works without it, but devcontainer features won't be available.

---

## 🤔 FAQ

<details>
<summary><strong>Q: Why should I use worktrees instead of branches?</strong></summary>

**A:** Worktrees let you have multiple branches checked out simultaneously in different folders. This means:
- No need to stash/commit when switching contexts
- Each branch keeps its own built artifacts and dependencies
- Perfect for comparing implementations side by side
- Ideal for Claude Code experimentation without affecting main work
</details>

<details>
<summary><strong>Q: What if I don't have Docker installed?</strong></summary>

**A:** The extension works fine without Docker! You'll still get:
- Full worktree management capabilities
- All Git operations work normally
- You just won't have devcontainer features

Devcontainers are recommended for Claude Code but not required.
</details>

<details>
<summary><strong>Q: How do I customize the environment variables?</strong></summary>

**A:** After generating a devcontainer:
1. Open `.devcontainer/devcontainer.json`
2. Edit the `containerEnv` section
3. Add/remove variables as needed
4. Rebuild the container

The extension provides a comprehensive default set that works for most development scenarios.
</details>

<details>
<summary><strong>Q: Can I use this with existing devcontainers?</strong></summary>

**A:** Yes! The extension detects existing `.devcontainer` folders and won't overwrite them unless you explicitly choose to. You can:
- Generate devcontainers only for new worktrees
- Update existing devcontainers with environment variables
- Mix and match as needed
</details>

<details>
<summary><strong>Q: What happens to Docker containers when I delete a worktree?</strong></summary>

**A:** The extension automatically cleans up associated Docker resources:
- Stops and removes containers
- Removes devcontainer images
- Cleans up dangling volumes
- Provides detailed logs of what was cleaned

This keeps your system tidy and prevents resource accumulation.
</details>

<details>
<summary><strong>Q: Is this safe for production repositories?</strong></summary>

**A:** Absolutely! The extension includes multiple safety features:
- Never touches your main branch without confirmation
- Detects uncommitted changes before operations
- Provides clear warnings and confirmations
- All operations are standard Git commands
- You can review everything before it happens
</details>

---

## 🚀 Getting Help

### Issues & Bug Reports
- [GitHub Issues](https://github.com/nomuon/cc-yolocon/issues) - Report bugs or request features
- Include your VS Code version, operating system, and steps to reproduce

### Community
- Share your cc-YOLOCON + Claude Code workflows
- Contribute improvements and suggestions

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🌍 日本語紹介

### cc-YOLOCON について

🚀 **Claude Code で Vibe Coding を体験しよう！** **devcontainer** と **Git worktree** の完璧な組み合わせで、安全な YOLO モードによる究極の開発フローを実現します。

### 3ステップで始める

1. **拡張機能をインストール**
   - [GitHub Releases](https://github.com/nomuon/cc-yolocon/releases)から最新の`.vsix`ファイルをダウンロード
   - `code --install-extension claude-worktree-manager-x.x.x.vsix` でインストール

2. **プロジェクトを開く**
   - GitリポジトリをVS Codeで開く
   - サイドバーに**cc-YOLOCON**アイコンが表示される

3. **初回のWorktreeを作成**
   - サイドバーの**「Create New Worktree」**をクリック
   - ブランチ名を入力（例：`feature/awesome-idea`）
   - **「Generate .devcontainer」**にチェック
   - **「Generate CLAUDE.md」**にチェック
   - **「Create」**をクリックして開始！

### なぜ Claude Code で worktree を使うのか？

**Vibe Coding** を体験しよう - 創造性と安全性が出会う完璧な開発フロー！

- 🎨 **創造の自由**: メインブランチを壊す心配なく大胆に実験
- 🔒 **安全な環境**: 各worktreeが独自のdevcontainerで完全分離  
- ⚡ **並列開発**: コンテキストスイッチなしで複数機能を同時開発
- 🛡️ **Claude Code対応**: プロジェクトの安定性を保ちながら創造性を発揮

### 重要な注意事項

devcontainer使用時、環境変数で`localhost`を参照している場合は`host.docker.internal`に書き換えが必要です：

```bash
# ホスト環境変数
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# DevContainer環境変数（要変更）
DATABASE_URL=postgresql://user:password@host.docker.internal:5432/mydb
```

cc-YOLOCON で、安全で創造的な開発体験をお楽しみください！