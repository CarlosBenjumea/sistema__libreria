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

  // Lightweight startup migration for new features.
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      recommendation TEXT,
      would_recommend INTEGER NOT NULL DEFAULT 1 CHECK(would_recommend IN (0, 1)),
      photo_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, book_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS social_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shared_by_user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      photo_url TEXT,
      shared_at TEXT NOT NULL,
      UNIQUE(shared_by_user_id, book_id),
      FOREIGN KEY(shared_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
    CREATE INDEX IF NOT EXISTS idx_social_shares_shared_by ON social_shares(shared_by_user_id);
    CREATE INDEX IF NOT EXISTS idx_social_shares_book_id ON social_shares(book_id);
    CREATE INDEX IF NOT EXISTS idx_social_shares_shared_at ON social_shares(shared_at);
  `);

  const userColumns = db.prepare("PRAGMA table_info('users')").all();
  const hasPenalizedUntil = userColumns.some((column) => column.name === 'penalized_until');
  if (!hasPenalizedUntil) {
    db.exec('ALTER TABLE users ADD COLUMN penalized_until TEXT');
  }
  const hasProfilePhotoUrl = userColumns.some((column) => column.name === 'profile_photo_url');
  if (!hasProfilePhotoUrl) {
    db.exec('ALTER TABLE users ADD COLUMN profile_photo_url TEXT');
  }

  const loanColumns = db.prepare("PRAGMA table_info('loans')").all();
  const hasDueDate = loanColumns.some((column) => column.name === 'due_date');
  if (!hasDueDate) {
    db.exec('ALTER TABLE loans ADD COLUMN due_date TEXT');
  }

  const bookColumns = db.prepare("PRAGMA table_info('books')").all();
  const hasCoverImageUrl = bookColumns.some((column) => column.name === 'cover_image_url');
  if (!hasCoverImageUrl) {
    db.exec('ALTER TABLE books ADD COLUMN cover_image_url TEXT');
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_penalized_until ON users(penalized_until);
    CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);
  `);
} catch (error) {
  console.error('Failed to connect to the database:', error);
}

export default db;
