FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20-bullseye

# Install Claude CLI
RUN npm install -g @anthropic/claude-desktop-sdk@latest

# Install additional tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Set up git
RUN git config --global init.defaultBranch main

# Create workspace directory
WORKDIR /workspace

# Switch to node user
USER node