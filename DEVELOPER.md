# Developer Guide

Development guide for Claude Worktree Manager VS Code extension.

## Project Structure

```
claude-worktree-manager/
├─ src/
│  ├─ extension.ts         # Extension entry point
│  ├─ treeView.ts          # Sidebar UI provider
│  ├─ commands/            # Command implementations
│  │   ├─ createWorktree.ts
│  │   ├─ mergeWorktree.ts
│  │   ├─ deleteWorktree.ts
│  │   ├─ generateDevcontainer.ts
│  │   └─ openDevcontainer.ts
│  └─ utils/               # Utility modules
│      ├─ git.ts           # Git operations wrapper
│      ├─ fs.ts            # File system helpers
│      └─ env.ts           # Environment variable definitions
├─ templates/              # Template files
│  ├─ devcontainer.json    # Devcontainer template
│  ├─ Dockerfile          # Docker image definition
│  ├─ init-firewall.sh    # Container initialization
│  └─ CLAUDE.md           # Default CLAUDE.md template
├─ package.json           # Extension manifest
├─ tsconfig.json          # TypeScript configuration
├─ .eslintrc.js           # Linting rules
└─ .prettierrc            # Code formatting rules
```

## Development Workflow

### Setup

1. **Clone and Install**
   ```bash
   git clone <repository>
   cd claude-worktree-manager
   npm install
   ```

2. **Development Build**
   ```bash
   npm run compile
   npm run watch  # For continuous compilation
   ```

3. **Testing**
   ```bash
   npm run lint
   npm test
   ```

### Debugging in VS Code

1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test the extension in the new VS Code window
4. Use debugger breakpoints in the original window

### Code Quality

The project uses ESLint and Prettier for code quality:

```bash
# Format code
npx prettier --write src/**/*.ts

# Lint code
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## Architecture

### Extension Activation

The extension activates when a workspace is opened. The main entry point is `src/extension.ts`:

```typescript
export function activate(context: vscode.ExtensionContext): void {
  const worktreeProvider = new WorktreeProvider();
  vscode.window.registerTreeDataProvider('worktreeView', worktreeProvider);
  // Register commands...
}
```

### TreeView Provider

The `WorktreeProvider` class implements `vscode.TreeDataProvider` to display worktrees in the sidebar:

- Fetches worktree data via Git commands
- Provides tree items with context menus
- Handles refresh operations

### Command Architecture

Each command is implemented as a separate module in `src/commands/`:

- **createWorktree.ts**: Interactive worktree creation wizard
- **mergeWorktree.ts**: Branch merge with safety checks
- **deleteWorktree.ts**: Safe worktree deletion
- **generateDevcontainer.ts**: Template-based container setup
- **openDevcontainer.ts**: VS Code devcontainer integration

### Git Operations

The `src/utils/git.ts` module wraps Git commands using ShellJS:

```typescript
export async function getWorktrees(repoPath: string): Promise<WorktreeItem[]> {
  // Uses 'git worktree list --porcelain'
}

export async function createNewWorktree(
  repoPath: string,
  branchName: string,
  worktreePath: string,
  baseBranch?: string
): Promise<void> {
  // Uses 'git worktree add'
}
```

## Templates

### Devcontainer Template

The `templates/devcontainer.json` includes:
- Node.js development environment
- Pre-configured VS Code extensions
- Comprehensive environment variable mapping
- Docker-in-Docker support

### Environment Variables

Environment variables are defined in `src/utils/env.ts`:

```typescript
const ENV_KEYS = [
  "ANTHROPIC_API_KEY",
  "CLAUDE_API_KEY",
  // ... extensive list of common environment variables
] as const;
```

## Testing

### Manual Testing

1. Open a Git repository in VS Code
2. Open the Claude Worktree Manager sidebar
3. Test each command:
   - Create worktree with/without devcontainer
   - Merge worktree (create test branch first)
   - Delete worktree
   - Generate standalone devcontainer

### Unit Tests

Unit tests use Vitest:

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

## Building & Packaging

### Development Build

```bash
npm run compile            # TypeScript compilation
npm run watch             # Watch mode for development
```

### Production Package

```bash
npm run package           # Creates .vsix file
```

### Installation

```bash
code --install-extension claude-worktree-manager-0.0.1.vsix
```

## Release Process

1. **Version Update**
   ```bash
   npm version patch|minor|major
   ```

2. **Build & Test**
   ```bash
   npm run compile
   npm test
   npm run lint
   ```

3. **Package**
   ```bash
   npm run package
   ```

4. **Test Installation**
   ```bash
   code --install-extension claude-worktree-manager-x.x.x.vsix
   ```

## Common Issues

### Git Path Issues

Ensure Git is available in PATH. The extension uses ShellJS to execute Git commands.

### Template Loading

Templates are loaded from the `templates/` directory relative to the compiled extension. Ensure the build process includes template files.

### Environment Variable Conflicts

Some environment variables may conflict between local and container environments. The devcontainer setup uses `${localEnv:VAR_NAME}` syntax to pass through local variables.

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Prefer async/await over Promises
- Use explicit return types

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Ensure all tests pass
4. Update documentation if needed
5. Submit PR with clear description

### Debugging Tips

- Use VS Code's built-in debugger with F5
- Check VS Code Developer Console for errors
- Use `console.log` for debugging (removed in production)
- Test with different Git repository states

## VS Code Extension APIs

Key APIs used:

- `vscode.window.registerTreeDataProvider()` - Sidebar tree view
- `vscode.commands.registerCommand()` - Command registration
- `vscode.window.showInputBox()` - User input dialogs
- `vscode.window.showQuickPick()` - Selection dialogs
- `vscode.window.withProgress()` - Progress indicators
- `vscode.workspace.workspaceFolders` - Workspace access