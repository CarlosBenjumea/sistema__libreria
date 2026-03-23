'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  getActiveUserIdFromStorage,
  subscribeActiveUserChanges,
} from '@/lib/active-user-client';
import {
  BookCopy,
  CalendarClock,
  CircleCheck,
  ImagePlus,
  MessageSquareText,
  Pencil,
  Share2,
  Star,
  X,
} from 'lucide-react';

const MAX_IMAGE_BYTES = 1_500_000;
const INITIAL_FORM = {
  book_id: '',
  rating: 5,
  comment: '',
  photo_url: '',
};

function StarInput({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      {[1, 2, 3, 4, 5].map((ratingValue) => (
        <button
          key={ratingValue}
          type="button"
          onClick={() => onChange(ratingValue)}
          style={{ color: ratingValue <= value ? '#f59e0b' : '#94a3b8', padding: 0 }}
          aria-label={`Valorar con ${ratingValue} estrellas`}
        >
          <Star size={24} fill={ratingValue <= value ? '#f59e0b' : 'transparent'} />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value }) {
  return (
    <div style={{ display: 'flex', gap: '0.125rem' }}>
      {[1, 2, 3, 4, 5].map((ratingValue) => (
        <Star
          key={ratingValue}
          size={16}
          style={{ color: '#f59e0b' }}
          fill={ratingValue <= value ? '#f59e0b' : 'transparent'}
        />
      ))}
    </div>
  );
}

export default function TusLibrosPage() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [reservedBooks, setReservedBooks] = useState([]);
  const [loanHistory, setLoanHistory] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sharingBookId, setSharingBookId] = useState(null);

  const [activeBook, setActiveBook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      const parsedUsers = Array.isArray(data) ? data : [];
      setUsers(parsedUsers);
    } catch (error) {
      console.error(error);
      alert('No se pudieron cargar los usuarios.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchReservedBooks = async (userId) => {
    if (!userId) {
      setReservedBooks([]);
      return;
    }

    setLoadingBooks(true);
    try {
      const res = await fetch(`/api/reviews?user_id=${userId}`);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'No se pudieron cargar los libros reservados.');
        setReservedBooks([]);
        return;
      }

      setReservedBooks(Array.isArray(data.eligibleBooks) ? data.eligibleBooks : []);
    } catch (error) {
      console.error(error);
      setReservedBooks([]);
      alert('No se pudieron cargar los libros reservados.');
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchLoanHistory = async (userId) => {
    if (!userId) {
      setLoanHistory([]);
      return;
    }

    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/loans?user_id=${userId}`);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'No se pudo cargar el historial de libros.');
        setLoanHistory([]);
        return;
      }

      setLoanHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setLoanHistory([]);
      alert('No se pudo cargar el historial de libros.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSelectedUserId(getActiveUserIdFromStorage());
    }, 0);

    const unsubscribe = subscribeActiveUserChanges((userId) => {
      setSelectedUserId((previousUserId) => (previousUserId === userId ? previousUserId : userId));
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchReservedBooks(selectedUserId);
    fetchLoanHistory(selectedUserId);
    setIsModalOpen(false);
    setActiveBook(null);
    setFormData(INITIAL_FORM);
  }, [selectedUserId]);

  const handleOpenCreateModal = (book) => {
    setActiveBook(book);
    setFormData({
      ...INITIAL_FORM,
      book_id: String(book.id),
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book) => {
    setActiveBook(book);
    setFormData({
      book_id: String(book.id),
      rating: Number(book.review_rating) || 5,
      comment: book.review_comment || '',
      photo_url: book.review_photo_url || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActiveBook(null);
    setFormData(INITIAL_FORM);
  };

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
      setFormData((previousForm) => ({ ...previousForm, photo_url: result }));
    };
    reader.onerror = () => {
      alert('No se pudo leer la imagen seleccionada.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    if (!selectedUserId || !formData.book_id) return;

    if (!formData.comment.trim()) {
      alert('El comentario es obligatorio.');
      return;
    }

    setSubmitting(true);
    try {
      const isEditing = Boolean(activeBook?.review_id);
      const endpoint = isEditing ? `/api/reviews/${activeBook.review_id}` : '/api/reviews';
      const method = isEditing ? 'PUT' : 'POST';
      const payload = isEditing
        ? {
            rating: Number(formData.rating),
            comment: formData.comment,
            photo_url: formData.photo_url,
          }
        : {
            user_id: Number(selectedUserId),
            book_id: Number(formData.book_id),
            rating: Number(formData.rating),
            comment: formData.comment,
            photo_url: formData.photo_url,
          };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'No se pudo guardar la resena.');
        return;
      }

      handleCloseModal();
      await Promise.all([fetchReservedBooks(selectedUserId), fetchLoanHistory(selectedUserId)]);
    } catch (error) {
      console.error(error);
      alert('Error al guardar la resena.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareBook = async (book) => {
    if (!selectedUserId || !book?.id) return;

    setSharingBookId(book.id);
    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(selectedUserId),
          book_id: Number(book.id),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'No se pudo compartir en social.');
        return;
      }

      alert('Resena compartida en Social para los demas usuarios.');
    } catch (error) {
      console.error(error);
      alert('Error al compartir la resena.');
    } finally {
      setSharingBookId(null);
    }
  };

  const pendingReviews = reservedBooks.filter((book) => !book.review_id).length;
  const completedReviews = reservedBooks.length - pendingReviews;
  const activeLoanCount = loanHistory.filter((loan) => loan.status === 'active').length;
  const returnedLoanCount = loanHistory.filter((loan) => loan.status === 'returned').length;
  const isEditing = Boolean(activeBook?.review_id);
  const activeUser = users.find((user) => String(user.id) === String(selectedUserId));

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tus libros</h1>
          <p style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            Libros reservados por usuario y boton para anadir comentario, valoracion y foto.
          </p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: 0 }}>
          <p className="form-label">Usuario activo</p>
          <h3 style={{ marginBottom: '0.25rem' }}>
            {loadingUsers
              ? 'Cargando usuarios...'
              : activeUser
                ? `${activeUser.name} (${activeUser.email})`
                : 'Selecciona un usuario en "Usuario rapido"'}
          </h3>
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
            Este panel se actualiza automaticamente con el selector de abajo a la izquierda.
          </p>
        </div>

        {selectedUserId ? (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-primary">Reservados: {reservedBooks.length}</span>
            <span className="badge badge-success">Resenas hechas: {completedReviews}</span>
            <span className="badge badge-warning">Pendientes: {pendingReviews}</span>
            <span className="badge badge-warning">Entrega pendiente: {activeLoanCount}</span>
            <span className="badge badge-success">Retornados: {returnedLoanCount}</span>
          </div>
        ) : null}
      </div>

      {loadingBooks ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>Cargando libros reservados...</div>
      ) : null}

      {!selectedUserId && !loadingUsers ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
          Selecciona un usuario en el panel lateral para ver sus datos.
        </div>
      ) : null}

      {!loadingBooks && selectedUserId && reservedBooks.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
          El usuario no tiene libros reservados todavia.
        </div>
      ) : null}

      {!loadingBooks && reservedBooks.length > 0 ? (
        <div className="grid grid-cols-2">
          {reservedBooks.map((book) => (
            <div key={book.id} className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>{book.title}</h3>
                  <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>{book.author}</p>
                </div>
                <span className={`badge ${book.review_id ? 'badge-success' : 'badge-warning'}`}>
                  {book.review_id ? 'Resena enviada' : 'Resena pendiente'}
                </span>
              </div>

              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-primary">Reservas: {book.total_loans}</span>
                {book.active_loans > 0 ? (
                  <span className="badge badge-warning">Activas ahora: {book.active_loans}</span>
                ) : null}
              </div>

              <p
                style={{
                  marginTop: '0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.85rem',
                  opacity: 0.75,
                }}
              >
                <CalendarClock size={14} />
                Ultima reserva:{' '}
                {book.last_loan_date ? new Date(book.last_loan_date).toLocaleDateString() : '--'}
              </p>

              {book.review_id ? (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <StarDisplay value={Number(book.review_rating) || 0} />
                    <span style={{ fontSize: '0.8rem', opacity: 0.65 }}>
                      {book.review_created_at
                        ? new Date(book.review_created_at).toLocaleDateString()
                        : ''}
                    </span>
                  </div>

                  <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                    <MessageSquareText size={14} style={{ verticalAlign: 'text-top', marginRight: '0.35rem' }} />
                    {book.review_comment}
                  </p>

                  {book.review_photo_url ? (
                    <Image
                      src={book.review_photo_url}
                      alt={`Foto de resena de ${book.title}`}
                      unoptimized
                      width={800}
                      height={220}
                      style={{
                        width: '100%',
                        height: '220px',
                        marginTop: '0.8rem',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                      }}
                    />
                  ) : null}
                </div>
              ) : null}

              {!book.review_id ? (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleOpenCreateModal(book)}
                    style={{ flex: 1 }}
                  >
                    <BookCopy size={16} />
                    Anadir comentario y valoracion
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleShareBook(book)}
                    style={{ flex: 1 }}
                    disabled={sharingBookId === book.id}
                  >
                    <Share2 size={16} />
                    {sharingBookId === book.id ? 'Compartiendo...' : 'Compartir usuarios'}
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleOpenEditModal(book)}
                    style={{ flex: 1 }}
                  >
                    <Pencil size={16} />
                    Editar resena
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleShareBook(book)}
                    style={{ flex: 1 }}
                    disabled={sharingBookId === book.id}
                  >
                    <Share2 size={16} />
                    {sharingBookId === book.id ? 'Compartiendo...' : 'Compartir usuarios'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {selectedUserId ? (
        <div className="glass-card" style={{ marginTop: '1.5rem', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.25rem 0.75rem' }}>
            <h3 style={{ marginBottom: '0.25rem' }}>Historial de libros del usuario</h3>
            <p style={{ opacity: 0.72, fontSize: '0.9rem' }}>
              Se muestran libros activos (entrega pendiente) y retornados con fecha.
            </p>
          </div>

          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>Cargando historial...</div>
          ) : loanHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', opacity: 0.7 }}>
              El usuario aun no tiene historial de prestamos.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Libro</th>
                  <th>Entrega</th>
                  <th>Fecha retorno</th>
                </tr>
              </thead>
              <tbody>
                {loanHistory.map((loan) => (
                  <tr key={loan.id}>
                    <td style={{ fontSize: '0.875rem' }}>
                      {loan.loan_date ? new Date(loan.loan_date).toLocaleDateString() : '--'}
                    </td>
                    <td style={{ fontWeight: 500 }}>{loan.book_title}</td>
                    <td>
                      <span className={`badge ${loan.status === 'active' ? 'badge-warning' : 'badge-success'}`}>
                        {loan.status === 'active' ? 'Entrega pendiente' : 'Retornado'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {loan.return_date ? new Date(loan.return_date).toLocaleDateString() : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      {isModalOpen && activeBook ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000,
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '760px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ marginBottom: '0.2rem' }}>
                  {isEditing ? 'Editar resena' : 'Nueva resena'}
                </h3>
                <p style={{ opacity: 0.75, fontSize: '0.9rem' }}>
                  Libro: <strong>{activeBook.title}</strong>
                </p>
              </div>
              <button className="btn btn-secondary" onClick={handleCloseModal} style={{ padding: '0.4rem' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="grid grid-cols-2" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Valoracion</label>
                <StarInput
                  value={Number(formData.rating)}
                  onChange={(newRating) => setFormData((previousForm) => ({ ...previousForm, rating: newRating }))}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Comentario</label>
                <textarea
                  required
                  rows={4}
                  className="form-input"
                  value={formData.comment}
                  onChange={(event) =>
                    setFormData((previousForm) => ({ ...previousForm, comment: event.target.value }))
                  }
                  placeholder="Escribe tu opinion del libro..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Foto (opcional)</label>
                <label className="btn btn-secondary" style={{ width: 'fit-content', borderStyle: 'dashed' }}>
                  <ImagePlus size={16} />
                  Subir foto
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                </label>
                <span style={{ fontSize: '0.8rem', opacity: 0.65 }}>
                  Formatos de imagen. Tamano maximo: 1.5MB.
                </span>
              </div>

              <div className="form-group">
                {formData.photo_url ? (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Image
                      src={formData.photo_url}
                      alt="Previsualizacion"
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
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        setFormData((previousForm) => ({ ...previousForm, photo_url: '' }))
                      }
                    >
                      Quitar foto
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
                    Sin foto seleccionada
                  </div>
                )}
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <CircleCheck size={16} />
                  {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar resena'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
