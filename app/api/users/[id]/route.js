import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone } = body;

    const stmt = db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, phone = ?
      WHERE id = ?
    `);
    
    stmt.run(name, email, phone, id);
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
