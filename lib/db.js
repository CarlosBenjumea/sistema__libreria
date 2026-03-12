import Database from 'better-sqlite3';
import path from 'path';

// Connect to the SQLite database
// For local development it will create library.db in the root folder
const dbPath = path.resolve(process.cwd(), 'library.db');

let db;

try {
  db = new Database(dbPath, { 
    // verbose: console.log 
  });
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
} catch (error) {
  console.error('Failed to connect to the database:', error);
}

export default db;
