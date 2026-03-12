'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Library, BookCopy, Users, ClipboardList } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', href: '/', icon: Library },
    { name: 'Books', href: '/books', icon: BookCopy },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Loans', href: '/loans', icon: ClipboardList },
  ];

  return (
    <aside className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
        <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
          <Library size={24} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.025em' }}>Biblioteca</h2>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          
          return (
            <Link
              key={link.name}
              href={link.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--primary)' : 'var(--foreground)',
                background: isActive ? 'var(--primary-light)' : 'transparent',
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Icon size={20} />
              {link.name}
            </Link>
          );
        })}
      </nav>
      
      <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border)', fontSize: '0.875rem', color: 'var(--foreground)', opacity: 0.7 }}>
        <p>Premium Library System v1.0</p>
      </div>
    </aside>
  );
}
