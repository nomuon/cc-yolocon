# Developer Guide

Development guide for cc-YOLOCON VS Code extension.

---

## 🚀 Quick Development Setup

### Prerequisites
- **VS Code** 1.89.0+
- **Node.js** 18+
- **Git** (available in PATH)
- **Docker** (optional, for testing devcontainer features)

### Get Started in 3 Steps

1. **Clone & Install**
   ```bash
   git clone https://github.com/nomuon/cc-yolocon.git
   cd cc-yolocon
   npm install
   ```

2. **Start Development**
   ```bash
   npm run watch    # Continuous compilation
   ```

3. **Test Extension**
   - Press `F5` in VS Code to launch Extension Development Host
   - Test your changes in the new VS Code window

---

## 📁 Project Structure

```
cc-yolocon/
├─ src/                          # Main source code
│  ├─ extension.ts               # 🎯 Extension entry point
│  ├─ treeView.ts                # 🌳 Sidebar UI provider
│  ├─ commands/                  # 📋 All commands
│  │   ├─ createWorktree.ts      # ➕ Create new worktree
│  │   ├─ deleteWorktree.ts      # 🗑️ Delete worktree + Docker cleanup
│  │   ├─ mergeWorktree.ts       # ⇄ Merge worktree to main
│  │   ├─ generateDevcontainer.ts      # ⚙️ Generate devcontainer
│  │   ├─ generateMainDevcontainer.ts  # ⚙️ Generate for main repo
│  │   ├─ openDevcontainer.ts          # 🐳 Open current workspace
│  │   └─ openWorktreeDevcontainer.ts  # 🐳 Open worktree in new window
│  └─ utils/                     # 🔧 Utility modules
│      ├─ git.ts                 # Git operations wrapper
│      ├─ fs.ts                  # File system helpers
│      └─ env.ts                 # Environment variable definitions (140+ vars)
├─ templates/                    # 📄 Template files
│  ├─ devcontainer.json          # Devcontainer configuration
│  ├─ Dockerfile                # Container image definition
│  ├─ init-firewall.sh          # Container initialization script
│  └─ CLAUDE.md                 # Default CLAUDE.md for worktrees
├─ .github/workflows/            # 🤖 GitHub Actions
│  └─ release.yml               # Automated VSIX build & release
├─ package.json                  # Extension manifest & dependencies
├─ tsconfig.json                # TypeScript configuration
└─ README.md                    # User documentation
```

---

## 🛠️ Development Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run compile` | Build TypeScript | Before testing |
| `npm run watch` | Continuous build | During development |
| `npm run lint` | Check code style | Before commits |
| `npm run lint -- --fix` | Auto-fix issues | Fix formatting |
| `npm test` | Run tests | Before releases |
| `npm run package` | Create VSIX | For distribution |

### Development Workflow
```bash
# 1. Start development mode
npm run watch

# 2. Test in VS Code (F5 key)
# 3. Make changes and see them hot-reload

# 4. Before committing
npm run lint
npm test
npm run compile
```

---

## 🏗️ Architecture Overview

### Extension Lifecycle

```typescript
// src/extension.ts
export function activate(context: vscode.ExtensionContext): void {
  // 1. Create tree data provider
  const worktreeProvider = new WorktreeProvider();
  
  // 2. Register sidebar view
  vscode.window.registerTreeDataProvider('worktreeView', worktreeProvider);
  
  // 3. Register all commands
  const commands = [
    vscode.commands.registerCommand('claude.createWorktree', 
      (item) => createWorktree(item, worktreeProvider)),
    // ... more commands
  ];
  
  context.subscriptions.push(...commands);
}
```

### Tree View System

**WorktreeProvider** (`treeView.ts`) implements `vscode.TreeDataProvider`:

```typescript
interface WorktreeItem {
  name: string;           // Branch name
  path: string;           // Absolute path
  branch: string;         // Git branch
  isCurrent: boolean;     // Is active worktree
  isMainRepo: boolean;    // Is main repository
}

class WorktreeTreeItem extends vscode.TreeItem {
  constructor(public readonly worktree: WorktreeItem) {
    // Visual styling based on worktree type
    this.iconPath = worktree.isCurrent ? 
      new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green')) :
      worktree.isMainRepo ?
      new vscode.ThemeIcon('home', new vscode.ThemeColor('charts.blue')) :
      new vscode.ThemeIcon('git-branch', new vscode.ThemeColor('charts.yellow'));
  }
}
```

---

## 📋 Command Implementation Patterns

### 1. Safety-First Operations

All destructive commands follow this pattern:

```typescript
export async function deleteWorktree(item: WorktreeTreeItem): Promise<void> {
  // 1. Validate input
  if (!item || item.worktree.isCurrent) {
    vscode.window.showErrorMessage('Cannot delete current worktree');
    return;
  }

  // 2. Check for uncommitted changes
  const hasChanges = await hasUncommittedChanges(item.worktree.path);
  
  // 3. Show appropriate warning
  const message = hasChanges 
    ? `Worktree has uncommitted changes. Delete anyway?`
    : `Delete worktree "${item.worktree.name}"?`;
    
  // 4. Confirm with user
  const confirm = await vscode.window.showWarningMessage(
    message, 'Yes, Delete', 'Cancel'
  );
  
  if (confirm !== 'Yes, Delete') return;

  // 5. Perform operation with progress
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Deleting worktree...'
  }, async (progress) => {
    // Actual deletion logic
  });
}
```

### 2. User Input Collection

Interactive commands use VS Code's built-in UI:

```typescript
// Get branch name
const branchName = await vscode.window.showInputBox({
  prompt: 'Enter branch name',
  placeHolder: 'feature/my-feature',
  validateInput: (value) => {
    if (!value.trim()) return 'Branch name is required';
    if (!/^[a-zA-Z0-9/_-]+$/.test(value)) return 'Invalid branch name';
    return null;
  }
});

// Get user choices
const options = await vscode.window.showQuickPick([
  { label: 'Create new branch', value: 'new' },
  { label: 'Use existing branch', value: 'existing' }
], { placeHolder: 'Select option' });
```

---

## 🐳 Docker Integration

### Container Cleanup (deleteWorktree.ts)

The extension includes comprehensive Docker resource cleanup:

```typescript
async function cleanupDockerResources(worktreePath: string, worktreeName: string) {
  // 1. Multiple search patterns for containers
  const searchPatterns = [
    `vsc-${path.basename(worktreePath)}`,
    `vsc-${worktreeName.replace(/\//g, '-')}`,
    // ... more patterns
  ];

  // 2. Label-based search (DevContainer labels)
  const labeledContainers = await execAsync(
    `docker ps -a --filter "label=devcontainer.local_folder=${worktreePath}" --format "{{.Names}}"`
  );

  // 3. Safe container removal
  for (const containerName of foundContainers) {
    try {
      await execAsync(`docker rm -f "${containerName}"`);
      console.log(`✓ Removed container: ${containerName}`);
    } catch (error) {
      console.warn(`✗ Failed to remove: ${containerName}`, error);
    }
  }

  // 4. Image cleanup
  // 5. Volume cleanup
}
```

---

## 🧪 Testing

### Manual Testing Checklist

**Worktree Operations:**
- [ ] Create worktree with new branch
- [ ] Create worktree with existing branch  
- [ ] Delete worktree (with/without uncommitted changes)
- [ ] Merge worktree
- [ ] Refresh worktree list

**Devcontainer Features:**
- [ ] Generate devcontainer for main repo
- [ ] Generate devcontainer for worktree
- [ ] Open worktree in devcontainer
- [ ] Environment variables are passed correctly
- [ ] `host.docker.internal` works for localhost services

**Safety Features:**
- [ ] Uncommitted changes warning works
- [ ] Cannot delete current worktree
- [ ] Path validation prevents overwrites
- [ ] Docker cleanup removes containers/images

### Unit Testing

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

Test files follow pattern: `*.test.ts` or `*.spec.ts`

---

## 📦 Building & Packaging

### Development Build
```bash
npm run compile            # One-time build
npm run watch             # Continuous build
```

### Production Package
```bash
npm run package           # Creates .vsix file
```

### Testing Installation
```bash
# Install locally
code --install-extension claude-worktree-manager-x.x.x.vsix

# Uninstall
code --uninstall-extension nomuon.claude-worktree-manager
```

---

## 🚀 Release Process

### Automated Release (GitHub Actions)

1. **Update Version**
   ```bash
   # Update package.json version manually or:
   npm version patch|minor|major
   ```

2. **Trigger Release**
   - Go to GitHub Actions tab
   - Run "Build and Release VSIX" workflow
   - Download will be available in GitHub Releases

### Manual Release

```bash
# 1. Version bump
npm version patch

# 2. Build & test
npm run compile
npm run lint
npm test

# 3. Package
npm run package

# 4. Test installation
code --install-extension claude-worktree-manager-x.x.x.vsix
```

---

## 🎯 Key Implementation Details

### Environment Variables (src/utils/env.ts)

140+ environment variables are automatically configured:

```typescript
const ENV_KEYS = [
  // Claude/Anthropic
  'ANTHROPIC_API_KEY', 'CLAUDE_API_KEY', 'ANTHROPIC_AUTH_TOKEN',
  
  // Development
  'GH_TOKEN', 'GITHUB_TOKEN', 'NPM_TOKEN',
  
  // Cloud providers
  'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AZURE_CLIENT_ID',
  
  // Databases
  'DATABASE_URL', 'POSTGRES_URL', 'MYSQL_URL', 'MONGODB_URI',
  
  // And many more...
] as const;
```

### Git Operations (src/utils/git.ts)

Uses ShellJS for reliable Git commands:

```typescript
export async function getWorktrees(repoPath: string): Promise<WorktreeItem[]> {
  const result = shell.exec('git worktree list --porcelain', { 
    cwd: repoPath, 
    silent: true 
  });
  
  if (result.code !== 0) {
    throw new Error(`Git command failed: ${result.stderr}`);
  }
  
  return parseWorktreeOutput(result.stdout);
}
```

### Template System (templates/)

Templates use placeholder replacement:

```json
// templates/devcontainer.json
{
  "name": "Development Container",
  "build": { "dockerfile": "Dockerfile" },
  "containerEnv": {
    // Dynamically injected by src/utils/env.ts
    "ANTHROPIC_API_KEY": "${localEnv:ANTHROPIC_API_KEY}"
  }
}
```

---

## 🐛 Common Issues & Solutions

### Development Issues

**Extension not loading:**
- Check VS Code Developer Console (`Help > Toggle Developer Tools`)
- Verify `package.json` activation events
- Ensure TypeScript compiles without errors

**Commands not appearing:**
- Check command registration in `src/extension.ts`
- Verify `package.json` contributes.commands section
- Reload Extension Development Host

**Git operations failing:**
- Ensure Git is in PATH
- Check repository is a valid Git repo
- Verify ShellJS execution context

### Docker Issues

**Container cleanup not working:**
- Check Docker daemon is running
- Verify container naming patterns match DevContainer conventions
- Review cleanup logs in VS Code Developer Console

**DevContainer not opening:**
- Ensure VS Code Remote-Containers extension is installed
- Check `.devcontainer/devcontainer.json` syntax
- Verify Docker image builds successfully

---

## 🤝 Contributing

### Code Style Guidelines

- **TypeScript strict mode** enabled
- **ESLint** for code quality
- **Prettier** for consistent formatting
- **Explicit return types** for functions
- **Async/await** preferred over Promises

### Pull Request Process

1. **Fork & branch** from `main`
2. **Implement changes** with tests
3. **Run quality checks**:
   ```bash
   npm run lint
   npm test
   npm run compile
   ```
4. **Update documentation** if needed
5. **Submit PR** with clear description

### Debugging Tips

- Use `console.log()` for debugging (remove before PR)
- Check VS Code Developer Console for errors
- Test with different Git repository states
- Use VS Code debugger with breakpoints (`F5`)

---

## 📚 VS Code Extension APIs

### Key APIs Used

| API | Purpose | Usage |
|-----|---------|-------|
| `vscode.window.registerTreeDataProvider()` | Sidebar tree view | Worktree list display |
| `vscode.commands.registerCommand()` | Command registration | All extension commands |
| `vscode.window.showInputBox()` | User input | Branch names, paths |
| `vscode.window.showQuickPick()` | Selection dialogs | Options, confirmations |
| `vscode.window.withProgress()` | Progress indicators | Long-running operations |
| `vscode.workspace.workspaceFolders` | Workspace access | Repository detection |

### Extension Manifest (package.json)

Key sections:
- `contributes.commands` - Define available commands
- `contributes.views` - Register sidebar views
- `contributes.menus` - Context menu items
- `activationEvents` - When extension loads

---

## 🔮 Future Enhancements

### Planned Features
- **Multi-repository support** - Manage worktrees across multiple repos
- **Template customization** - User-defined devcontainer templates
- **CLI mode** - Command-line interface for power users
- **Worktree templates** - Pre-configured setups for common workflows

### Architecture Improvements
- **Better error handling** - More descriptive error messages
- **Performance optimization** - Faster Git operations for large repos
- **Enhanced logging** - Structured logging for troubleshooting
- **Internationalization** - Multi-language support

---

**Happy coding with cc-YOLOCON! 🚀**