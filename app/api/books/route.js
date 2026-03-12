import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
  try {
    const books = db.prepare('SELECT * FROM books ORDER BY id DESC').all();
    return NextResponse.json(books);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, author, isbn, total_copies, cover_color } = body;

    const stmt = db.prepare(`
      INSERT INTO books (title, author, isbn, available_copies, total_copies, cover_color)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(title, author, isbn, total_copies, total_copies, cover_color || '#4f46e5');
    return NextResponse.json({ id: result.lastInsertRowid, ...body }, { status: 201 });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'A book with this ISBN already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
