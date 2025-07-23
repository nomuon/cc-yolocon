# cc-yolocon

Claude Code YOLO mode CLI tool with Devcontainer isolation

## 🎯 概要

`cc-yolocon` は、Claude Code の YOLO モードを手軽に起動・停止できる CLI ツールです。
Devcontainer を利用することで、YOLO モードの影響範囲をプロジェクト内に限定し、VS Code との統合により快適な開発環境を提供します。

## 📦 インストール

```bash
# bun でグローバルインストール
bun install --global cc-yolocon
```

## 🚀 使い方

### 1. 初期化

現在のディレクトリに `.devcontainer` テンプレートをコピーします。

```bash
yolocon init

# 既存の .devcontainer を上書きする場合
yolocon init --force

# 環境変数を設定する場合
yolocon init --env ANTHROPIC_API_KEY=sk-ant-xxx
yolocon init --env-file .env.local
```

⚠️ **注意**: Docker 環境で `localhost:3000` などを使用する場合は、`host.docker.internal:3000` に置き換えてください。

### 2. 起動

Devcontainer を起動し、Claude Code を指定モードで起動します。

```bash
# YOLO モードで起動（デフォルト）
yolocon start

# 起動後に VS Code を自動で開く
yolocon start --open

# 通常モードで起動
yolocon start --mode normal

# コンテナ名を指定
yolocon start --name my-claude-container

# 起動完了まで待機
yolocon start --wait
```

起動後、以下のメッセージが表示されます：
```
🚀 Open VS Code terminal and run `claude --dangerously-skip-permissions` to enjoy YOLO mode!
```

### 3. VS Code で開く

実行中の Devcontainer を VS Code で開きます。

```bash
# デフォルト（YOLO モード、新しいウィンドウ）
yolocon open

# 通常モードで開く
yolocon open --mode normal

# 既存のウィンドウで開く
yolocon open --no-new-window

# コンテナ名を指定
yolocon open --name my-claude-container
```

💡 **代替手段**: VS Code のコマンドパレット（`Cmd/Ctrl+Shift+P`）から「**Dev Containers: Reopen in Container**」を実行することでも開けます。

> **Note**: この方法を使う場合は、事前に `yolocon start` でコンテナを起動しておく必要があります。

### 4. ステータス確認

環境の現在状態を確認します。

```bash
yolocon status
```

**出力例**:
```
🔍 Claude Code Environment Status

✓ Docker: Running
✓ Devcontainer: Configuration found
  - Dockerfile: ✓
  - devcontainer.json: ✓
  - init-firewall.sh: ✓
✓ Container: Running (devcontainer-claude-yolo-1)
✓ Claude Code: Running
✓ VS Code: Available

📋 Summary:
• Environment is fully operational! 🚀
• Run "yolocon open" to access VS Code
```

### 5. 停止

Devcontainer を停止します。

```bash
# 停止のみ
yolocon stop

# .devcontainer ディレクトリも削除
yolocon stop --clean

# コンテナ名を指定
yolocon stop --name my-claude-container
```

## ⚙️ コマンドオプション

### `yolocon init`

- `-f, --force`: 既存の `.devcontainer` を上書き
- `--env <KEY=VALUE>`: 環境変数を追加（複数指定可）
- `--env-file <path>`: 環境変数ファイルを指定

### `yolocon start`

- `--name <container-name>`: コンテナ名（デフォルト: `claude-yolo`）
- `--mode <yolo|normal>`: 起動モード（デフォルト: `yolo`）
- `--wait`: 起動完了まで待機
- `--open`: 起動後に VS Code を自動で開く

### `yolocon open`

- `--name <container-name>`: コンテナ名（デフォルト: `claude-yolo`）
- `--mode <yolo|normal>`: Claude Code モード（デフォルト: `yolo`）
- `--no-new-window`: 既存の VS Code ウィンドウで開く

### `yolocon status`

- `--name <container-name>`: コンテナ名（デフォルト: `claude-yolo`）

### `yolocon stop`

- `--name <container-name>`: コンテナ名（デフォルト: `claude-yolo`）
- `-c, --clean`: `.devcontainer` ディレクトリを削除

## 🔧 環境変数

以下の Claude Code 関連環境変数は、ホスト環境から自動的にコンテナにマッピングされます：

- `ANTHROPIC_API_KEY`
- `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_MODEL`
- `HTTP_PROXY` / `HTTPS_PROXY`
- その他多数（詳細は `.devcontainer/devcontainer.json` を参照）

## ✨ 主な機能

- 🐳 **Devcontainer 統合**: 安全な隔離環境で Claude Code を実行
- 🚀 **ワンクリック起動**: `yolocon start --open` で環境構築から VS Code 起動まで自動化
- 💻 **VS Code 統合**: Devcontainer を新しいウィンドウで開き、Claude Code を自動起動
- 📊 **ステータス管理**: 環境の状態を一目で確認
- 🔒 **セキュリティ強化**: ファイアウォールで外部通信を制限
- 🌍 **環境変数自動マッピング**: ホストの Claude Code 設定を自動継承

## 🔄 推奨ワークフロー

```bash
# 1. プロジェクトで初期化
yolocon init

# 2. 環境を起動して VS Code で開く
yolocon start --open

# 3. VS Code のターミナルで Claude Code を使用
# （自動起動されているので、すぐに利用可能）

# 4. 必要に応じて状態確認
yolocon status

# 5. 作業完了後に停止
yolocon stop
```

### 📝 VS Code から直接開く方法

コンテナ起動後は、以下の方法でも開けます：

1. VS Code でプロジェクトを開く
2. コマンドパレット（`Cmd/Ctrl+Shift+P`）を開く
3. 「**Dev Containers: Reopen in Container**」を実行
4. Claude Code が自動起動され、すぐに利用可能

## 📋 要件

- [Docker](https://www.docker.com/) がインストールされていること
- [Bun](https://bun.sh/) v1.x 以上
- [VS Code](https://code.visualstudio.com/) （VS Code 統合機能を使用する場合）
- VS Code の `code` コマンドが PATH に含まれていること

## 🤝 貢献

Issue や Pull Request は歓迎します！

## 📄 ライセンス

MIT
