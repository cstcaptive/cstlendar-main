import React, { useState, useEffect } from 'react';

// Simple types
interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  isAllDay: boolean;
  contacts: any[];
  reminder: { days: number; hours: number; minutes: number };
  parentId?: string;
  createdAt: number;
  recurringGroupId?: string;
  recurringSequence?: number;
}

// Simple utility functions
const formatDateToLocalISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDateInfo = (date: Date) => {
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
    isToday
  };
};

// Simple TimeGrid component
const SimpleTimeGrid = ({ displayDays, events, onEventClick }: any) => {
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 to 22:00

  return (
    <div style={{ 
      flex: 1, 
      overflowY: 'auto', 
      backgroundColor: 'white',
      position: 'relative'
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '60px 1fr 1fr 1fr 1fr',
        minHeight: '100%'
      }}>
        {/* Time Column */}
        <div style={{ 
          backgroundColor: 'rgba(255,255,255,0.9)', 
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          left: 0,
          zIndex: 10,
          borderRight: '1px solid #f1f5f9'
        }}>
          {hours.map((hour) => (
            <div 
              key={hour} 
              style={{ 
                height: '48px', 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'center', 
                paddingTop: '8px'
              }}
            >
              <span style={{ 
                fontSize: '10px', 
                fontWeight: 'bold', 
                color: '#cbd5e1'
              }}>
                {hour}:00
              </span>
            </div>
          ))}
        </div>

        {/* Grid Columns */}
        <div style={{ 
          gridColumn: 'span 4', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          position: 'relative'
        }}>
          {/* Horizontal Lines */}
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            pointerEvents: 'none'
          }}>
            {hours.map((hour) => (
              <div 
                key={hour} 
                style={{ 
                  height: '48px', 
                  borderBottom: '1px solid #f1f5f9', 
                  width: '100%'
                }}
              ></div>
            ))}
          </div>
          
          {/* Vertical Columns & Events */}
          {displayDays.map((day: any, dayIdx: number) => {
            const dayStr = formatDateToLocalISO(day.date);
            const dayEvents = events.filter((e: ScheduleEvent) => e.date === dayStr && !e.isAllDay);

            return (
              <div key={dayIdx} style={{ 
                borderRight: dayIdx < 3 ? '1px solid #f1f5f9' : 'none', 
                height: '100%', 
                position: 'relative'
              }}>
                {dayEvents.map((event: ScheduleEvent) => {
                  if (!event.startTime) return null;
                  const [h, m] = event.startTime.split(':').map(Number);
                  const topOffset = (h - 8 + m / 60) * 48;
                  
                  return (
                    <div 
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      style={{ 
                        position: 'absolute',
                        left: '4px',
                        right: '4px',
                        top: `${topOffset}px`,
                        height: '32px',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        borderLeft: '4px solid #4f46e5',
                        borderRadius: '0 8px 8px 0',
                        padding: '4px',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ 
                        fontSize: '10px', 
                        fontWeight: '900', 
                        color: '#4338ca',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {event.title}
                      </div>
                      <div style={{ 
                        fontSize: '8px', 
                        fontWeight: 'bold', 
                        color: '#818cf8'
                      }}>
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

// Main App component
export default function App() {
  const [startDate, setStartDate] = useState(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(formatDateToLocalISO(new Date()));
  const [newEventTime, setNewEventTime] = useState('09:00');

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

  // Save events to localStorage
  const saveEvents = (newEvents: ScheduleEvent[]) => {
    setEvents(newEvents);
    try {
      localStorage.setItem('smartflow_events', JSON.stringify(newEvents));
    } catch (e) {
      console.error('Failed to save events', e);
    }
  };

  // Add new event
  const handleAddEvent = () => {
    if (!newEventTitle.trim()) return;
    
    const newEvent: ScheduleEvent = {
      id: Date.now().toString(),
      title: newEventTitle,
      date: newEventDate,
      startTime: newEventTime,
      isAllDay: false,
      contacts: [],
      reminder: { days: 0, hours: 0, minutes: 30 },
      createdAt: Date.now()
    };
    
    saveEvents([...events, newEvent]);
    setNewEventTitle('');
    setShowAddEvent(false);
  };

  // Delete event
  const handleDeleteEvent = (eventId: string) => {
    saveEvents(events.filter(e => e.id !== eventId));
  };

  // Calculate display days
  const displayDays = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return formatDateInfo(d);
  });

  // Navigation functions
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
    <div style={{ 
      position: 'absolute', 
      inset: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: 'white', 
      color: '#0f172a', 
      fontFamily: 'Inter, sans-serif', 
      overflow: 'hidden'
    }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '16px 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            backgroundColor: '#4f46e5', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.2)'
          }}>
            <span style={{ color: 'white', fontSize: '20px' }}>📅</span>
          </div>
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: '900', 
            letterSpacing: '-0.05em', 
            fontStyle: 'italic', 
            textTransform: 'uppercase'
          }}>CSTlendar</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={handleGoToday}
            style={{ 
              padding: '6px 16px', 
              backgroundColor: '#f1f5f9', 
              color: '#4f46e5', 
              fontSize: '14px', 
              fontWeight: 'bold', 
              borderRadius: '9999px', 
              border: 'none', 
              cursor: 'pointer'
            }}
          >
            Today
          </button>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: '#f1f5f9', 
            borderRadius: '9999px', 
            padding: '4px'
          }}>
            <button onClick={handlePrevPage} style={{ 
              padding: '4px', 
              backgroundColor: 'transparent', 
              border: 'none', 
              cursor: 'pointer'
            }}>
              <span style={{ fontSize: '20px' }}>←</span>
            </button>
            <button onClick={handleNextPage} style={{ 
              padding: '4px', 
              backgroundColor: 'transparent', 
              border: 'none', 
              cursor: 'pointer'
            }}>
              <span style={{ fontSize: '20px' }}>→</span>
            </button>
          </div>
        </div>
      </header>

      {/* Date Bar */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '60px 1fr 1fr 1fr 1fr', 
        borderBottom: '1px solid #f1f5f9', 
        paddingBottom: '8px', 
        cursor: 'pointer'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: '#4f46e5', 
          fontWeight: 'bold', 
          fontSize: '14px'
        }}>
          {displayDays[0].monthName}
        </div>
        {displayDays.map((day, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            padding: '8px 0'
          }}>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em', 
              color: day.isToday ? '#4f46e5' : '#94a3b8'
            }}>
              {day.dayName}
            </span>
            <span style={{ 
              fontSize: '24px', 
              fontWeight: '900', 
              lineHeight: 1, 
              margin: '4px 0', 
              color: day.isToday ? '#4f46e5' : '#1e293b'
            }}>
              {day.dayNumber}
            </span>
          </div>
        ))}
      </div>

      {/* All Day Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '60px 1fr 1fr 1fr 1fr', 
        borderBottom: '1px solid #f1f5f9', 
        minHeight: '60px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          borderRight: '1px solid #f8fafc'
        }}>
          <span style={{ 
            fontSize: '10px', 
            fontWeight: '900', 
            color: '#a5b4fc', 
            textTransform: 'uppercase', 
            transform: 'rotate(-90deg)', 
            letterSpacing: '0.2em'
          }}>
            All Day
          </span>
        </div>
        <div style={{ 
          gridColumn: 'span 4', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)'
        }}>
          {displayDays.map((day, idx) => {
            const dayStr = formatDateToLocalISO(day.date);
            const allDayEvents = events.filter(e => e.date === dayStr && e.isAllDay);
            return (
              <div key={idx} style={{ 
                borderRight: idx < 3 ? '1px solid #f8fafc' : 'none', 
                height: '100%', 
                padding: '4px'
              }}>
                {allDayEvents.map(event => (
                  <div 
                    key={event.id} 
                    onClick={() => handleDeleteEvent(event.id)}
                    style={{ 
                      backgroundColor: '#4f46e5', 
                      color: 'white', 
                      fontSize: '9px', 
                      fontWeight: 'bold', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      cursor: 'pointer'
                    }}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid Area */}
      <SimpleTimeGrid displayDays={displayDays} events={events} onEventClick={handleDeleteEvent} />

      {/* Bottom Navigation */}
      <footer style={{ 
        height: '96px', 
        borderTop: '1px solid #f8fafc', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-around', 
        padding: '0 32px', 
        position: 'relative', 
        backgroundColor: 'white'
      }}>
        <button style={{ 
          padding: '12px', 
          color: '#4f46e5', 
          backgroundColor: 'transparent', 
          border: 'none', 
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{ fontSize: '32px' }}>✨</span>
          <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>AI Chat</span>
        </button>
        
        {/* Floating Action Button */}
        <div style={{ 
          position: 'absolute', 
          top: '-40px', 
          left: '50%', 
          transform: 'translateX(-50%)'
        }}>
          <button 
            onClick={() => setShowAddEvent(true)}
            style={{ 
              width: '80px', 
              height: '80px', 
              backgroundColor: '#4f46e5', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white', 
              boxShadow: '0 25px 50px -12px rgba(79, 70, 229, 0.3)', 
              border: '4px solid white', 
              cursor: 'pointer',
              fontSize: '40px'
            }}
          >
            +
          </button>
        </div>

        <button style={{ 
          padding: '12px', 
          color: '#cbd5e1', 
          backgroundColor: 'transparent', 
          border: 'none', 
          cursor: 'pointer'
        }}>
          <span style={{ fontSize: '32px' }}>🔗</span>
        </button>
      </footer>

      {/* Add Event Modal */}
      {showAddEvent && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', 
          backdropFilter: 'blur(8px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 50
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '24px', 
            padding: '32px', 
            width: '90%', 
            maxWidth: '400px'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '900', 
              marginBottom: '24px'
            }}>添加日程</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                color: '#64748b', 
                marginBottom: '8px'
              }}>标题</label>
              <input
                type="text"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="输入日程标题"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '12px', 
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                color: '#64748b', 
                marginBottom: '8px'
              }}>日期</label>
              <input
                type="date"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '12px', 
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                color: '#64748b', 
                marginBottom: '8px'
              }}>时间</label>
              <input
                type="time"
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '12px', 
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowAddEvent(false)}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  backgroundColor: '#f1f5f9', 
                  color: '#64748b', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button 
                onClick={handleAddEvent}
                style={{ 
                  flex: 2, 
                  padding: '12px', 
                  backgroundColor: '#4f46e5', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer'
                }}
              >
                保存日程
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
