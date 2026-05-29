/**
 * 启动器标签页组件
 * 功能：
 * 1. CC Connect 一键启停
 * 2. Claude Code 一键启停
 * 3. 模型切换（写入 .env 文件）
 * 4. 工作目录配置
 */
import { useState, useCallback, useEffect } from 'react';

// 组件内部状态接口
interface State {
  ccRunning: boolean;       // CC Connect 是否正在运行
  ccLoading: boolean;       // CC Connect 是否正在操作中（加载态）
  claudeRunning: boolean;   // Claude Code 是否正在运行
  claudeLoading: boolean;   // Claude Code 是否正在操作中
  ccWorkDir: string;        // CC Connect 工作目录
  claudeWorkDir: string;    // Claude Code 工作目录
  ccMessage: string;        // CC Connect 状态消息
  claudeMessage: string;    // Claude Code 状态消息
}

function LauncherTab() {
  // 组件状态初始化
  const [state, setState] = useState<State>({
    ccRunning: false,
    ccLoading: false,
    claudeRunning: false,
    claudeLoading: false,
    ccWorkDir: 'C:/Users/JerryYuu/Desktop/wx-test',   // 默认工作目录
    claudeWorkDir: 'C:/Users/JerryYuu/Desktop/wx-test',
    ccMessage: '',
    claudeMessage: '',
  });

  // 是否显示工作目录输入框
  const [showCCDir, setShowCCDir] = useState(false);
  const [showClaudeDir, setShowClaudeDir] = useState(false);
  // 模型切换弹窗控制
  const [modelDialog, setModelDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [modelMessage, setModelMessage] = useState('');

  // 获取 IPC 通信接口
  const electronAPI = (window as any).electronAPI;

  // 定时检查 CC Connect 运行状态（每 3 秒）
  const checkStatus = useCallback(async () => {
    if (!electronAPI) return;
    const ccStatus = await electronAPI['cc-connect:status']();
    setState(s => ({ ...s, ccRunning: ccStatus.running }));
  }, [electronAPI]);

  useEffect(() => {
    checkStatus();
    const timer = setInterval(checkStatus, 3000);
    return () => clearInterval(timer);
  }, [checkStatus]);

  // 启动 CC Connect
  const handleCCStart = useCallback(async () => {
    if (!electronAPI) return;
    setState(s => ({ ...s, ccLoading: true, ccMessage: '正在启动...' }));
    const res = await electronAPI['cc-connect:start'](state.ccWorkDir);
    setState(s => ({ ...s, ccLoading: false, ccRunning: res.success, ccMessage: res.message }));
  }, [electronAPI, state.ccWorkDir]);

  // 停止 CC Connect
  const handleCCStop = useCallback(async () => {
    if (!electronAPI) return;
    setState(s => ({ ...s, ccLoading: true, ccMessage: '正在停止...' }));
    const res = await electronAPI['cc-connect:stop']();
    setState(s => ({ ...s, ccLoading: false, ccRunning: false, ccMessage: res.message }));
  }, [electronAPI]);

  // 启动 Claude Code
  const handleClaudeStart = useCallback(async () => {
    if (!electronAPI) return;
    setState(s => ({ ...s, claudeLoading: true, claudeMessage: '正在启动...' }));
    const res = await electronAPI['claudecode:start'](state.claudeWorkDir);
    setState(s => ({ ...s, claudeLoading: false, claudeRunning: true, claudeMessage: res.message }));
  }, [electronAPI, state.claudeWorkDir]);

  // 停止 Claude Code
  const handleClaudeStop = useCallback(async () => {
    if (!electronAPI) return;
    setState(s => ({ ...s, claudeLoading: true, claudeMessage: '正在停止...' }));
    const res = await electronAPI['claudecode:stop']();
    setState(s => ({ ...s, claudeLoading: false, claudeRunning: false, claudeMessage: res.message }));
  }, [electronAPI]);

  // 切换模型（写入 .env 文件）
  const handleModelSwitch = useCallback(async () => {
    if (!electronAPI || !selectedModel) return;
    const res = await electronAPI['model:switch']({ workDir: state.ccWorkDir, model: selectedModel });
    setModelMessage(res.message);
    // 1.5 秒后自动关闭弹窗
    setTimeout(() => setModelDialog(false), 1500);
  }, [electronAPI, selectedModel, state.ccWorkDir]);

  // 可选模型列表
  const models = ['astron-code-latest', 'claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-4-20251001'];

  // 通用卡片样式
  const serviceCardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 20,
    border: '1px solid rgba(255,255,255,0.08)',
  };

  // 主按钮样式（紫色渐变）
  const btnPrimary: React.CSSProperties = {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    flex: 1,
  };

  // 危险按钮样式（红色，用于停止操作）
  const btnDanger: React.CSSProperties = {
    background: 'rgba(239,68,68,0.15)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 8,
    padding: '10px 20px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    flex: 1,
  };

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      {/* CC Connect 服务卡片 */}
      <div style={{ ...serviceCardStyle, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* 状态指示图标 */}
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: state.ccRunning ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              {state.ccRunning ? '🟢' : '🔵'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>CC Connect</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                {state.ccRunning ? '正在运行' : '未运行'} · {state.ccMessage}
              </div>
            </div>
          </div>
          {/* 启动/停止按钮 */}
          <div style={{ display: 'flex', gap: 8 }}>
            {!state.ccRunning && (
              <button onClick={handleCCStart} disabled={state.ccLoading} style={btnPrimary}>
                {state.ccLoading ? '启动中...' : '启动'}
              </button>
            )}
            {state.ccRunning && (
              <button onClick={handleCCStop} style={btnDanger}>
                {state.ccLoading ? '停止中...' : '停止'}
              </button>
            )}
          </div>
        </div>
        {/* 工作目录配置（点击文字展开输入框） */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>工作目录:</span>
          {showCCDir ? (
            <input
              value={state.ccWorkDir}
              onChange={e => setState(s => ({ ...s, ccWorkDir: e.target.value }))}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6, padding: '6px 10px', color: '#e0e0e0', fontSize: 12,
              }}
            />
          ) : (
            <span
              onClick={() => setShowCCDir(true)}
              style={{ fontSize: 12, color: '#818cf8', cursor: 'pointer' }}
            >
              {state.ccWorkDir || '点击设置'}
            </span>
          )}
        </div>
      </div>

      {/* Claude Code 服务卡片 */}
      <div style={{ ...serviceCardStyle, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: state.claudeRunning ? 'rgba(34,197,94,0.15)' : 'rgba(168,85,247,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              {state.claudeRunning ? '🟢' : '🟣'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Claude Code</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                {state.claudeRunning ? '正在运行' : '未运行'} · {state.claudeMessage}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!state.claudeRunning && (
              <button onClick={handleClaudeStart} disabled={state.claudeLoading} style={btnPrimary}>
                {state.claudeLoading ? '启动中...' : '启动'}
              </button>
            )}
            {state.claudeRunning && (
              <button onClick={handleClaudeStop} style={btnDanger}>
                {state.claudeLoading ? '停止中...' : '停止'}
              </button>
            )}
          </div>
        </div>
        {/* 工作目录配置 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>工作目录:</span>
          {showClaudeDir ? (
            <input
              value={state.claudeWorkDir}
              onChange={e => setState(s => ({ ...s, claudeWorkDir: e.target.value }))}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6, padding: '6px 10px', color: '#e0e0e0', fontSize: 12,
              }}
            />
          ) : (
            <span
              onClick={() => setShowClaudeDir(true)}
              style={{ fontSize: 12, color: '#818cf8', cursor: 'pointer' }}
            >
              {state.claudeWorkDir || '点击设置'}
            </span>
          )}
        </div>
      </div>

      {/* 模型切换卡片 */}
      <div style={{ ...serviceCardStyle }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚡</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>模型切换</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                切换 Claude Code 使用的模型
                {modelMessage && <span style={{ color: '#fbbf24', marginLeft: 8 }}>{modelMessage}</span>}
              </div>
            </div>
          </div>
          <button onClick={() => setModelDialog(true)} style={btnPrimary}>切换模型</button>
        </div>
      </div>

      {/* 模型选择弹窗 */}
      {modelDialog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}
          onClick={() => setModelDialog(false)}  // 点击遮罩关闭弹窗
        >
          <div style={{
            background: '#1e1e3a', borderRadius: 16, padding: 24,
            border: '1px solid rgba(255,255,255,0.1)', width: 360,
          }}
            onClick={e => e.stopPropagation()}  // 阻止弹窗内部点击冒泡到遮罩
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#e0e0e0' }}>选择模型</h3>
            {/* 模型列表 */}
            {models.map(m => (
              <div
                key={m}
                onClick={() => setSelectedModel(m)}
                style={{
                  padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                  background: selectedModel === m ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                  border: selectedModel === m ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                  marginBottom: 8, fontSize: 13, transition: 'all 0.15s',
                }}
              >
                {m}
              </div>
            ))}
            {/* 确认/取消按钮 */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={handleModelSwitch}
                disabled={!selectedModel}
                style={{
                  ...btnPrimary, opacity: selectedModel ? 1 : 0.4,
                }}
              >
                确认切换
              </button>
              <button onClick={() => setModelDialog(false)} style={btnDanger}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LauncherTab;
