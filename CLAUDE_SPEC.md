以下は、\*\*VS Code 拡張機能（まずは Bun + TypeScript、必要なら npm でもビルド可能）\*\*として実装するための詳細な仕様書です。

---

## 1. 概要

| 項目     | 内容                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------- |
| ツール名   | **`claude-worktree-manager`**                                                                  |
| 目的     | Claude Code YOLO モードを **安全・簡単** に使うための VS Code サイドバー拡張                                         |
| 主な機能   | Git worktree の生成/マージ/削除、`.devcontainer` 雛形生成、VS Code で devcontainer を即座に開く、環境変数の自動パススルー        |
| 対象ユーザー | Git worktree・devcontainer の操作に不慣れな開発者／非エンジニア                                                   |
| コア技術   | Bun v1.2+ / Node18 ランタイム、TypeScript、VS Code Extension API、ShellJS（簡易 Git 操作）, esbuild (Bun 内蔵) |

---

## 2. アーキテクチャ

```
claude-worktree-manager/
├─ src/
│  ├─ extension.ts         # 拡張機能エントリ
│  ├─ treeView.ts          # サイドバー UI Provider
│  ├─ commands/
│  │   ├─ createWorktree.ts
│  │   ├─ mergeWorktree.ts
│  │   ├─ deleteWorktree.ts
│  │   ├─ generateDevcontainer.ts
│  │   └─ openDevcontainer.ts
│  └─ utils/
│      ├─ git.ts           # Git / worktree ラッパ
│      ├─ fs.ts            # ファイル操作ヘルパ
│      └─ env.ts           # 環境変数展開ヘルパ
├─ templates/
│  ├─ devcontainer.json    # ミニマム雛形（環境変数はコードで注入）
│  ├─ Dockerfile
│  ├─ init-firewall.sh
│  └─ CLAUDE.md            # デフォルトコピー用
├─ package.json            # npm fallback 用
├─ bunfig.toml             # Bun ビルド設定
├─ tsconfig.json
└─ README.md / DEVELOPER.md
```

> **Bun のみで完結**させる場合は `bun bun`　(= Bun のビルド＆拡張パッケージ出力) を採用。npm 互換性を重視する場合は `npm run package` を追加します。
> *VS Code マーケットプレース公開時は Node18 バンドルが必須* なので、Bun→esbuild で `.vsix` を生成し、依存関係を node\_modules ごと同梱する構成を推奨します。

---

## 3. 機能仕様

### 3.1 Git worktree 操作

| 機能  | 説明                                                          | コマンド ID                 | 主要入力                                           |
| --- | ----------------------------------------------------------- | ----------------------- | ---------------------------------------------- |
| 生成  | worktree を指定パスに作成し、オプションで `.devcontainer` と `CLAUDE.md` を配置 | `claude.createWorktree` | ブランチ名、パス、`--withDevcontainer`、`--withClaudeMd` |
| マージ | worktree ブランチを親ブランチへマージ。完了後 worktree を削除するか選択可              | `claude.mergeWorktree`  | 対象 worktree                                    |
| 削除  | 不要な worktree ディレクトリと Git 参照を安全に削除                           | `claude.deleteWorktree` | 対象 worktree                                    |

> **安全装置**
>
> * マージ前に `git status --porcelain` を実行し、未コミット変更がある場合は UI で警告
> * `--force` 相当の操作は拡張側で明示的にダイアログ確認

### 3.2 `.devcontainer` 雛形生成

1. `templates/devcontainer.json` をコピー
2. `containerEnv` セクションを下記テンプレートで動的挿入

   * `${localEnv:VAR_NAME}` 形式で書き込む
3. `Dockerfile` と `init-firewall.sh` も同時コピー

> GitHub 上流 (anthropics/claude-code) が更新された際は **週次 CI** で差分検知→テンプレ更新する GitHub Actions を別リポジトリで用意すると保守が楽です。

### 3.3 devcontainer の自動オープン

| オプション      | 動作                                                    |
| ---------- | ----------------------------------------------------- |
| **同ウィンドウ** | `vscode.openFolder(path, { forceReuseWindow: true })` |
| **新ウィンドウ** | `vscode.openFolder(path, { forceNewWindow: true })`   |

> `.code-workspace` を経由せず、`AttachContainer` コマンドを Shell 経由で叩く方法は非推奨。VS Code 1.89 以降は API で直接開けます。

### 3.4 サイドバー UI (Tree View)

```
cc-YOLOCON
├─ Existing Worktrees
│   ├─ feature/foo        (path)   [🗑️][⇄]
│   └─ bugfix/bar         (path)   [🗑️][⇄]
├─ + Create New Worktree
├─ + Generate .devcontainer
└─ + Open in Devcontainer
```

* TreeItem の `contextValue` を使い、`when` 条件でアイコン付きインラインボタンを実装
* `vscode.window.registerTreeDataProvider` + `vscode.commands.registerCommand` でアクションを紐付け

---

## 4. 非機能要件

| 項目          | 要件                                                                                |
| ----------- | --------------------------------------------------------------------------------- |
| パフォーマンス     | 主要操作は 2 秒以内に UI 応答。Git worktree 生成はファイル数 5 万以下でも 10 秒以内                           |
| セキュリティ      | 環境変数をログ出力しない。`claude --dangerously-skip-permissions` は devcontainer 内限定で実行        |
| クロスプラットフォーム | macOS / Linux / Windows (WSL2) をサポート。パス区切りは `path.join` で抽象化                      |
| テスト         | Vitest + Bun でユニットテスト。最低カバレッジ 80 %                                                |
| CI/CD       | GitHub Actions で<br>① lint/test → ② `bun bunx vsce package` → ③ Release Artifacts |

---

## 5. 主要ライブラリとバージョン

| ライブラリ                     | バージョン (推奨) | 用途                             |
| ------------------------- | ---------- | ------------------------------ |
| **Bun**                   | 1.2.x      | ビルド・ランタイム                      |
| **@types/vscode**         | ^1.89.0    | VS Code API 型定義                |
| **shelljs**               | ^0.8       | Git wrapper（child\_process 代替） |
| **fs-extra**              | ^11        | ファイル操作                         |
| **prettier** + **eslint** | 最新         | フォーマッタ & Lint                  |
| **vitest**                | 最新         | テスティング                         |

---

## 6. 実装ステップ

1. **Bun プロジェクト初期化**

   ```bash
   bun init
   bun add -d @types/vscode shelljs fs-extra vitest eslint prettier
   ```
2. **VS Code 拡張雛形生成**

   ```bash
   bunx yo code --extensionType=ui --extensionName=claude-worktree-manager
   ```
3. **`bunfig.toml`** で `"main": "dist/extension.js"` を出力
4. **TreeView & コマンド実装**（`src/` 配下）
5. **テンプレートファイル** を `templates/` に配置
6. **単体テスト + ESLint / Prettier 設定**
7. **GitHub Actions** を作成（pull\_request / main push で動作）
8. **README.md / DEVELOPER.md** を下記フォーマットで作成
9. **vsce package** で `.vsix` 出力し、手元でインストールテスト
10. **マーケットプレース公開**（任意）

---

## 7. ドキュメント指針

### 7.1 README.md（ユーザー向け）

| セクション       | 内容                                  |
| ----------- | ----------------------------------- |
| Overview    | 拡張機能の目的・主な使い方（GIF 付き推奨）             |
| Quick Start | ① install → ② サイドバー操作 → ③ Claude 起動 |
| FAQ         | よくあるエラー・トラブルシュート                    |

### 7.2 DEVELOPER.md（開発者向け）

| セクション    | 内容                            |
| -------- | ----------------------------- |
| プロジェクト構造 | ディレクトリ／主要ファイル説明               |
| 開発フロー    | `bun run watch`、デバッグ方法 (`F5`) |
| リリース手順   | バージョン付与 → `bun run release`   |

---

## 8. 今後の拡張余地

* **CLI モード**（`bunx claude-wtm <subcommand>`）でサイドバーを使わず高速操作
* **Worktree テンプレ切替**: 生成時に Dockerfile などをカスタマイズ選択
* **Claude Code 設定 UI**: `settings.json` を GUI 編集

---

### 付録 A. `containerEnv` 生成テンプレート

```ts
const ENV_KEYS = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  // ... (中略) ...
  "API_TIMEOUT_MS",
] as const;

export function generateContainerEnv(): Record<string, string> {
  return Object.fromEntries(
    ENV_KEYS.map((k) => [k, `\${localEnv:${k}}`])
  );
}
```

---
