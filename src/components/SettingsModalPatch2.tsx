/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PATCH2: AI Proxy Settings Functionality
 * This component provides a settings modal to configure AI proxy details,
 * stores them in localStorage, and allows testing the connection.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, EyeOff, Play, AlertCircle, CheckCircle2, Terminal, Download, Upload, RefreshCw } from 'lucide-react';
import { dataServicePatch6 } from '../services/dataServicePatch6';

const getWeekNumber = (d: Date): number => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

interface AISettingsPatch2 {
  apiKey: string;
  baseUrl: string;
  endpointPath: string;
  authType: 'Bearer' | 'x-goog-api-key';
  model: string;
}

interface SettingsModalPatch2Props {
  isOpen: boolean;
  onClose: () => void;
  weekOffset: number;
  onWeekOffsetChange: (offset: number) => void;
}

const STORAGE_KEY = 'smartflow_patch2_ai_config_v2';

export const SettingsModalPatch2: React.FC<SettingsModalPatch2Props> = ({ isOpen, onClose, weekOffset, onWeekOffsetChange }) => {
  // 获取环境预设的 API Key
  const SYSTEM_DEFAULT_KEY = process.env.GEMINI_API_KEY || '';

  const [config, setConfig] = useState<AISettingsPatch2>(() => {
    const SYSTEM_DEFAULT_KEY = process.env.GEMINI_API_KEY || '';
    const defaultConfig: AISettingsPatch2 = {
      apiKey: 'sk-3qWP0EbLZzCqsiqGaLCm3JqB9aYt1STkHXrETggP7EV1ag73',
      baseUrl: 'https://www.chataiapi.com',
      endpointPath: '/v1/chat/completions',
      authType: 'Bearer',
      model: 'gemini-2.5-flash',
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.model === 'gemini-2.5-flash-lite') {
          parsed.model = 'gemini-2.5-flash';
        }
        return { ...defaultConfig, ...parsed };
      }
    } catch (e) {
      console.error('Failed to parse AI config', e);
    }
    return defaultConfig;
  });

  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testStep, setTestStep] = useState<string>('');
  const [debugLog, setDebugLog] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Load from localStorage on mount (Keep for external updates, but initialization is handled in useState)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {}
  }, []);

  // Save to localStorage whenever config changes
  const updateConfig = (newConfig: Partial<AISettingsPatch2>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save AI config', e);
    }
  };

  const constructUrl = () => {
    const base = config.baseUrl.replace(/\/+$/, '');
    const path = config.endpointPath.replace(/^\/+/, '').replace('{model}', config.model);
    let url = `${base}/${path}`;
    
    // If using Google style and key is provided, we can append it to URL as fallback
    if (config.authType === 'x-goog-api-key' && config.apiKey) {
      url += (url.includes('?') ? '&' : '?') + `key=${config.apiKey}`;
    }
    return url;
  };

  const handleTestConnection = async () => {
    setTestStatus('loading');
    setTestStep('正在构造请求...');
    setDebugLog(null);
    
    const fullUrl = constructUrl();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (config.authType === 'Bearer') {
      headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
    } else {
      headers['x-goog-api-key'] = config.apiKey.trim();
    }
    
    // OpenAI format payload - Patch 9 alignment
    const isOpenAI = config.endpointPath.includes('chat/completions');
    const body = isOpenAI ? {
      model: config.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'hello' }
      ],
      temperature: 0.7
    } : {
      contents: [{ parts: [{ text: '你好' }] }],
    };

    const initialLog = {
      url: fullUrl.replace(config.apiKey, '***'),
      method: 'POST',
      headers: { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : undefined, 'x-goog-api-key': headers['x-goog-api-key'] ? '***' : undefined },
      body: body
    };
    setDebugLog(JSON.stringify(initialLog, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      setTestStep('正在发起网络请求...');
      const response = await fetch(fullUrl, {
        method: 'POST',
        signal: controller.signal,
        headers,
        body: JSON.stringify(body),
      });

      clearTimeout(timeoutId);
      setTestStep('正在解析服务器响应...');
      const data = await response.json();

      if (response.ok) {
        setTestStatus('success');
        setTestStep('连接成功');
        setDebugLog(JSON.stringify({ status: response.status, data }, null, 2));
      } else {
        throw { status: response.status, data };
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      setTestStatus('error');
      
      let errorMessage = 'Unknown error';
      let status = err.status || 'Error';

      if (err.name === 'AbortError') {
        status = 'Timeout';
        errorMessage = '请求超时 (10秒)。';
      } else {
        errorMessage = err.data || err.message || '网络请求失败。';
      }

      const log = {
        url: fullUrl.replace(config.apiKey, '***'),
        status: status,
        response: errorMessage,
      };
      setDebugLog(JSON.stringify(log, null, 2));
      setTestStep('测试失败');
    }
  };

  const handleExport = () => {
    dataServicePatch6.downloadBackup();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    try {
      await dataServicePatch6.importData(file);
      setImportStatus('success');
      // Reload page to apply all changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI 中转设置</h2>
                <p className="text-sm text-slate-400 font-medium">配置您的 AI 代理服务 (Patch 2)</p>
              </div>
              <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="px-8 py-4 overflow-y-auto space-y-6 flex-1 scrollbar-hide">
              {/* API Key */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => updateConfig({ apiKey: e.target.value })}
                    placeholder="输入您的 API 密钥"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-4 text-slate-800 font-bold transition-all outline-none pr-12"
                  />
                  <button 
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Base URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">中转 URL (Base URL)</label>
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={(e) => updateConfig({ baseUrl: e.target.value })}
                  placeholder="https://api.proxy.com"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-4 text-slate-800 font-bold transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Endpoint Path */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">请求路径 (Path)</label>
                  <input
                    type="text"
                    value={config.endpointPath}
                    onChange={(e) => updateConfig({ endpointPath: e.target.value })}
                    placeholder="/v1/chat/completions"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-4 text-slate-800 font-bold transition-all outline-none"
                  />
                </div>
                {/* Auth Type */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">鉴权方式</label>
                  <select
                    value={config.authType}
                    onChange={(e) => updateConfig({ authType: e.target.value as any })}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-4 text-slate-800 font-bold transition-all outline-none appearance-none"
                  >
                    <option value="Bearer">Bearer Token (OpenAI)</option>
                    <option value="x-goog-api-key">API Key (Google)</option>
                  </select>
                </div>
              </div>

               <div className="grid grid-cols-1 gap-4">
                 {/* Model */}
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">模型名称 (Model)</label>
                   <input
                     type="text"
                     value={config.model}
                     onChange={(e) => updateConfig({ model: e.target.value })}
                     placeholder="gemini-2.5-flash"
                     className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-4 text-slate-800 font-bold transition-all outline-none"
                   />
                 </div>

                 {/* Week Number Offset */}
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">周次偏移设置</label>
                   <div className="flex items-center gap-2">
                     <button
                       onClick={() => onWeekOffsetChange(weekOffset - 1)}
                       className="w-12 h-12 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 rounded-xl font-bold text-xl transition-colors"
                     >
                       −
                     </button>
                     <div className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 text-center">
                       <span className="font-black text-lg">当前周次: W{getWeekNumber(new Date()) + weekOffset}</span>
                       <p className="text-[10px] font-bold text-slate-400 mt-1">设置当前日期对应的周次，所有日期会自动修正</p>
                     </div>
                     <button
                       onClick={() => onWeekOffsetChange(weekOffset + 1)}
                       className="w-12 h-12 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 rounded-xl font-bold text-xl transition-colors"
                     >
                       +
                     </button>
                   </div>
                   <button
                     onClick={() => onWeekOffsetChange(0)}
                     className="w-full text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                   >
                     重置为系统默认周次
                   </button>
                 </div>
               </div>

              {/* Data Management Section (Patch 6) */}
              <div className="pt-4 space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">数据备份与恢复 (Patch 6)</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleExport}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-[2rem] border-2 border-transparent hover:border-indigo-100 transition-all group"
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-indigo-100 group-hover:scale-110 transition-all">
                      <Download className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider">导出数据</span>
                  </button>

                  <label className="flex flex-col items-center justify-center gap-2 p-6 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 rounded-[2rem] border-2 border-transparent hover:border-emerald-100 transition-all group cursor-pointer">
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-emerald-100 group-hover:scale-110 transition-all">
                      {importStatus === 'loading' ? (
                        <RefreshCw className="w-6 h-6 animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider">
                      {importStatus === 'success' ? '导入成功' : '导入数据'}
                    </span>
                  </label>
                </div>
                
                {importStatus === 'success' && (
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-[10px] font-bold text-emerald-600 text-center uppercase tracking-widest"
                  >
                    数据已恢复，正在重启应用...
                  </motion.p>
                )}
                {importStatus === 'error' && (
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-[10px] font-bold text-rose-600 text-center uppercase tracking-widest"
                  >
                    导入失败，文件格式不正确
                  </motion.p>
                )}
              </div>

              {/* Test Section */}
              <div className="pt-4">
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus === 'loading'}
                  className={`
                    w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black transition-all
                    ${testStatus === 'loading' ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700'}
                  `}
                >
                  {testStatus === 'loading' ? (
                    <div className="flex flex-col items-center">
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin mb-1" />
                      <span className="text-[10px] font-bold opacity-70">{testStep}</span>
                    </div>
                  ) : (
                    <Play className="w-5 h-5 fill-current" />
                  )}
                  {testStatus === 'loading' ? '' : '测试连接'}
                </button>

                {/* Status Feedback */}
                <AnimatePresence>
                  {(testStatus === 'success' || testStatus === 'loading' || testStatus === 'error') && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 space-y-3"
                    >
                      {testStatus === 'success' && (
                        <div className="p-4 bg-emerald-50 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-6 h-6" />
                          连接成功！AI 已准备就绪。
                        </div>
                      )}

                      {testStatus === 'error' && (
                        <div className="p-4 bg-rose-50 rounded-2xl flex items-center gap-3 text-rose-700 font-bold">
                          <AlertCircle className="w-6 h-6" />
                          连接失败，请检查配置。
                        </div>
                      )}
                      
                      {/* Debug Log - 始终在测试中或失败时显示 */}
                      {(debugLog && (testStatus === 'error' || testStatus === 'loading')) && (
                        <div className="bg-slate-900 rounded-2xl p-5 overflow-hidden">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Terminal className="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Debug Log (Patch 2)</span>
                            </div>
                            {testStatus === 'loading' && (
                              <span className="text-[8px] font-bold text-amber-400 animate-pulse uppercase tracking-widest">
                                正在监听响应...
                              </span>
                            )}
                          </div>
                          <pre className="text-[10px] font-mono text-emerald-400 overflow-x-auto scrollbar-hide leading-relaxed">
                            {debugLog}
                          </pre>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-slate-50 flex flex-col items-center justify-center gap-4">
              <button 
                onClick={() => {
                  const defaultConfig: AISettingsPatch2 = {
                    apiKey: 'sk-3qWP0EbLZzCqsiqGaLCm3JqB9aYt1STkHXrETggP7EV1ag73',
                    baseUrl: 'https://www.chataiapi.com',
                    endpointPath: '/v1/chat/completions',
                    authType: 'Bearer',
                    model: 'gemini-2.5-flash',
                  };
                  setConfig(defaultConfig);
                  try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultConfig));
                  } catch (e) {
                    console.error('Failed to reset config', e);
                  }
                  setTestStatus('idle');
                  setDebugLog(null);
                }}
                className="text-xs font-bold text-indigo-600 hover:underline uppercase tracking-widest"
              >
                重置为系统默认配置
              </button>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                SmartFlow AI Config Engine v1.1
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
