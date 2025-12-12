import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, UserPlus } from 'lucide-react';
import { Client } from '../types';

interface ClientListProps {
  clients: Client[];
  onSelectClient: (id: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onSelectClient }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 h-full bg-paper-50 p-8 overflow-hidden flex flex-col">
       {/* Header */}
       <div className="flex justify-between items-end mb-10 pb-6 border-b border-ink-900/10">
         <div>
            <h1 className="font-serif text-4xl text-ink-900 mb-2">Patient Index</h1>
            <p className="font-sans text-ink-500">Directory of active case files.</p>
         </div>
         <button className="bg-ink-900 hover:bg-ink-800 text-paper-50 px-6 py-3 rounded-sm font-medium shadow-book transition-all flex items-center font-sans tracking-wide text-sm">
            <UserPlus className="w-4 h-4 mr-2" />
            New File
         </button>
       </div>

       {/* Search Bar */}
       <div className="bg-white p-2 rounded-sm border border-paper-300 shadow-sm mb-8 flex items-center max-w-2xl">
          <Search className="w-5 h-5 text-ink-400 ml-3" />
          <input 
             type="text" 
             placeholder="Search by name, diagnosis..." 
             className="w-full pl-4 pr-4 py-2 bg-transparent border-0 focus:ring-0 outline-none font-mono text-ink-800 placeholder:text-ink-300 placeholder:italic"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="h-6 w-px bg-paper-200 mx-2"></div>
          <button className="px-4 py-1 text-ink-500 hover:text-ink-900 font-sans text-sm font-medium">Filter</button>
       </div>

       {/* Index Card Grid */}
       <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
            {filteredClients.map(client => (
               <div 
                  key={client.id} 
                  onClick={() => onSelectClient(client.id)}
                  className="group bg-white p-6 rounded-sm border border-paper-200 shadow-book hover:shadow-float hover:border-accent/20 transition-all duration-300 cursor-pointer relative overflow-hidden"
               >
                  {/* Top color band */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${client.status === 'Active' ? 'bg-emerald-500' : 'bg-ink-300'}`}></div>
                  
                  <div className="flex justify-between items-start mb-4">
                     <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-paper-100 shadow-sm">
                       <img src={client.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                     </div>
                     <button className="text-ink-300 hover:text-ink-600"><MoreHorizontal className="w-5 h-5" /></button>
                  </div>
                  
                  <h3 className="font-serif text-xl text-ink-900 font-bold mb-1 group-hover:text-accent transition-colors">{client.name}</h3>
                  <p className="font-sans text-xs font-bold text-ink-400 uppercase tracking-widest mb-4">{client.diagnosis || 'Undiagnosed'}</p>
                  
                  <div className="border-t border-paper-100 pt-4 mt-2">
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-ink-400 font-serif italic">Next Session:</span>
                        <span className="font-mono text-ink-700">
                           {client.nextAppointment ? new Date(client.nextAppointment).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'None'}
                        </span>
                     </div>
                  </div>
               </div>
            ))}
          </div>
          {filteredClients.length === 0 && (
            <div className="text-center py-20 text-ink-400 font-serif italic text-lg">
              No records found in the index.
            </div>
          )}
       </div>
    </div>
  );
};

export default ClientList;
