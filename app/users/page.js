'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Trash2, User, ImagePlus } from 'lucide-react';
import { notifyUsersUpdated } from '@/lib/active-user-client';

const MAX_IMAGE_BYTES = 1_500_000;

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', profile_photo_url: ''
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
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      alert('La imagen es demasiado grande. Usa una imagen menor a 1.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setFormData((previousForm) => ({ ...previousForm, profile_photo_url: result }));
    };
    reader.onerror = () => {
      alert('No se pudo leer la foto seleccionada.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData((previousForm) => ({ ...previousForm, profile_photo_url: '' }));
  };

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
        setFormData({ name: '', email: '', phone: '', profile_photo_url: '' });
        notifyUsersUpdated();
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
        notifyUsersUpdated();
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
            <div className="form-group">
              <label className="form-label">Profile Photo (optional)</label>
              <label className="btn btn-secondary" style={{ width: 'fit-content', borderStyle: 'dashed' }}>
                <ImagePlus size={16} />
                Upload photo
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
              </label>
              <span style={{ fontSize: '0.8rem', opacity: 0.65 }}>
                Image formats. Max size: 1.5MB.
              </span>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              {formData.profile_photo_url ? (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Image
                    src={formData.profile_photo_url}
                    alt="Profile preview"
                    unoptimized
                    width={72}
                    height={72}
                    style={{
                      width: '72px',
                      height: '72px',
                      objectFit: 'cover',
                      borderRadius: '9999px',
                      border: '1px solid var(--border)',
                    }}
                  />
                  <button type="button" className="btn btn-secondary" onClick={handleRemovePhoto}>
                    Remove photo
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '9999px',
                    border: '1px dashed var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.65,
                  }}
                >
                  <User size={28} />
                </div>
              )}
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ minWidth: '150px' }}>Save User</button>
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
                      {user.profile_photo_url ? (
                        <Image
                          src={user.profile_photo_url}
                          alt={`Avatar de ${user.name}`}
                          unoptimized
                          width={40}
                          height={40}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '9999px',
                            objectFit: 'cover',
                            border: '1px solid var(--border)',
                          }}
                        />
                      ) : (
                        <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '50%', color: 'var(--primary)' }}>
                          <User size={20} />
                        </div>
                      )}
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
