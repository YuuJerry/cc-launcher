/**
 * 全局类型声明
 * 为 React 的 CSSProperties 扩展 WebkitAppRegion 属性，
 * 用于控制 Electron 无边框窗口的拖拽区域
 */
declare namespace React.CSSProperties {
  interface WebkitAppearance {
    '-webkit-appearance'?: string;
  }
}
declare module 'react' {
  interface CSSProperties {
    // 'drag' 表示该区域可拖拽窗口，'no-drag' 表示该区域可正常交互（点击按钮等）
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}
