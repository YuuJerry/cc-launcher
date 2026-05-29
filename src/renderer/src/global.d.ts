/**
 * 全局类型声明
 */

/** React CSSProperties 扩展：WebkitAppRegion（用于 Electron 无边框窗口拖拽区域） */
declare module 'react' {
  interface CSSProperties {
    // 'drag' 表示该区域可拖拽窗口，'no-drag' 表示该区域可正常交互（点击按钮等）
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}

/** window.electronAPI 类型声明（实际由 preload.ts 通过 contextBridge 注入） */
interface ElectronAPI {
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
}

declare interface Window {
  electronAPI: ElectronAPI;
}
