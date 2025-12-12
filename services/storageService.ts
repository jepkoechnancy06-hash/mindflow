import { Client, Appointment } from '../types';
import { MOCK_CLIENTS, MOCK_APPOINTMENTS } from '../constants';

// Keys for localStorage
const DATA_KEY_PREFIX = 'mindfulflow_data_';

interface UserData {
  clients: Client[];
  appointments: Appointment[];
}

export const loadUserData = (userId: string): UserData => {
  const key = `${DATA_KEY_PREFIX}${userId}`;
  const saved = localStorage.getItem(key);

  if (saved) {
    return JSON.parse(saved);
  }

  // Onboarding: New users get the default "Mock" data as a starter template
  // In a real app, this might be empty or a specific onboarding set
  const initialData = {
    clients: MOCK_CLIENTS,
    appointments: MOCK_APPOINTMENTS
  };
  
  saveUserData(userId, initialData.clients, initialData.appointments);
  return initialData;
};

export const saveUserData = (userId: string, clients: Client[], appointments: Appointment[]) => {
  const key = `${DATA_KEY_PREFIX}${userId}`;
  const data: UserData = { clients, appointments };
  localStorage.setItem(key, JSON.stringify(data));
};
