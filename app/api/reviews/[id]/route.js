import { NextResponse } from 'next/server';
import db from '@/lib/db';

function isValidPhoto(photoUrl) {
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
    const { rating, comment, photo_url = '' } = body;

    const review = db.prepare('SELECT id FROM reviews WHERE id = ?').get(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    }

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5.' }, { status: 400 });
    }

    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      return NextResponse.json({ error: 'Comment is required.' }, { status: 400 });
    }

    if (!isValidPhoto(photo_url)) {
      return NextResponse.json(
        { error: 'Photo must be a valid image URL or data URL.' },
        { status: 400 }
      );
    }

    if (photo_url && photo_url.length > 2_000_000) {
      return NextResponse.json(
        { error: 'Photo payload is too large. Please use a smaller image.' },
        { status: 400 }
      );
    }

    db.prepare(`
      UPDATE reviews
      SET rating = ?, comment = ?, photo_url = ?, updated_at = ?
      WHERE id = ?
    `).run(parsedRating, comment.trim(), photo_url || null, new Date().toISOString(), id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const review = db.prepare('SELECT id FROM reviews WHERE id = ?').get(id);

    if (!review) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    }

    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
