import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Video, MapPin, Plus, X, Loader2, Calendar as CalendarIcon, List } from 'lucide-react';
import { Appointment, Client } from '../types';
import { createCalendarEvent } from '../services/calendarService';

interface CalendarProps {
  appointments: Appointment[];
  clients: Client[];
  onAddAppointment: (appt: Appointment) => void;
  isCalendarConnected?: boolean;
}

type ViewMode = 'MONTH' | 'WEEK';

const CalendarView: React.FC<CalendarProps> = ({ appointments, clients, onAddAppointment, isCalendarConnected }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('MONTH');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('09:00');
  const [formType, setFormType] = useState<'In-Person' | 'Virtual'>('In-Person');

  // --- Helper Functions ---

  const getClient = (id: string) => clients.find(c => c.id === id);

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'MONTH') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const prevPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'MONTH') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const getDaysForMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of current month
    const firstDay = new Date(year, month, 1);
    // Day of week for 1st (0=Sun, 1=Mon...)
    const startDay = firstDay.getDay(); 
    
    // Get total days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get days in previous month (for padding)
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Previous Month Padding
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false
      });
    }
    
    // Current Month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next Month Padding (to fill 42 cells - 6 rows)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const getDaysForWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay(); // 0 (Sun) - 6 (Sat)
    // Adjust to start on Sunday (or Monday if preferred, sticking to Sunday for consistency with month)
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0,0,0,0);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(a => {
      const aDate = new Date(a.date);
      return aDate.getDate() === date.getDate() && 
             aDate.getMonth() === date.getMonth() && 
             aDate.getFullYear() === date.getFullYear();
    });
  };

  // --- Handlers ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !formDate || !formTime) return;

    setIsSubmitting(true);
    const client = clients.find(c => c.id === selectedClientId);
    const dateTimeStr = `${formDate}T${formTime}:00`;
    const start = new Date(dateTimeStr);

    try {
        if (isCalendarConnected && client) {
            await createCalendarEvent(
                `Session with ${client.name}`,
                start.toISOString(),
                50
            );
        }
    } catch (err) {
        console.error("Failed to sync with Google Calendar", err);
    }

    const newAppt: Appointment = {
        id: `a${Date.now()}`,
        clientId: selectedClientId,
        date: start.toISOString(),
        durationMinutes: 50,
        type: formType
    };

    onAddAppointment(newAppt);
    setIsSubmitting(false);
    setIsModalOpen(false);
    setSelectedClientId('');
    setFormTime('09:00');
  };

  // --- Renderers ---

  const renderMonthView = () => {
    const days = getDaysForMonthView();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="flex-1 flex flex-col bg-white border border-paper-200 rounded-sm shadow-book overflow-hidden h-full">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-paper-200 bg-paper-50/50">
          {dayNames.map(d => (
            <div key={d} className="py-2 text-center text-xs font-bold font-sans text-ink-500 uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>
        
        {/* Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6">
          {days.map((dayObj, idx) => {
             const dayAppts = getAppointmentsForDate(dayObj.date);
             const isToday = new Date().toDateString() === dayObj.date.toDateString();
             
             return (
               <div 
                 key={idx} 
                 className={`border-b border-r border-paper-100 p-2 relative transition-colors hover:bg-paper-50 ${
                   !dayObj.isCurrentMonth ? 'bg-paper-50/30 text-ink-300' : 'text-ink-900'
                 }`}
                 onClick={() => {
                   setFormDate(dayObj.date.toISOString().split('T')[0]);
                   if (dayObj.isCurrentMonth) setIsModalOpen(true);
                 }}
               >
                 <div className={`text-sm font-mono mb-1 ${isToday ? 'bg-accent text-white w-6 h-6 rounded-full flex items-center justify-center -ml-1.5' : ''}`}>
                    {dayObj.date.getDate()}
                 </div>
                 
                 <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                    {dayAppts.map(app => {
                       const client = getClient(app.clientId);
                       const isVirtual = app.type === 'Virtual';
                       return (
                          <div key={app.id} className={`text-[10px] truncate px-1.5 py-0.5 rounded-sm border-l-2 ${
                              isVirtual 
                                ? 'bg-purple-50 border-purple-400 text-purple-900'
                                : 'bg-emerald-50 border-emerald-500 text-emerald-900'
                          }`}>
                             {new Date(app.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}).toLowerCase()} {client?.name}
                          </div>
                       );
                    })}
                 </div>
               </div>
             );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getDaysForWeekView();
    const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM
    
    return (
      <div className="flex-1 flex flex-col bg-white border border-paper-200 rounded-sm shadow-book overflow-hidden relative">
          <div className="flex-1 overflow-auto relative bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
             {/* Main Scrollable Grid Container - Min width ensures horizontal scroll on mobile */}
             <div className="min-w-[700px]">
                {/* Header Row */}
                <div className="grid grid-cols-8 border-b border-paper-200 bg-paper-50/50 sticky top-0 z-20">
                   <div className="p-4 border-r border-paper-200 text-xs font-mono text-ink-400 text-right bg-paper-50/50">GMT</div>
                   {weekDays.map((d) => {
                      const isToday = new Date().toDateString() === d.toDateString();
                      return (
                        <div key={d.toString()} className={`p-4 text-center border-r border-paper-200 last:border-0 ${isToday ? 'bg-accent/5' : ''}`}>
                           <div className="font-serif font-bold text-ink-700">{d.toLocaleDateString(undefined, {weekday:'short'})}</div>
                           <div className={`text-xs font-sans mt-1 ${isToday ? 'text-accent font-bold' : 'text-ink-400'}`}>
                              {d.getDate()}
                           </div>
                        </div>
                      );
                   })}
                </div>

                <div className="grid grid-cols-8 h-[60rem]"> {/* 10 hours * 6rem */}
                    {/* Time Column */}
                    <div className="border-r border-paper-200 bg-paper-50">
                       {hours.map(h => (
                          <div key={h} className="h-24 border-b border-paper-200 text-xs font-mono text-ink-400 p-2 text-right relative">
                             <span className="-top-2 relative">{h}:00</span>
                          </div>
                       ))}
                    </div>

                    {/* Days Columns */}
                    {weekDays.map((dayDate, i) => (
                       <div key={i} className="border-r border-paper-200 relative last:border-0 hover:bg-paper-50/30 transition-colors">
                          {/* Grid Lines */}
                          {hours.map(h => (
                             <div key={`${i}-${h}`} className="h-24 border-b border-paper-100"></div>
                          ))}
                          
                          {/* Appointments */}
                          {getAppointmentsForDate(dayDate).map(app => {
                             const client = getClient(app.clientId);
                             const date = new Date(app.date);
                             const startHour = 8;
                             
                             // Calculate Position
                             const hour = date.getHours();
                             const minutes = date.getMinutes();
                             if (hour < startHour) return null; // Skip if before start time for demo
                             
                             const hoursFromStart = (hour - startHour) + (minutes / 60);
                             const top = `${hoursFromStart * 6}rem`;
                             const height = `${(app.durationMinutes / 60) * 6}rem`;
                             
                             const isVirtual = app.type === 'Virtual';
                             
                             return (
                                <div 
                                   key={app.id}
                                   className={`absolute left-1 right-1 p-2 rounded-sm border-l-4 cursor-pointer hover:shadow-float transition-all z-10 overflow-hidden group ${
                                      isVirtual 
                                        ? 'bg-purple-50 border-purple-400 text-purple-900' 
                                        : 'bg-emerald-50 border-emerald-500 text-emerald-900'
                                   }`}
                                   style={{ top, height }}
                                >
                                   <p className="font-serif font-bold text-xs truncate">{client?.name || 'Unknown'}</p>
                                   <div className="flex items-center text-[10px] mt-1 opacity-80 font-sans">
                                      {isVirtual ? <Video className="w-3 h-3 mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
                                      {date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
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
    );
  };

  return (
    <div className="flex-1 h-full bg-paper-50 p-4 md:p-8 flex flex-col animate-fade-in overflow-hidden relative">
       {/* Header */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
         <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-900">
               {currentDate.toLocaleDateString(undefined, {month: 'long', year: 'numeric'})}
            </h1>
            <div className="flex items-center space-x-4 mt-2">
               <div className="flex items-center bg-white rounded-md shadow-sm border border-paper-300 overflow-hidden">
                  <button onClick={prevPeriod} className="p-1.5 hover:bg-paper-100 border-r border-paper-200">
                     <ChevronLeft className="w-4 h-4 text-ink-600" />
                  </button>
                  <button onClick={goToToday} className="px-3 py-1.5 text-xs font-medium hover:bg-paper-100 text-ink-700 font-sans">
                     Today
                  </button>
                  <button onClick={nextPeriod} className="p-1.5 hover:bg-paper-100 border-l border-paper-200">
                     <ChevronRight className="w-4 h-4 text-ink-600" />
                  </button>
               </div>
            </div>
         </div>

         <div className="flex items-center space-x-2 md:space-x-4 w-full sm:w-auto">
             {/* View Switcher */}
            <div className="flex bg-paper-200/50 p-1 rounded-md">
               <button 
                  onClick={() => setViewMode('MONTH')}
                  className={`p-2 rounded flex items-center space-x-2 text-xs font-medium transition-all ${
                     viewMode === 'MONTH' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'
                  }`}
               >
                  <CalendarIcon className="w-4 h-4" /> <span className="hidden md:inline">Month</span>
               </button>
               <button 
                  onClick={() => setViewMode('WEEK')}
                  className={`p-2 rounded flex items-center space-x-2 text-xs font-medium transition-all ${
                     viewMode === 'WEEK' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'
                  }`}
               >
                  <List className="w-4 h-4" /> <span className="hidden md:inline">Week</span>
               </button>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center bg-accent text-white px-4 py-2 rounded-sm text-sm font-medium shadow-md hover:bg-accent-dark transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New <span className="hidden sm:inline ml-1">Session</span>
            </button>
         </div>
       </div>

       {/* Content */}
       <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {viewMode === 'MONTH' ? renderMonthView() : renderWeekView()}
       </div>

       {/* Add Appointment Modal */}
       {isModalOpen && (
         <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-paper-50 w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
               <div className="p-6 border-b border-paper-200 flex justify-between items-center bg-white">
                  <h2 className="font-serif text-xl font-bold text-ink-800">Schedule Session</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-ink-400 hover:text-ink-800">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Client</label>
                     <select 
                       required
                       className="w-full p-3 bg-white border border-paper-300 rounded-sm font-sans text-ink-900 outline-none focus:border-accent"
                       value={selectedClientId}
                       onChange={e => setSelectedClientId(e.target.value)}
                     >
                       <option value="">Select a client...</option>
                       {clients.map(c => (
                         <option key={c.id} value={c.id}>{c.name}</option>
                       ))}
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Date</label>
                        <input 
                           type="date" 
                           required
                           className="w-full p-3 bg-white border border-paper-300 rounded-sm font-sans outline-none"
                           value={formDate}
                           onChange={e => setFormDate(e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Time</label>
                        <input 
                           type="time" 
                           required
                           className="w-full p-3 bg-white border border-paper-300 rounded-sm font-sans outline-none"
                           value={formTime}
                           onChange={e => setFormTime(e.target.value)}
                        />
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Session Type</label>
                     <div className="flex space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                           <input 
                              type="radio" 
                              name="type" 
                              value="In-Person" 
                              checked={formType === 'In-Person'} 
                              onChange={() => setFormType('In-Person')}
                              className="text-accent focus:ring-accent"
                           />
                           <span className="text-sm font-sans text-ink-700">In-Person</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                           <input 
                              type="radio" 
                              name="type" 
                              value="Virtual" 
                              checked={formType === 'Virtual'} 
                              onChange={() => setFormType('Virtual')}
                              className="text-accent focus:ring-accent"
                           />
                           <span className="text-sm font-sans text-ink-700">Virtual</span>
                        </label>
                     </div>
                  </div>
                  <div className="pt-4 flex justify-end space-x-3">
                     <button 
                       type="button"
                       onClick={() => setIsModalOpen(false)}
                       className="px-4 py-2 text-ink-500 hover:text-ink-900 font-medium text-sm"
                     >
                        Cancel
                     </button>
                     <button 
                       type="submit"
                       disabled={isSubmitting}
                       className="px-6 py-2 bg-ink-900 text-white rounded-sm font-medium text-sm shadow-md hover:bg-ink-800 transition-colors flex items-center"
                     >
                        {isSubmitting && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                        Schedule
                     </button>
                  </div>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};

export default CalendarView;
