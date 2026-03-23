'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { BookCopy, MessageSquareText, Share2, Star } from 'lucide-react';

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

export default function SocialPage() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchShares = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/social');
      const data = await res.json();
      setShares(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setShares([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Social</h1>
          <p style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            Resenas compartidas para que otros usuarios puedan valorarlas.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando publicaciones...</div>
      ) : shares.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
          Aun no hay resenas compartidas.
        </div>
      ) : (
        <div className="grid grid-cols-2">
          {shares.map((share) => (
            <div key={share.id} className="glass-card" style={{ overflow: 'hidden' }}>
              {share.book_cover_image_url ? (
                <Image
                  src={share.book_cover_image_url}
                  alt={`Portada de ${share.book_title}`}
                  unoptimized
                  width={800}
                  height={180}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    borderBottom: '1px solid var(--card-border)',
                  }}
                />
              ) : (
                <div
                  style={{
                    height: '180px',
                    background: share.book_cover_color || '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  <BookCopy size={48} />
                </div>
              )}

              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.2rem' }}>{share.book_title}</h3>
                    <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>{share.book_author}</p>
                  </div>
                  <span className="badge badge-primary">
                    <Share2 size={12} />
                    Compartido
                  </span>
                </div>

                <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', opacity: 0.75 }}>
                  por {share.shared_by_name} ({share.shared_by_email})
                </p>

                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <StarDisplay value={Number(share.rating) || 0} />
                  <span style={{ fontSize: '0.8rem', opacity: 0.65 }}>
                    {share.shared_at ? new Date(share.shared_at).toLocaleDateString() : ''}
                  </span>
                </div>

                <p style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap' }}>
                  <MessageSquareText size={14} style={{ verticalAlign: 'text-top', marginRight: '0.35rem' }} />
                  {share.comment}
                </p>

                {share.photo_url ? (
                  <Image
                    src={share.photo_url}
                    alt={`Foto de resena de ${share.book_title}`}
                    unoptimized
                    width={800}
                    height={220}
                    style={{
                      width: '100%',
                      height: '220px',
                      marginTop: '0.9rem',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
