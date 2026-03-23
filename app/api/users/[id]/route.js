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

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone } = body;
    const hasProfilePhotoInBody = Object.prototype.hasOwnProperty.call(body, 'profile_photo_url');
    const profilePhotoFromBody = body.profile_photo_url ?? '';

    const existingUser = db.prepare('SELECT id, profile_photo_url FROM users WHERE id = ?').get(id);
    if (!existingUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const resolvedProfilePhoto = hasProfilePhotoInBody
      ? (profilePhotoFromBody || null)
      : (existingUser.profile_photo_url || null);

    if (!isValidProfilePhoto(resolvedProfilePhoto || '')) {
      return NextResponse.json(
        { error: 'Profile photo must be a valid image URL or data URL.' },
        { status: 400 }
      );
    }

    if (resolvedProfilePhoto && resolvedProfilePhoto.length > 2_000_000) {
      return NextResponse.json(
        { error: 'Profile photo is too large. Please use a smaller image.' },
        { status: 400 }
      );
    }

    const stmt = db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, phone = ?, profile_photo_url = ?
      WHERE id = ?
    `);
    
    stmt.run(name, email, phone, resolvedProfilePhoto, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'Email is already in use by another user.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Check if user has active loans
    const loans = db.prepare('SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND status = ?').get(id, 'active');
    if (loans.count > 0) {
      return NextResponse.json({ error: 'Cannot delete user with active loans.' }, { status: 400 });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
