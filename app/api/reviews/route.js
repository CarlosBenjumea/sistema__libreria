import { NextResponse } from 'next/server';
import db from '@/lib/db';

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'si' || normalized === 'yes';
  }
  return false;
}

function isValidPhoto(photoUrl) {
  if (!photoUrl) return true;
  if (typeof photoUrl !== 'string') return false;
  return (
    photoUrl.startsWith('data:image/') ||
    photoUrl.startsWith('http://') ||
    photoUrl.startsWith('https://')
  );
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (userId) {
      const parsedUserId = Number(userId);
      if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
        return NextResponse.json({ error: 'Invalid user_id.' }, { status: 400 });
      }

      const eligibleBooks = db.prepare(`
        SELECT
          b.id,
          b.title,
          b.author,
          b.cover_color,
          MAX(l.loan_date) as last_loan_date,
          COUNT(l.id) as total_loans,
          SUM(CASE WHEN l.status = 'active' THEN 1 ELSE 0 END) as active_loans,
          r.id as review_id,
          r.rating as review_rating,
          r.comment as review_comment,
          r.recommendation as review_recommendation,
          r.would_recommend as review_would_recommend,
          r.photo_url as review_photo_url,
          r.created_at as review_created_at
        FROM loans l
        JOIN books b ON b.id = l.book_id
        LEFT JOIN reviews r ON r.book_id = b.id AND r.user_id = ?
        WHERE l.user_id = ?
        GROUP BY
          b.id,
          b.title,
          b.author,
          b.cover_color,
          r.id,
          r.rating,
          r.comment,
          r.recommendation,
          r.would_recommend,
          r.photo_url,
          r.created_at
        ORDER BY datetime(last_loan_date) DESC
      `).all(parsedUserId, parsedUserId);

      return NextResponse.json({ eligibleBooks });
    }

    const reviews = db.prepare(`
      SELECT
        r.*,
        u.name as user_name,
        u.email as user_email,
        b.title as book_title,
        b.author as book_author,
        b.cover_color as book_cover_color
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN books b ON b.id = r.book_id
      ORDER BY datetime(r.created_at) DESC
    `).all();

    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      user_id,
      book_id,
      rating,
      comment,
      recommendation = '',
      would_recommend = true,
      photo_url = '',
    } = body;

    if (!user_id || !book_id) {
      return NextResponse.json({ error: 'User and book are required.' }, { status: 400 });
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

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const book = db.prepare('SELECT id FROM books WHERE id = ?').get(book_id);
    if (!book) return NextResponse.json({ error: 'Book not found.' }, { status: 404 });

    const loan = db
      .prepare('SELECT id FROM loans WHERE user_id = ? AND book_id = ? LIMIT 1')
      .get(user_id, book_id);

    if (!loan) {
      return NextResponse.json(
        { error: 'This user can only review books they have borrowed.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO reviews (
        user_id,
        book_id,
        rating,
        comment,
        recommendation,
        would_recommend,
        photo_url,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      user_id,
      book_id,
      parsedRating,
      comment.trim(),
      (recommendation || '').trim(),
      parseBoolean(would_recommend) ? 1 : 0,
      photo_url || null,
      now,
      now
    );

    return NextResponse.json({ id: result.lastInsertRowid, success: true }, { status: 201 });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json(
        { error: 'This user already reviewed this book.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
