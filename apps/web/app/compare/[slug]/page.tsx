/**
 * page.tsx — SIMIS Product Comparison Grid Page
 */

"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { API_BASE } from '../../../lib/kernel-api';

interface ComparisonRow {
  feature: string;
  sony_xm6: string;
  bose_ultra: string;
  airpods_max: string;
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
          setContent(MOCK_COMPARE);
        }
        setLoading(false);
      })
      .catch(() => {
        setContent(MOCK_COMPARE);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <p>Loading comparison data...</p>;
  if (!content) return <p>Comparison not found.</p>;

  return (
    <div style={compareStyles.container}>
      <header style={compareStyles.header}>
        <span style={compareStyles.category}>{content.metadata.category}</span>
        <h1 style={compareStyles.title}>{content.title}</h1>
        <p style={compareStyles.sub}>Comparing noise-cancellation specs, design comfort, and pricing metrics.</p>
      </header>

      {/* Comparison Grid Table */}
      <div className="glass-container" style={compareStyles.tableWrapper}>
        <table style={compareStyles.table}>
          <thead>
            <tr style={compareStyles.theadRow}>
              <th style={compareStyles.th}>Feature Spec</th>
              <th style={compareStyles.thHighlight}>
                Sony WH-1000XM6
                <span style={compareStyles.badgeValue}>★ Best Overall</span>
              </th>
              <th style={compareStyles.th}>Bose QC Ultra</th>
              <th style={compareStyles.th}>AirPods Max 2</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ROWS.map((row, idx) => (
              <tr key={idx} style={idx % 2 === 0 ? compareStyles.trEven : compareStyles.trOdd}>
                <td style={compareStyles.tdLabel}>{row.feature}</td>
                <td style={compareStyles.tdHighlight}>{row.sony_xm6}</td>
                <td style={compareStyles.td}>{row.bose_ultra}</td>
                <td style={compareStyles.td}>{row.airpods_max}</td>
              </tr>
            ))}
            {/* CTA Layer row */}
            <tr style={compareStyles.ctaRow}>
              <td style={compareStyles.tdLabel}>Affiliate Links</td>
              <td style={compareStyles.tdHighlight}>
                <a href="https://amazon.com/sony-xm6" target="_blank" rel="noopener" style={compareStyles.buyBtn}>
                  Buy on Amazon ($299)
                </a>
              </td>
              <td style={compareStyles.td}>
                <a href="https://shopee.com/bose-ultra" target="_blank" rel="noopener" style={compareStyles.secondaryBtn}>
                  Buy on Shopee ($329)
                </a>
              </td>
              <td style={compareStyles.td}>
                <a href="https://tokopedia.com/apple-max" target="_blank" rel="noopener" style={compareStyles.secondaryBtn}>
                  Buy on Tokopedia ($449)
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const MOCK_COMPARE: ContentBlockV2 = {
  id: "compare-1",
  type: "comparison",
  title: "Sony WH-1000XM6 vs Bose QC Ultra vs AirPods Max 2",
  slug: "sony-xm6-vs-bose-ultra",
  blocks: [],
  metadata: { category: "Compare", tags: ["headphones", "audio", "specs"], author: "Reasoning Engine" }
};

const MOCK_ROWS: ComparisonRow[] = [
  { feature: "Active Noise Cancelling", sony_xm6: "45dB (Excellent)", bose_ultra: "41dB (Very Good)", airpods_max: "38dB (Good)" },
  { feature: "Battery Life (ANC On)", sony_xm6: "36 Hours", bose_ultra: "24 Hours", airpods_max: "20 Hours" },
  { feature: "Weight / Materials", sony_xm6: "245g (Recycled PC)", bose_ultra: "250g (Plastic)", airpods_max: "385g (Aluminum)" },
  { feature: "Codec Support", sony_xm6: "LDAC, AAC, SBC", bose_ultra: "aptX Adaptive, AAC", airpods_max: "AAC, SBC" },
  { feature: "Price Drop", sony_xm6: "$299 ($100 savings)", bose_ultra: "$329 ($50 savings)", airpods_max: "$449 (No discount)" }
];

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
