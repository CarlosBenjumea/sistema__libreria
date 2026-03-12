import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, author, isbn, total_copies, cover_color } = body;
    
    // Total copies adjustment logic (simple replacement for this demo)
    // To properly adjust available_copies, you need to calculate the difference
    const book = db.prepare('SELECT total_copies, available_copies FROM books WHERE id = ?').get(id);
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    
    const diff = total_copies - book.total_copies;
    const new_available = book.available_copies + diff;

    if (new_available < 0) {
      return NextResponse.json({ error: 'Cannot reduce total copies below active loans' }, { status: 400 });
    }

    const stmt = db.prepare(`
      UPDATE books 
      SET title = ?, author = ?, isbn = ?, total_copies = ?, available_copies = ?, cover_color = ?
      WHERE id = ?
    `);
    
    stmt.run(title, author, isbn, total_copies, new_available, cover_color, id);
    return NextResponse.json({ success: true, new_available });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'A book with this ISBN already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Check if book has active loans
    const loans = db.prepare('SELECT COUNT(*) as count FROM loans WHERE book_id = ? AND status = ?').get(id, 'active');
    if (loans.count > 0) {
      return NextResponse.json({ error: 'Cannot delete book with active loans.' }, { status: 400 });
    }

    db.prepare('DELETE FROM books WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
