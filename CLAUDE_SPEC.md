# cc-yolocon パッケージ仕様書

## 🎯 目的

- **Claude Code** の YOLO モードを手軽に起動・停止できる CLI ツールを提供
- Devcontainer を利用し、YOLO モードの影響範囲をプロジェクト内に限定

## 🚀 ゴール

1. `.devcontainer` テンプレートを現在の作業ディレクトリへコピー
2. Devcontainer を起動して内部で **Claude Code** を起動（YOLO モード or 通常モード）
3. 任意のタイミングで Devcontainer を停止・クリーンアップ

   - YOLO モードでの変更履歴はホスト側に残す

---

## 📦 要件

- **言語・ランタイム**

  - bun (v1.x 以上)
  - TypeScript

- **CLI コマンド**

  - `yolo init`
  - `yolo start`
  - `yolo stop`

---

## 💾 インストール方法

```bash
# bun でグローバルインストール
bun install --global cc-yolocon
```

---

## ⚙️ CLI コマンド仕様

### 1. `yolo init`

- **説明**: `.devcontainer` テンプレートをコピーし、Claude Code 用環境変数を設定
- **オプション**

  - `--force`, `-f` : 既存の `.devcontainer` を上書き
  - `--env <KEY=VALUE>` : Claude Code 関連環境変数を `.devcontainer/.env` に追記（複数指定可）
  - `--env-file <path>` : 環境変数定義ファイルを指定し、その内容を `.devcontainer/.env` として使用

- **処理フロー**

  1. GitHub 上のテンプレートディレクトリをローカルにダウンロード or サブモジュール化
  2. `./.devcontainer/` 以下へファイル一式をコピー
  3. `devcontainer.json` の `workspaceFolder` を `"/workspaces/${PWD_BASE_NAME}"` に書き換え
  4. `.devcontainer/devcontainer.json` に以下を必ず追加し、ホスト環境変数をコンテナに自動でマッピング:

  ```jsonc
  "containerEnv": {
    "ANTHROPIC_API_KEY":       "${localEnv:ANTHROPIC_API_KEY}",
    "ANTHROPIC_AUTH_TOKEN":    "${localEnv:ANTHROPIC_AUTH_TOKEN}",
    "ANTHROPIC_CUSTOM_HEADERS": "${localEnv:ANTHROPIC_CUSTOM_HEADERS}",
    "ANTHROPIC_MODEL":         "${localEnv:ANTHROPIC_MODEL}",
    "ANTHROPIC_SMALL_FAST_MODEL": "${localEnv:ANTHROPIC_SMALL_FAST_MODEL}",
    "BASH_DEFAULT_TIMEOUT_MS": "${localEnv:BASH_DEFAULT_TIMEOUT_MS}",
    "BASH_MAX_TIMEOUT_MS":     "${localEnv:BASH_MAX_TIMEOUT_MS}",
    "BASH_MAX_OUTPUT_LENGTH":  "${localEnv:BASH_MAX_OUTPUT_LENGTH}",
    "CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR": "${localEnv:CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR}",
    "CLAUDE_CODE_API_KEY_HELPER_TTL_MS": "${localEnv:CLAUDE_CODE_API_KEY_HELPER_TTL_MS}",
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "${localEnv:CLAUDE_CODE_MAX_OUTPUT_TOKENS}",
    "CLAUDE_CODE_USE_BEDROCK": "${localEnv:CLAUDE_CODE_USE_BEDROCK}",
    "CLAUDE_CODE_USE_VERTEX":  "${localEnv:CLAUDE_CODE_USE_VERTEX}",
    "CLAUDE_CODE_SKIP_BEDROCK_AUTH": "${localEnv:CLAUDE_CODE_SKIP_BEDROCK_AUTH}",
    "CLAUDE_CODE_SKIP_VERTEX_AUTH": "${localEnv:CLAUDE_CODE_SKIP_VERTEX_AUTH}",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "${localEnv:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC}",
    "DISABLE_AUTOUPDATER":      "${localEnv:DISABLE_AUTOUPDATER}",
    "DISABLE_BUG_COMMAND":     "${localEnv:DISABLE_BUG_COMMAND}",
    "DISABLE_COST_WARNINGS":    "${localEnv:DISABLE_COST_WARNINGS}",
    "DISABLE_ERROR_REPORTING":  "${localEnv:DISABLE_ERROR_REPORTING}",
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "${localEnv:DISABLE_NON_ESSENTIAL_MODEL_CALLS}",
    "DISABLE_TELEMETRY":        "${localEnv:DISABLE_TELEMETRY}",
    "HTTP_PROXY":              "${localEnv:HTTP_PROXY}",
    "HTTPS_PROXY":             "${localEnv:HTTPS_PROXY}",
    "MAX_THINKING_TOKENS":     "${localEnv:MAX_THINKING_TOKENS}",
    "MCP_TIMEOUT":             "${localEnv:MCP_TIMEOUT}",
    "MCP_TOOL_TIMEOUT":        "${localEnv:MCP_TOOL_TIMEOUT}",
    "MAX_MCP_OUTPUT_TOKENS":   "${localEnv:MAX_MCP_OUTPUT_TOKENS}",
    "AWS_REGION":               "${localEnv:AWS_REGION}",
    "AWS_ACCESS_KEY_ID":        "${localEnv:AWS_ACCESS_KEY_ID}",
    "AWS_SECRET_ACCESS_KEY":     "${localEnv:AWS_SECRET_ACCESS_KEY}",
    "AWS_SESSION_TOKEN":         "${localEnv:AWS_SESSION_TOKEN}",
    "ANTHROPIC_BEDROCK_BASE_URL": "${localEnv:ANTHROPIC_BEDROCK_BASE_URL}",
    "ANTHROPIC_VERTEX_PROJECT_ID": "${localEnv:ANTHROPIC_VERTEX_PROJECT_ID}",
    "ANTHROPIC_VERTEX_BASE_URL": "${localEnv:ANTHROPIC_VERTEX_BASE_URL}",
    "API_TIMEOUT_MS":           "${localEnv:ANTHROPIC_VERTEX_BASE_URL}"
  }
  ```

5. `--env` および `--env-file` オプションは引き続き利用可能。これらが指定された場合、 `containerEnv` の自動マッピングよりも優先して適用される（同一キーは上書き）。  
   -> docker を利用するため PROXY などで `localhost:3000` を指定する場合、 `host.docker.internal:3000` とすることをユーザーに伝える

### 2. `yolo start` 

- **説明**: Devcontainer を起動し、Claude Code を指定モードで起動
- **オプション**

  - `--name <container-name>` : Devcontainer 名を指定（デフォルト `claude-yolo`）
  - `--mode <yolo|normal>` : 起動モードを指定（デフォルト `yolo`）
  - `--wait` : 起動完了まで待機

- **処理フロー**

  1. `docker compose -f ./.devcontainer/docker-compose.yml up -d`
  2. モード判定:

     - `yolo`: `docker exec -d <container-name> claude-code --yolo`
     - `normal`: `docker exec -d <container-name> claude-code`

  3. 起動完了メッセージ表示

### 3. `yolo stop`

- **説明**: Devcontainer を停止し、設定ファイルを削除
- **オプション**

  - `--name <container-name>` : 停止する Devcontainer 名（デフォルト `claude-yolo`）
  - `--clean`, `-c` : `.devcontainer/` 以下を丸ごと削除

- **処理フロー**

  1. `docker compose -f ./.devcontainer/docker-compose.yml down`
  2. オプションに応じて `./.devcontainer/` ディレクトリを削除
  3. 停止完了メッセージ表示

---

## 🏗️ ディレクトリ構成イメージ

```
cc-yolocon/
├── src/
│   ├── commands/
│   │   ├── init.ts       # yolo init ロジック
│   │   ├── start.ts      # yolo start ロジック
│   │   └── stop.ts       # yolo stop ロジック
│   ├── lib/
│   │   ├── fs.ts         # ファイル操作ユーティリティ
│   │   └── docker.ts     # Docker／Devcontainer 操作ユーティリティ
│   └── index.ts          # CLI エントリポイント
├── .devcontainer/        # コピー用テンプレート（git サブモジュール or ダウンロード元）
│   ├── devcontainer.json
│   ├── Dockerfile
│   └── docker-compose.yml
├── package.json
├── bunfig.toml
├── tsconfig.json
└── README.md             # 上記使い方の概要
```

---

## 📐 実装詳細

### ■ `init.ts`

- GitHub からテンプレートを取得 or ローカル `.devcontainer/` を上書き
- ファイル存在チェック & 上書き確認ダイアログ

### ■ `start.ts`

- `docker-compose` CLI をラップ
- 起動ログのストリームをフォローして完了検知
- モードに応じた `claude-code` 起動オプション制御

### ■ `stop.ts`

- 停止前に実行中コンテナの確認
- `down` → `prune` → ディレクトリ削除

### ■ 共通ライブラリ (`fs.ts`, `docker.ts`)

- 非同期 FS 操作（コピー、削除、存在チェック）
- child_process ラッパー：`bun.spawn()` or `bun.spawnSync()`

---

## 🔄 ワークフロー例

1. **初期化**

   ```bash
   yolo init
   # ⇒ ./.devcontainer/ が生成される
   ```

2. **起動 (YOLO モード)**

   ```bash
   yolo start --mode yolo --wait
   # ⇒ docker compose up → Claude Code (--yolo) 起動
   ```

3. **起動 (通常モード)**

   ```bash
   yolo start --mode normal --wait
   # ⇒ docker compose up → Claude Code (通常) 起動
   ```

4. **停止 & クリーン**

   ```bash
   yolo stop --clean
   # ⇒ docker compose down → .devcontainer/ を削除
   ```

---

## 🧪 テスト & CI

- bun 付属のテストフレームワークで各コマンドロジックをユニットテスト
- CI（GitHub Actions）で `bun test` / `bun lint` / `bun build` を自動実行

---

## 📈 今後の拡張案

- `yolo status`：コンテナ稼働状況を出力
- `yolo update`：テンプレート最新版への同期
- 複数プロジェクト対応のワークスペース管理
