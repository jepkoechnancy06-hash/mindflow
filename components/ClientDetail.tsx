import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Clock, Send, Paperclip, Save, Sparkles, FileText, X, History, Mic, MessageSquare, Upload
} from 'lucide-react';
import { Client, Note, DocumentFile } from '../types';
import { generateSessionRecap, analyzeCurrentNote, chatWithFile } from '../services/geminiService';

interface ClientDetailProps {
  client: Client;
  onBack: () => void;
  onSaveNote: (clientId: string, note: Note) => void;
  onAddDocument: (clientId: string, doc: DocumentFile) => void;
}

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  type?: 'text' | 'recall' | 'file_summary';
  relatedId?: string; 
}

const ClientDetail: React.FC<ClientDetailProps> = ({ client, onBack, onSaveNote, onAddDocument }) => {
  const [activeFile, setActiveFile] = useState<DocumentFile | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Mobile UI States
  const [mobileTab, setMobileTab] = useState<'history' | 'session'>('session');
  const [isChatOpen, setIsChatOpen] = useState(false); // Mobile toggle for chat
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialization
  useEffect(() => {
    const init = async () => {
      setMessages([]);
      if (client.notes.length > 0) {
        setIsTyping(true);
        const lastNote = client.notes[0];
        const recap = await generateSessionRecap(lastNote, client.name);
        setIsTyping(false);
        setMessages([
          { id: '1', role: 'ai', text: recap, type: 'recall' },
          { id: '2', role: 'ai', text: "Ready to log today's session." }
        ]);
      } else {
         setMessages([{ id: '1', role: 'ai', text: "New client file opened. Ready for initial intake notes." }]);
      }
    };
    init();
  }, [client.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, isChatOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputQuery };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    let context = activeFile 
        ? `Active File: ${activeFile.name}\nContent: ${activeFile.content || "(Simulated)"}`
        : client.notes.map(n => `Date: ${n.date}\nContent: ${n.content}`).join('\n---\n');

    const aiResponseText = await chatWithFile(messages, context, userMsg.text);
    setIsTyping(false);
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', text: aiResponseText }]);
  };

  const handleSaveNote = async () => {
    if (!newNoteContent.trim()) return;
    setIsTyping(true);
    const analysis = await analyzeCurrentNote(newNoteContent);
    const newNote: Note = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content: newNoteContent,
      summary: analysis.summary,
      sentiment: analysis.sentiment as any,
    };
    onSaveNote(client.id, newNote);
    setNewNoteContent('');
    setIsTyping(false);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: `Entry saved. Sentiment detected: ${analysis.sentiment}.` }]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newDoc: DocumentFile = {
        id: `d${Date.now()}`,
        name: file.name,
        type: file.type,
        uploadDate: new Date().toISOString().split('T')[0],
        content: "[Simulated content extracted from uploaded file]" 
      };
      onAddDocument(client.id, newDoc);
      // Optional: Inform chat
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: `Attached ${file.name} to patient file.` }]);
    }
  };

  return (
    <div className="h-full flex flex-col bg-paper-100 overflow-hidden relative">
      
      {/* Top Bar (Navigation) */}
      <div className="bg-paper-50 border-b border-paper-200 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center space-x-3 md:space-x-6 overflow-hidden">
           <button onClick={onBack} className="text-ink-400 hover:text-ink-900 transition-colors flex items-center font-sans text-sm font-medium shrink-0">
             <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" /> <span className="hidden sm:inline">Index</span>
           </button>
           <div className="h-6 w-px bg-paper-300 shrink-0"></div>
           <div className="truncate">
              <h1 className="font-serif text-lg md:text-xl font-bold text-ink-900 truncate">{client.name}</h1>
              <p className="font-sans text-[10px] md:text-xs text-ink-500 tracking-wide uppercase">File #{client.id.toUpperCase()}</p>
           </div>
        </div>
        <div className="flex items-center space-x-2 text-ink-500 font-mono text-xs md:text-sm shrink-0">
           <Clock className="w-3 h-3 md:w-4 md:h-4" />
           <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden flex border-b border-paper-300 bg-paper-100">
         <button 
           onClick={() => setMobileTab('history')}
           className={`flex-1 py-3 text-sm font-medium ${mobileTab === 'history' ? 'bg-paper-50 text-ink-900 border-b-2 border-accent' : 'text-ink-500'}`}
         >
           History & Files
         </button>
         <button 
           onClick={() => setMobileTab('session')}
           className={`flex-1 py-3 text-sm font-medium ${mobileTab === 'session' ? 'bg-white text-ink-900 border-b-2 border-accent' : 'text-ink-500'}`}
         >
           Current Session
         </button>
      </div>

      {/* Main Content Area: Split Notebook */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PAGE: Reference & History (The "Past") */}
        {/* Visible on Desktop, or on Mobile if 'history' tab is active */}
        <div className={`
            w-full md:w-1/3 min-w-[300px] bg-paper-100 border-r border-paper-300 flex flex-col relative
            ${mobileTab === 'history' ? 'flex' : 'hidden md:flex'}
        `}>
           <div className="p-4 md:p-6 border-b border-paper-200 bg-paper-50/50">
              <h2 className="font-serif text-lg text-ink-800 italic flex items-center">
                 <History className="w-4 h-4 mr-2 text-ink-400" />
                 Previous Entries
              </h2>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-20 md:pb-6">
              {client.notes.map(note => (
                 <div key={note.id} className="relative pl-6 border-l-2 border-paper-300">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-paper-400"></div>
                    <div className="mb-1 flex items-center justify-between">
                       <span className="font-mono text-xs text-ink-500 font-bold">{new Date(note.date).toLocaleDateString()}</span>
                       {note.sentiment && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                             note.sentiment === 'Concern' ? 'bg-red-100 text-red-800' : 'bg-paper-200 text-ink-600'
                          }`}>{note.sentiment}</span>
                       )}
                    </div>
                    <p className="font-mono text-sm text-ink-600 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                       {note.content}
                    </p>
                 </div>
              ))}
              
              {/* Documents List */}
              {client.documents.length > 0 && (
                 <div className="mt-8 pt-6 border-t border-paper-200">
                    <h3 className="font-sans text-xs font-bold text-ink-400 uppercase tracking-widest mb-3">Attached Documents</h3>
                    <div className="space-y-2">
                       {client.documents.map(doc => (
                          <div 
                             key={doc.id}
                             onClick={() => {
                               setActiveFile(doc);
                               setMobileTab('session'); // Auto switch on mobile to view
                             }}
                             className={`flex items-center p-2 rounded-sm cursor-pointer transition-colors ${
                                activeFile?.id === doc.id ? 'bg-accent/10 text-accent' : 'hover:bg-paper-200 text-ink-600'
                             }`}
                          >
                             <FileText className="w-4 h-4 mr-2" />
                             <span className="text-sm font-sans truncate">{doc.name}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              )}
           </div>
        </div>

        {/* RIGHT PAGE: Active Session & Co-pilot (The "Present") */}
        {/* Visible on Desktop, or on Mobile if 'session' tab is active */}
        <div className={`
           flex-1 bg-white flex flex-col relative shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)]
           ${mobileTab === 'session' ? 'flex' : 'hidden md:flex'}
        `}>
           
           {/* If viewing a file */}
           {activeFile ? (
              <div className="flex-1 p-6 md:p-12 overflow-y-auto pb-24 md:pb-12">
                 <div className="flex justify-between items-center mb-8 border-b border-paper-200 pb-4">
                    <h2 className="font-serif text-xl md:text-2xl text-ink-900 truncate pr-4">{activeFile.name}</h2>
                    <button onClick={() => setActiveFile(null)} className="text-ink-400 hover:text-ink-800"><X className="w-5 h-5" /></button>
                 </div>
                 <div className="font-mono text-sm md:text-base text-ink-600 leading-loose bg-paper-50 p-4 md:p-8 rounded-sm border border-paper-200 min-h-[400px]">
                    [Document Content Viewer Placeholder]<br/><br/>
                    Reading: {activeFile.name}<br/>
                    Type: {activeFile.type}<br/>
                    Uploaded: {activeFile.uploadDate}
                 </div>
              </div>
           ) : (
              /* Writing Pad */
              <div className="flex-1 flex flex-col">
                 <div className="p-4 md:p-10 pb-20 md:pb-0 max-w-3xl mx-auto w-full flex-1 flex flex-col">
                    <div className="mb-4">
                       <span className="font-serif text-2xl md:text-3xl text-ink-900 border-b-2 border-accent/20 pb-1">
                          Session Note
                       </span>
                    </div>
                    <textarea 
                       value={newNoteContent}
                       onChange={(e) => setNewNoteContent(e.target.value)}
                       placeholder="Start writing today's observations..."
                       className="flex-1 w-full bg-transparent border-none resize-none outline-none font-mono text-base md:text-lg text-ink-800 leading-[1.8rem] md:leading-[2rem] ruled-lines placeholder:text-ink-300"
                       spellCheck={false}
                    />
                    
                    {/* Toolbar */}
                    <div className="py-4 md:py-6 flex justify-between items-center border-t border-paper-100 mt-auto bg-white sticky bottom-0">
                       <div className="flex space-x-4 text-ink-400">
                          <Mic className="w-5 h-5 hover:text-ink-700 cursor-pointer transition-colors" />
                          <button onClick={() => fileInputRef.current?.click()} className="text-ink-400 hover:text-ink-700">
                              <Paperclip className="w-5 h-5 cursor-pointer transition-colors" />
                          </button>
                          <input 
                             type="file" 
                             ref={fileInputRef}
                             className="hidden"
                             onChange={handleFileUpload}
                          />
                       </div>
                       <button 
                          onClick={handleSaveNote}
                          disabled={!newNoteContent}
                          className="bg-accent text-white px-4 md:px-6 py-2 rounded-full font-sans text-sm font-medium hover:bg-accent-dark transition-colors shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center"
                       >
                          <Save className="w-4 h-4 mr-2" /> Save <span className="hidden sm:inline ml-1">Entry</span>
                       </button>
                    </div>
                 </div>
              </div>
           )}

           {/* Mobile Chat Toggle Button */}
           <button 
             onClick={() => setIsChatOpen(!isChatOpen)}
             className={`md:hidden absolute bottom-24 right-4 z-20 p-3 rounded-full shadow-lg transition-colors ${
               isChatOpen ? 'bg-accent text-white' : 'bg-white text-accent border border-accent/20'
             }`}
           >
             <MessageSquare className="w-6 h-6" />
           </button>

           {/* Floating "Marginalia" (AI Chat) */}
           {/* Desktop: Absolute positioned. Mobile: Full screen overlay/Modal */}
           <div className={`
              transition-all duration-300 ease-in-out
              md:absolute md:right-6 md:top-6 md:bottom-24 md:w-80 md:pointer-events-none md:flex md:flex-col md:justify-end
              ${isChatOpen ? 'fixed inset-0 z-50 bg-white/95 p-4 flex flex-col' : 'hidden md:flex'}
           `}>
              <div className="pointer-events-auto bg-white/95 backdrop-blur-sm border border-paper-200 shadow-float rounded-xl overflow-hidden flex flex-col h-full md:max-h-[60%]">
                 <div className="bg-paper-100 px-4 py-2 border-b border-paper-200 flex items-center justify-between">
                    <span className="font-sans text-xs font-bold text-ink-500 uppercase tracking-widest flex items-center">
                       <Sparkles className="w-3 h-3 mr-1 text-accent" /> Co-Pilot
                    </span>
                    {/* Mobile Close Chat */}
                    <button onClick={() => setIsChatOpen(false)} className="md:hidden text-ink-400">
                       <X className="w-5 h-5" />
                    </button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-paper-50" ref={scrollRef}>
                    {messages.map((msg) => (
                       <div key={msg.id} className={`text-sm leading-relaxed p-3 rounded-lg ${
                          msg.role === 'user' 
                             ? 'bg-ink-800 text-white ml-8 rounded-br-none' 
                             : 'bg-white border border-paper-200 text-ink-700 mr-4 rounded-bl-none shadow-sm'
                       }`}>
                          {msg.type === 'recall' && <div className="text-xs font-bold text-accent mb-1 uppercase">Recall</div>}
                          {msg.text}
                       </div>
                    ))}
                    {isTyping && <div className="text-xs text-ink-400 italic pl-2">Thinking...</div>}
                 </div>
                 <form onSubmit={handleSendMessage} className="p-2 bg-white border-t border-paper-200">
                    <div className="relative">
                       <input 
                          type="text" 
                          className="w-full pl-3 pr-10 py-2 bg-paper-50 rounded-lg border border-paper-200 text-sm focus:border-accent focus:ring-0 outline-none"
                          placeholder="Ask assistant..."
                          value={inputQuery}
                          onChange={(e) => setInputQuery(e.target.value)}
                       />
                       <button type="submit" disabled={!inputQuery.trim()} className="absolute right-2 top-2 text-accent disabled:text-ink-300">
                          <Send className="w-4 h-4" />
                       </button>
                    </div>
                 </form>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default ClientDetail;