import { Pool } from '@neondatabase/serverless';
import { CONFIG } from './config';

// Initialize the pool
let pool: Pool | null = null;

export const getDb = () => {
  if (!pool) {
    if (!CONFIG.DATABASE_URL) {
      console.warn("Database URL missing, running in local-only mode.");
      return null;
    }
    pool = new Pool({ connectionString: CONFIG.DATABASE_URL });
  }
  return pool;
};

// Helper to run queries safely
export const runQuery = async (text: string, params: any[] = []) => {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  
  try {
    const { rows } = await db.query(text, params);
    return rows;
  } catch (err) {
    console.error("Database Error:", err);
    throw err;
  }
};

// Ensure all tables exist
export const ensureSchema = async () => {
  const queries = [
    // Users Table
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    // Clients Table
    `CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      name TEXT NOT NULL,
      avatar TEXT,
      status TEXT,
      diagnosis TEXT,
      next_appointment TEXT, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    // Notes Table
    `CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id),
      date TEXT NOT NULL,
      content TEXT,
      summary TEXT,
      sentiment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    // Documents Table
    `CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id),
      name TEXT,
      type TEXT,
      upload_date TEXT,
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    // Appointments Table
    `CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      client_id TEXT REFERENCES clients(id),
      date TEXT NOT NULL,
      duration_minutes INTEGER,
      type TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];
  
  // We allow this to throw so the caller knows if it failed
  for (const q of queries) {
    await runQuery(q);
  }
  console.log("Full Schema verified.");
};