'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    roles: ['admin', 'staff'],
  },
  {
    label: 'New Invoice',
    href: '/invoices/new',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
    roles: ['admin', 'staff'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ['admin'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    roles: ['admin'],
  },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const userRole = session?.user?.role || 'staff';

  const visibleItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside
      className="no-print"
      style={{
        width: '260px',
        minHeight: '100vh',
        backgroundColor: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Logo / Brand */}
      <div
        style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.svg" alt="Logo" style={{ height: '36px', width: 'auto' }} />
          <div>
            <div
              style={{
                color: '#CC19F4',
                fontWeight: 700,
                fontSize: '15px',
                lineHeight: '1.2',
              }}
            >
              Swift Tech
            </div>
            <div
              style={{
                color: 'var(--sidebar-text)',
                fontSize: '11px',
                opacity: 0.7,
              }}
            >
              Invoice Manager
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        <div style={{ marginBottom: '8px', padding: '0 8px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(161, 161, 170, 0.5)',
            }}
          >
            Menu
          </span>
        </div>
        {visibleItems.map(item => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '4px',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#ffffff' : 'var(--sidebar-text)',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(204, 25, 244, 0.2), rgba(204, 25, 244, 0.08))'
                  : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--sidebar-hover)';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--sidebar-text)';
                }
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: '20px',
                    background: '#CC19F4',
                    borderRadius: '0 3px 3px 0',
                  }}
                />
              )}
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      {session?.user && (
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>
                {session.user.name}
              </div>
              <div
                style={{
                  color: 'var(--sidebar-text)',
                  fontSize: '11px',
                  opacity: 0.6,
                }}
              >
                {session.user.role === 'admin' ? 'Administrator' : 'Staff'}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--sidebar-text)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--sidebar-text)';
                e.currentTarget.style.background = 'transparent';
              }}
              title="Sign out"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
