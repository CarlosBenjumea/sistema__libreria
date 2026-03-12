import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const users = db.prepare('SELECT * FROM users ORDER BY id DESC').all();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone } = body;

    const stmt = db.prepare(`
      INSERT INTO users (name, email, phone, registered_date)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(name, email, phone, new Date().toISOString());
    return NextResponse.json({ id: result.lastInsertRowid, ...body }, { status: 201 });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
