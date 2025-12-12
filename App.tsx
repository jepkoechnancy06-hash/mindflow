import React, { useState, useEffect } from 'react';
import { Menu, BookMarked } from 'lucide-react';
import { Client, ViewState, Note, Appointment, DocumentFile } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import ClientDetail from './components/ClientDetail';
import CalendarView from './components/Calendar';
import VoiceAssistant from './components/VoiceAssistant';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { initCalendarApi, handleAuthClick, listUpcomingEvents } from './services/calendarService';
import { fetchUserData, createClient, createAppointment, addNote, addDocument } from './services/dataService';

const AuthenticatedApp: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load user data from Neon DB on mount
  useEffect(() => {
    if (user?.id) {
      const load = async () => {
        setIsLoadingData(true);
        try {
          const data = await fetchUserData(user.id);
          setClients(data.clients);
          setAppointments(data.appointments);
        } catch (e) {
          console.error("Failed to load data", e);
        } finally {
          setIsLoadingData(false);
        }
      };
      load();
    }
  }, [user?.id]);

  useEffect(() => {
    initCalendarApi((success) => {
       if (success) console.log("Google Calendar API Initialized");
    });
  }, []);

  const handleConnectCalendar = () => {
     handleAuthClick(async (token) => {
        if (token && !token.error) {
           setIsCalendarConnected(true);
           const events = await listUpcomingEvents();
           if (events.length > 0) {
              // We could choose to save these to DB here, 
              // but for now we keep GCal events in state only (merged view)
              setAppointments(prev => {
                  // Merge avoiding duplicates by ID
                  const newIds = new Set(events.map(e => e.id));
                  return [...prev.filter(p => !newIds.has(p.id)), ...events];
              });
           }
        }
     });
  };

  const handleClientSelect = (id: string) => {
    setSelectedClientId(id);
    setCurrentView(ViewState.CLIENT_DETAIL);
    setIsSidebarOpen(false);
  };

  const handleBackToClients = () => {
    setSelectedClientId(null);
    setCurrentView(ViewState.CLIENTS);
  };

  const handleSaveNote = async (clientId: string, newNote: Note) => {
    // Optimistic Update
    setClients(prevClients => 
      prevClients.map(client => 
        client.id === clientId 
          ? { ...client, notes: [newNote, ...client.notes] }
          : client
      )
    );
    // DB Update
    await addNote(clientId, newNote);
  };

  const handleAddClient = async (newClient: Client) => {
    if (!user) return;
    // Optimistic Update
    setClients(prev => [...prev, newClient]);
    // DB Update
    await createClient(user.id, newClient);
  };

  const handleAddAppointment = async (newAppt: Appointment) => {
    if (!user) return;
    // Optimistic Update
    setAppointments(prev => [...prev, newAppt]);
    // DB Update
    await createAppointment(user.id, newAppt);
  };

  const handleAddDocument = async (clientId: string, doc: DocumentFile) => {
    // Optimistic Update
    setClients(prev => prev.map(c => {
        if (c.id === clientId) {
            return { ...c, documents: [...c.documents, doc] };
        }
        return c;
    }));
    // DB Update
    await addDocument(clientId, doc);
  };

  const renderContent = () => {
    if (isLoadingData) {
      return (
        <div className="flex h-full items-center justify-center text-ink-400 font-serif italic">
          Retrieving archives...
        </div>
      );
    }

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
        return (
          <ClientList 
            clients={clients} 
            onSelectClient={handleClientSelect} 
            onAddClient={handleAddClient}
          />
        );
      case ViewState.CALENDAR:
        return (
          <CalendarView 
            appointments={appointments} 
            clients={clients} 
            onAddAppointment={handleAddAppointment}
            isCalendarConnected={isCalendarConnected}
          />
        );
      case ViewState.CLIENT_DETAIL:
        const client = clients.find(c => c.id === selectedClientId);
        if (!client) return <div>Client not found</div>;
        return (
          <ClientDetail 
            client={client} 
            onBack={handleBackToClients}
            onSaveNote={handleSaveNote}
            onAddDocument={handleAddDocument}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="flex h-screen w-full bg-paper-100 font-sans text-ink-900 overflow-hidden">
      {/* Mobile Header */}
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
      
      <VoiceAssistant 
        clients={clients}
        setClients={setClients}
        appointments={appointments}
        setAppointments={setAppointments}
      />
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-paper-100 text-ink-500">Loading Journal...</div>;
  }

  if (!user) {
    return authView === 'login' 
      ? <Login onNavigateToRegister={() => setAuthView('register')} />
      : <Register onNavigateToLogin={() => setAuthView('login')} />;
  }

  return <AuthenticatedApp />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
