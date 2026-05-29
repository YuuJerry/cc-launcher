/**
 * 提示词优化标签页组件
 * 功能：
 * 1. 通用提示词优化（适用于 Claude Code 等 agent 的指令提示词）
 * 2. 生图提示词优化（适用于 GPT-image 等 AI 绘图模型）
 * 支持 DeepSeek、Kimi、OpenAI、自定义等多种 AI 服务商
 */
import { useState, useCallback } from 'react';
import { PromptType, ProviderConfig, PROVIDERS } from '../types';

// 通用提示词优化的系统提示词
const GENERAL_SYSTEM_PROMPT = `你是一个提示词优化专家。用户会给你一段原始提示词，你的任务是：

1. 分析原始提示词的结构和意图
2. 指出可以改进的地方
3. 提供优化后的版本
4. 解释为什么这样修改

如果是专业任务（编程、写作、翻译等），请针对具体场景优化。
始终保持输出简洁实用。`;

// 生图提示词优化的系统提示词（含追问机制）
const IMAGE_SYSTEM_PROMPT = `你是一个专业的 AI 生图提示词专家。用户会描述他们想要的画面，你的任务是：

1. 主动询问细节：场景、风格、光线、色调、构图、氛围
2. 将用户需求转化为高质量的中英文提示词
3. 包含：主体描述、环境背景、艺术风格、光线效果、镜头角度、质量修饰词
4. 同时输出中文和英文版本，方便不同模型使用

示例输出格式：
🎨 中文提示词：...
🖼️  English Prompt: ...`;

function PromptTab() {
  // 提示词类型：通用 / 生图
  const [promptType, setPromptType] = useState<PromptType>('general');
  // 当前选择的 AI 服务商
  const [provider, setProvider] = useState<keyof typeof PROVIDERS>('deepseek');
  // API 密钥
  const [apiKey, setApiKey] = useState('');
  // 自定义服务商的 API 地址和模型名
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [customModel, setCustomModel] = useState('');
  // 用户输入的原始提示词
  const [inputPrompt, setInputPrompt] = useState('');
  // AI 优化后的输出结果
  const [output, setOutput] = useState('');
  // 请求加载状态
  const [loading, setLoading] = useState(false);
  // 错误信息
  const [error, setError] = useState('');
  // API 配置弹窗显示控制
  const [showApiConfig, setShowApiConfig] = useState(false);

  const electronAPI = (window as any).electronAPI;

  // 获取当前服务商配置（自定义时使用用户填写的值）
  const currentProvider: ProviderConfig = provider === 'custom'
    ? { name: '自定义', baseUrl: customBaseUrl || 'https://api.example.com/v1/chat/completions', defaultModel: customModel || 'gpt-4', models: [] }
    : PROVIDERS[provider];

  /**
   * 执行提示词优化
   * 将用户输入 + 系统提示词发送给选中的 AI 服务商
   */
  const handleOptimize = useCallback(async () => {
    if (!inputPrompt.trim()) return;
    // 未配置 API Key 时自动弹出配置窗口
    if (!apiKey.trim()) {
      setShowApiConfig(true);
      return;
    }

    setLoading(true);
    setError('');
    setOutput('');

    try {
      // 根据提示词类型选择对应的系统提示词
      const systemPrompt = promptType === 'general' ? GENERAL_SYSTEM_PROMPT : IMAGE_SYSTEM_PROMPT;
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: inputPrompt },
      ];

      // 通过 IPC 调用主进程发送 API 请求
      const res = await electronAPI['prompt:optimize']({
        provider,
        apiKey: apiKey.trim(),
        baseUrl: currentProvider.baseUrl,
        model: currentProvider.defaultModel || customModel,
        messages,
      });

      if (res.success && res.content) {
        setOutput(res.content);
      } else {
        setError(res.message || '优化失败');
      }
    } catch (err: any) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  }, [inputPrompt, provider, apiKey, currentProvider, customModel, promptType, electronAPI]);

  // 复制优化结果到剪贴板
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output);
    setOutput(output);
  }, [output]);

  // 通用卡片样式
  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 20,
    border: '1px solid rgba(255,255,255,0.08)',
  };

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      {/* 提示词类型切换按钮 */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setPromptType('general')}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
            background: promptType === 'general' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
            color: promptType === 'general' ? '#818cf8' : '#94a3b8',
            fontWeight: promptType === 'general' ? 600 : 400,
          }}
        >
          ✦ 通用提示词优化
        </button>
        <button
          onClick={() => setPromptType('image')}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
            background: promptType === 'image' ? 'rgba(236,72,153,0.2)' : 'rgba(255,255,255,0.04)',
            color: promptType === 'image' ? '#ec4899' : '#94a3b8',
            fontWeight: promptType === 'image' ? 600 : 400,
          }}
        >
          🎨 生图提示词优化
        </button>
      </div>

      {/* 输入区域 */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <textarea
          value={inputPrompt}
          onChange={e => setInputPrompt(e.target.value)}
          placeholder={promptType === 'general' ? '请输入你想要优化的提示词...' : '描述你想要的画面...'}
          rows={5}
          style={{
            width: '100%', background: 'transparent', border: 'none', color: '#e0e0e0',
            fontSize: 14, resize: 'vertical', outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* 操作按钮区域 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={handleOptimize}
          disabled={!inputPrompt.trim() || loading}
          style={{
            flex: 1, padding: '12px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 14,
            background: (!inputPrompt.trim() || loading) ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
          }}
        >
          {loading ? '优化中...' : '✨ 优化提示词'}
        </button>
        {/* API 设置按钮 */}
        {!showApiConfig && (
          <button onClick={() => setShowApiConfig(true)} style={{
            padding: '12px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
            cursor: 'pointer', background: 'transparent', color: '#94a3b8', fontSize: 14,
          }}>
            ⚙ 设置API
          </button>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{
          ...cardStyle, marginBottom: 16,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
        }}>
          <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>
        </div>
      )}

      {/* 优化结果输出区域 */}
      {output && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#818cf8' }}>优化结果</span>
            <button onClick={handleCopy} style={{
              background: 'rgba(99,102,241,0.15)', border: 'none', color: '#818cf8',
              borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12,
            }}>
              复制
            </button>
          </div>
          <div style={{
            whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.7, color: '#e0e0e0',
            maxHeight: 400, overflowY: 'auto',
          }}>
            {output}
          </div>
        </div>
      )}

      {/* API 配置弹窗 */}
      {showApiConfig && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowApiConfig(false)}>
          <div style={{
            background: '#1e1e3a', borderRadius: 16, padding: 24,
            border: '1px solid rgba(255,255,255,0.1)', width: 420,
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>API 设置</h3>
            {/* 服务商选择下拉框 */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>服务商</label>
              <select
                value={provider}
                onChange={e => setProvider(e.target.value as any)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '8px 10px', color: '#e0e0e0', fontSize: 13 }}
              >
                <option value="deepseek" style={{ background: '#1e1e3a' }}>DeepSeek</option>
                <option value="kimi" style={{ background: '#1e1e3a' }}>Kimi</option>
                <option value="openai" style={{ background: '#1e1e3a' }}>OpenAI</option>
                <option value="custom" style={{ background: '#1e1e3a' }}>自定义</option>
              </select>
            </div>
            {/* 自定义服务商：显示 API 地址和模型输入框 */}
            {provider === 'custom' && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>API 地址</label>
                  <input
                    value={customBaseUrl}
                    onChange={e => setCustomBaseUrl(e.target.value)}
                    placeholder="https://api.example.com/v1/chat/completions"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '8px 10px', color: '#e0e0e0', fontSize: 13 }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>模型</label>
                  <input
                    value={customModel}
                    onChange={e => setCustomModel(e.target.value)}
                    placeholder="model-name"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '8px 10px', color: '#e0e0e0', fontSize: 13 }}
                  />
                </div>
              </>
            )}
            {/* API Key 输入框 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>API Key</label>
              <input
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                type="password"
                placeholder="sk-..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '8px 10px', color: '#e0e0e0', fontSize: 13 }}
              />
            </div>
            {/* 保存/取消按钮 */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowApiConfig(false)} style={{
                ...btnSaveStyle,
              }}>
                保存
              </button>
              <button onClick={() => setShowApiConfig(false)} style={btnCancelStyle}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 保存按钮样式
const btnSaveStyle: React.CSSProperties = {
  flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
  fontWeight: 600, fontSize: 14,
};

// 取消按钮样式
const btnCancelStyle: React.CSSProperties = {
  flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
  cursor: 'pointer', background: 'transparent', color: '#94a3b8', fontSize: 14, fontWeight: 500,
};

export default PromptTab;
