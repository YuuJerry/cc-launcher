/**
 * React 渲染进程入口文件
 * 将 App 组件挂载到 #root DOM 节点上
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 创建 React 根节点并渲染应用（使用 StrictMode 进行开发期检查）
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
