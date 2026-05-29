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

## 架构说明

### 双进程架构

项目有两套独立的 TypeScript 编译配置：

- **主进程** (`src/main/`)：`tsconfig.main.json`，CommonJS 模块，编译到 `dist/main/`
- **渲染进程** (`src/renderer/`)：`tsconfig.renderer.json`，ESM 模块，由 Vite 构建到 `dist/renderer/`

### 进程间通信

渲染进程通过 `src/renderer/src/electron-api.ts` 桥接模块访问主进程功能。该模块将 `ipcRenderer.invoke`/`ipcRenderer.send` 包装到 `window.electronAPI` 对象上。

主进程 `src/main/index.ts` 中通过 `ipcMain.handle`（双向）和 `ipcMain.on`（单向）处理请求。当前 IPC 通道：
- `cc-connect:start/stop/status` — CC Connect 子进程管理
- `claudecode:start/stop` — Claude Code 子进程管理
- `model:switch` — 写入 `.env` 文件切换模型
- `prompt:optimize` — 调用第三方 AI API
- `config:export` — 导出配置 JSON
- `window-minimize/maximize/close` — 窗口控制

### 渲染进程结构

- `App.tsx` — 无边框窗口根组件，自定义标题栏（drag 区域）+ 三标签页切换
- `components/LauncherTab.tsx` — 服务启停 + 模型切换
- `components/PromptTab.tsx` — 提示词优化（通用/生图双模式）
- `components/SettingsTab.tsx` — 命令路径配置 + 配置导入导出
- `types/index.ts` — AI 服务商预设配置（DeepSeek / Kimi / OpenAI / 自定义）

### 关键构建配置

- `vite.config.ts` 中 `base: './'` 是必需的，否则 Electron 通过 file:// 协议加载时资源路径会失效
- 主进程使用 `nodeIntegration: true` + `contextIsolation: false`，渲染进程可直接 `require('electron')`
- electron-builder 打包输出到 `release/`，已配置 Windows NSIS 安装包（支持自定义安装目录）
