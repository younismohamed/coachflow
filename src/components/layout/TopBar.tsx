'use client';

import { useState, useEffect } from 'react';
import type { Profile } from '@/lib/supabase/types';

export default function TopBar({ profile }: { profile: Profile }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [viewAs, setViewAs] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
    const savedView = localStorage.getItem('viewAs');
    if (savedView) setViewAs(savedView);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleViewAs = (role: string) => {
    if (role === (profile as any).role) {
      localStorage.removeItem('viewAs');
      setViewAs('');
    } else {
      localStorage.setItem('viewAs', role);
      setViewAs(role);
    }
    window.location.reload();
  };

  const initials = (profile.name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isAdmin = (profile as any).role === 'admin';
  const currentView = viewAs || (profile as any).role;

  return (
    <header style={{
      height: '64px',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {/* Left — date + view indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        {viewAs && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '3px 10px', borderRadius: '99px',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)',
            fontSize: '12px', fontWeight: 500, color: '#f59e0b',
          }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Viewing as {viewAs.charAt(0).toUpperCase() + viewAs.slice(1)}
            <button
              onClick={() => handleViewAs((profile as any).role)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', padding: '0 0 0 4px', fontSize: '14px', lineHeight: 1 }}
            >×</button>
          </div>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* View As switcher — only for admin */}
        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px' }}>
            {['admin', 'manager', 'employee'].map((r) => (
              <button
                key={r}
                onClick={() => handleViewAs(r)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: currentView === r ? 'var(--accent)' : 'transparent',
                  color: currentView === r ? 'white' : 'var(--text-muted)',
                }}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'var(--bg)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s',
          }}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* User menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '6px 10px 6px 6px', borderRadius: '10px',
              background: menuOpen ? 'var(--bg)' : 'transparent',
              border: '1px solid', borderColor: menuOpen ? 'var(--border)' : 'transparent',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '12px', fontWeight: 700, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {profile.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                {(profile as any).role.charAt(0).toUpperCase() + (profile as any).role.slice(1)}
              </div>
            </div>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: '220px', background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 50,
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{profile.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{profile.email}</div>
              </div>
              <div style={{ padding: '6px' }}>
                <form action="/auth/signout" method="POST">
                  <button type="submit" style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 10px', borderRadius: '8px', background: 'transparent',
                    border: 'none', color: '#ef4444', fontSize: '13px', cursor: 'pointer',
                  }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
