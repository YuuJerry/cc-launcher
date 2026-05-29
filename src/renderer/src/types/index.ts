/**
 * 全局类型定义与 AI 服务商配置
 */

// 标签页类型：启动器 | 提示词优化 | 设置
export type TabKey = 'launcher' | 'prompt' | 'settings';

// 提示词优化类型：通用提示词 | 生图提示词
export type PromptType = 'general' | 'image';

// AI 服务商类型
export type ProviderKey = 'deepseek' | 'kimi' | 'openai' | 'custom';

// 服务商配置接口
export interface ProviderConfig {
  name: string;           // 服务商显示名称
  baseUrl: string;        // API 请求地址
  defaultModel: string;   // 默认使用的模型
  models: string[];       // 可选模型列表
}

// 预置的 AI 服务商配置
export const PROVIDERS: Record<ProviderKey, ProviderConfig> = {
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-coder'],
  },
  kimi: {
    name: 'Kimi',
    baseUrl: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'moonshot-v1-8k',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  },
  // 自定义服务商：用户手动填写 API 地址和模型名
  custom: {
    name: '自定义',
    baseUrl: '',
    defaultModel: '',
    models: [],
  },
};
