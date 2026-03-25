/**
 * PATCH7: Universal AI Request Utility
 * Supports both Google Gemini and OpenAI-compatible APIs
 */

export interface AISettingsPatch7 {
  apiKey: string;
  baseUrl: string;
  endpointPath: string;
  authType: 'Bearer' | 'x-goog-api-key';
  model: string;
}

export const callAIPatch7 = async (
  config: AISettingsPatch7,
  payload: {
    systemInstruction?: string;
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
    responseMimeType?: string;
  }
): Promise<string> => {
  const base = config.baseUrl.replace(/\/+$/, '');
  const path = config.endpointPath.replace(/^\/+/, '').replace('{model}', config.model);
  let url = `${base}/${path}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (config.authType === 'Bearer') {
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
  } else {
    headers['x-goog-api-key'] = config.apiKey.trim();
    // Fallback for some proxies that expect key in URL
    if (!url.includes('key=')) {
      url += (url.includes('?') ? '&' : '?') + `key=${config.apiKey.trim()}`;
    }
  }

  const isOpenAI = config.endpointPath.includes('chat/completions');

  let body: any;
  if (isOpenAI) {
    // OpenAI Format
    const messages = [...payload.messages];
    if (payload.systemInstruction) {
      // Prepend system instruction as a system message
      messages.unshift({ role: 'system', content: payload.systemInstruction });
    }

    body = {
      model: config.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      temperature: 0.7
    };
  } else {
    // Google Gemini Format
    body = {
      contents: payload.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      generationConfig: {
        responseMimeType: payload.responseMimeType,
      }
    };
    if (payload.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: payload.systemInstruction }]
      };
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `AI 请求失败: ${response.status}`);
  }

  const data = await response.json();

  if (isOpenAI) {
    return data.choices?.[0]?.message?.content || '';
  } else {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
};

/**
 * Helper to extract JSON from AI response text that might contain markdown or extra text
 */
export const extractJsonPatch10 = (text: string): any => {
  try {
    // 1. Try direct parse
    return JSON.parse(text.trim());
  } catch (e) {
    // 2. Try to find JSON block within markdown
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e2) {}
    }

    // 3. Try to find the first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const potentialJson = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(potentialJson);
      } catch (e3) {}
    }

    throw new Error('无法从 AI 响应中解析有效的 JSON 数据');
  }
};
