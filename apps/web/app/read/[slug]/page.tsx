/**
 * page.tsx — SIMIS Article & Block Renderer Page
 */

"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '../../../lib/kernel-api';

interface Block {
  type: "paragraph" | "image" | "quote" | "product" | "embed" | "divider";
  content: any;
}

interface ContentBlockV2 {
  id: string;
  type: string;
  title: string;
  slug: string;
  blocks: Block[];
  metadata: {
    category: string;
    tags: string[];
    author: string;
    created_at: string;
  };
  trace: {
    poe_hash: string;
  };
}

export default function ArticlePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [content, setContent] = useState<ContentBlockV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const toggleBookmark = async () => {
    setIsBookmarked(!isBookmarked);
    // In real app, call API: POST /api/v2/public/bookmark
    try {
      await fetch(`${API_BASE}/api/v2/public/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: content?.id })
      });
    } catch (e) {
      console.error('Failed to bookmark', e);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("URL copied to clipboard!");
  };

  useEffect(() => {
    if (!slug) return;
    
    fetch(`${API_BASE}/api/v2/content/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setContent(data);
        } else {
          setContent(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setContent(null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <p>Loading article content...</p>;
  if (!content) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', color: 'var(--text-primary)' }}>⚠️ Article Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>The page you are looking for does not exist or has been archived.</p>
        <Link href="/" style={{ display: 'inline-block', marginTop: '16px', color: 'var(--primary)', textDecoration: 'underline' }}>Back to home feed</Link>
      </div>
    );
  }

  const jsonLdArticle = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: content.title,
    datePublished: content.metadata.created_at,
    author: {
      '@type': 'Person',
      name: content.metadata.author
    },
    publisher: {
      '@type': 'Organization',
      name: 'SIMIS Media',
      logo: {
        '@type': 'ImageObject',
        url: 'https://mediafarm.vercel.app/logo.png'
      }
    }
  };

  return (
    <div style={articleStyles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }}
      />
      <article style={articleStyles.article}>
        {/* Article Header */}
        <header style={articleStyles.header}>
          <span style={articleStyles.category}>{content.metadata.category}</span>
          <h1 style={articleStyles.title}>{content.title}</h1>
          <div style={articleStyles.meta}>
            Published by <span style={articleStyles.bold}>{content.metadata.author}</span> on {new Date(content.metadata.created_at).toLocaleDateString()}
          </div>
          
          {/* Social Utility Bar & Bookmark */}
          <div style={articleStyles.socialBar}>
            <button style={articleStyles.socialBtn} onClick={toggleBookmark}>
              {isBookmarked ? '🔖 Saved' : '🔖 Bookmark'}
            </button>
            <button style={articleStyles.socialBtn} onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(content.title)}`, '_blank')}>
              🐦 Twitter
            </button>
            <button style={articleStyles.socialBtn} onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(content.title)}`, '_blank')}>
              💼 LinkedIn
            </button>
            <button style={articleStyles.socialBtn} onClick={copyUrl}>
              🔗 Copy URL
            </button>
          </div>
        </header>

        {/* Content Block Renderer Engine */}
        <div style={articleStyles.body}>
          {content.blocks.map((block, idx) => {
            switch (block.type) {
              case 'paragraph':
                return <p key={idx} style={articleStyles.paragraph}>{block.content}</p>;
              case 'quote':
                return (
                  <blockquote key={idx} style={articleStyles.quote}>
                    &ldquo;{block.content}&rdquo;
                  </blockquote>
                );
              case 'product':
                return (
                  <div key={idx} className="glass-container interactive-glow" style={articleStyles.productCta}>
                    <div style={articleStyles.productInfo}>
                      <h4 style={articleStyles.productTitle}>{block.content.title}</h4>
                      <p style={articleStyles.productPrice}>Best Price: ${block.content.price}</p>
                    </div>
                    <a href={block.content.url} target="_blank" rel="noopener noreferrer" style={articleStyles.productBtn}>
                      Buy Product
                    </a>
                  </div>
                );
              case 'divider':
                return <hr key={idx} style={articleStyles.divider} />;
              default:
                return null;
            }
          })}
        </div>
      </article>

      {/* Sidebar: Metadata & Audit Integrity (PoE Seal) */}
      <aside style={articleStyles.sidebar}>
        <div className="glass-container" style={articleStyles.sidebarCard}>
          <h3 style={articleStyles.sidebarHeading}>📌 Category Tags</h3>
          <div style={articleStyles.tags}>
            {content.metadata.tags.map(tag => (
              <span key={tag} style={articleStyles.tag}>#{tag}</span>
            ))}
          </div>
        </div>

        <div className="glass-container" style={articleStyles.sidebarCard}>
          <h3 style={articleStyles.sidebarHeading}>🛡️ PoE Verification</h3>
          <p style={articleStyles.poeText}>This content was generated deterministically and audit-logged in the execution ledger.</p>
          <div style={articleStyles.poeSeal}>
            <span style={articleStyles.bold}>PoE Hash:</span>
            <div style={articleStyles.hashText}>{content.trace.poe_hash}</div>
          </div>
        </div>
      </aside>
    </div>
  );
}

const articleStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '32px',
    alignItems: 'flex-start',
  },
  article: {
    flexGrow: 1,
    maxWidth: '800px',
  },
  header: {
    marginBottom: '32px',
  },
  category: {
    color: 'var(--primary)',
    fontWeight: 600,
    fontSize: '14px',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '36px',
    lineHeight: '1.2',
    color: 'var(--text-primary)',
    marginTop: '8px',
  },
  meta: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    marginTop: '12px',
  },
  socialBar: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    alignItems: 'center',
  },
  socialBtn: {
    background: 'var(--surface-border)',
    border: 'none',
    color: 'var(--text-primary)',
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: 500,
  },
  bold: {
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  paragraph: {
    fontSize: '17px',
    lineHeight: '1.7',
    color: 'var(--text-primary)',
  },
  quote: {
    borderLeft: '4px solid var(--primary)',
    paddingLeft: '20px',
    fontStyle: 'italic',
    fontSize: '19px',
    color: 'var(--text-secondary)',
    margin: '24px 0',
  },
  productCta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderRadius: 'var(--radius-md)',
    gap: '16px',
  },
  productInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  productTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  productPrice: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--deal-green)',
  },
  productBtn: {
    background: 'var(--primary)',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 600,
    padding: '10px 20px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px',
  },
  divider: {
    border: '0',
    borderTop: '1px solid var(--surface-border)',
    margin: '24px 0',
  },
  sidebar: {
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sidebarCard: {
    padding: '24px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sidebarHeading: {
    fontSize: '18px',
    color: 'var(--text-primary)',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tag: {
    background: 'var(--background)',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  poeText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  poeSeal: {
    background: 'var(--background)',
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  hashText: {
    fontFamily: 'monospace',
    fontSize: '11px',
    wordBreak: 'break-all',
    color: 'var(--text-secondary)',
  }
};
