import { runQuery, ensureSchema } from './db';
import { Client, Appointment, Note, DocumentFile } from '../types';
import { MOCK_CLIENTS, MOCK_APPOINTMENTS } from '../constants';

// --- DATA FETCHING ---

export const fetchUserData = async (userId: string): Promise<{ clients: Client[], appointments: Appointment[] }> => {
  try {
    return await fetchUserDataInternal(userId);
  } catch (error: any) {
    // Auto-recovery: If tables are missing, try to create them and retry the fetch
    const errorMsg = error.message || error.toString();
    if (errorMsg.includes('relation') || errorMsg.includes('does not exist')) {
      console.warn("Database schema appears to be missing. Attempting to repair...", errorMsg);
      try {
        await ensureSchema();
        console.log("Schema repaired. Retrying data fetch...");
        
        // Retry the fetch after schema repair
        return await fetchUserDataInternal(userId);
      } catch (retryError) {
        console.error("Failed to recover from schema error:", retryError);
        // Fallback to empty state so the app doesn't crash white-screen
        return { clients: [], appointments: [] };
      }
    }
    
    console.error("Error fetching user data:", error);
    return { clients: [], appointments: [] };
  }
};

const fetchUserDataInternal = async (userId: string): Promise<{ clients: Client[], appointments: Appointment[] }> => {
  // 1. Fetch Clients
  const clientRows = await runQuery('SELECT * FROM clients WHERE user_id = $1', [userId]);
  
  // If new user with no data (or fresh DB), seed mock data
  if (clientRows.length === 0) {
    return await seedMockData(userId);
  }

  // 2. Hydrate Clients with Notes and Documents
  const clients: Client[] = await Promise.all(clientRows.map(async (row: any) => {
    const notes = await runQuery('SELECT * FROM notes WHERE client_id = $1 ORDER BY date DESC', [row.id]);
    const docs = await runQuery('SELECT * FROM documents WHERE client_id = $1 ORDER BY upload_date DESC', [row.id]);
    
    return {
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      status: row.status as any,
      diagnosis: row.diagnosis,
      nextAppointment: row.next_appointment,
      notes: notes.map((n: any) => ({
        id: n.id,
        date: n.date,
        content: n.content,
        summary: n.summary,
        sentiment: n.sentiment
      })),
      documents: docs.map((d: any) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        uploadDate: d.upload_date,
        content: d.content
      }))
    };
  }));

  // 3. Fetch Appointments
  const apptRows = await runQuery('SELECT * FROM appointments WHERE user_id = $1', [userId]);
  const appointments: Appointment[] = apptRows.map((a: any) => ({
    id: a.id,
    clientId: a.client_id,
    date: a.date,
    durationMinutes: a.duration_minutes,
    type: a.type as any
  }));

  return { clients, appointments };
};

// --- CRUD OPERATIONS ---

export const createClient = async (userId: string, client: Client) => {
  await runQuery(
    `INSERT INTO clients (id, user_id, name, avatar, status, diagnosis, next_appointment) 
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [client.id, userId, client.name, client.avatar, client.status, client.diagnosis, client.nextAppointment]
  );
  return client;
};

export const addNote = async (clientId: string, note: Note) => {
  await runQuery(
    `INSERT INTO notes (id, client_id, date, content, summary, sentiment) 
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [note.id, clientId, note.date, note.content, note.summary, note.sentiment]
  );
};

export const addDocument = async (clientId: string, doc: DocumentFile) => {
  await runQuery(
    `INSERT INTO documents (id, client_id, name, type, upload_date, content) 
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [doc.id, clientId, doc.name, doc.type, doc.uploadDate, doc.content]
  );
};

export const createAppointment = async (userId: string, appt: Appointment) => {
  await runQuery(
    `INSERT INTO appointments (id, user_id, client_id, date, duration_minutes, type) 
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [appt.id, userId, appt.clientId, appt.date, appt.durationMinutes, appt.type]
  );
  
  // Update client's next appointment if this is sooner or newer
  await runQuery(
    `UPDATE clients SET next_appointment = $1 WHERE id = $2`,
    [appt.date, appt.clientId]
  );
};

// --- SEEDING ---

const seedMockData = async (userId: string) => {
  console.log("Seeding Database for new user...");
  
  // Guard: Ensure user exists in DB before seeding clients (Foreign Key Requirement)
  // This handles the edge case where the DB is empty but the user has a valid session in LocalStorage
  const userCheck = await runQuery('SELECT id FROM users WHERE id = $1', [userId]);
  if (userCheck.length === 0) {
    console.log("User record missing in DB (likely fresh DB). creating placeholder user record.");
    // We insert a placeholder user. 
    // Note: Password hash is dummy here, which effectively forces a re-login if they clear local storage,
    // but keeps the current session working.
    try {
      await runQuery(
        'INSERT INTO users (id, email, name, password_hash) VALUES ($1, $2, $3, $4)', 
        [userId, `recovered_${userId}@example.com`, 'Recovered User', 'dummy_hash']
      );
    } catch (e) {
      console.warn("Failed to create placeholder user during seed:", e);
      // We continue, but createClient might fail if FK is strictly enforced
    }
  }

  for (const client of MOCK_CLIENTS) {
    const dbClientId = `${client.id}_${userId}_${Date.now()}`; 
    const mappedClient = { ...client, id: dbClientId };
    
    await createClient(userId, mappedClient);

    for (const note of client.notes) {
      await addNote(dbClientId, { ...note, id: `n_${Date.now()}_${Math.random()}` });
    }

    for (const doc of client.documents) {
      await addDocument(dbClientId, { ...doc, id: `d_${Date.now()}_${Math.random()}` });
    }
  }
  
  // Re-fetch to return correctly formatted structure
  const clientRows = await runQuery('SELECT * FROM clients WHERE user_id = $1', [userId]);
  const clients: Client[] = await Promise.all(clientRows.map(async (row: any) => {
      const notes = await runQuery('SELECT * FROM notes WHERE client_id = $1', [row.id]);
      const docs = await runQuery('SELECT * FROM documents WHERE client_id = $1', [row.id]);
      return {
        id: row.id,
        name: row.name,
        avatar: row.avatar,
        status: row.status as any,
        diagnosis: row.diagnosis,
        nextAppointment: row.next_appointment,
        notes: notes.map((n: any) => ({
             id: n.id,
             date: n.date,
             content: n.content,
             summary: n.summary,
             sentiment: n.sentiment
        })),
        documents: docs.map((d: any) => ({
             id: d.id,
             name: d.name,
             type: d.type,
             uploadDate: d.upload_date,
             content: d.content
        }))
      };
  }));

  return { clients, appointments: [] };
};