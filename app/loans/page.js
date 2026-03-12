'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, ClipboardSignature } from 'lucide-react';

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    book_id: '', user_id: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loansRes, booksRes, usersRes] = await Promise.all([
        fetch('/api/loans'), fetch('/api/books'), fetch('/api/users')
      ]);
      setLoans(await loansRes.json());
      setBooks(await booksRes.json());
      setUsers(await usersRes.json());
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.book_id || !formData.user_id) return alert('Please select a book and a user.');
    
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowForm(false);
        setFormData({ book_id: '', user_id: '' });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturn = async (id) => {
    if (!confirm('Mark this book as returned?')) return;
    
    try {
      const res = await fetch(`/api/loans/${id}`, { method: 'PUT' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Loan Management</h1>
          <p style={{ color: 'var(--foreground)', opacity: 0.7 }}>Track borrowed and returned books.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} />
          {showForm ? 'Cancel' : 'New Loan'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card stagger-1" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Create New Loan</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Select Book</label>
              <select className="form-input" value={formData.book_id} onChange={e => setFormData({...formData, book_id: e.target.value})}>
                <option value="">-- Choose a available book --</option>
                {books.filter(b => b.available_copies > 0).map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title} ({book.available_copies} available)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Select User</label>
              <select className="form-input" value={formData.user_id} onChange={e => setFormData({...formData, user_id: e.target.value})}>
                <option value="">-- Choose a member --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ minWidth: '150px' }}>Issue Book</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
      ) : (
        <div className="glass-card stagger-2" style={{ animationDelay: '0.2s', animationFillMode: 'both', animationName: 'fadeIn', animationDuration: '0.4s', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Book Title</th>
                <th>Member</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan.id} style={{ opacity: loan.status === 'returned' ? 0.7 : 1 }}>
                  <td style={{ fontSize: '0.875rem' }}>{new Date(loan.loan_date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: '500' }}>{loan.book_title}</td>
                  <td>{loan.user_name}</td>
                  <td>
                    <span className={`badge ${loan.status === 'active' ? 'badge-warning' : 'badge-success'}`}>
                      {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {loan.status === 'active' ? (
                      <button onClick={() => handleReturn(loan.id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                        <CheckCircle2 size={16} />
                        Return
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.875rem', opacity: 0.6, fontStyle: 'italic' }}>
                        Returned {new Date(loan.return_date).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loans.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
              <ClipboardSignature size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No loan records found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
