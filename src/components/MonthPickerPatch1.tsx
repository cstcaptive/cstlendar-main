/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PATCH1: Month View Functionality
 * This component provides a modular date picker modal to quickly jump to any date.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface MonthPickerPatch1Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  initialDate: Date;
}

type ViewMode = 'days' | 'months' | 'years';

export const MonthPickerPatch1: React.FC<MonthPickerPatch1Props> = ({
  isOpen,
  onClose,
  onSelectDate,
  initialDate,
}) => {
  const [viewDate, setViewDate] = useState(new Date(initialDate));
  const [viewMode, setViewMode] = useState<ViewMode>('days');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Generate days for the calendar grid
  const daysInMonth = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];
    
    // Padding for previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, currentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
    }

    // Current month days
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= lastDayOfMonth; i++) {
      days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
    }

    // Padding for next month
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
    }

    return days;
  }, [year, month]);

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  const years = useMemo(() => {
    const startYear = year - 10;
    return Array.from({ length: 21 }, (_, i) => startYear + i);
  }, [year]);

  const handlePrev = () => {
    if (viewMode === 'days') setViewDate(new Date(year, month - 1, 1));
    else if (viewMode === 'years') setViewDate(new Date(year - 20, month, 1));
  };

  const handleNext = () => {
    if (viewMode === 'days') setViewDate(new Date(year, month + 1, 1));
    else if (viewMode === 'years') setViewDate(new Date(year + 20, month, 1));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setViewMode('years')}
                    className="text-lg font-black text-slate-800 hover:text-indigo-600 transition-colors"
                  >
                    {year}年
                  </button>
                  <button 
                    onClick={() => setViewMode('months')}
                    className="text-lg font-black text-slate-800 hover:text-indigo-600 transition-colors"
                  >
                    {month + 1}月
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={handlePrev} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <button onClick={handleNext} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors ml-2">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* View Rendering */}
              <div className="min-h-[280px]">
                {viewMode === 'days' && (
                  <>
                    <div className="grid grid-cols-7 mb-2">
                      {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2">
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {daysInMonth.map((d, i) => {
                        const isSelected = d.date.toDateString() === initialDate.toDateString();
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              if (d.currentMonth) {
                                onSelectDate(d.date);
                                onClose();
                              } else {
                                setViewDate(d.date);
                              }
                            }}
                            className={`
                              aspect-square flex items-center justify-center rounded-full text-sm font-bold transition-all
                              ${d.currentMonth ? 'text-slate-700 hover:bg-indigo-50' : 'text-slate-300'}
                              ${isSelected ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' : ''}
                            `}
                          >
                            {d.day}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {viewMode === 'months' && (
                  <div className="grid grid-cols-3 gap-4 py-4">
                    {months.map((m, i) => (
                      <button
                        key={m}
                        onClick={() => {
                          setViewDate(new Date(year, i, 1));
                          setViewMode('days');
                        }}
                        className={`
                          py-4 rounded-2xl text-sm font-bold transition-all
                          ${month === i ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-600 hover:bg-indigo-50'}
                        `}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}

                {viewMode === 'years' && (
                  <div className="grid grid-cols-3 gap-4 py-4 max-h-[280px] overflow-y-auto scrollbar-hide">
                    {years.map((y) => (
                      <button
                        key={y}
                        onClick={() => {
                          setViewDate(new Date(y, month, 1));
                          setViewMode('days');
                        }}
                        className={`
                          py-4 rounded-2xl text-sm font-bold transition-all
                          ${year === y ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-600 hover:bg-indigo-50'}
                        `}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 flex justify-center">
              <button 
                onClick={() => {
                  const today = new Date();
                  setViewDate(today);
                  setViewMode('days');
                }}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                回到今天
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
