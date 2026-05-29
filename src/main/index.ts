/**
 * Electron 主进程入口文件
 * 负责：窗口创建、IPC 通信处理、子进程管理（CC Connect / Claude Code）、模型切换、提示词优化请求
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

// 主窗口实例
let mainWindow: BrowserWindow | null = null;
// CC Connect 子进程引用
let ccConnectProcess: ChildProcess | null = null;
// Claude Code 子进程引用
let claudeCodeProcess: ChildProcess | null = null;

/**
 * 创建主窗口
 * 使用无边框（frame: false）自定义标题栏方案
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 700,
    minHeight: 550,
    frame: false,           // 无边框窗口，由前端自定义标题栏
    transparent: false,
    backgroundColor: '#1a1a2e',  // 深色背景
    webPreferences: {
      contextIsolation: true,     // 开启上下文隔离（安全模式）
      nodeIntegration: false,     // 禁用渲染进程 Node.js 访问
      preload: path.join(__dirname, '../preload.js'),  // 加载预加载脚本
    },
  });

  // 开发模式下加载 Vite 开发服务器，生产模式下加载打包后的 HTML
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 应用就绪后创建窗口
app.whenReady().then(createWindow);

// 所有窗口关闭时，清理子进程并退出（macOS 除外）
app.on('window-all-closed', () => {
  if (ccConnectProcess) ccConnectProcess.kill();
  if (claudeCodeProcess) claudeCodeProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

// ==================== IPC 事件处理 ====================

// --- 窗口控制 ---
// 最小化窗口
ipcMain.on('window-minimize', () => mainWindow?.minimize());
// 最大化/还原窗口
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
// 关闭窗口
ipcMain.on('window-close', () => mainWindow?.close());

// --- CC Connect 启停控制 ---
/**
 * 启动 CC Connect 进程
 * 命令：cc-connect run（直接运行，不指定 --project）
 * @param workDir - 工作目录
 */
ipcMain.handle('cc-connect:start', async (_event, workDir: string) => {
  try {
    if (ccConnectProcess) {
      return { success: false, message: 'CC Connect 已在运行' };
    }
    const ccConnectPath = 'cc-connect';
    ccConnectProcess = spawn(ccConnectPath, ['run'], {
      cwd: workDir,
      shell: true,
      detached: false,
    });

    // 进程出错时打印日志
    ccConnectProcess.on('error', (err) => {
      console.error('CC Connect error:', err);
    });

    // 进程退出时清除引用
    ccConnectProcess.on('exit', (code) => {
      ccConnectProcess = null;
    });

    // 等待 1 秒确认启动成功
    await new Promise((r) => setTimeout(r, 1000));
    return { success: true, message: 'CC Connect 已启动' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
});

/**
 * 停止 CC Connect 进程
 */
ipcMain.handle('cc-connect:stop', async () => {
  try {
    if (!ccConnectProcess) {
      return { success: false, message: 'CC Connect 未运行' };
    }
    ccConnectProcess.kill('SIGTERM');
    ccConnectProcess = null;
    return { success: true, message: 'CC Connect 已停止' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
});

/**
 * 查询 CC Connect 运行状态
 */
ipcMain.handle('cc-connect:status', async () => {
  return { running: !!ccConnectProcess };
});

// --- Claude Code 启停控制 ---
/**
 * 启动 Claude Code 进程
 * @param workDir - 工作目录
 */
ipcMain.handle('claudecode:start', async (_event, workDir: string) => {
  try {
    if (claudeCodeProcess) {
      return { success: false, message: 'Claude Code 已在运行' };
    }
    claudeCodeProcess = spawn('claude', [], {
      cwd: workDir,
      shell: true,
    });

    claudeCodeProcess.on('error', (err) => {
      console.error('Claude Code error:', err);
    });

    claudeCodeProcess.on('exit', (code) => {
      claudeCodeProcess = null;
    });

    await new Promise((r) => setTimeout(r, 500));
    return { success: true, message: 'Claude Code 已启动' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
});

/**
 * 停止 Claude Code 进程
 */
ipcMain.handle('claudecode:stop', async () => {
  try {
    if (!claudeCodeProcess) {
      return { success: false, message: 'Claude Code 未运行' };
    }
    claudeCodeProcess.kill('SIGTERM');
    claudeCodeProcess = null;
    return { success: true, message: 'Claude Code 已停止' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
});

// --- 模型切换 ---
/**
 * 切换 Claude Code 使用的模型
 * 通过写入工作目录下的 .env 文件来设置环境变量 ANTHROPIC_DEFAULT_SONNET_MODEL_NAME
 * @param config.workDir - 工作目录路径
 * @param config.model - 目标模型名称
 */
ipcMain.handle('model:switch', async (_event, config: { workDir: string; model: string }) => {
  try {
    const envKey = 'ANTHROPIC_DEFAULT_SONNET_MODEL_NAME';

    // 读取现有的 .env 文件内容
    const envPath = path.join(config.workDir, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // 更新或追加模型配置行
    const lines = envContent.split('\n');
    let replaced = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(envKey + '=')) {
        lines[i] = `${envKey}=${config.model}`;
        replaced = true;
      }
    }
    if (!replaced) {
      lines.push(`${envKey}=${config.model}`);
    }
    fs.writeFileSync(envPath, lines.join('\n'));

    return { success: true, message: `模型已切换到 ${config.model}` };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
});

// --- 提示词优化（调用第三方 AI API）---
/**
 * 调用 AI API 优化提示词
 * 支持 DeepSeek、Kimi、OpenAI 及自定义兼容接口
 * @param options.provider - 服务商标识
 * @param options.apiKey - API 密钥
 * @param options.baseUrl - API 地址
 * @param options.model - 模型名称
 * @param options.messages - 对话消息数组（含 system prompt + 用户输入）
 */
ipcMain.handle('prompt:optimize', async (_event, options: {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
}) => {
  try {
    const response = await fetch(options.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error: ${response.status} ${errText}`);
    }

    // 兼容不同 API 的响应格式
    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content || data.output || '';
    return { success: true, content: content.trim() };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
});

// --- 导出配置 ---
/**
 * 弹出保存对话框，将配置导出为 JSON 文件
 * 注意：使用了 electron.remote（已废弃），需安装 @electron/remote 包
 */
ipcMain.handle('config:export', async (_event, config: any) => {
  try {
    const { dialog } = require('electron').remote;
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: '导出配置',
      defaultPath: 'cc-launcher-config.json',
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, JSON.stringify(config, null, 2));
      return { success: true, path: result.filePath };
    }
    return { success: false, message: '取消导出' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
});
