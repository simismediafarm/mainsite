'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TopBar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Sync theme state with document attribute on mount
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' || 'light';
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
  };

  return (
    <header style={styles.header}>
      <div style={styles.navWrapper}>
        <div style={styles.left}>
          <Link href="/" style={styles.logo}>
            <span style={styles.logoIcon}>🧭</span>
            <span style={styles.logoText}>SIMIS <span style={styles.logoSub}>MediaFarm</span></span>
          </Link>
        </div>

        <nav style={styles.nav}>
          <Link 
            href="/search" 
            style={{ 
              ...styles.navLink, 
              color: pathname === '/search' ? 'var(--primary-color)' : 'var(--text-secondary)' 
            }}
          >
            🔍 Search
          </Link>
          <Link 
            href="/create" 
            style={{ 
              ...styles.navLink, 
              color: pathname === '/create' ? 'var(--primary-color)' : 'var(--text-secondary)' 
            }}
          >
            ✍️ Write
          </Link>
          <Link 
            href="/admin" 
            style={{ 
              ...styles.navLink, 
              color: pathname === '/admin' ? 'var(--primary-color)' : 'var(--text-secondary)' 
            }}
          >
            ⚙️ Admin
          </Link>

          <button onClick={toggleTheme} style={styles.themeToggle} aria-label="Toggle Theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </nav>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'var(--bg-primary)',
    borderBottom: '1px solid var(--border-color)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  navWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '12px 20px',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
  },
  logoIcon: {
    fontSize: '22px',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  logoSub: {
    fontWeight: 400,
    color: 'var(--text-secondary)',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  navLink: {
    fontSize: '14px',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'color 0.15s ease',
  },
  themeToggle: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'background-color 0.15s',
  },
};
