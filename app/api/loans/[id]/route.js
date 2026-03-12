import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
    // Get loan to check if it's already returned
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(id);
    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    if (loan.status === 'returned') return NextResponse.json({ error: 'Book already returned' }, { status: 400 });

    const transaction = db.transaction(() => {
      // Mark as returned
      db.prepare(`
        UPDATE loans 
        SET status = 'returned', return_date = ? 
        WHERE id = ?
      `).run(new Date().toISOString(), id);

      // Increase available copies
      db.prepare('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?').run(loan.book_id);
    });

    transaction();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
