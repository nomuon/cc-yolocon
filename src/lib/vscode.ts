import { spawn } from 'bun';
import * as docker from './docker.js';

interface VSCodeOptions {
  containerName: string;
  hostPath: string;
  workspacePath: string;
  newWindow?: boolean;
  wait?: boolean;
}

/**
 * VS CodeでDevcontainerを開く
 * @param options - VS Code開幕オプション
 * @returns 成功したかどうか
 */
export async function openInVSCode(options: VSCodeOptions): Promise<boolean> {
  try {
    // コンテナが実行中かチェック
    if (!await docker.isContainerRunning(options.containerName)) {
      console.error(`Container "${options.containerName}" is not running`);
      return false;
    }

    // VS Codeがインストールされているかチェック
    const checkCode = spawn(['which', 'code'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    await checkCode.exited;
    
    if (checkCode.exitCode !== 0) {
      console.error('VS Code (code command) is not available in PATH');
      return false;
    }

    // VS CodeでDevcontainerを開く
    const codeArgs = ['code'];
    
    // 新しいウィンドウで開く場合
    if (options.newWindow) {
      codeArgs.push('--new-window');
    }
    
    // 起動完了を待機する場合
    if (options.wait) {
      codeArgs.push('--wait');
    }
    
    // devcontainer形式でリモート接続
    // VS Codeはhostパスを16進数でエンコードして期待している
    const hexPath = Buffer.from(options.hostPath).toString('hex');
    const remoteUri = `vscode-remote://dev-container+${hexPath}${options.workspacePath}`;
    
    codeArgs.push('--folder-uri', remoteUri);
    
    const codeProcess = spawn(codeArgs, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    await codeProcess.exited;

    return codeProcess.exitCode === 0;
  } catch (error) {
    console.error('Failed to open VS Code:', error);
    return false;
  }
}

/**
 * VS Codeがインストールされているかチェック
 * @returns VS Codeが利用可能かどうか
 */
export async function isVSCodeAvailable(): Promise<boolean> {
  try {
    const checkCode = spawn(['which', 'code'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    await checkCode.exited;
    return checkCode.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Devcontainerのワークスペースパスを取得
 * @returns コンテナ内のワークスペースパス
 */
export function getContainerWorkspacePath(): string {
  return `/workspace`;
}

/**
 * コンテナ内でClaude Codeが実行中かチェック
 * @param containerName - コンテナ名
 * @returns Claude Codeが実行中かどうか
 */
export async function isClaudeCodeRunning(containerName: string): Promise<boolean> {
  try {
    const checkResult = await docker.dockerExec(containerName, ['pgrep', '-f', 'claude'], false);
    return checkResult.success && checkResult.stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * コンテナ内でClaude Codeを起動
 * @param containerName - コンテナ名
 * @param mode - 起動モード ('yolo' | 'normal')
 * @returns 起動に成功したかどうか
 */
export async function startClaudeCodeInContainer(containerName: string, mode: 'yolo' | 'normal' = 'yolo'): Promise<boolean> {
  try {
    const claudeCommand = mode === 'yolo' 
      ? ['bash', '-c', 'export PATH="/home/node/.local/bin:$PATH" && nohup claude --yolo > /tmp/claude.log 2>&1 &']
      : ['bash', '-c', 'export PATH="/home/node/.local/bin:$PATH" && nohup claude > /tmp/claude.log 2>&1 &'];
    
    const execResult = await docker.dockerExec(containerName, claudeCommand, false);
    
    if (!execResult.success) {
      console.error('Failed to start Claude Code:', execResult.stderr);
      return false;
    }
    
    // 少し待機してプロセスが起動するのを確認
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return await isClaudeCodeRunning(containerName);
  } catch (error) {
    console.error('Error starting Claude Code:', error);
    return false;
  }
}