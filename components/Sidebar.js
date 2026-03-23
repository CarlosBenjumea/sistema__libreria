'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  getActiveUserIdFromStorage,
  setActiveUserIdInStorage,
  subscribeActiveUserChanges,
  subscribeUsersUpdated,
} from '@/lib/active-user-client';
import {
  Library,
  BookCopy,
  Users,
  ClipboardList,
  BookmarkCheck,
  Share2,
  User,
  ChevronDown,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const userDropdownRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const links = [
    { name: 'Dashboard', href: '/', icon: Library },
    { name: 'Books', href: '/books', icon: BookCopy },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Loans', href: '/loans', icon: ClipboardList },
    { name: 'Tus libros', href: '/tus-libros', icon: BookmarkCheck },
    { name: 'Social', href: '/social', icon: Share2 },
  ];

  const loadUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();

        const parsedUsers = Array.isArray(data) ? data : [];
        const sortedUsers = [...parsedUsers].sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' })
        );
        setUsers(sortedUsers);

        const savedUserId = getActiveUserIdFromStorage();
        const fallbackUserId = sortedUsers.length ? String(sortedUsers[0].id) : '';
        const resolvedUserId =
          savedUserId && sortedUsers.some((user) => String(user.id) === savedUserId)
            ? savedUserId
            : fallbackUserId;

      setActiveUserId(resolvedUserId);
      if (resolvedUserId) {
        setActiveUserIdInStorage(resolvedUserId);
      }
    } catch (error) {
      console.error(error);
      setUsers([]);
      setActiveUserId('');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      await loadUsers();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    return subscribeUsersUpdated(() => {
      setLoadingUsers(true);
      setTimeout(async () => {
        await loadUsers();
      }, 0);
    });
  }, []);

  useEffect(() => {
    if (!activeUserId) return;
    setActiveUserIdInStorage(activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    return subscribeActiveUserChanges((userId) => {
      if (!userId) return;
      setActiveUserId((previousUserId) => (previousUserId === userId ? previousUserId : userId));
    });
  }, []);

  useEffect(() => {
    setIsUserDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!userDropdownRef.current) return;
      if (userDropdownRef.current.contains(event.target)) return;
      setIsUserDropdownOpen(false);
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeUser = users.find((user) => String(user.id) === String(activeUserId));

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

      <div
        ref={userDropdownRef}
        style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', position: 'relative' }}
      >
        <button
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'space-between', padding: '0.6rem 0.75rem' }}
          onClick={() => setIsUserDropdownOpen((previousOpen) => !previousOpen)}
          disabled={loadingUsers || users.length === 0}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
            {activeUser?.profile_photo_url ? (
              <Image
                src={activeUser.profile_photo_url}
                alt={`Avatar de ${activeUser.name}`}
                unoptimized
                width={26}
                height={26}
                style={{
                  width: '26px',
                  height: '26px',
                  objectFit: 'cover',
                  borderRadius: '9999px',
                  border: '1px solid var(--border)',
                  flexShrink: 0,
                }}
              />
            ) : (
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '9999px',
                  background: 'var(--primary-light)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                <User size={15} />
              </span>
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {loadingUsers
                ? 'Cargando usuarios...'
                : activeUser
                  ? activeUser.name
                  : users.length
                    ? 'Selecciona usuario'
                    : 'Sin usuarios'}
            </span>
          </span>
          <ChevronDown
            size={16}
            style={{
              opacity: 0.7,
              transform: isUserDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {isUserDropdownOpen && users.length > 0 ? (
          <div
            className="glass-card"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 0.45rem)',
              left: 0,
              width: '100%',
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '0.35rem',
              zIndex: 20,
            }}
          >
            {users.map((user) => {
              const isSelected = String(user.id) === String(activeUserId);
              return (
                <button
                  key={user.id}
                  className="btn btn-secondary"
                  onClick={() => {
                    setActiveUserId(String(user.id));
                    setIsUserDropdownOpen(false);
                  }}
                  style={{
                    justifyContent: 'flex-start',
                    width: '100%',
                    background: isSelected ? 'var(--primary-light)' : 'transparent',
                    borderColor: 'transparent',
                    color: isSelected ? 'var(--primary)' : 'var(--foreground)',
                    fontWeight: isSelected ? 600 : 500,
                    padding: '0.55rem 0.6rem',
                  }}
                >
                  {user.profile_photo_url ? (
                    <Image
                      src={user.profile_photo_url}
                      alt={`Avatar de ${user.name}`}
                      unoptimized
                      width={24}
                      height={24}
                      style={{
                        width: '24px',
                        height: '24px',
                        objectFit: 'cover',
                        borderRadius: '9999px',
                        border: '1px solid var(--border)',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '9999px',
                        background: 'var(--primary-light)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        flexShrink: 0,
                      }}
                    >
                      <User size={14} />
                    </span>
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.875rem', color: 'var(--foreground)', opacity: 0.7 }}>
        <p>Premium Library System v1.0</p>
      </div>
    </aside>
  );
}
