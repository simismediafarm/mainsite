/**
 * page.tsx — SIMIS Natural Language Search Page
 */

"use client";

import React, { useState } from 'react';
import { API_BASE } from '../../lib/kernel-api';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  slug: string;
  metadata: {
    category: string;
    author: string;
  };
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    fetch(`${API_BASE}/api/v2/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setResults(data.items);
        } else {
          setResults([]);
        }
        setSearching(false);
      })
      .catch(() => {
        setResults([]);
        setSearching(false);
      });
  };

  return (
    <div style={searchStyles.container}>
      <header style={searchStyles.header}>
        <h1 style={searchStyles.title}>🔎 AI Discovery Search</h1>
        <p style={searchStyles.sub}>Search tech reviews, hot price drops, and product matrices using natural language.</p>
      </header>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} style={searchStyles.form}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Find noise cancelling headphones with the best battery..."
          style={searchStyles.input}
        />
        <button type="submit" style={searchStyles.btn}>Search</button>
      </form>

      {/* Search Results list */}
      <div style={searchStyles.results}>
        {searching && <p>Searching indexes...</p>}
        
        {!searching && results.length > 0 && (
          <div style={searchStyles.grid}>
            {results.map(item => (
              <div key={item.id} className="glass-container hover-lift" style={searchStyles.card}>
                <span style={searchStyles.category}>{item.metadata.category}</span>
                <h3 style={searchStyles.cardTitle}>{item.title}</h3>
                <div style={searchStyles.footer}>
                  <a href={`/read/${item.slug}`} style={searchStyles.link}>View Details ➔</a>
                  <span style={searchStyles.type}>{item.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!searching && results.length === 0 && query && (
          <div style={searchStyles.empty}>
            <p>No results found for "{query}". Try another search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const searchStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  title: {
    fontSize: '32px',
    color: 'var(--text-primary)',
  },
  sub: {
    color: 'var(--text-secondary)',
    fontSize: '15px',
  },
  form: {
    display: 'flex',
    gap: '12px',
  },
  input: {
    flexGrow: 1,
    padding: '16px 20px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--surface-border)',
    fontSize: '16px',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  btn: {
    background: 'var(--primary)',
    color: '#fff',
    border: '0',
    fontWeight: 600,
    padding: '0 32px',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontSize: '16px',
  },
  results: {
    marginTop: '16px',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    padding: '24px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  category: {
    color: 'var(--primary)',
    fontWeight: 600,
    fontSize: '13px',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: '18px',
    color: 'var(--text-primary)',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
  },
  link: {
    color: 'var(--text-primary)',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '14px',
  },
  type: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    border: '1px solid var(--surface-border)',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: 'var(--text-secondary)',
  }
};
