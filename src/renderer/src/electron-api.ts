/**
 * window.electronAPI 类型声明
 * 实际实现由 preload.ts 通过 contextBridge 暴露
 * 此文件仅为渲染进程提供 TypeScript 类型支持
 */
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

export {};
