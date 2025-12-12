import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Client, Appointment } from '../types';
import { decodeAudioData, createPcmBlob, base64ToUint8Array } from '../utils/audioUtils';
import { createCalendarEvent, listUpcomingEvents } from '../services/calendarService';

interface VoiceAssistantProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  clients, 
  setClients, 
  appointments, 
  setAppointments 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  // Audio Context Refs
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionRef = useRef<any>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Define Tools
  const scheduleAppointmentTool: FunctionDeclaration = {
    name: 'scheduleAppointment',
    description: 'Schedule a new appointment for a client using Google Calendar.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        clientName: { type: Type.STRING, description: 'The name of the client.' },
        dateTime: { type: Type.STRING, description: 'ISO 8601 date string for the appointment.' },
        durationMinutes: { type: Type.NUMBER, description: 'Duration in minutes (default 50).' },
        type: { type: Type.STRING, description: 'Type of appointment: "In-Person" or "Virtual".' }
      },
      required: ['clientName', 'dateTime']
    }
  };

  const updateClientNoteTool: FunctionDeclaration = {
    name: 'updateClientNote',
    description: 'Update or append to the latest note for a client. Create a new note if none exists.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        clientName: { type: Type.STRING, description: 'The name of the client.' },
        content: { type: Type.STRING, description: 'The content to add to the note.' },
        mode: { type: Type.STRING, description: '"append" to add to existing note, "replace" to overwrite.' }
      },
      required: ['clientName', 'content']
    }
  };

  // Helper to find client
  const findClient = (name: string) => {
    return clients.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
  };

  const cleanupAudio = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current = null;
    }
    cleanupAudio();
    setIsActive(false);
    setIsConnecting(false);
    setVolumeLevel(0);
  };

  const startSession = async () => {
    if (isActive) {
      stopSession();
      return;
    }

    try {
      setIsConnecting(true);
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: {
             parts: [{ text: "You are a helpful assistant for a psychologist's organizer app. You can schedule appointments on Google Calendar and edit client notes. Be concise. When scheduling, confirming the time." }]
          },
          tools: [{ functionDeclarations: [scheduleAppointmentTool, updateClientNoteTool] }],
        },
        callbacks: {
          onopen: () => {
            console.log("Live session connected");
            setIsConnecting(false);
            setIsActive(true);

            if (!inputContextRef.current || !streamRef.current) return;
            
            sourceRef.current = inputContextRef.current.createMediaStreamSource(streamRef.current);
            processorRef.current = inputContextRef.current.createScriptProcessor(4096, 1, 1);
            
            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for(let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolumeLevel(Math.sqrt(sum / inputData.length));
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };

            sourceRef.current.connect(processorRef.current);
            processorRef.current.connect(inputContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData && outputContextRef.current) {
               const audioBytes = base64ToUint8Array(audioData);
               const audioBuffer = await decodeAudioData(audioBytes, outputContextRef.current);
               const source = outputContextRef.current.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputContextRef.current.destination);
               const currentTime = outputContextRef.current.currentTime;
               const startTime = Math.max(currentTime, nextStartTimeRef.current);
               source.start(startTime);
               nextStartTimeRef.current = startTime + audioBuffer.duration;
               audioSourcesRef.current.add(source);
               source.onended = () => audioSourcesRef.current.delete(source);
             }

             if (msg.toolCall) {
               const responses = [];
               for (const call of msg.toolCall.functionCalls) {
                  let result = { status: 'error', message: 'Unknown error' };
                  
                  try {
                    if (call.name === 'scheduleAppointment') {
                       const { clientName, dateTime, durationMinutes, type } = call.args as any;
                       const client = findClient(clientName);
                       
                       // Try to call Google Calendar API
                       try {
                         await createCalendarEvent(
                           `Session with ${client ? client.name : clientName}`,
                           dateTime,
                           durationMinutes || 50
                         );
                         
                         // Refresh local state from calendar
                         const updatedEvents = await listUpcomingEvents();
                         if (updatedEvents.length > 0) {
                             setAppointments(updatedEvents);
                         } else {
                             // Fallback: Optimistic update if list fails or is empty
                             const newAppt: Appointment = {
                                id: Date.now().toString(),
                                clientId: client ? client.id : 'unknown',
                                date: dateTime,
                                durationMinutes: durationMinutes || 50,
                                type: type || 'In-Person'
                             };
                             setAppointments(prev => [...prev, newAppt]);
                         }

                         result = { status: 'success', message: `Scheduled on Google Calendar: ${type} appointment with ${clientName} for ${dateTime}` };
                       } catch (apiError: any) {
                         console.error("Calendar API Error", apiError);
                         result = { status: 'error', message: `Failed to schedule on Google Calendar: ${apiError.message || 'Check connection'}` };
                       }

                    } else if (call.name === 'updateClientNote') {
                       const { clientName, content, mode } = call.args as any;
                       const client = findClient(clientName);
                       if (client) {
                          setClients(prev => prev.map(c => {
                             if (c.id !== client.id) return c;
                             const notes = [...c.notes];
                             if (notes.length > 0 && mode !== 'replace') {
                                notes[0] = { ...notes[0], content: notes[0].content + "\n" + content };
                             } else {
                                notes.unshift({
                                   id: Date.now().toString(),
                                   date: new Date().toISOString(),
                                   content: content,
                                   sentiment: 'Neutral'
                                });
                             }
                             return { ...c, notes };
                          }));
                          result = { status: 'success', message: `Updated notes for ${client.name}` };
                       } else {
                          result = { status: 'error', message: `Client ${clientName} not found` };
                       }
                    }
                  } catch (err: any) {
                     result = { status: 'error', message: err.message };
                  }

                  responses.push({
                     id: call.id,
                     name: call.name,
                     response: { result }
                  });
               }
               sessionPromise.then(session => session.sendToolResponse({ functionResponses: responses }));
             }
          },
          onclose: () => {
            cleanupAudio();
            setIsActive(false);
          },
          onerror: (err) => {
            cleanupAudio();
            setIsActive(false);
            setIsConnecting(false);
          }
        }
      });
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error("Failed to start session", e);
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`flex items-center space-x-3 bg-white p-2 rounded-full shadow-float border border-paper-200 transition-all duration-300 ${isActive ? 'pl-4 pr-2 ring-4 ring-accent/10' : ''}`}>
        
        {isActive && (
           <div className="flex items-center space-x-2 mr-2">
              <div className="flex space-x-0.5 items-end h-6">
                 {[...Array(3)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-accent rounded-full transition-all duration-75"
                      style={{ height: `${Math.max(20, Math.min(100, volumeLevel * 500 * (i + 1)))}%` }}
                    ></div>
                 ))}
              </div>
              <span className="text-sm font-sans font-medium text-ink-700">Listening...</span>
           </div>
        )}

        {isConnecting ? (
           <div className="p-3 bg-paper-100 rounded-full text-ink-400">
              <Loader2 className="w-6 h-6 animate-spin" />
           </div>
        ) : (
           <button 
             onClick={startSession}
             className={`p-4 rounded-full transition-all duration-300 shadow-sm ${
               isActive 
                 ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                 : 'bg-ink-900 text-paper-50 hover:bg-ink-800 hover:shadow-lg hover:scale-105'
             }`}
           >
             {isActive ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
           </button>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;
