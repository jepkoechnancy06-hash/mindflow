import { User } from '../types';
import { runQuery, ensureSchema } from './db';

const USERS_KEY = 'mindfulflow_users';
const SESSION_KEY = 'mindfulflow_session';

// Helper to hash passwords (simple simulation for demo purposes)
// In production, use bcrypt or Argon2 on the server side.
const simpleHash = async (text: string) => {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const login = async (email: string, password: string): Promise<User> => {
  try {
    // Attempt Neon DB Login
    const hashedPassword = await simpleHash(password);
    const rows = await runQuery('SELECT * FROM users WHERE email = $1 AND password_hash = $2', [email, hashedPassword]);
    
    if (rows.length > 0) {
      const dbUser = rows[0];
      const user: User = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    } else {
      // Check if it was a connection error or just invalid creds
      // If query ran successfully but returned 0 rows:
      throw new Error('Invalid credentials');
    }
  } catch (error: any) {
    // If DB connection fails, or generic error, fall back to local storage (Offline Mode)
    console.warn("Neon DB login failed, checking local storage cache...", error.message);
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password); // Local stores plain text in this demo fallback

    if (user) {
      const sessionUser = { id: user.id, name: user.name, email: user.email };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    }
    
    if (error.message === 'Invalid credentials') {
        throw error;
    }
    throw new Error('Connection failed. Please check your internet or try again.');
  }
};

export const register = async (name: string, email: string, password: string): Promise<User> => {
  const newUser = {
    id: `u${Date.now()}`,
    name,
    email
  };

  try {
    // 1. Ensure DB Schema exists (Just in case it's the first run)
    await ensureSchema();

    // 2. Hash password
    const hashedPassword = await simpleHash(password);

    // 3. Insert into Neon DB
    await runQuery(
      'INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)',
      [newUser.id, name, email, hashedPassword]
    );

    // 4. Save Session
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return newUser;

  } catch (error: any) {
    console.error("Neon DB Registration failed:", error);

    // Fallback to Local Storage
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find((u: any) => u.email === email)) {
      throw new Error('Email already registered (Local Cache)');
    }
    
    // Save locally
    const localUser = { ...newUser, password }; // Storing password locally for fallback login
    users.push(localUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return newUser;
  }
};

export const logout = async () => {
  localStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
};
