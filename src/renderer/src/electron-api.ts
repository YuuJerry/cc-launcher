/**
 * IPC 通信桥接模块
 * 在渲染进程中暴露 window.electronAPI 对象，
 * 供 React 组件调用主进程的功能（启停服务、模型切换、提示词优化等）
 */
import { app } from 'electron';

// 声明 window.electronAPI 的类型，提供 TypeScript 类型支持
declare global {
  interface Window {
    electronAPI: {
      'cc-connect:start': (workDir: string) => Promise<{ success: boolean; message: string }>;
      'cc-connect:stop': () => Promise<{ success: boolean; message: string }>;
      'cc-connect:status': () => Promise<{ running: boolean }>;
      'claudecode:start': (workDir: string) => Promise<{ success: boolean; message: string }>;
      'claudecode:stop': () => Promise<{ success: boolean; message: string }>;
      'model:switch': (options: { workDir: string; model: string }) => Promise<{ success: boolean; message: string }>;
      'prompt:optimize': (options: {
        provider: string;
        apiKey: string;
        baseUrl: string;
        model: string;
        messages: Array<{ role: string; content: string }>;
      }) => Promise<{ success: boolean; content?: string; message?: string }>;
      'config:export': (config: any) => Promise<{ success: boolean; path?: string; message?: string }>;
      'window-minimize': () => void;
      'window-maximize': () => void;
      'window-close': () => void;
    };
  }
}

// 获取 Electron 的 ipcRenderer 模块，用于渲染进程→主进程通信
const { ipcRenderer } = require('electron');

// 将所有 IPC 调用挂载到 window.electronAPI 上
window.electronAPI = {
  // CC Connect 启动/停止/状态查询
  'cc-connect:start': (workDir: string) => ipcRenderer.invoke('cc-connect:start', workDir),
  'cc-connect:stop': () => ipcRenderer.invoke('cc-connect:stop'),
  'cc-connect:status': () => ipcRenderer.invoke('cc-connect:status'),
  // Claude Code 启动/停止
  'claudecode:start': (workDir: string) => ipcRenderer.invoke('claudecode:start', workDir),
  'claudecode:stop': () => ipcRenderer.invoke('claudecode:stop'),
  // 模型切换
  'model:switch': (options: { workDir: string; model: string }) => ipcRenderer.invoke('model:switch', options),
  // 提示词优化
  'prompt:optimize': (options: {
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    messages: Array<{ role: string; content: string }>;
  }) => ipcRenderer.invoke('prompt:optimize', options),
  // 配置导出
  'config:export': (config: any) => ipcRenderer.invoke('config:export', config),
  // 窗口控制（使用 send 而非 invoke，因为是单向通知）
  'window-minimize': () => ipcRenderer.send('window-minimize'),
  'window-maximize': () => ipcRenderer.send('window-maximize'),
  'window-close': () => ipcRenderer.send('window-close'),
};

export {};
