export interface Note {
  id: string;
  date: string;
  content: string;
  summary?: string;
  sentiment?: 'Positive' | 'Neutral' | 'Concern';
}

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  content?: string; // Simulated content for text files
}

export interface Client {
  id: string;
  name: string;
  avatar: string;
  status: 'Active' | 'Archived';
  nextAppointment?: string;
  diagnosis?: string;
  notes: Note[];
  documents: DocumentFile[];
}

export interface Appointment {
  id: string;
  clientId: string;
  date: string; // ISO string
  durationMinutes: number;
  type: 'In-Person' | 'Virtual';
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CLIENTS = 'CLIENTS',
  CALENDAR = 'CALENDAR',
  CLIENT_DETAIL = 'CLIENT_DETAIL'
}
