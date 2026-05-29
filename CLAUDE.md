# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

CC Launcher 是一个基于 Electron + React + TypeScript 的 Windows 桌面应用，提供 AI 工具的快捷启动和提示词优化功能。

## 常用命令

```bash
npm run dev          # 同时启动主进程和渲染进程的开发模式
npm run build        # 编译主进程（tsc）+ 渲染进程（vite build）
npm run pack         # 构建 + electron-builder 打包（目录形式，不生成安装包）
npm run dist:win     # 构建 + 生成 Windows NSIS 安装包到 release/ 目录
```

双击 `启动.bat` 可快速构建并启动应用。

## 架构说明

### 三进程架构

- **主进程** (`src/main/index.ts`)：窗口创建、IPC 处理、子进程管理
- **预加载脚本** (`src/preload.ts`)：在主进程和渲染进程之间建立安全的 IPC 桥接
- **渲染进程** (`src/renderer/`)：React UI

### 编译配置

- **主进程 + preload**：`tsconfig.main.json`，CommonJS 模块，编译到 `dist/`
  - `src/main/index.ts` → `dist/main/index.js`
  - `src/preload.ts` → `dist/preload.js`
- **渲染进程**：`tsconfig.renderer.json`，ESM 模块，由 Vite 构建到 `dist/renderer/`

### 进程间通信

通过 `src/preload.ts` 使用 `contextBridge.exposeInMainWorld` 将 `ipcRenderer` 接口安全暴露到 `window.electronAPI`。

主进程使用 `contextIsolation: true` + `nodeIntegration: false`（安全模式），preload 脚本在 `webPreferences.preload` 中指定。

`src/renderer/src/electron-api.ts` 和 `src/renderer/src/global.d.ts` 仅为渲染进程提供 `window.electronAPI` 的 TypeScript 类型声明，不含运行时代码。

当前 IPC 通道：
- `cc-connect:start/stop/status` — CC Connect 子进程管理
- `claudecode:start/stop` — Claude Code 子进程管理
- `model:switch` — 写入 `.env` 文件切换模型
- `prompt:optimize` — 调用第三方 AI API
- `config:export` — 导出配置 JSON
- `window-minimize/maximize/close` — 窗口控制

### 关键构建配置

- `vite.config.ts` 中 `base: './'` 是必需的，否则 Electron 通过 file:// 协议加载时资源路径会失效
- `vite.config.ts` 中 `build.rollupOptions.external: ['electron']` 是必需的，防止 Vite 将 `require('electron')` 打包时丢弃
