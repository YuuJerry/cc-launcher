/**
 * Electron 预加载脚本
 * 在渲染进程加载前执行，通过 contextBridge 将 IPC 接口暴露给渲染进程
 */
const { contextBridge, ipcRenderer } = require('electron');

// 将 IPC 接口暴露到 window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  // CC Connect 启动/停止/状态
  'cc-connect:start': (workDir: string) => ipcRenderer.invoke('cc-connect:start', workDir),
  'cc-connect:stop': () => ipcRenderer.invoke('cc-connect:stop'),
  'cc-connect:status': () => ipcRenderer.invoke('cc-connect:status'),
  // Claude Code 启动/停止
  'claudecode:start': (workDir: string) => ipcRenderer.invoke('claudecode:start', workDir),
  'claudecode:stop': () => ipcRenderer.invoke('claudecode:stop'),
  // 模型切换
  'model:switch': (options: { workDir: string; model: string }) => ipcRenderer.invoke('model:switch', options),
  // 提示词优化
  'prompt:optimize': (options: any) => ipcRenderer.invoke('prompt:optimize', options),
  // 配置导出
  'config:export': (config: any) => ipcRenderer.invoke('config:export', config),
  // 窗口控制
  'window-minimize': () => ipcRenderer.send('window-minimize'),
  'window-maximize': () => ipcRenderer.send('window-maximize'),
  'window-close': () => ipcRenderer.send('window-close'),
});
