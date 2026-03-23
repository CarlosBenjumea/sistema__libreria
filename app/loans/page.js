'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, ClipboardSignature } from 'lucide-react';
import {
  getActiveUserIdFromStorage,
  subscribeActiveUserChanges,
} from '@/lib/active-user-client';

function formatDurationFromSeconds(totalSecondsInput) {
  const totalSeconds = Math.max(0, Number(totalSecondsInput) || 0);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${Math.max(1, Math.floor(totalSeconds))}s`;
}

function formatPendingTime(loan, nowMs) {
  if (loan.status !== 'active') return '--';

  const dueMs = new Date(loan.due_date).getTime();
  const seconds = Math.ceil((dueMs - nowMs) / 1000);

  if (seconds >= 0) return formatDurationFromSeconds(seconds);
  return `Retraso ${formatDurationFromSeconds(Math.abs(seconds))}`;
}

function getPenaltySecondsLeft(user, nowMs) {
  if (!user?.penalized_until) return 0;
  const diff = Math.ceil((new Date(user.penalized_until).getTime() - nowMs) / 1000);
  return diff > 0 ? diff : 0;
}

function getDeliveryBadgeConfig(loan) {
  if (loan.status === 'active') {
    return {
      text: 'Pendiente',
      className: loan.delivery_status === 'late' ? 'badge-danger' : 'badge-warning',
    };
  }

  if (loan.delivery_status === 'late') {
    return { text: 'Con retraso', className: 'badge-danger' };
  }

  return { text: 'A tiempo', className: 'badge-success' };
}

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState('');
  const [nowMs, setNowMs] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    book_id: ''
  });

  const fetchData = async (userId) => {
    setLoading(true);
    try {
      const [booksRes, usersRes] = await Promise.all([
        fetch('/api/books'), fetch('/api/users')
      ]);
      const booksData = await booksRes.json();
      const usersData = await usersRes.json();

      let loansData = [];
      if (userId) {
        const loansRes = await fetch(`/api/loans?user_id=${userId}`);
        loansData = await loansRes.json();
      }

      setLoans(Array.isArray(loansData) ? loansData : []);
      setBooks(Array.isArray(booksData) ? booksData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setActiveUserId(getActiveUserIdFromStorage());
    }, 0);

    const unsubscribe = subscribeActiveUserChanges((userId) => {
      setActiveUserId((previousUserId) => (previousUserId === userId ? previousUserId : userId));
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData(activeUserId);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      setShowForm(false);
      setFormData({ book_id: '' });
    };
  }, [activeUserId]);

  useEffect(() => {
    const immediateId = setTimeout(() => {
      setNowMs(Date.now());
    }, 0);

    const timerId = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      clearTimeout(immediateId);
      clearInterval(timerId);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.book_id || !activeUserId) return alert('Selecciona un usuario activo y un libro.');
    
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: formData.book_id,
          user_id: Number(activeUserId),
        })
      });
      
      if (res.ok) {
        setShowForm(false);
        setFormData({ book_id: '' });
        fetchData(activeUserId);
      } else {
        const data = await res.json();
        alert(data.error || 'No se pudo crear la reserva.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturn = async (id) => {
    if (!confirm('Mark this book as returned?')) return;
    
    try {
      const res = await fetch(`/api/loans/${id}`, { method: 'PUT' });
      const data = await res.json();
      if (res.ok) {
        if (data.late_return) {
          alert(`Entrega tardia. Penalizacion activa durante ${formatDurationFromSeconds(data.penalty_seconds)}.`);
        }
        fetchData(activeUserId);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeUser = users.find((user) => String(user.id) === String(activeUserId));
  const activeUserPenaltySeconds = getPenaltySecondsLeft(activeUser, nowMs);

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Loan Management</h1>
          <p style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            {activeUser
              ? `Prestamos de ${activeUser.name}. Solo se muestran los suyos.`
              : 'Selecciona un usuario en el selector inferior izquierdo.'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
          disabled={!activeUserId}
        >
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
              <label className="form-label">Active User</label>
              <div className="form-input" style={{ minHeight: '42px', display: 'flex', alignItems: 'center' }}>
                {activeUser ? `${activeUser.name} (${activeUser.email})` : 'Sin usuario seleccionado'}
              </div>
              {activeUserPenaltySeconds > 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>
                  Penalizado por retraso: {formatDurationFromSeconds(activeUserPenaltySeconds)}
                </span>
              ) : null}
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ minWidth: '150px' }}
                disabled={!activeUserId || activeUserPenaltySeconds > 0}
              >
                Issue Book
              </button>
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
                <th>Tiempo pendiente</th>
                <th>Status</th>
                <th>Entrega</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => {
                const deliveryBadge = getDeliveryBadgeConfig(loan);
                return (
                <tr key={loan.id} style={{ opacity: loan.status === 'returned' ? 0.7 : 1 }}>
                  <td style={{ fontSize: '0.875rem' }}>{new Date(loan.loan_date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: '500' }}>{loan.book_title}</td>
                  <td>
                    <span
                      className={`badge ${
                        loan.status === 'active'
                          ? new Date(loan.due_date).getTime() < nowMs
                            ? 'badge-danger'
                            : 'badge-primary'
                          : 'badge-success'
                      }`}
                    >
                      {formatPendingTime(loan, nowMs)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${loan.status === 'active' ? 'badge-warning' : 'badge-success'}`}>
                      {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${deliveryBadge.className}`}>{deliveryBadge.text}</span>
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
              )})}
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
