import React, { useEffect, useState } from 'react';
import { Calendar, Clock, ArrowRight, Sun } from 'lucide-react';
import { Appointment, Client } from '../types';
import { generateDailyBriefing } from '../services/geminiService';

interface DashboardProps {
  appointments: Appointment[];
  clients: Client[];
  onClientClick: (clientId: string) => void;
  onNavigate: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ appointments, clients, onClientClick, onNavigate }) => {
  const [briefing, setBriefing] = useState<string>("Preparing your daily brief...");
  
  const upcomingAppointments = appointments
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const getClient = (id: string) => clients.find(c => c.id === id);

  useEffect(() => {
    generateDailyBriefing(appointments, clients).then(setBriefing);
  }, [appointments, clients]);

  const today = new Date();

  return (
    <div className="flex-1 h-full bg-paper-50 p-4 md:p-12 overflow-y-auto animate-fade-in">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <header className="border-b-2 border-ink-900/10 pb-6 mb-8 md:mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h2 className="text-ink-500 font-sans text-xs md:text-sm font-bold uppercase tracking-widest mb-2">
              {today.toLocaleDateString(undefined, { weekday: 'long' })}
            </h2>
            <h1 className="font-serif text-3xl md:text-5xl text-ink-900 font-medium">
              {today.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
            </h1>
          </div>
          <div className="md:text-right flex flex-row md:flex-col justify-between items-center md:items-end border-t md:border-0 border-paper-200 pt-4 md:pt-0 w-full md:w-auto">
             <div className="flex items-center text-amber-600 mb-1">
               <Sun className="w-5 h-5 mr-2" />
               <span className="font-sans text-sm font-medium">Morning Session</span>
             </div>
             <p className="text-ink-400 font-serif italic text-sm">October, 2023</p>
          </div>
        </header>

        {/* The Briefing Note */}
        <section className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-paper-200 mb-8 md:mb-12 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
           <h3 className="font-serif text-xl md:text-2xl text-ink-800 mb-4 italic">Daily Briefing</h3>
           <p className="font-mono text-base md:text-lg text-ink-700 leading-relaxed">
             {briefing}
           </p>
        </section>

        {/* Schedule "Entries" */}
        <section>
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-sans text-xs font-bold text-ink-400 uppercase tracking-widest">Today's Appointments</h3>
             <button onClick={() => onNavigate('CALENDAR')} className="text-accent text-sm font-medium hover:underline font-serif italic">View Full Calendar</button>
          </div>
          
          <div className="space-y-4">
            {upcomingAppointments.map((app, idx) => {
              const client = getClient(app.clientId);
              if (!client) return null;
              
              return (
                <div 
                  key={app.id}
                  onClick={() => onClientClick(client.id)}
                  className="group flex flex-col sm:flex-row items-start sm:items-center p-4 bg-white border border-paper-200 rounded-sm hover:border-accent/30 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="w-full sm:w-24 border-b sm:border-b-0 sm:border-r border-paper-200 pb-2 sm:pb-0 sm:pr-4 sm:text-right mb-3 sm:mb-0 flex justify-between sm:block items-baseline">
                     <span className="block font-mono text-lg text-ink-900 font-semibold">
                       {new Date(app.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </span>
                     <span className="block text-xs text-ink-400 uppercase mt-1 tracking-wide">{app.type}</span>
                  </div>
                  <div className="flex-1 sm:pl-6">
                     <h4 className="font-serif text-xl text-ink-800 group-hover:text-accent transition-colors">
                       {client.name}
                     </h4>
                     <p className="text-ink-500 font-sans text-sm mt-1">{client.diagnosis}</p>
                  </div>
                  <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity text-accent px-4">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
             {upcomingAppointments.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-paper-200 text-ink-400 font-serif italic">
                   No further appointments scheduled for today.
                </div>
             )}
          </div>
        </section>
        
      </div>
    </div>
  );
};

export default Dashboard;
