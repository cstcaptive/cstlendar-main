import React from 'react';
import { TIME_CONFIG } from '../constants/config';
import { ScheduleEventPatch3 } from '../types/patch3';
import { formatDateToLocalISO } from '../App';

interface TimeGridProps {
  displayDays: any[];
  events: ScheduleEventPatch3[];
  onEventClick: (event: ScheduleEventPatch3) => void;
}

export const TimeGrid: React.FC<TimeGridProps> = ({ displayDays, events, onEventClick }) => {
  const hours = Array.from(
    { length: TIME_CONFIG.MAX_END_HOUR - TIME_CONFIG.START_HOUR + 1 },
    (_, i) => TIME_CONFIG.START_HOUR + i
  );

  return (
    <div className="flex-1 overflow-y-auto relative scrollbar-hide bg-white">
      <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr] min-h-full">
        {/* Time Column */}
        <div className="bg-white/90 backdrop-blur-sm sticky left-0 z-10 border-r border-slate-50">
          {hours.map((hour) => (
            <div 
              key={hour} 
              style={{ height: `${TIME_CONFIG.HOUR_HEIGHT}px` }} 
              className="flex items-start justify-center pt-2"
            >
              <span className="text-[10px] font-bold text-slate-300">
                {hour}:00
              </span>
            </div>
          ))}
        </div>

        {/* Grid Columns */}
        <div className="col-span-4 grid grid-cols-4 relative">
          {/* Horizontal Lines */}
          <div className="absolute inset-0 pointer-events-none">
            {hours.map((hour) => (
              <div 
                key={hour} 
                style={{ height: `${TIME_CONFIG.HOUR_HEIGHT}px` }} 
                className="border-b border-slate-50 w-full"
              ></div>
            ))}
          </div>
          
          {/* Vertical Columns & Events */}
          {displayDays.map((day, dayIdx) => {
            // Filter events for this specific day
            const dayStr = formatDateToLocalISO(day.date);
            const dayEvents = events.filter(e => e.date === dayStr && !e.isAllDay);

            return (
              <div key={dayIdx} className="border-r border-slate-50 last:border-r-0 h-full relative">
                {dayEvents.map(event => {
                  if (!event.startTime) return null;
                  const [h, m] = event.startTime.split(':').map(Number);
                  const topOffset = (h - TIME_CONFIG.START_HOUR + m / 60) * TIME_CONFIG.HOUR_HEIGHT;
                  
                  return (
                    <div 
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      style={{ 
                        top: `${topOffset}px`,
                        height: '32px' // Default height for events without end time
                      }}
                      className="absolute left-1 right-1 bg-indigo-600/10 border-l-4 border-indigo-600 rounded-r-lg p-1 overflow-hidden cursor-pointer hover:bg-indigo-600/20 transition-colors"
                    >
                      <div className="text-[10px] font-black text-indigo-700 truncate leading-tight">
                        {event.title}
                      </div>
                      <div className="text-[8px] font-bold text-indigo-400 leading-none">
                        {event.startTime}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
