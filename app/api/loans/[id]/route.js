import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { calculateDueDate, calculatePenaltyUntil, getSecondsDifference } from '@/lib/loan-policy';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
    // Get loan to check if it's already returned
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(id);
    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    if (loan.status === 'returned') return NextResponse.json({ error: 'Book already returned' }, { status: 400 });

    const now = new Date();
    const dueDate = loan.due_date ? new Date(loan.due_date) : calculateDueDate(loan.loan_date);
    const isLateReturn = now.getTime() > dueDate.getTime();
    const penaltyUntil = isLateReturn ? calculatePenaltyUntil(now) : null;

    const transaction = db.transaction(() => {
      // Mark as returned
      db.prepare(`
        UPDATE loans 
        SET status = 'returned', return_date = ?, due_date = ?
        WHERE id = ?
      `).run(now.toISOString(), dueDate.toISOString(), id);

      // Increase available copies
      db.prepare('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?').run(loan.book_id);

      if (isLateReturn) {
        db.prepare('UPDATE users SET penalized_until = ? WHERE id = ?').run(
          penaltyUntil.toISOString(),
          loan.user_id
        );
      }
    });

    transaction();
    return NextResponse.json({
      success: true,
      late_return: isLateReturn,
      penalty_until: penaltyUntil ? penaltyUntil.toISOString() : null,
      penalty_seconds: penaltyUntil ? getSecondsDifference(now, penaltyUntil) : 0,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
