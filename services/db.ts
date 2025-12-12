import { Pool } from '@neondatabase/serverless';
import { CONFIG } from './config';

// Initialize the pool
// We use a lazy initialization pattern to avoid connection errors on load if config is invalid
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

// Ensure users table exists (Migration for demo)
export const ensureSchema = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await runQuery(createTableQuery);
    console.log("Schema verified: 'users' table exists.");
  } catch (e) {
    console.error("Failed to ensure schema:", e);
  }
};