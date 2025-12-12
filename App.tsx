import React, { useState } from 'react';
import { MOCK_CLIENTS, MOCK_APPOINTMENTS } from './constants';
import { Client, ViewState, Note, Appointment } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import ClientDetail from './components/ClientDetail';
import CalendarView from './components/Calendar';
import VoiceAssistant from './components/VoiceAssistant';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);

  const handleClientSelect = (id: string) => {
    setSelectedClientId(id);
    setCurrentView(ViewState.CLIENT_DETAIL);
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
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900">
      {currentView !== ViewState.CLIENT_DETAIL && (
        <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      )}
      <main className="flex-1 overflow-auto relative">
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
