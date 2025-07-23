export const DOCKERFILE = `FROM node:20

ARG TZ
ENV TZ="$TZ"

# Install basic development tools and iptables/ipset
RUN apt update && apt install -y less \\
  git \\
  procps \\
  sudo \\
  fzf \\
  zsh \\
  man-db \\
  unzip \\
  gnupg2 \\
  gh \\
  iptables \\
  ipset \\
  iproute2 \\
  dnsutils \\
  aggregate \\
  jq

# Ensure default node user has access to /usr/local/share
RUN mkdir -p /usr/local/share/npm-global && \\
  chown -R node:node /usr/local/share

ARG USERNAME=node

# Persist bash history.
RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \\
  && mkdir /commandhistory \\
  && touch /commandhistory/.bash_history \\
  && chown -R $USERNAME /commandhistory

# Set \`DEVCONTAINER\` environment variable to help with orientation
ENV DEVCONTAINER=true

# Create workspace and config directories and set permissions
RUN mkdir -p /workspace /home/node/.claude && \\
  chown -R node:node /workspace /home/node/.claude

WORKDIR /workspace

RUN ARCH=$(dpkg --print-architecture) && \\
  wget "https://github.com/dandavison/delta/releases/download/0.18.2/git-delta_0.18.2_\${ARCH}.deb" && \\
  sudo dpkg -i "git-delta_0.18.2_\${ARCH}.deb" && \\
  rm "git-delta_0.18.2_\${ARCH}.deb"

# Set up non-root user
USER node

# Install global packages
ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=$PATH:/usr/local/share/npm-global/bin

# Set the default shell to zsh rather than sh
ENV SHELL=/bin/zsh

# Default powerline10k theme
RUN sh -c "$(wget -O- https://github.com/deluan/zsh-in-docker/releases/download/v1.2.0/zsh-in-docker.sh)" -- \\
  -p git \\
  -p fzf \\
  -a "source /usr/share/doc/fzf/examples/key-bindings.zsh" \\
  -a "source /usr/share/doc/fzf/examples/completion.zsh" \\
  -a "export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \\
  -x

# Install Claude
RUN npm install -g @anthropic-ai/claude-code

# Copy and set up firewall script
COPY init-firewall.sh /usr/local/bin/
USER root
RUN chmod +x /usr/local/bin/init-firewall.sh && \\
  echo "node ALL=(root) NOPASSWD: /usr/local/bin/init-firewall.sh" > /etc/sudoers.d/node-firewall && \\
  chmod 0440 /etc/sudoers.d/node-firewall
USER node`;

export const DEVCONTAINER_JSON = `{
  "name": "Claude Code Sandbox",
  "build": {
    "dockerfile": "Dockerfile",
    "args": {
      "TZ": "\${localEnv:TZ:America/Los_Angeles}"
    }
  },
  "runArgs": ["--cap-add=NET_ADMIN", "--cap-add=NET_RAW"],
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "eamodio.gitlens"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": "explicit"
        },
        "terminal.integrated.defaultProfile.linux": "zsh",
        "terminal.integrated.profiles.linux": {
          "bash": {
            "path": "bash",
            "icon": "terminal-bash"
          },
          "zsh": {
            "path": "zsh"
          },
          "claude": {
            "path": "/bin/bash",
            "args": ["-c", "export PATH=/home/node/.local/bin:$PATH && claude --yolo"],
            "icon": "robot"
          }
        },
        "terminal.integrated.automationProfile.linux": {
          "path": "/bin/bash",
          "args": ["-l"]
        }
      },
      "tasks": {
        "version": "2.0.0",
        "tasks": [
          {
            "label": "Start Claude Code (YOLO)",
            "type": "shell",
            "command": "export PATH=/home/node/.local/bin:$PATH && claude --yolo",
            "group": "build",
            "presentation": {
              "echo": true,
              "reveal": "always",
              "focus": true,
              "panel": "new"
            },
            "runOptions": {
              "runOn": "folderOpen"
            }
          },
          {
            "label": "Start Claude Code (Normal)",
            "type": "shell",
            "command": "export PATH=/home/node/.local/bin:$PATH && claude",
            "group": "build",
            "presentation": {
              "echo": true,
              "reveal": "always",
              "focus": true,
              "panel": "new"
            }
          }
        ]
      }
    }
  },
  "remoteUser": "node",
  "mounts": [
    "source=claude-code-bashhistory-\${devcontainerId},target=/commandhistory,type=volume",
    "source=\${localEnv:HOME}/.claude,target=/home/node/.claude,type=bind,consistency=cached"
  ],
  "remoteEnv": {
    "NODE_OPTIONS": "--max-old-space-size=4096",
    "CLAUDE_CONFIG_DIR": "/home/node/.claude",
    "POWERLEVEL9K_DISABLE_GITSTATUS": "true"
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
  },
  "workspaceMount": "source=\${localWorkspaceFolder},target=/workspace,type=bind,consistency=delegated",
  "workspaceFolder": "/workspace",
  "postCreateCommand": "sudo /usr/local/bin/init-firewall.sh"
}`;

export const INIT_FIREWALL_SH = `#!/bin/bash
set -euo pipefail  # Exit on error, undefined vars, and pipeline failures
IFS=$'\\n\\t'       # Stricter word splitting

# Flush existing rules and delete existing ipsets
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X
ipset destroy allowed-domains 2>/dev/null || true

# First allow DNS and localhost before any restrictions
# Allow outbound DNS
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
# Allow inbound DNS responses
iptables -A INPUT -p udp --sport 53 -j ACCEPT
# Allow outbound SSH
iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT
# Allow inbound SSH responses
iptables -A INPUT -p tcp --sport 22 -m state --state ESTABLISHED -j ACCEPT
# Allow localhost
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Create ipset with CIDR support
ipset create allowed-domains hash:net

# Fetch GitHub meta information and aggregate + add their IP ranges
echo "Fetching GitHub IP ranges..."
gh_ranges=$(curl -s https://api.github.com/meta)
if [ -z "$gh_ranges" ]; then
    echo "ERROR: Failed to fetch GitHub IP ranges"
    exit 1
fi

if ! echo "$gh_ranges" | jq -e '.web and .api and .git' >/dev/null; then
    echo "ERROR: GitHub API response missing required fields"
    exit 1
fi

echo "Processing GitHub IPs..."
while read -r cidr; do
    if [[ ! "$cidr" =~ ^[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}/[0-9]{1,2}$ ]]; then
        echo "ERROR: Invalid CIDR range from GitHub meta: $cidr"
        exit 1
    fi
    echo "Adding GitHub range $cidr"
    ipset add allowed-domains "$cidr"
done < <(echo "$gh_ranges" | jq -r '(.web + .api + .git)[]' | aggregate -q)

# Resolve and add other allowed domains
for domain in \\
    "registry.npmjs.org" \\
    "api.anthropic.com" \\
    "sentry.io" \\
    "statsig.anthropic.com" \\
    "statsig.com"; do
    echo "Resolving $domain..."
    ips=$(dig +short A "$domain")
    if [ -z "$ips" ]; then
        echo "ERROR: Failed to resolve $domain"
        exit 1
    fi
    
    while read -r ip; do
        if [[ ! "$ip" =~ ^[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}$ ]]; then
            echo "ERROR: Invalid IP from DNS for $domain: $ip"
            exit 1
        fi
        echo "Adding $ip for $domain"
        ipset add allowed-domains "$ip"
    done < <(echo "$ips")
done

# Get host IP from default route
HOST_IP=$(ip route | grep default | cut -d" " -f3)
if [ -z "$HOST_IP" ]; then
    echo "ERROR: Failed to detect host IP"
    exit 1
fi

HOST_NETWORK=$(echo "$HOST_IP" | sed "s/\\.[0-9]*$/.0\\/24/")
echo "Host network detected as: $HOST_NETWORK"

# Set up remaining iptables rules
iptables -A INPUT -s "$HOST_NETWORK" -j ACCEPT
iptables -A OUTPUT -d "$HOST_NETWORK" -j ACCEPT

# Set default policies to DROP first
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP

# First allow established connections for already approved traffic
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Then allow only specific outbound traffic to allowed domains
iptables -A OUTPUT -m set --match-set allowed-domains dst -j ACCEPT

echo "Firewall configuration complete"
echo "Verifying firewall rules..."
if curl --connect-timeout 5 https://example.com >/dev/null 2>&1; then
    echo "ERROR: Firewall verification failed - was able to reach https://example.com"
    exit 1
else
    echo "Firewall verification passed - unable to reach https://example.com as expected"
fi

# Verify GitHub API access
if ! curl --connect-timeout 5 https://api.github.com/zen >/dev/null 2>&1; then
    echo "ERROR: Firewall verification failed - unable to reach https://api.github.com"
    exit 1
else
    echo "Firewall verification passed - able to reach https://api.github.com as expected"
fi`;