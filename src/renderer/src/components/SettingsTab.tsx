/**
 * 设置标签页组件
 * 功能：
 * 1. 应用名称配置
 * 2. CC Connect / Claude Code 命令路径配置
 * 3. 配置导出/导入（方便分享给他人使用）
 */
import { useState, useCallback } from 'react';

function SettingsTab() {
  // CC Connect 命令路径（默认 cc-connect）
  const [ccPath, setCcPath] = useState('cc-connect');
  // Claude Code 命令路径（默认 claude）
  const [claudePath, setClaudePath] = useState('claude');
  // 应用显示名称
  const [configName, setConfigName] = useState('CC Launcher');
  // 导出加载状态
  const [exporting, setExporting] = useState(false);

  const electronAPI = (window as any).electronAPI;

  /**
   * 导出配置为 JSON 文件
   * 优先使用 Electron 原生保存对话框，否则降级为浏览器下载
   */
  const handleExportConfig = useCallback(async () => {
    setExporting(true);
    try {
      const config = {
        version: '1.0.0',
        name: configName,
        ccPath,
        claudePath,
        exportDate: new Date().toISOString(),
      };
      if (electronAPI) {
        // 调用主进程的保存对话框
        await electronAPI['config:export'](config);
      } else {
        // 降级方案：浏览器下载
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${configName}-config.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [configName, ccPath, claudePath, electronAPI]);

  /**
   * 从 JSON 文件导入配置
   * 通过隐藏的 file input 触发文件选择
   */
  const handleImportConfig = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const config = JSON.parse(text);
        if (config.ccPath) setCcPath(config.ccPath);
        if (config.claudePath) setClaudePath(config.claudePath);
        if (config.name) setConfigName(config.name);
        alert('配置已导入！');
      } catch {
        alert('配置文件格式错误');
      }
    };
    input.click();
  }, []);

  // 通用卡片样式
  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 20,
    border: '1px solid rgba(255,255,255,0.08)',
    marginBottom: 16,
  };

  // 输入框统一样式
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 6,
    padding: '8px 10px',
    color: '#e0e0e0',
    fontSize: 13,
    outline: 'none',
  };

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      {/* 应用设置卡片 */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>应用设置</h3>
        {/* 应用名称 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>应用名称</label>
          <input value={configName} onChange={e => setConfigName(e.target.value)} style={inputStyle} />
        </div>
        {/* CC Connect 命令路径 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>CC Connect 命令路径</label>
          <input value={ccPath} onChange={e => setCcPath(e.target.value)} style={inputStyle} />
        </div>
        {/* Claude Code 命令路径 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Claude Code 命令路径</label>
          <input value={claudePath} onChange={e => setClaudePath(e.target.value)} style={inputStyle} />
        </div>
      </div>

      {/* 配置分享卡片 */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>分享配置</h3>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
          导出配置文件让你的朋友也可以使用，导入他人分享的配置快速上手
        </p>
        {/* 导出/导入按钮 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExportConfig} disabled={exporting} style={{
            flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
            fontWeight: 600, fontSize: 13, opacity: exporting ? 0.6 : 1,
          }}>
            {exporting ? '导出中...' : '📤 导出配置'}
          </button>
          <button onClick={handleImportConfig} style={{
            flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
            cursor: 'pointer', background: 'transparent', color: '#94a3b8', fontSize: 13, fontWeight: 500,
          }}>
            📥 导入配置
          </button>
        </div>
      </div>

      {/* 关于信息卡片 */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>关于</h3>
        <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8 }}>
          <div><strong style={{ color: '#cbd5e1' }}>CC Launcher</strong> v1.0.0</div>
          <div>AI 助手桌面工具</div>
          <div style={{ marginTop: 8, fontSize: 12 }}>
            功能：CC Connect 启停、Claude Code 启动、模型切换、提示词优化
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsTab;
