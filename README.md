# Claude Worktree Manager

VS Code extension for managing Git worktrees for Claude Code YOLO mode safely and easily.

## Overview

Claude Worktree Manager makes it simple to create, manage, and work with Git worktrees, especially when using Claude Code in YOLO mode. This extension provides an intuitive sidebar interface for worktree operations and automatic .devcontainer setup.

## Features

- 🌳 **Worktree Management**: Create, merge, and delete Git worktrees with a simple UI
- 🐳 **Devcontainer Integration**: Automatically generate .devcontainer configuration with environment variables
- 🔧 **Safe Operations**: Built-in safety checks for uncommitted changes
- 📱 **Sidebar Interface**: Intuitive tree view in VS Code sidebar
- 🚀 **Quick Setup**: One-click worktree creation with optional devcontainer and CLAUDE.md setup

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
| `Claude: Generate .devcontainer` | Generate devcontainer configuration |
| `Claude: Open in Devcontainer` | Open current workspace in devcontainer |
| `Claude: Refresh Worktrees` | Refresh the worktree list |

## Sidebar Interface

The extension adds a "Claude Worktree Manager" view to your VS Code sidebar:

```
Claude Worktree Manager
├─ Existing Worktrees
│   ├─ feature-auth        [🗑️][⇄]
│   └─ bugfix-login        [🗑️][⇄]
├─ + Create New Worktree
├─ + Generate .devcontainer
└─ + Open in Devcontainer
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

Git worktrees allow you to work on multiple branches simultaneously without switching contexts. This is especially useful with Claude Code's YOLO mode, as you can:

- Test experimental changes in isolation
- Keep your main workspace stable
- Quickly switch between different features
- Use separate devcontainer environments per branch

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