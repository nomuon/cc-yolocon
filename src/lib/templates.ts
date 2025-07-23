export const DEVCONTAINER_JSON = `{
  "name": "Claude YOLO Environment",
  "dockerComposeFile": "docker-compose.yml",
  "service": "claude-yolo",
  "workspaceFolder": "/workspaces/\${localWorkspaceFolderBasename}",
  "features": {
    "ghcr.io/devcontainers/features/common-utils:2": {
      "installZsh": "true",
      "username": "vscode",
      "userUid": "1000",
      "userGid": "1000",
      "upgradePackages": "false"
    },
    "ghcr.io/devcontainers/features/git:1": {
      "version": "latest"
    },
    "ghcr.io/devcontainers/features/node:1": {
      "version": "lts"
    }
  },
  "remoteUser": "vscode",
  "postCreateCommand": "npm install -g claude-code",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-vscode.vscode-typescript-next",
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint"
      ],
      "settings": {
        "terminal.integrated.defaultProfile.linux": "zsh"
      }
    }
  },
  "containerEnv": {
    "ANTHROPIC_API_KEY": "\${localEnv:ANTHROPIC_API_KEY}",
    "ANTHROPIC_AUTH_TOKEN": "\${localEnv:ANTHROPIC_AUTH_TOKEN}",
    "ANTHROPIC_CUSTOM_HEADERS": "\${localEnv:ANTHROPIC_CUSTOM_HEADERS}",
    "ANTHROPIC_MODEL": "\${localEnv:ANTHROPIC_MODEL}",
    "ANTHROPIC_SMALL_FAST_MODEL": "\${localEnv:ANTHROPIC_SMALL_FAST_MODEL}",
    "BASH_DEFAULT_TIMEOUT_MS": "\${localEnv:BASH_DEFAULT_TIMEOUT_MS}",
    "BASH_MAX_TIMEOUT_MS": "\${localEnv:BASH_MAX_TIMEOUT_MS}",
    "BASH_MAX_OUTPUT_LENGTH": "\${localEnv:BASH_MAX_OUTPUT_LENGTH}",
    "CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR": "\${localEnv:CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR}",
    "CLAUDE_CODE_API_KEY_HELPER_TTL_MS": "\${localEnv:CLAUDE_CODE_API_KEY_HELPER_TTL_MS}",
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "\${localEnv:CLAUDE_CODE_MAX_OUTPUT_TOKENS}",
    "CLAUDE_CODE_USE_BEDROCK": "\${localEnv:CLAUDE_CODE_USE_BEDROCK}",
    "CLAUDE_CODE_USE_VERTEX": "\${localEnv:CLAUDE_CODE_USE_VERTEX}",
    "CLAUDE_CODE_SKIP_BEDROCK_AUTH": "\${localEnv:CLAUDE_CODE_SKIP_BEDROCK_AUTH}",
    "CLAUDE_CODE_SKIP_VERTEX_AUTH": "\${localEnv:CLAUDE_CODE_SKIP_VERTEX_AUTH}",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "\${localEnv:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC}",
    "DISABLE_AUTOUPDATER": "\${localEnv:DISABLE_AUTOUPDATER}",
    "DISABLE_BUG_COMMAND": "\${localEnv:DISABLE_BUG_COMMAND}",
    "DISABLE_COST_WARNINGS": "\${localEnv:DISABLE_COST_WARNINGS}",
    "DISABLE_ERROR_REPORTING": "\${localEnv:DISABLE_ERROR_REPORTING}",
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "\${localEnv:DISABLE_NON_ESSENTIAL_MODEL_CALLS}",
    "DISABLE_TELEMETRY": "\${localEnv:DISABLE_TELEMETRY}",
    "HTTP_PROXY": "\${localEnv:HTTP_PROXY}",
    "HTTPS_PROXY": "\${localEnv:HTTPS_PROXY}",
    "MAX_THINKING_TOKENS": "\${localEnv:MAX_THINKING_TOKENS}",
    "MCP_TIMEOUT": "\${localEnv:MCP_TIMEOUT}",
    "MCP_TOOL_TIMEOUT": "\${localEnv:MCP_TOOL_TIMEOUT}",
    "MAX_MCP_OUTPUT_TOKENS": "\${localEnv:MAX_MCP_OUTPUT_TOKENS}",
    "AWS_REGION": "\${localEnv:AWS_REGION}",
    "AWS_ACCESS_KEY_ID": "\${localEnv:AWS_ACCESS_KEY_ID}",
    "AWS_SECRET_ACCESS_KEY": "\${localEnv:AWS_SECRET_ACCESS_KEY}",
    "AWS_SESSION_TOKEN": "\${localEnv:AWS_SESSION_TOKEN}",
    "ANTHROPIC_BEDROCK_BASE_URL": "\${localEnv:ANTHROPIC_BEDROCK_BASE_URL}",
    "ANTHROPIC_VERTEX_PROJECT_ID": "\${localEnv:ANTHROPIC_VERTEX_PROJECT_ID}",
    "ANTHROPIC_VERTEX_BASE_URL": "\${localEnv:ANTHROPIC_VERTEX_BASE_URL}",
    "API_TIMEOUT_MS": "\${localEnv:API_TIMEOUT_MS}"
  }
}`;

export const DOCKERFILE = `FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

# Install additional tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \\
    && apt-get -y install --no-install-recommends \\
    curl \\
    git \\
    jq \\
    && apt-get clean \\
    && rm -rf /var/lib/apt/lists/*

# Install bun
RUN curl -fsSL https://bun.sh/install | bash \\
    && mv /root/.bun /usr/local/bun \\
    && ln -s /usr/local/bun/bin/bun /usr/local/bin/bun

# Create a non-root user if not exists
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN if ! id -u $USERNAME > /dev/null 2>&1; then \\
    groupadd --gid $USER_GID $USERNAME \\
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \\
    && apt-get update \\
    && apt-get install -y sudo \\
    && echo $USERNAME ALL=\\(root\\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \\
    && chmod 0440 /etc/sudoers.d/$USERNAME; \\
    fi

# Set the default user
USER $USERNAME`;

export const DOCKER_COMPOSE_YML = `version: '3.8'

services:
  claude-yolo:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ..:/workspaces/\${WORKSPACE_FOLDER_NAME}:cached
      - ~/.gitconfig:/home/vscode/.gitconfig:ro
      - ~/.ssh:/home/vscode/.ssh:ro
    command: sleep infinity
    environment:
      - WORKSPACE_FOLDER_NAME=\${WORKSPACE_FOLDER_NAME}
    network_mode: host`;