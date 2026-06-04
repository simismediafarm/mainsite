/**
 * page.tsx — SIMIS Product Comparison Grid Page
 */

"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '../../../lib/kernel-api';

interface ComparisonRow {
  feature: string;
  [key: string]: any;
}

interface ProductMeta {
  id: string;
  name: string;
  isBest?: boolean;
  affiliateLink?: string;
  price?: string;
}

interface ContentBlockV2 {
  id: string;
  type: string;
  title: string;
  slug: string;
  blocks: any[];
  metadata: {
    category: string;
    tags: string[];
    author: string;
    comparison_rows?: ComparisonRow[];
    products?: ProductMeta[];
  };
}

export default function ComparePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [content, setContent] = useState<ContentBlockV2 | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    
    fetch(`${API_BASE}/api/v2/compare/${slug}`)
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

  if (loading) return <p>Loading comparison data...</p>;
  if (!content) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', color: 'var(--text-primary)' }}>⚠️ Comparison Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>The comparison grid you are looking for does not exist or has been archived.</p>
        <Link href="/" style={{ display: 'inline-block', marginTop: '16px', color: 'var(--primary)', textDecoration: 'underline' }}>Back to home feed</Link>
      </div>
    );
  }

  const rows = (content.metadata?.comparison_rows || []) as ComparisonRow[];
  
  // Try to use defined products metadata, otherwise infer from the first row's keys
  let products: ProductMeta[] = content.metadata?.products || [];
  if (products.length === 0 && rows.length > 0) {
    const keys = Object.keys(rows[0]).filter(k => k !== 'feature');
    products = keys.map(k => ({
      id: k,
      name: k.replace(/_/g, ' ').toUpperCase()
    }));
  }

  return (
    <div style={compareStyles.container}>
      <header style={compareStyles.header}>
        <span style={compareStyles.category}>{content.metadata.category}</span>
        <h1 style={compareStyles.title}>{content.title}</h1>
        <p style={compareStyles.sub}>Comparing features, specifications, and pricing metrics.</p>
      </header>

      {/* Comparison Grid Table */}
      <div className="glass-container" style={compareStyles.tableWrapper}>
        <table style={compareStyles.table}>
          <thead>
            <tr style={compareStyles.theadRow}>
              <th style={compareStyles.th}>Feature Spec</th>
              {products.map(p => (
                <th key={p.id} style={p.isBest ? compareStyles.thHighlight : compareStyles.th}>
                  {p.name}
                  {p.isBest && <span style={compareStyles.badgeValue}>★ Best Overall</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} style={idx % 2 === 0 ? compareStyles.trEven : compareStyles.trOdd}>
                <td style={compareStyles.tdLabel}>{row.feature}</td>
                {products.map(p => (
                  <td key={p.id} style={p.isBest ? compareStyles.tdHighlight : compareStyles.td}>
                    {row[p.id]}
                  </td>
                ))}
              </tr>
            ))}
            
            {/* CTA Layer row - Only render if at least one product has an affiliate link */}
            {products.some(p => p.affiliateLink) && (
              <tr style={compareStyles.ctaRow}>
                <td style={compareStyles.tdLabel}>Affiliate Links</td>
                {products.map(p => (
                  <td key={p.id} style={p.isBest ? compareStyles.tdHighlight : compareStyles.td}>
                    {p.affiliateLink ? (
                      <a href={p.affiliateLink} target="_blank" rel="noopener" style={p.isBest ? compareStyles.buyBtn : compareStyles.secondaryBtn}>
                        Buy on {new URL(p.affiliateLink).hostname.replace('www.', '')} ({p.price || 'Check Price'})
                      </a>
                    ) : (
                      <span style={{color: 'var(--text-secondary)'}}>Not Available</span>
                    )}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const compareStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  header: {
    borderBottom: '2px solid var(--surface-border)',
    paddingBottom: '16px',
  },
  category: {
    color: 'var(--primary)',
    fontWeight: 600,
    fontSize: '14px',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '32px',
    color: 'var(--text-primary)',
    marginTop: '4px',
  },
  sub: {
    color: 'var(--text-secondary)',
    fontSize: '16px',
    marginTop: '6px',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: 'var(--radius-md)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '15px',
  },
  theadRow: {
    borderBottom: '2px solid var(--surface-border)',
  },
  th: {
    padding: '20px 24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    background: 'var(--background)',
  },
  thHighlight: {
    padding: '20px 24px',
    fontWeight: 700,
    color: 'var(--primary)',
    background: 'var(--primary-glow)',
    position: 'relative',
  },
  badgeValue: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--deal-green)',
    marginTop: '4px',
  },
  trOdd: {
    borderBottom: '1px solid var(--surface-border)',
  },
  trEven: {
    borderBottom: '1px solid var(--surface-border)',
    background: 'var(--background)',
  },
  tdLabel: {
    padding: '16px 24px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  td: {
    padding: '16px 24px',
    color: 'var(--text-secondary)',
  },
  tdHighlight: {
    padding: '16px 24px',
    color: 'var(--text-primary)',
    fontWeight: 600,
    background: 'var(--primary-glow)',
  },
  ctaRow: {
    background: 'var(--surface)',
  },
  buyBtn: {
    display: 'inline-block',
    background: 'var(--primary)',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 600,
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    textAlign: 'center',
    width: '100%',
    boxShadow: '0 4px 10px var(--primary-glow)',
  },
  secondaryBtn: {
    display: 'inline-block',
    background: 'var(--text-primary)',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 600,
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    textAlign: 'center',
    width: '100%',
  }
};
