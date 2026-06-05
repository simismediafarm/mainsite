'use client';

import React, { useState, useEffect } from 'react';
import { Post } from '@simis/shared';
import PostCard from '../../components/PostCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Trigger search on query change (with a minor delay / immediate input response)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/mvp/search?q=${encodeURIComponent(query)}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Search failed');
        })
        .then((data) => {
          setResults(data.posts || []);
        })
        .catch((err) => {
          console.error(err);
          setResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div className="reader-container fade-in">
      <header style={styles.header}>
        <h1 style={{ fontSize: '32px', fontWeight: 800 }}>Search Stories</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Find articles by title, content, or tag</p>
      </header>

      {/* Search Bar Input */}
      <div style={styles.searchBarContainer}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics, titles, or tags..."
          style={styles.searchInput}
          autoFocus
        />
        {query && (
          <button onClick={() => setQuery('')} style={styles.clearBtn}>
            ✕
          </button>
        )}
      </div>

      {/* Results Section */}
      <div style={{ marginTop: '24px' }}>
        {isSearching && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
            Searching stories...
          </p>
        )}

        {!isSearching && results.length > 0 && (
          <div>
            <div style={styles.resultsHeader}>
              Found {results.length} {results.length === 1 ? 'result' : 'results'} for &quot;{query}&quot;
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {results.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        {!isSearching && results.length === 0 && query.trim() !== '' && (
          <div style={styles.emptyState}>
            <p>No matches found. Try refining your keywords or tags.</p>
          </div>
        )}

        {!query.trim() && (
          <div style={styles.placeholderState}>
            <p>Type a keyword to discover interesting articles on SIMIS MediaFarm.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    padding: '30px 0 20px 0',
  },
  searchBarContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    borderBottom: '1.5px solid var(--border-focus)',
    paddingBottom: '8px',
  },
  searchIcon: {
    fontSize: '20px',
    marginRight: '12px',
    color: 'var(--text-tertiary)',
  },
  searchInput: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: '22px',
    fontWeight: 500,
    outline: 'none',
    fontFamily: 'var(--font-sans)',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: 'var(--text-secondary)',
    padding: '4px',
  },
  resultsHeader: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.05em',
    marginBottom: '16px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 0',
    color: 'var(--text-secondary)',
  },
  placeholderState: {
    textAlign: 'center',
    padding: '60px 0',
    color: 'var(--text-tertiary)',
    fontSize: '15px',
  },
};
