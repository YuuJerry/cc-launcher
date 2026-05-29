/**
 * 应用根组件
 * 负责：自定义标题栏、窗口控制按钮、标签页导航切换
 * 布局：标题栏 → 标签栏 → 内容区
 */
import { useState, useCallback } from 'react';
import LauncherTab from './components/LauncherTab';
import PromptTab from './components/PromptTab';
import SettingsTab from './components/SettingsTab';

// 标签页类型
type TabKey = 'launcher' | 'prompt' | 'settings';

// 标签页配置列表（图标 + 标识 + 显示名称）
const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'launcher', label: '启动器', icon: '▶' },
  { key: 'prompt', label: '提示词优化', icon: '✦' },
  { key: 'settings', label: '设置', icon: '⚙' },
];

function App() {
  // 当前激活的标签页
  const [activeTab, setActiveTab] = useState<TabKey>('launcher');

  // 切换标签页
  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
  }, []);

  // 窗口最小化
  const handleWindowMin = useCallback(() => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI['window-minimize']?.();
    }
  }, []);

  // 窗口最大化/还原
  const handleWindowMax = useCallback(() => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI['window-maximize']?.();
    }
  }, []);

  // 关闭窗口
  const handleWindowClose = useCallback(() => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI['window-close']?.();
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#1a1a2e' }}>
      {/* 自定义标题栏（可拖拽） */}
      <div style={{
        height: 38,
        background: 'linear-gradient(90deg, #16213e, #0f3460)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        WebkitAppRegion: 'drag',    // 整个标题栏可拖拽
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>🤖</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0' }}>CC Launcher</span>
        </div>
        {/* 窗口控制按钮区域（不可拖拽，可点击） */}
        <div style={{ display: 'flex', gap: 8, WebkitAppRegion: 'no-drag' }}>
          <button onClick={handleWindowMin} style={windowBtnStyle} title="最小化">−</button>
          <button onClick={handleWindowMax} style={windowBtnStyle} title="最大化">□</button>
          <button onClick={handleWindowClose} style={{...windowBtnStyle, color: '#ff6b6b'}} title="关闭">✕</button>
        </div>
      </div>

      {/* 标签页导航栏 */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '10px 16px 0',
        background: '#1a1a2e',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            style={{
              ...tabBtnStyle,
              // 激活标签高亮样式
              ...(activeTab === tab.key ? { background: 'rgba(99,102,241,0.2)', color: '#818cf8', borderBottom: '2px solid #818cf8' } : {}),
            }}
          >
            <span style={{ marginRight: 6 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域：根据标签页切换显示对应组件 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'launcher' && <LauncherTab />}
        {activeTab === 'prompt' && <PromptTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

// 窗口控制按钮样式
const windowBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#94a3b8',
  width: 32,
  height: 28,
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  WebkitAppRegion: 'no-drag',  // 按钮区域不可拖拽，确保可点击
};

// 标签页按钮样式
const tabBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#94a3b8',
  padding: '8px 16px',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
  borderRadius: '6px 6px 0 0',
  transition: 'all 0.2s',
};

export default App;
