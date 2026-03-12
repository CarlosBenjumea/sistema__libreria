import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const data = {
      totalBooks: db.prepare('SELECT COUNT(*) as count FROM books').get().count,
      totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      activeLoans: db.prepare('SELECT COUNT(*) as count FROM loans WHERE status = ?').get('active').count,
      recentActivity: db.prepare(`
        SELECT loans.id, loans.loan_date, loans.status, books.title as book_title, users.name as user_name
        FROM loans
        JOIN books ON loans.book_id = books.id
        JOIN users ON loans.user_id = users.id
        ORDER BY loans.loan_date DESC
        LIMIT 5
      `).all(),
    };
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}
