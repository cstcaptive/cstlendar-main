/**
 * PATCH5: AI Chat Service
 */

import { ScheduleEventPatch3 } from '../types/patch3';
import { ChatMessagePatch5 } from '../types/patch5';
import { callAIPatch7, AISettingsPatch7 } from './aiUtilsPatch7';

const STORAGE_KEY = 'smartflow_patch2_ai_config_v2';

const getAIConfig = (): AISettingsPatch7 => {
  const savedConfig = localStorage.getItem(STORAGE_KEY);
  const SYSTEM_DEFAULT_KEY = process.env.GEMINI_API_KEY || '';
  
  const defaultConfig: AISettingsPatch7 = {
    apiKey: 'sk-3qWP0EbLZzCqsiqGaLCm3JqB9aYt1STkHXrETggP7EV1ag73',
    baseUrl: 'https://www.chataiapi.com',
    endpointPath: '/v1/chat/completions',
    authType: 'Bearer',
    model: 'gemini-2.5-flash',
  };

  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      if (config.model === 'gemini-2.5-flash-lite') {
        config.model = 'gemini-2.5-flash';
      }
      return { ...defaultConfig, ...config };
    } catch (e) {
      console.error('Failed to parse saved AI config', e);
    }
  }
  return defaultConfig;
};

export const chatWithSchedulePatch5 = async (
  messages: ChatMessagePatch5[],
  events: ScheduleEventPatch3[]
): Promise<string> => {
  const config = getAIConfig();
  if (!config.apiKey) {
    throw new Error('请先在设置中配置 AI API');
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const systemInstruction = `
    你是一个专业的日程助理。你的任务是根据用户提供的日程数据库回答问题。
    
    规则：
    1. 简洁回答：回答应直击要点，风格简洁，字数尽量控制在100字以内。
    2. 禁止编造：只能基于提供的日程数据回答。如果数据库中没有相关信息，请明确告知“未找到相关日程”，严禁编造虚假的日程、时间或 ID。
    3. 关联图链接：只要在回答中提到某个具体的日程，必须使用 Markdown 链接格式引用它，格式为：[日程标题](日程ID)。
       例如：“你明天下午3点有一个 [部门会议](event_123)。”
    4. 当前上下文：今天是 ${todayStr}，当前时间是 ${now.toLocaleTimeString()}。
    
    日程数据库 (JSON)：
    ${JSON.stringify(events.map(e => ({ id: e.id, title: e.title, date: e.date, startTime: e.startTime, isAllDay: e.isAllDay })))}
  `;

  try {
    const text = await callAIPatch7(config, {
      systemInstruction,
      messages: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      })),
    });

    if (!text) {
      throw new Error('AI 未返回任何内容');
    }

    return text.trim();
  } catch (err: any) {
    console.error('AI Chat Error:', err);
    throw new Error(err.message || 'AI 响应失败，请检查网络或 API 配置');
  }
};
