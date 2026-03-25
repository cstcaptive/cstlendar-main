/**
 * PATCH3: AI Service for Schedule Recognition
 */

import { AIRecognitionResultPatch3, ScheduleEventPatch3 } from '../types/patch3';
import { callAIPatch7, AISettingsPatch7, extractJsonPatch10 } from './aiUtilsPatch7';

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

export const recognizeSchedulePatch3 = async (text: string): Promise<AIRecognitionResultPatch3> => {
  const config = getAIConfig();
  if (!config.apiKey) {
    throw new Error('请先在设置中配置 AI API');
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const todayStr = now.toISOString().split('T')[0];

  const systemInstruction = `
    你是一个专业的日程管理助手。你的任务是从用户输入的文本中提取日程信息。
    
    规则：
    1. 提取日期和时间。如果没有年份，默认为 ${currentYear}。如果没有日期，默认为今天 (${todayStr})。如果没有具体时间，标记为全天 (isAllDay: true)。
    2. 提取标题。从原句中截取最能代表事件的连续片段。不要编造标题。
    3. 剥离信息。标题中不应包含已提取的时间、日期等信息。
    4. 提取联系人。识别姓名、电话、邮箱。仅提取关键人物。
    5. 提取提醒。识别如“提前一小时”、“一天前”等意图。如果提到“出发前”但没说时间，默认为提前30分钟。
    6. 提取循环次数 (recurringCount)。如果用户提到“连续4周”、“每周五共3次”等，提取次数（最大30，默认1）。
    7. 返回严格的 JSON 格式。
    
    JSON 结构示例：
    {
      "title": "吃饭",
      "date": "2026-02-28",
      "startTime": "15:00",
      "isAllDay": false,
      "contacts": [{"name": "张三", "phone": "13800000000", "email": "test@test.com"}],
      "reminder": {"days": 0, "hours": 1, "minutes": 0},
      "recurringCount": 1
    }
  `;

  const prompt = `用户输入： "${text}" \n 当前时间： ${now.toLocaleString()}`;

  try {
    const content = await callAIPatch7(config, {
      systemInstruction,
      messages: [{ role: 'user', content: prompt }],
      responseMimeType: "application/json",
    });

    if (!content) {
      throw new Error('AI 未返回任何内容');
    }

    return extractJsonPatch10(content);
  } catch (err: any) {
    console.error('AI Recognition Error:', err);
    throw new Error(err.message || 'AI 识别失败，请检查网络或 API 配置');
  }
};

export const semanticSearchEventsPatch3 = async (query: string, events: ScheduleEventPatch3[]): Promise<string[]> => {
  if (!query.trim() || events.length === 0) return [];

  const config = getAIConfig();
  if (!config.apiKey) return [];

  const systemInstruction = `
    你是一个日程搜索助手。用户会提供一个搜索词和一系列日程列表。
    你的任务是根据语义相关性，从列表中找出最符合搜索词的日程。
    
    规则：
    1. 返回最相关的日程 ID 数组。
    2. 按相关度排序。
    3. 如果没有相关的，返回空数组。
    4. 仅返回 JSON 格式的字符串数组。
  `;

  const eventList = events.map(e => ({ id: e.id, title: e.title, date: e.date }));
  const prompt = `搜索词： "${query}" \n 日程列表： ${JSON.stringify(eventList)}`;

  try {
    const content = await callAIPatch7(config, {
      systemInstruction,
      messages: [{ role: 'user', content: prompt }],
      responseMimeType: "application/json",
    });

    if (!content) return [];
    
    const result = extractJsonPatch10(content);
    return Array.isArray(result) ? result : [];
  } catch (err) {
    console.error('Semantic Search Error:', err);
    return [];
  }
};
