import { Appointment } from '../types';

// NOTE: In a production app, these should be environment variables.
// For this demo to work dynamically, you must provide a valid Client ID.
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''; 
const API_KEY = process.env.GOOGLE_API_KEY || ''; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const initCalendarApi = (onInit: (success: boolean) => void) => {
  const gapi = (window as any).gapi;
  const google = (window as any).google;

  if (!gapi || !google) {
      console.warn("Google API scripts not loaded");
      onInit(false);
      return;
  }

  // Prevent crash if credentials are missing
  if (!CLIENT_ID || !API_KEY) {
      console.warn("Google Client ID or API Key is missing. Calendar integration disabled.");
      onInit(false);
      return;
  }

  gapi.load('client', async () => {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        checkInit(onInit);
    } catch (e) {
        console.error("Error initializing GAPI client", e);
        onInit(false);
    }
  });

  try {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
      });
      gisInited = true;
      checkInit(onInit);
  } catch (e) {
      console.error("Error initializing Token Client", e);
      onInit(false);
  }
};

const checkInit = (onInit: (success: boolean) => void) => {
    if (gapiInited && gisInited) {
        onInit(true);
    }
};

export const handleAuthClick = (callback: (token: any) => void) => {
  if (!tokenClient) {
      console.warn("Token client not initialized");
      return;
  }
  
  tokenClient.callback = async (resp: any) => {
    if (resp.error) {
      throw (resp);
    }
    callback(resp);
  };

  if ((window as any).gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
    // Skip display of account chooser and consent dialog for an existing session.
    tokenClient.requestAccessToken({prompt: ''});
  }
};

export const listUpcomingEvents = async (): Promise<Appointment[]> => {
    const gapi = (window as any).gapi;
    if (!gapi || !gapi.client || !gapi.client.calendar) return [];

    try {
        const response = await gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 20,
            'orderBy': 'startTime'
        });

        const events = response.result.items;
        if (!events || events.length === 0) return [];

        return events.map((event: any) => ({
            id: event.id,
            clientId: 'c1', // In a real app, this would be derived from event description or attendees
            date: event.start.dateTime || event.start.date,
            durationMinutes: 50, // Simplified
            type: event.location?.toLowerCase().includes('zoom') || event.location?.toLowerCase().includes('meet') ? 'Virtual' : 'In-Person',
            summary: event.summary // Extra field for display
        }));
    } catch (err) {
        console.error("Error listing events", err);
        return [];
    }
};

export const createCalendarEvent = async (summary: string, dateTime: string, durationMinutes: number): Promise<any> => {
    const gapi = (window as any).gapi;
    if (!gapi || !gapi.client || !gapi.client.calendar) throw new Error("Calendar API not initialized");

    const start = new Date(dateTime);
    const end = new Date(start.getTime() + durationMinutes * 60000);

    const event = {
        'summary': summary,
        'description': 'Scheduled via MindfulFlow AI',
        'start': {
            'dateTime': start.toISOString(),
            'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        'end': {
            'dateTime': end.toISOString(),
            'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
        }
    };

    const request = gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': event
    });

    const response = await request;
    return response.result;
};
