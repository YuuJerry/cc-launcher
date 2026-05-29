/**
 * Vite 构建配置（用于渲染进程）
 * - root: 指定渲染进程 HTML 入口目录
 * - base: 使用相对路径 './'，确保 Electron 通过 file:// 协议加载时资源路径正确
 * - build.outDir: 输出到 dist/renderer 目录
 * - resolve.alias: '@' 映射到 src/renderer/src，方便导入
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],                          // React JSX 支持
  root: 'src/renderer',                        // 渲染进程根目录
  base: './',                                  // 相对路径，适配 Electron file:// 加载
  build: {
    outDir: '../../dist/renderer',             // 构建输出目录
    emptyOutDir: true,                         // 构建前清空输出目录
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer/src'),  // 路径别名
    },
  },
});
