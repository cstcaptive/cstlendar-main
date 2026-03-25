/**
 * PATCH3: Add Event Modal Component
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Clipboard, 
  User, 
  Bell, 
  Link2, 
  Clock, 
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Search,
  CheckCircle2
} from 'lucide-react';
import { ScheduleEventPatch3, ContactPatch3, ReminderPatch3 } from '../types/patch3';
import { recognizeSchedulePatch3, semanticSearchEventsPatch3 } from '../services/aiServicePatch3';
import { formatDateToLocalISO } from '../App';

interface AddEventModalPatch3Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: ScheduleEventPatch3, scope?: 'this' | 'following' | 'all', recurringCount?: number) => void;
  onDelete?: (eventId: string, scope?: 'this' | 'following' | 'all') => void;
  editingEvent?: ScheduleEventPatch3 | null;
}

export const AddEventModalPatch3: React.FC<AddEventModalPatch3Props> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  editingEvent 
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(formatDateToLocalISO(new Date()));
  const [startTime, setStartTime] = useState('09:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [contacts, setContacts] = useState<ContactPatch3[]>([]);
  const [reminder, setReminder] = useState<ReminderPatch3>({ days: 0, hours: 0, minutes: 30 });
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [recurringCount, setRecurringCount] = useState(1);
  const [recurringPrompt, setRecurringPrompt] = useState<{
    isOpen: boolean;
    action: 'save' | 'delete';
    event?: ScheduleEventPatch3;
  }>({ isOpen: false, action: 'save' });

  // Populate form when editing
  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDate(editingEvent.date);
      setStartTime(editingEvent.startTime || '09:00');
      setIsAllDay(editingEvent.isAllDay);
      setContacts(editingEvent.contacts);
      setReminder(editingEvent.reminder);
      setParentId(editingEvent.parentId);
      setInputText('');
      setRecurringCount(1);
    } else {
      resetForm();
    }
  }, [editingEvent, isOpen]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleRecognize = async (textToProcess: string) => {
    if (!textToProcess.trim()) return;
    setIsRecognizing(true);
    try {
      const result = await recognizeSchedulePatch3(textToProcess);
      if (result.title) setTitle(result.title);
      if (result.date) setDate(result.date);
      if (result.startTime) setStartTime(result.startTime);
      if (result.isAllDay !== undefined) setIsAllDay(result.isAllDay);
      if (result.contacts) setContacts(result.contacts);
      if (result.reminder) setReminder(result.reminder);
      if (result.recurringCount) setRecurringCount(Math.min(30, Math.max(1, result.recurringCount)));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRecognizing(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      handleRecognize(text);
    } catch (err) {
      alert('无法读取剪贴板，请手动粘贴');
    }
  };

  const handleAddContact = () => {
    setContacts([...contacts, { name: '', phone: '', email: '' }]);
  };

  const updateContact = (index: number, field: keyof ContactPatch3, value: string) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setContacts(newContacts);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const triggerSave = () => {
    if (!title) return alert('请输入标题');
    const newEvent: ScheduleEventPatch3 = {
      id: editingEvent ? editingEvent.id : (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
      title,
      date,
      startTime: isAllDay ? undefined : startTime,
      isAllDay,
      contacts,
      reminder,
      parentId,
      createdAt: editingEvent ? editingEvent.createdAt : Date.now(),
      recurringGroupId: editingEvent?.recurringGroupId,
      recurringSequence: editingEvent?.recurringSequence,
    };

    if (editingEvent?.recurringGroupId) {
      setRecurringPrompt({ isOpen: true, action: 'save', event: newEvent });
    } else {
      onSave(newEvent, undefined, recurringCount);
      resetForm();
      onClose();
    }
  };

  const triggerDelete = () => {
    if (editingEvent?.recurringGroupId) {
      setRecurringPrompt({ isOpen: true, action: 'delete', event: editingEvent });
    } else if (editingEvent && onDelete) {
      onDelete(editingEvent.id);
    }
  };

  const handleRecurringAction = (scope: 'this' | 'following' | 'all') => {
    if (recurringPrompt.action === 'save' && recurringPrompt.event) {
      onSave(recurringPrompt.event, scope, recurringCount);
      resetForm();
      onClose();
    } else if (recurringPrompt.action === 'delete' && editingEvent && onDelete) {
      onDelete(editingEvent.id, scope);
    }
    setRecurringPrompt({ isOpen: false, action: 'save' });
  };

  const handleSave = () => {
    if (!title) return alert('请输入标题');
    const newEvent: ScheduleEventPatch3 = {
      id: editingEvent ? editingEvent.id : (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
      title,
      date,
      startTime: isAllDay ? undefined : startTime,
      isAllDay,
      contacts,
      reminder,
      parentId,
      createdAt: editingEvent ? editingEvent.createdAt : Date.now(),
    };
    onSave(newEvent);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setInputText('');
    setTitle('');
    setDate(formatDateToLocalISO(new Date()));
    setStartTime('09:00');
    setIsAllDay(false);
    setContacts([]);
    setReminder({ days: 0, hours: 0, minutes: 30 });
    setParentId(undefined);
    setRecurringCount(1);
    setRecurringPrompt({ isOpen: false, action: 'save' });
  };

  // Fuzzy search simulation for relations
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        const allEvents: ScheduleEventPatch3[] = JSON.parse(localStorage.getItem('smartflow_events') || '[]');
        
        // 1. Local Filter (Fast)
        const localFiltered = allEvents.filter((e) => 
          e.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (localFiltered.length > 0) {
          setSearchResults(localFiltered);
          setIsSearching(false);
        } else {
          // 2. Semantic Search (AI) - only if local fails or query is complex
          setIsSearching(true);
          try {
            const relevantIds = await semanticSearchEventsPatch3(searchQuery, allEvents);
            const aiFiltered = allEvents.filter(e => relevantIds.includes(e.id));
            setSearchResults(aiFiltered);
          } catch (err) {
            console.error(err);
          } finally {
            setIsSearching(false);
          }
        }
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 600); // Debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="relative w-full max-w-2xl bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-slate-50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingEvent ? '编辑日程' : '添加日程'}
                </h2>
                <p className="text-sm text-slate-400 font-medium">Patch 3: AI 智能识别</p>
              </div>
              <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Body */}
            <div className="px-8 py-6 overflow-y-auto space-y-8 flex-1 scrollbar-hide">
              {/* Input Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">智能输入 / 粘贴</label>
                  <button 
                    onClick={handlePaste}
                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-all"
                  >
                    <Clipboard className="w-3 h-3" /> 一键粘贴识别
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="例如：明天下午3点在老地方和张三吃火锅，提前一小时提醒我"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-4 text-slate-800 font-medium transition-all outline-none min-h-[100px] resize-none"
                  />
                  <button 
                    id="ai-recognize-button"
                    type="button"
                    onClick={() => {
                      console.log('AI Recognize triggered with:', inputText);
                      handleRecognize(inputText);
                    }}
                    disabled={isRecognizing || !inputText.trim()}
                    className={`
                      absolute bottom-4 right-4 p-3 rounded-xl transition-all
                      ${isRecognizing ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700'}
                    `}
                  >
                    {isRecognizing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Main Form */}
              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">日程标题</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-4 text-slate-800 font-bold transition-all outline-none"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">日期</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl pl-12 pr-5 py-4 text-slate-800 font-bold transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">开始时间</label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isAllDay} 
                          onChange={(e) => setIsAllDay(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-500">全天</span>
                      </label>
                    </div>
                    <div className={`relative ${isAllDay ? 'opacity-30 pointer-events-none' : ''}`}>
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl pl-10 pr-4 py-4 text-slate-800 font-bold transition-all outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Recurring Count (Only show when creating) */}
                {!editingEvent && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">循环次数 (每周)</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={recurringCount}
                      onChange={(e) => setRecurringCount(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-4 text-slate-800 font-bold transition-all outline-none"
                    />
                  </div>
                )}

                {/* Contacts */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">关键联系人</label>
                    <button onClick={handleAddContact} className="text-indigo-600 p-1 hover:bg-indigo-50 rounded-lg transition-all">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {contacts.map((contact, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={idx} 
                        className="bg-slate-50 rounded-2xl p-4 space-y-3 relative group"
                      >
                        <button 
                          onClick={() => removeContact(idx)}
                          className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            placeholder="姓名"
                            value={contact.name}
                            onChange={(e) => updateContact(idx, 'name', e.target.value)}
                            className="bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none font-bold text-sm flex-1 py-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3 pl-11">
                          <input
                            type="text"
                            placeholder="电话"
                            value={contact.phone}
                            onChange={(e) => updateContact(idx, 'phone', e.target.value)}
                            className="bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none text-xs font-medium py-1"
                          />
                          <input
                            type="text"
                            placeholder="邮箱"
                            value={contact.email}
                            onChange={(e) => updateContact(idx, 'email', e.target.value)}
                            className="bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none text-xs font-medium py-1"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Reminder */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">提醒设置</label>
                  <div className="bg-slate-50 rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Bell className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-slate-600">提前提醒</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <input 
                          type="number" 
                          value={reminder.days} 
                          onChange={(e) => setReminder({...reminder, days: parseInt(e.target.value) || 0})}
                          className="w-12 bg-white border border-slate-200 rounded-lg text-center py-1 font-bold text-sm"
                        />
                        <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">天</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <input 
                          type="number" 
                          value={reminder.hours} 
                          onChange={(e) => setReminder({...reminder, hours: parseInt(e.target.value) || 0})}
                          className="w-12 bg-white border border-slate-200 rounded-lg text-center py-1 font-bold text-sm"
                        />
                        <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">时</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <input 
                          type="number" 
                          value={reminder.minutes} 
                          onChange={(e) => setReminder({...reminder, minutes: parseInt(e.target.value) || 0})}
                          className="w-12 bg-white border border-slate-200 rounded-lg text-center py-1 font-bold text-sm"
                        />
                        <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">分</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Relations */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">前置关联日程</label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="搜索日程建立关联..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsSearching(true);
                        }}
                        onFocus={() => setIsSearching(true)}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl pl-12 pr-12 py-4 text-slate-800 font-medium transition-all outline-none text-sm"
                      />
                      {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    <AnimatePresence>
                      {isSearching && (searchQuery || searchResults.length > 0) && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 max-h-48 overflow-y-auto scrollbar-hide"
                        >
                          {searchResults.length > 0 ? (
                            searchResults.map((res) => (
                              <button
                                key={res.id}
                                onClick={() => {
                                  setParentId(res.id);
                                  setSearchQuery(res.title);
                                  setIsSearching(false);
                                }}
                                className="w-full px-5 py-3 text-left hover:bg-indigo-50 flex items-center justify-between group"
                              >
                                <div className="flex items-center gap-3">
                                  <Link2 className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
                                  <span className="text-sm font-bold text-slate-700">{res.title}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">{res.date}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-5 py-4 text-center text-xs text-slate-400 font-medium italic">
                              未找到匹配日程
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {parentId && (
                    <div className="flex items-center gap-2 px-2">
                      <div className="w-1 h-1 bg-indigo-600 rounded-full" />
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">已设为前置节点</span>
                      <button onClick={() => setParentId(undefined)} className="text-[10px] text-rose-500 font-bold hover:underline ml-auto">取消关联</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 relative z-10">
              {editingEvent && onDelete && (
                <button
                  type="button"
                  onClick={triggerDelete}
                  className="flex-1 py-5 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-100 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-6 h-6" />
                  删除
                </button>
              )}
              <button
                type="button"
                onClick={triggerSave}
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {editingEvent ? <CheckCircle2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                {editingEvent ? '更新日程' : '保存日程'}
              </button>
            </div>
          </motion.div>

          {/* Recurring Action Prompt */}
          <AnimatePresence>
            {recurringPrompt.isOpen && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm rounded-[2.5rem]">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4"
                >
                  <h3 className="text-lg font-black text-slate-900">
                    {recurringPrompt.action === 'save' ? '修改循环日程' : '删除循环日程'}
                  </h3>
                  <p className="text-sm font-medium text-slate-500">
                    这是一个循环日程。您希望将此更改应用于：
                  </p>
                  <div className="space-y-2">
                    <button onClick={() => handleRecurringAction('this')} className="w-full py-3 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-bold rounded-xl transition-colors">
                      仅此日程
                    </button>
                    <button onClick={() => handleRecurringAction('following')} className="w-full py-3 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-bold rounded-xl transition-colors">
                      此日程及后续
                    </button>
                    <button onClick={() => handleRecurringAction('all')} className="w-full py-3 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-bold rounded-xl transition-colors">
                      全部日程
                    </button>
                  </div>
                  <button onClick={() => setRecurringPrompt({ isOpen: false, action: 'save' })} className="w-full py-3 text-slate-400 hover:text-slate-600 font-bold text-sm mt-2">
                    取消
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};
