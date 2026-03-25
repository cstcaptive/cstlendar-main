import { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Sparkles,
  Settings2,
  Network
} from 'lucide-react';
import { motion } from 'motion/react';
import { TimeGrid } from './components/TimeGrid';
import { TIME_CONFIG } from './constants/config';
import { MonthPickerPatch1 } from './components/MonthPickerPatch1';
import { SettingsModalPatch2 } from './components/SettingsModalPatch2';
import { AddEventModalPatch3 } from './components/AddEventModalPatch3';
import { GraphSearchModalPatch4 } from './components/GraphSearchModalPatch4';
import { RelationGraphPatch4 } from './components/RelationGraphPatch4';
import { AIChatModalPatch5 } from './components/AIChatModalPatch5';
import { ScheduleEventPatch3 } from './types/patch3';

// --- Types ---
interface DateInfo {
  date: Date;
  dayName: string;
  dayNumber: number;
  monthName: string;
  weekNumber: number;
  isToday: boolean;
}

// --- Utils ---
const getWeekNumber = (d: Date): number => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

export const formatDateToLocalISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const shiftDate = (dateStr: string, daysToShift: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + daysToShift);
  return formatDateToLocalISO(d);
};

const getDaysDiff = (dateStr1: string, dateStr2: string): number => {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
};

const formatDateInfo = (date: Date): DateInfo => {
  const today = new Date();
  const isToday = date.getDate() === today.getDate() && 
                  date.getMonth() === today.getMonth() && 
                  date.getFullYear() === today.getFullYear();
  
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  return {
    date,
    dayName: isToday ? '今天' : days[date.getDay()],
    dayNumber: date.getDate(),
    monthName: months[date.getMonth()],
    weekNumber: getWeekNumber(date),
    isToday
  };
};

// --- Components ---

export default function App() {
  const [startDate, setStartDate] = useState(new Date());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isGraphSearchOpen, setIsGraphSearchOpen] = useState(false);
  const [isGraphViewOpen, setIsGraphViewOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [selectedGraphRoot, setSelectedGraphRoot] = useState<ScheduleEventPatch3 | null>(null);
  const [editingEvent, setEditingEvent] = useState<ScheduleEventPatch3 | null>(null);
  const [events, setEvents] = useState<ScheduleEventPatch3[]>([]);

  // Load events from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartflow_events');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setEvents(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load events', e);
    }
  }, []);

  // Notification Engine (Patch 3)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      events.forEach(event => {
        if (!event.startTime) return; // Skip all-day for now or handle differently
        
        const eventDate = new Date(`${event.date}T${event.startTime}`);
        const reminderTime = new Date(eventDate.getTime());
        reminderTime.setDate(reminderTime.getDate() - event.reminder.days);
        reminderTime.setHours(reminderTime.getHours() - event.reminder.hours);
        reminderTime.setMinutes(reminderTime.getMinutes() - event.reminder.minutes);

        // If current time matches reminder time (within 1 minute precision)
        if (Math.abs(now.getTime() - reminderTime.getTime()) < 60000) {
          // Check if already notified in this session to avoid duplicates
          const notifiedKey = `notified_${event.id}_${reminderTime.getTime()}`;
          try {
            if (!sessionStorage.getItem(notifiedKey)) {
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(`日程提醒: ${event.title}`, {
                  body: `事件将于 ${event.startTime} 开始`,
                  icon: '/favicon.ico'
                });
              } else {
                alert(`🔔 提醒: ${event.title}\n即将于 ${event.startTime} 开始`);
              }
              sessionStorage.setItem(notifiedKey, 'true');
            }
          } catch (e) {
            console.error('Notification error', e);
          }
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [events]);

  // Request notification permission
  useEffect(() => {
    try {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    } catch (e) {
      console.error('Failed to request notification permission', e);
    }
  }, []);

  const handleSaveEvent = (newEvent: ScheduleEventPatch3, scope?: 'this' | 'following' | 'all', recurringCount: number = 1) => {
    let updatedEvents = [...events];
    
    if (!editingEvent) {
      // Creation
      if (recurringCount > 1) {
        const groupId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
        for (let i = 0; i < recurringCount; i++) {
          const d = new Date(newEvent.date);
          d.setDate(d.getDate() + i * 7);
          updatedEvents.push({
            ...newEvent,
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
            date: formatDateToLocalISO(d),
            recurringGroupId: groupId,
            recurringSequence: i + 1
          });
        }
      } else {
        updatedEvents.push(newEvent);
      }
    } else {
      // Editing
      if (!newEvent.recurringGroupId || scope === 'this' || !scope) {
        const idx = updatedEvents.findIndex(e => e.id === newEvent.id);
        if (idx >= 0) updatedEvents[idx] = newEvent;
      } else {
        const oldEvent = events.find(e => e.id === newEvent.id)!;
        const daysDiff = getDaysDiff(newEvent.date, oldEvent.date);
        
        updatedEvents = updatedEvents.map(e => {
          if (e.recurringGroupId === newEvent.recurringGroupId) {
            const isTarget = scope === 'all' || (scope === 'following' && e.recurringSequence! >= newEvent.recurringSequence!);
            if (isTarget) {
              if (e.id === newEvent.id) return newEvent;
              // Apply changes to other instances
              return {
                ...newEvent,
                id: e.id, // keep original id
                date: shiftDate(e.date, daysDiff), // shift date by same amount
                recurringGroupId: e.recurringGroupId,
                recurringSequence: e.recurringSequence,
                createdAt: e.createdAt
              };
            }
          }
          return e;
        });
      }
    }
    
    setEvents(updatedEvents);
    try {
      localStorage.setItem('smartflow_events', JSON.stringify(updatedEvents));
    } catch (e) {
      console.error('Failed to save events', e);
    }
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string, scope?: 'this' | 'following' | 'all') => {
    setEvents(prev => {
      const eventToDelete = prev.find(e => e.id === eventId);
      let updated = prev;
      
      if (!eventToDelete?.recurringGroupId || scope === 'this' || !scope) {
        updated = prev.filter(e => e.id !== eventId);
      } else {
        updated = prev.filter(e => {
          if (e.recurringGroupId === eventToDelete.recurringGroupId) {
            if (scope === 'all') return false;
            if (scope === 'following' && e.recurringSequence! >= eventToDelete.recurringSequence!) return false;
          }
          return true;
        });
      }
      
      try {
        localStorage.setItem('smartflow_events', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save events', e);
      }
      return updated;
    });
    setIsAddEventOpen(false);
  };

  const handleEditEvent = (event: ScheduleEventPatch3) => {
    setEditingEvent(event);
    setIsAddEventOpen(true);
  };
  const displayDays = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return formatDateInfo(d);
    });
  }, [startDate]);

  const handlePrevPage = () => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() - 4);
    setStartDate(newDate);
  };

  const handleNextPage = () => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + 4);
    setStartDate(newDate);
  };

  const handleGoToday = () => {
    setStartDate(new Date());
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-white text-slate-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <CalendarIcon className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-tighter italic uppercase">SmartFlow</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleGoToday}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-600 text-sm font-bold rounded-full transition-colors uppercase tracking-wider"
          >
            Today
          </button>
          <div className="flex items-center bg-slate-100 rounded-full p-1">
            <button onClick={handlePrevPage} className="p-1 hover:bg-white rounded-full transition-all">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button onClick={handleNextPage} className="p-1 hover:bg-white rounded-full transition-all">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Date Bar */}
      <div 
        className="grid grid-cols-[60px_1fr_1fr_1fr_1fr] border-b border-slate-100 pb-2 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsMonthPickerOpen(true)}
      >
        <div className="flex flex-col items-center justify-center text-indigo-600 font-bold text-sm">
          {displayDays[0].monthName}
        </div>
        {displayDays.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center py-2">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${day.isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
              {day.dayName}
            </span>
            <span className={`text-2xl font-black leading-none my-1 ${day.isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
              {day.dayNumber}
            </span>
            <span className="text-[10px] font-bold text-slate-300 uppercase">
              W{day.weekNumber}
            </span>
          </div>
        ))}
      </div>

      {/* All Day Section */}
      <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr] border-b border-slate-100 min-h-[60px]">
        <div className="flex items-center justify-center border-r border-slate-50">
          <span className="text-[10px] font-black text-indigo-300 uppercase -rotate-90 tracking-[0.2em]">
            All Day
          </span>
        </div>
        <div className="col-span-4 grid grid-cols-4">
          {displayDays.map((day, idx) => {
            const dayStr = formatDateToLocalISO(day.date);
            const allDayEvents = events.filter(e => e.date === dayStr && e.isAllDay);
            return (
              <div key={idx} className="border-r border-slate-50 last:border-r-0 h-full p-1 space-y-1">
                {allDayEvents.map(event => (
                  <div 
                    key={event.id} 
                    onClick={() => handleEditEvent(event)}
                    className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate cursor-pointer hover:bg-indigo-700 transition-colors"
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid Area (Scrollable) */}
      <TimeGrid displayDays={displayDays} events={events} onEventClick={handleEditEvent} />

      {/* Bottom Navigation */}
      <footer className="h-24 border-t border-slate-50 flex items-center justify-around px-8 relative bg-white">
        <button 
          onClick={() => setIsAIChatOpen(true)}
          className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all flex flex-col items-center gap-1"
        >
          <Sparkles className="w-8 h-8" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">AI Chat</span>
        </button>
        
        {/* Floating Action Button */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddEventOpen(true)}
            className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-300 border-4 border-white"
          >
            <Plus className="w-10 h-10" />
          </motion.button>
        </div>

        <button 
          id="footer-graph-button"
          onClick={() => setIsGraphSearchOpen(true)}
          className="p-3 text-slate-300 hover:bg-slate-50 rounded-2xl transition-all"
        >
          <Network className="w-8 h-8" />
        </button>
      </footer>

      {/* PATCH1: Month Picker Modal */}
      <MonthPickerPatch1 
        isOpen={isMonthPickerOpen}
        onClose={() => setIsMonthPickerOpen(false)}
        onSelectDate={(date) => setStartDate(date)}
        initialDate={startDate}
      />

      {/* PATCH2: AI Settings Modal */}
      <SettingsModalPatch2 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* PATCH3: Add Event Modal */}
      <AddEventModalPatch3 
        isOpen={isAddEventOpen}
        onClose={() => {
          setIsAddEventOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        editingEvent={editingEvent}
      />

      {/* PATCH4: Relation Graph */}
      <GraphSearchModalPatch4 
        isOpen={isGraphSearchOpen}
        onClose={() => setIsGraphSearchOpen(false)}
        events={events}
        onSelect={(event) => {
          setSelectedGraphRoot(event);
          setIsGraphSearchOpen(false);
          setIsGraphViewOpen(true);
        }}
      />

      {selectedGraphRoot && (
        <RelationGraphPatch4 
          isOpen={isGraphViewOpen}
          onClose={() => setIsGraphViewOpen(false)}
          rootEvent={selectedGraphRoot}
          allEvents={events}
        />
      )}

      {/* PATCH5: AI Global Chat */}
      <AIChatModalPatch5 
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        events={events}
        onViewGraph={(eventId) => {
          const event = events.find(e => e.id === eventId);
          if (event) {
            setSelectedGraphRoot(event);
            setIsGraphViewOpen(true);
          }
        }}
      />
    </div>
  );
}
