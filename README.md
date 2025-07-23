# cc-yolocon

Claude Code YOLO mode CLI tool with Devcontainer isolation

## 🎯 概要

`cc-yolocon` は、Claude Code の YOLO モードを手軽に起動・停止できる CLI ツールです。
Devcontainer を利用することで、YOLO モードの影響範囲をプロジェクト内に限定できます。

## 📦 インストール

```bash
# bun でグローバルインストール
bun install --global cc-yolocon
```

## 🚀 使い方

### 1. 初期化

現在のディレクトリに `.devcontainer` テンプレートをコピーします。

```bash
yolo init

# 既存の .devcontainer を上書きする場合
yolo init --force

# 環境変数を設定する場合
yolo init --env ANTHROPIC_API_KEY=sk-ant-xxx
yolo init --env-file .env.local
```

⚠️ **注意**: Docker 環境で `localhost:3000` などを使用する場合は、`host.docker.internal:3000` に置き換えてください。

### 2. 起動

Devcontainer を起動し、Claude Code を指定モードで起動します。

```bash
# YOLO モードで起動（デフォルト）
yolo start

# 通常モードで起動
yolo start --mode normal

# コンテナ名を指定
yolo start --name my-claude-container

# 起動完了まで待機
yolo start --wait
```

### 3. 停止

Devcontainer を停止します。

```bash
# 停止のみ
yolo stop

# .devcontainer ディレクトリも削除
yolo stop --clean

# コンテナ名を指定
yolo stop --name my-claude-container
```

## ⚙️ コマンドオプション

### `yolo init`

- `-f, --force`: 既存の `.devcontainer` を上書き
- `--env <KEY=VALUE>`: 環境変数を追加（複数指定可）
- `--env-file <path>`: 環境変数ファイルを指定

### `yolo start`

- `--name <container-name>`: コンテナ名（デフォルト: `claude-yolo`）
- `--mode <yolo|normal>`: 起動モード（デフォルト: `yolo`）
- `--wait`: 起動完了まで待機

### `yolo stop`

- `--name <container-name>`: コンテナ名（デフォルト: `claude-yolo`）
- `-c, --clean`: `.devcontainer` ディレクトリを削除

## 🔧 環境変数

以下の Claude Code 関連環境変数は、ホスト環境から自動的にコンテナにマッピングされます：

- `ANTHROPIC_API_KEY`
- `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_MODEL`
- `HTTP_PROXY` / `HTTPS_PROXY`
- その他多数（詳細は `.devcontainer/devcontainer.json` を参照）

## 📋 要件

- [Docker](https://www.docker.com/) がインストールされていること
- [Bun](https://bun.sh/) v1.x 以上

## 🤝 貢献

Issue や Pull Request は歓迎します！

## 📄 ライセンス

MIT
