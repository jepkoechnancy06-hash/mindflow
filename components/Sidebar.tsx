import React from 'react';
import { Home, Users, Calendar, LogOut, BookMarked } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => onChangeView(view)}
        className={`w-full group flex items-center px-4 py-4 transition-all duration-300 relative ${
          isActive ? 'text-paper-50' : 'text-slate-400 hover:text-paper-100'
        }`}
      >
        <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-md transition-all ${isActive ? 'bg-paper-50' : 'bg-transparent'}`}></div>
        <Icon className={`w-5 h-5 mr-4 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
        <span className={`font-sans text-sm tracking-wide font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="w-64 h-screen bg-ink-900 text-white flex flex-col shadow-2xl z-30 relative overflow-hidden">
      {/* Texture overlay for spine effect */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] pointer-events-none"></div>
      
      {/* Branding */}
      <div className="p-8 pb-10 border-b border-ink-800/50">
         <div className="flex items-center space-x-3 text-paper-50">
           <BookMarked className="w-6 h-6" />
           <span className="font-serif text-xl font-bold italic tracking-wider">MindfulFlow</span>
         </div>
         <p className="text-xs text-ink-500 mt-2 font-sans px-1">Dr. AI's Journal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 space-y-1">
        <NavItem view={ViewState.DASHBOARD} icon={Home} label="Daily Log" />
        <NavItem view={ViewState.CLIENTS} icon={Users} label="Patient Index" />
        <NavItem view={ViewState.CALENDAR} icon={Calendar} label="Appointments" />
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-ink-800/50">
        <button className="flex items-center space-x-3 text-ink-500 hover:text-red-400 transition-colors px-4 py-2">
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Close Journal</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
