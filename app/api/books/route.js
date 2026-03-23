import { NextResponse } from 'next/server';
import db from '@/lib/db';

function isValidCoverImage(coverImageUrl) {
  if (!coverImageUrl) return true;
  if (typeof coverImageUrl !== 'string') return false;
  return (
    coverImageUrl.startsWith('data:image/') ||
    coverImageUrl.startsWith('http://') ||
    coverImageUrl.startsWith('https://')
  );
}

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
    const { title, author, isbn, total_copies, cover_color, cover_image_url = '' } = body;

    if (!isValidCoverImage(cover_image_url)) {
      return NextResponse.json(
        { error: 'Cover image must be a valid image URL or data URL.' },
        { status: 400 }
      );
    }

    if (cover_image_url && cover_image_url.length > 2_000_000) {
      return NextResponse.json(
        { error: 'Cover image payload is too large. Please use a smaller image.' },
        { status: 400 }
      );
    }

    const stmt = db.prepare(`
      INSERT INTO books (title, author, isbn, available_copies, total_copies, cover_color, cover_image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      title,
      author,
      isbn,
      total_copies,
      total_copies,
      cover_color || '#4f46e5',
      cover_image_url || null
    );
    return NextResponse.json({ id: result.lastInsertRowid, ...body }, { status: 201 });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'A book with this ISBN already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
