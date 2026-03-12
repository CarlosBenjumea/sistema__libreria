import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const loans = db.prepare(`
      SELECT loans.*, books.title as book_title, users.name as user_name 
      FROM loans
      JOIN books ON loans.book_id = books.id
      JOIN users ON loans.user_id = users.id
      ORDER BY loans.status ASC, loans.loan_date DESC
    `).all();
    return NextResponse.json(loans);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { book_id, user_id } = body;

    // Check book availability
    const book = db.prepare('SELECT available_copies FROM books WHERE id = ?').get(book_id);
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    if (book.available_copies <= 0) return NextResponse.json({ error: 'Book is not available for loan' }, { status: 400 });

    // Begin transaction for creating loan and reducing copies
    const transaction = db.transaction(() => {
      const loanStmt = db.prepare(`
        INSERT INTO loans (book_id, user_id, loan_date, status)
        VALUES (?, ?, ?, 'active')
      `);
      const result = loanStmt.run(book_id, user_id, new Date().toISOString());

      const updateBookStmt = db.prepare('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?');
      updateBookStmt.run(book_id);

      return result.lastInsertRowid;
    });

    const loanId = transaction();
    return NextResponse.json({ id: loanId, success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
