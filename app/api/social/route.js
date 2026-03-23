import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (userId) {
      const parsedUserId = Number(userId);
      if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
        return NextResponse.json({ error: 'Invalid user_id.' }, { status: 400 });
      }

      const sharesByUser = db.prepare(`
        SELECT
          s.*,
          u.name as shared_by_name,
          u.email as shared_by_email,
          b.title as book_title,
          b.author as book_author,
          b.cover_color as book_cover_color,
          b.cover_image_url as book_cover_image_url
        FROM social_shares s
        JOIN users u ON u.id = s.shared_by_user_id
        JOIN books b ON b.id = s.book_id
        WHERE s.shared_by_user_id = ?
        ORDER BY datetime(s.shared_at) DESC
      `).all(parsedUserId);

      return NextResponse.json(sharesByUser);
    }

    const allShares = db.prepare(`
      SELECT
        s.*,
        u.name as shared_by_name,
        u.email as shared_by_email,
        b.title as book_title,
        b.author as book_author,
        b.cover_color as book_cover_color,
        b.cover_image_url as book_cover_image_url
      FROM social_shares s
      JOIN users u ON u.id = s.shared_by_user_id
      JOIN books b ON b.id = s.book_id
      ORDER BY datetime(s.shared_at) DESC
    `).all();

    return NextResponse.json(allShares);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, book_id } = body;

    const parsedUserId = Number(user_id);
    const parsedBookId = Number(book_id);
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      return NextResponse.json({ error: 'Invalid user_id.' }, { status: 400 });
    }
    if (!Number.isInteger(parsedBookId) || parsedBookId <= 0) {
      return NextResponse.json({ error: 'Invalid book_id.' }, { status: 400 });
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(parsedUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const book = db.prepare('SELECT id FROM books WHERE id = ?').get(parsedBookId);
    if (!book) {
      return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    }

    const review = db.prepare(`
      SELECT rating, comment, photo_url
      FROM reviews
      WHERE user_id = ? AND book_id = ?
      LIMIT 1
    `).get(parsedUserId, parsedBookId);

    if (!review) {
      return NextResponse.json(
        { error: 'Primero crea una resena para poder compartirla.' },
        { status: 400 }
      );
    }

    const sharedAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO social_shares (
        shared_by_user_id,
        book_id,
        rating,
        comment,
        photo_url,
        shared_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(shared_by_user_id, book_id) DO UPDATE SET
        rating = excluded.rating,
        comment = excluded.comment,
        photo_url = excluded.photo_url,
        shared_at = excluded.shared_at
    `).run(
      parsedUserId,
      parsedBookId,
      review.rating,
      review.comment,
      review.photo_url || null,
      sharedAt
    );

    return NextResponse.json({ success: true, shared_at: sharedAt }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
