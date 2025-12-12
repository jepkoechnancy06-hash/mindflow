import React from 'react';
import { ChevronLeft, ChevronRight, Clock, Video, MapPin } from 'lucide-react';
import { Appointment, Client } from '../types';

interface CalendarProps {
  appointments: Appointment[];
  clients: Client[];
}

const CalendarView: React.FC<CalendarProps> = ({ appointments, clients }) => {
  const hours = Array.from({ length: 9 }, (_, i) => i + 9); // 9 AM to 5 PM
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const today = new Date();
  
  // Calculate start of current week (simplified to always show current M-F for demo)
  const currentDay = today.getDay(); // 0 is Sun, 1 is Mon
  const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); 
  const startOfWeek = new Date(today.setDate(diff));

  const getAppointmentsForDay = (dayIndex: number) => {
    // Day Index: 0 = Mon, 1 = Tue...
    return appointments.filter(app => {
      const appDate = new Date(app.date);
      // Simplify matching for demo: match day of week
      // Real app would match exact date
      const appDay = appDate.getDay(); // 1 = Mon
      return (appDay - 1) === dayIndex; 
    });
  };

  const getPosition = (dateStr: string, duration: number) => {
    const date = new Date(dateStr);
    const hour = date.getHours();
    const minutes = date.getMinutes();
    
    // Start at 9 AM (hour 9)
    // 1 hour = 6rem (h-24)
    const startHour = 9;
    
    // Relative to 9am
    const hoursFromStart = (hour - startHour) + (minutes / 60);
    const top = hoursFromStart * 6; // 6rem per hour
    const height = (duration / 60) * 6; // 6rem per hour
    
    return { top: `${top}rem`, height: `${height}rem` };
  };

  const getClient = (id: string) => clients.find(c => c.id === id);

  return (
    <div className="flex-1 h-full bg-paper-50 p-4 md:p-8 flex flex-col animate-fade-in overflow-hidden">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
         <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-900">Weekly Schedule</h1>
            <p className="font-sans text-ink-500 mt-1 text-sm">
              {startOfWeek.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - 
              {new Date(startOfWeek.getTime() + 4*24*60*60*1000).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
            </p>
         </div>
         <div className="flex items-center space-x-2 md:space-x-4 w-full sm:w-auto">
            <div className="flex items-center bg-white rounded-sm border border-paper-300 shadow-sm">
               <button className="p-2 hover:bg-paper-100 border-r border-paper-200"><ChevronLeft className="w-5 h-5 text-ink-600" /></button>
               <button className="p-2 hover:bg-paper-100"><ChevronRight className="w-5 h-5 text-ink-600" /></button>
            </div>
            <button className="flex-1 sm:flex-none bg-ink-900 text-paper-50 px-4 md:px-6 py-2 rounded-sm text-sm font-medium shadow-book hover:bg-ink-800 transition-colors whitespace-nowrap">
               Sync Calendar
            </button>
         </div>
       </div>

       <div className="flex-1 bg-white rounded-sm border border-paper-200 shadow-book overflow-hidden flex flex-col relative">
          <div className="flex-1 overflow-auto relative bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
             {/* Main Scrollable Grid Container - Min width ensures horizontal scroll on mobile */}
             <div className="min-w-[700px]">
                {/* Header Row */}
                <div className="grid grid-cols-6 border-b border-paper-200 bg-paper-50/50 sticky top-0 z-20">
                   <div className="p-4 border-r border-paper-200 text-xs font-mono text-ink-400 text-right bg-paper-50/50">GMT-05</div>
                   {days.map((d, i) => {
                      const date = new Date(startOfWeek);
                      date.setDate(date.getDate() + i);
                      const isToday = new Date().toDateString() === date.toDateString();
                      
                      return (
                        <div key={d} className={`p-4 text-center border-r border-paper-200 last:border-0 ${isToday ? 'bg-accent/5' : ''}`}>
                           <div className="font-serif font-bold text-ink-700">{d}</div>
                           <div className={`text-xs font-sans mt-1 ${isToday ? 'text-accent font-bold' : 'text-ink-400'}`}>
                              {date.getDate()}
                           </div>
                        </div>
                      );
                   })}
                </div>

                <div className="grid grid-cols-6 min-h-[54rem]"> {/* 9 hours * 6rem */}
                    {/* Time Column */}
                    <div className="border-r border-paper-200 bg-paper-50">
                       {hours.map(h => (
                          <div key={h} className="h-24 border-b border-paper-200 text-xs font-mono text-ink-400 p-2 text-right relative">
                             <span className="-top-2 relative">{h}:00</span>
                          </div>
                       ))}
                    </div>

                    {/* Days Columns */}
                    {[0, 1, 2, 3, 4].map(dayIndex => (
                       <div key={dayIndex} className="border-r border-paper-200 relative last:border-0 hover:bg-paper-50/30 transition-colors">
                          {/* Grid Lines */}
                          {hours.map(h => (
                             <div key={`${dayIndex}-${h}`} className="h-24 border-b border-paper-100"></div>
                          ))}
                          
                          {/* Appointments */}
                          {getAppointmentsForDay(dayIndex).map(app => {
                             const client = getClient(app.clientId);
                             const pos = getPosition(app.date, app.durationMinutes);
                             const isVirtual = app.type === 'Virtual';
                             
                             return (
                                <div 
                                   key={app.id}
                                   className={`absolute left-1 right-1 p-2 md:p-3 rounded-sm border-l-4 cursor-pointer hover:shadow-float transition-all z-10 overflow-hidden group ${
                                      isVirtual 
                                        ? 'bg-purple-50 border-purple-400 text-purple-900' 
                                        : 'bg-emerald-50 border-emerald-500 text-emerald-900'
                                   }`}
                                   style={{ top: pos.top, height: pos.height }}
                                >
                                   <p className="font-serif font-bold text-xs md:text-sm truncate">{client?.name || (app as any).summary || 'Unknown'}</p>
                                   <div className="flex items-center text-[10px] md:text-xs mt-1 opacity-80 font-sans">
                                      {isVirtual ? <Video className="w-3 h-3 mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
                                      {new Date(app.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                   </div>
                                </div>
                             );
                          })}
                       </div>
                    ))}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default CalendarView;
