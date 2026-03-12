'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Book } from 'lucide-react';

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '', author: '', isbn: '', total_copies: 1, cover_color: '#4f46e5'
  });

  const fetchBooks = () => {
    setLoading(true);
    fetch('/api/books')
      .then(res => res.json())
      .then(data => {
        setBooks(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowForm(false);
        setFormData({ title: '', author: '', isbn: '', total_copies: 1, cover_color: '#4f46e5' });
        fetchBooks();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    
    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBooks();
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
          <h1 className="page-title">Books Inventory</h1>
          <p style={{ color: 'var(--foreground)', opacity: 0.7 }}>Manage your library collection.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} />
          {showForm ? 'Cancel' : 'Add New Book'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card stagger-1" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Add New Book</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input required className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. 1984" />
            </div>
            <div className="form-group">
              <label className="form-label">Author</label>
              <input required className="form-input" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} placeholder="e.g. George Orwell" />
            </div>
            <div className="form-group">
              <label className="form-label">ISBN</label>
              <input required className="form-input" value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value})} placeholder="e.g. 978-0-452-28423-4" />
            </div>
            <div className="form-group">
              <label className="form-label">Total Copies</label>
              <input required type="number" min="1" className="form-input" value={formData.total_copies} onChange={e => setFormData({...formData, total_copies: e.target.value === '' ? '' : parseInt(e.target.value)})} />
            </div>
            <div className="form-group">
              <label className="form-label">Cover Color</label>
              <input type="color" className="form-input" value={formData.cover_color} onChange={e => setFormData({...formData, cover_color: e.target.value})} style={{ height: '42px', padding: '0.25rem' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Book</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
      ) : (
        <div className="grid grid-cols-4 stagger-2" style={{ animationDelay: '0.2s', animationFillMode: 'both', animationName: 'fadeIn', animationDuration: '0.4s' }}>
          {books.map(book => (
            <div key={book.id} className="glass-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '140px', background: book.cover_color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.8)' }}>
                <Book size={48} />
              </div>
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{book.title}</h3>
                <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1rem' }}>{book.author}</p>
                
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.875rem' }}>
                     <span style={{ fontWeight: 600, color: book.available_copies > 0 ? 'var(--success)' : 'var(--danger)' }}>
                       {book.available_copies}
                     </span>
                     <span style={{ opacity: 0.6 }}> / {book.total_copies}</span>
                  </div>
                  <button onClick={() => handleDelete(book.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {books.length === 0 && !loading && (
            <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
              <Book size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No books in inventory.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
