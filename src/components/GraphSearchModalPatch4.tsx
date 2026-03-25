/**
 * PATCH4: Graph Search Modal
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Link2, Sparkles } from 'lucide-react';
import { ScheduleEventPatch3 } from '../types/patch3';
import { semanticSearchEventsPatch3 } from '../services/aiServicePatch3';

interface GraphSearchModalPatch4Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (event: ScheduleEventPatch3) => void;
  events: ScheduleEventPatch3[];
}

export const GraphSearchModalPatch4: React.FC<GraphSearchModalPatch4Props> = ({
  isOpen,
  onClose,
  onSelect,
  events
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ScheduleEventPatch3[]>([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        // 1. Local Filter
        const localFiltered = events.filter((e) => 
          e.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (localFiltered.length > 0) {
          setSearchResults(localFiltered);
          setIsSearching(false);
        } else {
          // 2. Semantic Search
          setIsSearching(true);
          try {
            const relevantIds = await semanticSearchEventsPatch3(searchQuery, events);
            const aiFiltered = events.filter(e => relevantIds.includes(e.id));
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
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, events]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-black text-slate-900 tracking-tight">探索关联图谱</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="输入日程标题或语义描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl pl-12 pr-12 py-4 text-slate-800 font-bold transition-all outline-none"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-hide">
                {searchResults.length > 0 ? (
                  searchResults.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onSelect(event)}
                      className="w-full p-4 text-left hover:bg-indigo-50 rounded-2xl flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                          <Link2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-800">{event.title}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{event.date}</div>
                        </div>
                      </div>
                      <div className="text-[10px] font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">查看图谱 →</div>
                    </button>
                  ))
                ) : searchQuery ? (
                  <div className="py-8 text-center text-slate-400 font-medium italic text-sm">
                    未找到相关日程，换个词试试？
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-300 font-medium text-xs uppercase tracking-widest">
                    开始输入以搜索日程
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
