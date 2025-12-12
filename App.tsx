import React, { useState, useEffect } from 'react';
import { Menu, BookMarked } from 'lucide-react';
import { MOCK_CLIENTS, MOCK_APPOINTMENTS } from './constants';
import { Client, ViewState, Note, Appointment } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import ClientDetail from './components/ClientDetail';
import CalendarView from './components/Calendar';
import VoiceAssistant from './components/VoiceAssistant';
import { initCalendarApi, handleAuthClick, listUpcomingEvents } from './services/calendarService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  
  // Start with Mock, replace with Real if connected
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);

  // Mobile Menu State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Initialize Google API
    initCalendarApi((success) => {
       if (success) {
          console.log("Google Calendar API Initialized");
       }
    });
  }, []);

  const handleConnectCalendar = () => {
     handleAuthClick(async (token) => {
        if (token && !token.error) {
           setIsCalendarConnected(true);
           const events = await listUpcomingEvents();
           if (events.length > 0) {
              setAppointments(events);
           }
        }
     });
  };

  const handleClientSelect = (id: string) => {
    setSelectedClientId(id);
    setCurrentView(ViewState.CLIENT_DETAIL);
    // On mobile, finding a client should close menu if it was open (though usually covered by View change)
    setIsSidebarOpen(false);
  };

  const handleBackToClients = () => {
    setSelectedClientId(null);
    setCurrentView(ViewState.CLIENTS);
  };

  const handleSaveNote = (clientId: string, newNote: Note) => {
    setClients(prevClients => 
      prevClients.map(client => 
        client.id === clientId 
          ? { ...client, notes: [newNote, ...client.notes] }
          : client
      )
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return (
          <Dashboard 
            appointments={appointments} 
            clients={clients} 
            onClientClick={handleClientSelect}
            onNavigate={(view) => setCurrentView(view)} 
          />
        );
      case ViewState.CLIENTS:
        return <ClientList clients={clients} onSelectClient={handleClientSelect} />;
      case ViewState.CALENDAR:
        return <CalendarView appointments={appointments} clients={clients} />;
      case ViewState.CLIENT_DETAIL:
        const client = clients.find(c => c.id === selectedClientId);
        if (!client) return <div>Client not found</div>;
        return (
          <ClientDetail 
            client={client} 
            onBack={handleBackToClients}
            onSaveNote={handleSaveNote}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="flex h-screen w-full bg-paper-100 font-sans text-ink-900 overflow-hidden">
      
      {/* Mobile Header (Only visible on small screens) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-ink-900 text-paper-50 flex items-center justify-between px-4 z-30 shadow-md">
         <div className="flex items-center space-x-2">
            <BookMarked className="w-6 h-6" />
            <span className="font-serif font-bold text-lg">MindfulFlow</span>
         </div>
         <button onClick={() => setIsSidebarOpen(true)} className="p-2">
            <Menu className="w-6 h-6" />
         </button>
      </div>

      <Sidebar 
         currentView={currentView} 
         onChangeView={(view) => { setCurrentView(view); setIsSidebarOpen(false); }} 
         onConnectCalendar={handleConnectCalendar}
         isCalendarConnected={isCalendarConnected}
         isOpen={isSidebarOpen}
         onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 overflow-auto relative flex flex-col pt-16 md:pt-0 w-full">
        {renderContent()}
      </main>
      
      {/* Global Voice Assistant Overlay */}
      <VoiceAssistant 
        clients={clients}
        setClients={setClients}
        appointments={appointments}
        setAppointments={setAppointments}
      />
    </div>
  );
};

export default App;
