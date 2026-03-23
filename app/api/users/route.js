import { NextResponse } from 'next/server';
import db from '@/lib/db';

function isValidProfilePhoto(photoUrl) {
  if (!photoUrl) return true;
  if (typeof photoUrl !== 'string') return false;
  return (
    photoUrl.startsWith('data:image/') ||
    photoUrl.startsWith('http://') ||
    photoUrl.startsWith('https://')
  );
}

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
    const { name, email, phone, profile_photo_url = '' } = body;

    if (!isValidProfilePhoto(profile_photo_url)) {
      return NextResponse.json(
        { error: 'Profile photo must be a valid image URL or data URL.' },
        { status: 400 }
      );
    }

    if (profile_photo_url && profile_photo_url.length > 2_000_000) {
      return NextResponse.json(
        { error: 'Profile photo is too large. Please use a smaller image.' },
        { status: 400 }
      );
    }

    const stmt = db.prepare(`
      INSERT INTO users (name, email, phone, profile_photo_url, registered_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(name, email, phone, profile_photo_url || null, new Date().toISOString());
    return NextResponse.json({ id: result.lastInsertRowid, ...body }, { status: 201 });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
