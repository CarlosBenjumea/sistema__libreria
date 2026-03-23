'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Trash2, Book, ImagePlus } from 'lucide-react';

const MAX_IMAGE_BYTES = 1_500_000;

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    total_copies: 1,
    cover_color: '#4f46e5',
    cover_image_url: '',
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

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      alert('La imagen es demasiado grande. Usa una imagen menor a 1.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setFormData((previousForm) => ({ ...previousForm, cover_image_url: result }));
    };
    reader.onerror = () => {
      alert('No se pudo leer la portada seleccionada.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = () => {
    setFormData((previousForm) => ({ ...previousForm, cover_image_url: '' }));
  };

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
        setFormData({
          title: '',
          author: '',
          isbn: '',
          total_copies: 1,
          cover_color: '#4f46e5',
          cover_image_url: '',
        });
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
            <div className="form-group">
              <label className="form-label">Cover Photo (optional)</label>
              <label className="btn btn-secondary" style={{ width: 'fit-content', borderStyle: 'dashed' }}>
                <ImagePlus size={16} />
                Upload cover
                <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} />
              </label>
              <span style={{ fontSize: '0.8rem', opacity: 0.65 }}>
                Image formats. Max size: 1.5MB.
              </span>
            </div>
            <div className="form-group">
              {formData.cover_image_url ? (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Image
                    src={formData.cover_image_url}
                    alt="Cover preview"
                    unoptimized
                    width={120}
                    height={120}
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  />
                  <button type="button" className="btn btn-secondary" onClick={handleRemoveCover}>
                    Remove photo
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    height: '120px',
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.6,
                    fontSize: '0.9rem',
                  }}
                >
                  No cover selected
                </div>
              )}
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ minWidth: '150px' }}>Save Book</button>
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
              {book.cover_image_url ? (
                <Image
                  src={book.cover_image_url}
                  alt={`Cover of ${book.title}`}
                  unoptimized
                  width={800}
                  height={140}
                  style={{
                    width: '100%',
                    height: '140px',
                    objectFit: 'cover',
                    borderBottom: '1px solid var(--card-border)',
                  }}
                />
              ) : (
                <div style={{ height: '140px', background: book.cover_color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.8)' }}>
                  <Book size={48} />
                </div>
              )}
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
