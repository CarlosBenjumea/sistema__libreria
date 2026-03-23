import { NextResponse } from 'next/server';
import db from '@/lib/db';
import {
  calculateDueDate,
  formatSecondsAsDuration,
  LOAN_MAX_DURATION_MS,
  getSecondsDifference,
} from '@/lib/loan-policy';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    let loans;

    if (userId) {
      const parsedUserId = Number(userId);
      if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
        return NextResponse.json({ error: 'Invalid user_id.' }, { status: 400 });
      }

      loans = db.prepare(`
        SELECT loans.*, books.title as book_title, users.name as user_name
        FROM loans
        JOIN books ON loans.book_id = books.id
        JOIN users ON loans.user_id = users.id
        WHERE loans.user_id = ?
        ORDER BY loans.status ASC, loans.loan_date DESC
      `).all(parsedUserId);
    } else {
      loans = db.prepare(`
        SELECT loans.*, books.title as book_title, users.name as user_name 
        FROM loans
        JOIN books ON loans.book_id = books.id
        JOIN users ON loans.user_id = users.id
        ORDER BY loans.status ASC, loans.loan_date DESC
      `).all();
    }

    const now = new Date();
    const normalizedLoans = loans.map((loan) => {
      const dueDate = loan.due_date ? new Date(loan.due_date) : calculateDueDate(loan.loan_date);
      const signedRemainingSeconds =
        loan.status === 'active' ? getSecondsDifference(now, dueDate) : null;
      const returnDate = loan.return_date ? new Date(loan.return_date) : null;
      const returnedWithDelay =
        loan.status === 'returned' && returnDate ? returnDate.getTime() > dueDate.getTime() : false;
      const deliveryStatus =
        loan.status === 'active'
          ? signedRemainingSeconds < 0
            ? 'late'
            : 'pending'
          : returnedWithDelay
            ? 'late'
            : 'on_time';

      return {
        ...loan,
        due_date: dueDate.toISOString(),
        max_duration_ms: LOAN_MAX_DURATION_MS,
        remaining_seconds: signedRemainingSeconds,
        is_overdue: loan.status === 'active' && signedRemainingSeconds < 0,
        overdue_seconds:
          loan.status === 'active' && signedRemainingSeconds < 0
            ? Math.abs(signedRemainingSeconds)
            : 0,
        returned_with_delay: returnedWithDelay,
        delivery_status: deliveryStatus,
      };
    });

    return NextResponse.json(normalizedLoans);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { book_id, user_id } = body;
    const now = new Date();

    const user = db.prepare('SELECT id, penalized_until FROM users WHERE id = ?').get(user_id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.penalized_until) {
      const penalizedUntil = new Date(user.penalized_until);
      if (penalizedUntil.getTime() > now.getTime()) {
        const remainingPenaltySeconds = getSecondsDifference(now, penalizedUntil);
        return NextResponse.json(
          {
            error: `User has a late-return penalty. Wait ${formatSecondsAsDuration(remainingPenaltySeconds)} before a new reservation.`,
            penalty_until: penalizedUntil.toISOString(),
            penalty_remaining_seconds: remainingPenaltySeconds,
            penalty_remaining_label: formatSecondsAsDuration(remainingPenaltySeconds),
          },
          { status: 403 }
        );
      }

      db.prepare('UPDATE users SET penalized_until = NULL WHERE id = ?').run(user_id);
    }

    // Check book availability
    const book = db.prepare('SELECT available_copies FROM books WHERE id = ?').get(book_id);
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    if (book.available_copies <= 0) {
      return NextResponse.json({ error: 'Book is not available for loan' }, { status: 400 });
    }

    const loanDate = now;
    const dueDate = calculateDueDate(loanDate);

    // Begin transaction for creating loan and reducing copies
    const transaction = db.transaction(() => {
      const loanStmt = db.prepare(`
        INSERT INTO loans (book_id, user_id, loan_date, due_date, status)
        VALUES (?, ?, ?, ?, 'active')
      `);
      const result = loanStmt.run(book_id, user_id, loanDate.toISOString(), dueDate.toISOString());

      const updateBookStmt = db.prepare('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?');
      updateBookStmt.run(book_id);

      return result.lastInsertRowid;
    });

    const loanId = transaction();
    return NextResponse.json(
      {
        id: loanId,
        success: true,
        due_date: dueDate.toISOString(),
        remaining_seconds: getSecondsDifference(new Date(), dueDate),
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
