import React from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Appointment, Client } from '../types';

interface CalendarProps {
  appointments: Appointment[];
  clients: Client[];
}

const CalendarView: React.FC<CalendarProps> = ({ appointments, clients }) => {
  const hours = Array.from({ length: 9 }, (_, i) => i + 9); // 9 AM to 5 PM
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  
  // Simplified mock calendar rendering
  return (
    <div className="p-8 h-screen flex flex-col">
       <div className="flex justify-between items-center mb-6">
         <h1 className="text-3xl font-bold text-slate-800">Weekly Schedule</h1>
         <div className="flex items-center space-x-4">
            <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm">
               <button className="p-2 hover:bg-slate-50 border-r border-slate-200"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
               <span className="px-4 py-2 font-medium text-slate-700">Oct 23 - Oct 27, 2023</span>
               <button className="p-2 hover:bg-slate-50"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
            </div>
            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium">New Appointment</button>
         </div>
       </div>

       <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="grid grid-cols-6 border-b border-slate-200">
             <div className="p-4 border-r border-slate-100 bg-slate-50"></div>
             {days.map(d => (
                <div key={d} className="p-4 text-center font-semibold text-slate-600 border-r border-slate-100 last:border-0">{d}</div>
             ))}
          </div>
          <div className="flex-1 overflow-y-auto">
             <div className="grid grid-cols-6 h-full">
                <div className="border-r border-slate-100 bg-slate-50">
                   {hours.map(h => (
                      <div key={h} className="h-24 border-b border-slate-200 text-xs text-slate-400 p-2 text-right relative">
                         <span className="-top-2 relative">{h}:00</span>
                      </div>
                   ))}
                </div>
                {[0, 1, 2, 3, 4].map(dayIndex => (
                   <div key={dayIndex} className="border-r border-slate-100 relative last:border-0 bg-white">
                      {hours.map(h => (
                         <div key={`${dayIndex}-${h}`} className="h-24 border-b border-slate-100"></div>
                      ))}
                      
                      {/* Mock Placement of Appointments */}
                      {dayIndex === 1 && ( // Tuesday
                         <div className="absolute top-24 left-1 right-1 h-20 bg-blue-100 border-l-4 border-blue-500 rounded p-2 cursor-pointer hover:shadow-md transition-shadow">
                            <p className="font-bold text-blue-900 text-xs">Sarah Jenkins</p>
                            <div className="flex items-center text-blue-700 text-xs mt-1">
                               <Clock className="w-3 h-3 mr-1" /> 10:00 - 10:50
                            </div>
                         </div>
                      )}
                      {dayIndex === 2 && ( // Wednesday
                         <div className="absolute top-[12rem] left-1 right-1 h-20 bg-purple-100 border-l-4 border-purple-500 rounded p-2 cursor-pointer hover:shadow-md transition-shadow">
                            <p className="font-bold text-purple-900 text-xs">Michael Chen</p>
                             <div className="flex items-center text-purple-700 text-xs mt-1">
                               <Clock className="w-3 h-3 mr-1" /> 11:00 - 11:50
                            </div>
                         </div>
                      )}
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
};

export default CalendarView;
