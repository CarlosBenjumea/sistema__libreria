'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, User } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: ''
  });

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowForm(false);
        setFormData({ name: '', email: '', phone: '' });
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
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
          <h1 className="page-title">Registered Users</h1>
          <p style={{ color: 'var(--foreground)', opacity: 0.7 }}>Manage library members.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} />
          {showForm ? 'Cancel' : 'Add New User'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card stagger-1" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Add New User</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input required type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="e.g. john@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="e.g. 555-123-456" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save User</button>
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
                <th>Member</th>
                <th>Contact</th>
                <th>Registered</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '50%', color: 'var(--primary)' }}>
                        <User size={20} />
                      </div>
                      <span style={{ fontWeight: '500' }}>{user.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.875rem' }}>
                      <span>{user.email}</span>
                      <span style={{ opacity: 0.6 }}>{user.phone || 'No phone'}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{new Date(user.registered_date).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => handleDelete(user.id)} className="btn btn-secondary" style={{ padding: '0.5rem', color: 'var(--danger)', borderColor: 'transparent' }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
              <p>No members registered.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
