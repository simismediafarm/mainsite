/**
 * page.tsx — SIMIS Programmatic Media Homepage
 * RSC Version for Zero-CLS & Hydration fixes
 */

import React from 'react';
import { API_BASE } from '../lib/kernel-api';
import NewsletterModal from '../components/NewsletterModal';

interface ContentBlockV2 {
  id: string;
  type: "article" | "affiliate" | "scraped" | "ai_generated" | "comparison";
  title: string;
  slug: string;
  blocks: any[];
  metadata: {
    category: string;
    tags: string[];
    author: string;
    created_at: string;
  };
  ranking: {
    score: number;
    monetization_weight: number;
  };
}

export default async function HomePage() {
  let feedItems: ContentBlockV2[] = [];

  try {
    const res = await fetch(`${API_BASE}/api/v2/feed?limit=15`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      feedItems = data.items || MOCK_FEED_ITEMS;
    } else {
      feedItems = MOCK_FEED_ITEMS;
    }
  } catch (err) {
    feedItems = MOCK_FEED_ITEMS;
  }

  const heroItem = feedItems[0];
  const dealsItems = feedItems.filter(item => item.type === 'affiliate');
  const streamItems = feedItems.slice(1);

  const jsonLdCollection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'SIMIS Media Home Feed',
    description: 'Curated programmatic media feed and hot deals.',
    url: 'https://mediafarm.vercel.app',
    hasPart: feedItems.map(item => ({
      '@type': 'Article',
      headline: item.title,
      url: `https://mediafarm.vercel.app/read/${item.slug}`
    }))
  };

  return (
    <div style={homeStyles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCollection) }}
      />
      {/* ── Section A: Hero Stream (Featured Review / Story) ────────────────── */}
      {heroItem && (
        <section style={homeStyles.heroSection}>
          <div className="glass-container hover-lift" style={homeStyles.heroCard}>
            <div style={homeStyles.heroBadge}>🔥 BREAKING TREND</div>
            <h1 style={homeStyles.heroTitle}>{heroItem.title}</h1>
            <p style={homeStyles.heroMeta}>
              By <span style={homeStyles.bold}>{heroItem.metadata.author}</span> in {heroItem.metadata.category}
            </p>
            <a href={`/read/${heroItem.slug}`} style={homeStyles.heroBtn}>Read Full Review</a>
          </div>
        </section>
      )}

      {/* ── Section B: Deals Strip (Monetization Injection Point) ───────────── */}
      <section style={homeStyles.dealsSection}>
        <div style={homeStyles.sectionHeader}>
          <h2 style={homeStyles.sectionTitle}>💰 Hot Deals Strip</h2>
          <span style={homeStyles.sectionSub}>Content-Egg direct affiliate tracking</span>
        </div>
        <div style={homeStyles.dealsTrack}>
          {dealsItems.map(deal => (
            <div key={deal.id} className="glass-container hover-lift" style={homeStyles.dealCard}>
              <div style={homeStyles.discountBadge}>-25% Price Drop</div>
              <h3 style={homeStyles.dealTitle}>{deal.title}</h3>
              <p style={homeStyles.dealPrice}>$299.00 <span style={homeStyles.strike}>$399.00</span></p>
              <a href={`/read/${deal.slug}`} style={homeStyles.dealBtn}>Get Tracking Link</a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section C: Main Ranked Stream (Infinite Content Stream) ─────────── */}
      <section style={homeStyles.streamSection}>
        <h2 style={homeStyles.sectionTitle}>📰 Discovery Stream</h2>
        <div style={homeStyles.feedGrid}>
          {streamItems.map(item => (
            <article key={item.id} className="glass-container hover-lift" style={homeStyles.articleCard}>
              <div style={homeStyles.cardHeader}>
                <span style={homeStyles.category}>{item.metadata.category}</span>
                <span style={homeStyles.scoreBadge}>CTR Score: {item.ranking.score.toFixed(2)}</span>
              </div>
              <h3 style={homeStyles.cardTitle}>{item.title}</h3>
              <p style={homeStyles.cardSnippet}>
                Explore automated specs, price comparison grids, and dynamic scoring indexes.
              </p>
              <div style={homeStyles.cardFooter}>
                <a href={`/read/${item.slug}`} style={homeStyles.cardLink}>Read Article ➔</a>
                <span style={homeStyles.typeBadge}>{item.type}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Pre-reserved Ad Slot (Prevents Layout Shift) ──────────────────── */}
      <div style={homeStyles.adSlot}>
        <span style={homeStyles.adPlaceholderText}>Advertisement - 728x90</span>
      </div>

      {/* ── Lead Capture Newsletter Box (Client Component) ────────────────── */}
      <NewsletterModal />
    </div>
  );
}

// Offline Safe fallback data to keep UI visually stunning out-of-the-box
const MOCK_FEED_ITEMS: ContentBlockV2[] = [
  {
    id: "1",
    type: "article",
    title: "Best Noise Cancelling Headphones of 2026: Sony vs Bose vs Apple",
    slug: "best-noise-cancelling-headphones-2026",
    blocks: [],
    metadata: { category: "Tech", tags: ["audio", "sony", "headphones"], author: "AGC Writer", created_at: new Date().toISOString() },
    ranking: { score: 0.95, monetization_weight: 0.8 }
  },
  {
    id: "2",
    type: "affiliate",
    title: "Sony WH-1000XM6 Wireless Headphones (Amazon Direct Link)",
    slug: "sony-wh-1000xm6-deal",
    blocks: [],
    metadata: { category: "Deals", tags: ["amazon", "sony", "affiliate"], author: "Scraper Bot", created_at: new Date().toISOString() },
    ranking: { score: 0.88, monetization_weight: 0.9 }
  },
  {
    id: "3",
    type: "comparison",
    title: "Sony WH-1000XM6 vs Bose QuietComfort Ultra Comparison Matrix",
    slug: "sony-xm6-vs-bose-ultra",
    blocks: [],
    metadata: { category: "Compare", tags: ["sony", "bose", "comparison"], author: "Reasoning Engine", created_at: new Date().toISOString() },
    ranking: { score: 0.84, monetization_weight: 0.7 }
  },
  {
    id: "4",
    type: "article",
    title: "How to Optimize Your Personal Finance Strategy with High-Yield Savings Accounts",
    slug: "finance-savings-account-guide",
    blocks: [],
    metadata: { category: "Finance", tags: ["savings", "banking", "finance"], author: "AGC Writer", created_at: new Date().toISOString() },
    ranking: { score: 0.78, monetization_weight: 0.5 }
  }
];

const homeStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '48px',
  },
  heroSection: {
    width: '100%',
  },
  heroCard: {
    padding: '48px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--surface-border)',
    background: 'linear-gradient(135deg, var(--surface) 0%, var(--primary-glow) 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'flex-start',
  },
  heroBadge: {
    background: 'var(--primary)',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 700,
    padding: '6px 12px',
    borderRadius: '20px',
    letterSpacing: '0.05em',
  },
  heroTitle: {
    fontSize: '38px',
    lineHeight: '1.2',
    color: 'var(--text-primary)',
    maxWidth: '800px',
  },
  heroMeta: {
    color: 'var(--text-secondary)',
    fontSize: '15px',
  },
  bold: {
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  heroBtn: {
    background: 'var(--primary)',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 600,
    padding: '14px 28px',
    borderRadius: 'var(--radius-sm)',
    marginTop: '16px',
    boxShadow: '0 4px 14px var(--primary-glow)',
  },
  dealsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottom: '2px solid var(--surface-border)',
    paddingBottom: '12px',
  },
  sectionTitle: {
    fontSize: '24px',
    color: 'var(--text-primary)',
  },
  sectionSub: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  dealsTrack: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  dealCard: {
    padding: '24px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'var(--deal-badge-bg)',
    color: 'var(--deal-green)',
    fontWeight: 700,
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  dealTitle: {
    fontSize: '18px',
    color: 'var(--text-primary)',
    marginTop: '16px',
  },
  dealPrice: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--deal-green)',
  },
  strike: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    textDecoration: 'line-through',
    fontWeight: 400,
    marginLeft: '6px',
  },
  dealBtn: {
    background: 'var(--text-primary)',
    color: '#fff',
    textAlign: 'center',
    textDecoration: 'none',
    fontWeight: 600,
    padding: '10px 0',
    borderRadius: 'var(--radius-sm)',
    marginTop: '12px',
  },
  streamSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  feedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px',
  },
  articleCard: {
    padding: '32px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    justifyContent: 'space-between',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  category: {
    color: 'var(--primary)',
    fontWeight: 600,
  },
  scoreBadge: {
    color: 'var(--text-secondary)',
  },
  cardTitle: {
    fontSize: '20px',
    lineHeight: '1.4',
    color: 'var(--text-primary)',
  },
  cardSnippet: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
  },
  cardLink: {
    color: 'var(--text-primary)',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '15px',
  },
  typeBadge: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    border: '1px solid var(--surface-border)',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  adSlot: {
    minHeight: '250px',
    width: '100%',
    background: 'var(--surface-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-md)',
    marginTop: '24px',
  },
  adPlaceholderText: {
    color: 'var(--text-secondary)',
    fontSize: '12px',
    letterSpacing: '1px',
    textTransform: 'uppercase'
  },
  newsletterModal: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '340px',
    zIndex: 1000,
    animation: 'slideUp 0.3s ease-out',
  },
  newsletterContent: {
    padding: '24px',
    borderRadius: 'var(--radius-lg)',
    position: 'relative',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '16px',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--surface-border)',
    background: 'var(--background)',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  submitBtn: {
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  }
};
