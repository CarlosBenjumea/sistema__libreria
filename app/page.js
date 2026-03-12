'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Users, ClipboardSignature } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p style={{ color: 'var(--foreground)', opacity: 0.7 }}>Welcome back to the library management system.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 stagger-1" style={{ animationDelay: '0.1s', animationFillMode: 'both', animationName: 'fadeIn', animationDuration: '0.4s' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--foreground)', opacity: 0.7 }}>Total Books</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>{stats.totalBooks}</h3>
            </div>
            <div style={{ background: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
              <BookOpen size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--foreground)', opacity: 0.7 }}>Registered Users</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>{stats.totalUsers}</h3>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--foreground)', opacity: 0.7 }}>Active Loans</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>{stats.activeLoans}</h3>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--warning)' }}>
              <ClipboardSignature size={24} />
            </div>
          </div>
        </div>
      </div>

      <h2 className="stagger-2" style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '3rem', marginBottom: '1.5rem', animationDelay: '0.2s', animationFillMode: 'both', animationName: 'fadeIn', animationDuration: '0.4s' }}>
        Recent Activity
      </h2>
      
      <div className="glass-card stagger-3" style={{ animationDelay: '0.3s', animationFillMode: 'both', animationName: 'fadeIn', animationDuration: '0.4s', overflow: 'hidden' }}>
        {stats.recentActivity && stats.recentActivity.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Book</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentActivity.map((activity) => (
                <tr key={activity.id}>
                  <td>{new Date(activity.loan_date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: '500' }}>{activity.user_name}</td>
                  <td>{activity.book_title}</td>
                  <td>
                    <span className={`badge ${activity.status === 'active' ? 'badge-warning' : 'badge-success'}`}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--foreground)', opacity: 0.6 }}>
            <ClipboardSignature size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No recent loan activity found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
