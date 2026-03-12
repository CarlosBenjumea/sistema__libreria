const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../library.db');

// Delete existing db for a fresh start if needed (optional)
// if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

console.log(`Initializing database at: ${dbPath}`);
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

// Note: Using INTEGER PRIMARY KEY AUTOINCREMENT
const initScript = `
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT UNIQUE,
    available_copies INTEGER DEFAULT 0,
    total_copies INTEGER DEFAULT 0,
    cover_color TEXT DEFAULT '#4f46e5'
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    registered_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    loan_date TEXT NOT NULL,
    return_date TEXT,
    status TEXT DEFAULT 'active',
    FOREIGN KEY(book_id) REFERENCES books(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`;

db.exec(initScript);

// Optional: Seed some initial data
const booksCount = db.prepare('SELECT COUNT(*) as count FROM books').get().count;

if (booksCount === 0) {
  console.log('Seeding initial books data...');
  const insertBook = db.prepare('INSERT INTO books (title, author, isbn, available_copies, total_copies, cover_color) VALUES (?, ?, ?, ?, ?, ?)');
  
  insertBook.run('El Quijote', 'Miguel de Cervantes', '978-84-249-1489-3', 3, 3, '#ec4899');
  insertBook.run('Cien años de soledad', 'Gabriel García Márquez', '978-0-307-47472-8', 5, 5, '#10b981');
  insertBook.run('1984', 'George Orwell', '978-0-452-28423-4', 1, 2, '#4f46e5');
  insertBook.run('Orgullo y prejuicio', 'Jane Austen', '978-84-9104-017-0', 2, 2, '#f59e0b');
  
  console.log('Seeding initial users data...');
  const insertUser = db.prepare('INSERT INTO users (name, email, phone, registered_date) VALUES (?, ?, ?, ?)');
  
  insertUser.run('Carlos Bene', 'carlos@example.com', '600123456', new Date().toISOString());
  insertUser.run('Ana García', 'ana@example.com', '600654321', new Date().toISOString());
}

console.log('Database initialized successfully.');
db.close();
