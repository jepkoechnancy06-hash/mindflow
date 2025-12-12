import { GoogleGenAI } from "@google/genai";
import { Note, Client, Appointment } from '../types';

const getAi = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// New: Generates a natural language briefing for the dashboard
export const generateDailyBriefing = async (appointments: Appointment[], clients: Client[]): Promise<string> => {
  const ai = getAi();
  if (!ai) return "Welcome, Dr. AI. Please check your API key.";

  try {
    const today = new Date().toLocaleDateString();
    const apptDetails = appointments.map(a => {
      const c = clients.find(cl => cl.id === a.clientId);
      return `${new Date(a.date).toLocaleTimeString()} with ${c?.name} (${c?.diagnosis})`;
    }).join(", ");

    const prompt = `
      You are an executive assistant for a psychologist. Today is ${today}.
      Here is the schedule: ${apptDetails}.
      
      Write a 2-3 sentence warm, minimalist morning briefing. 
      Mention how many sessions there are and highlight if there's a busy block.
      Do not use bullet points. Be conversational and calm.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "You have a few sessions today.";
  } catch (error) {
    return "Ready for your sessions today.";
  }
};

// Updated: More conversational recall
export const generateSessionRecap = async (lastNote: Note, clientName: string): Promise<string> => {
  const ai = getAi();
  if (!ai) return "Service unavailable.";

  try {
    const prompt = `
      You are a helpful AI co-pilot for a psychologist.
      User is seeing client "${clientName}".
      Last session date: ${new Date(lastNote.date).toLocaleDateString()}.
      Last session notes: "${lastNote.content}".
      
      Write a short, natural paragraph reminding the psychologist what happened last time. 
      End with one relevant follow-up question they might want to ask the client today.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate recap.";
  } catch (error) {
    return "Unable to access session history.";
  }
};

export const analyzeCurrentNote = async (currentInput: string): Promise<{ summary: string; sentiment: string; suggestions: string[] }> => {
  const ai = getAi();
  if (!ai) return { summary: '', sentiment: 'Neutral', suggestions: [] };

  try {
    const prompt = `
      Analyze these therapy notes:
      "${currentInput}"

      Output JSON with:
      - "summary": 1 sentence summary.
      - "sentiment": "Positive", "Neutral", or "Concern".
      - "suggestions": Array of 2 very brief (3-4 words) interventions.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing note:", error);
    return { summary: "Analysis failed", sentiment: "Neutral", suggestions: [] };
  }
};

export const chatWithFile = async (history: {role: string, text: string}[], context: string, query: string): Promise<string> => {
  const ai = getAi();
  if (!ai) return "Service unavailable";

  try {
     // Convert history to string format for context window (simplification)
     const historyStr = history.slice(-4).map(h => `${h.role}: ${h.text}`).join('\n');

     const prompt = `
      System: You are a helpful assistant for a psychologist. Answer based on the context provided. Be brief and professional.
      
      Context (Notes/Files):
      ${context}

      Chat History:
      ${historyStr}

      User Query: ${query}
     `;

     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
     });

     return response.text || "I couldn't find that information.";
  } catch (e) {
    return "I'm having trouble connecting right now.";
  }
};
