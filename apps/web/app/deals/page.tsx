/**
 * page.tsx — SIMIS Deals Stream Directory Page
 */
/* eslint-disable @next/next/no-img-element */

"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api-client';

interface Product {
  product_id: string;
  title: string;
  url: string;
  price: number;
  original_price?: number;
  discount?: number;
  image_url?: string;
  availability: boolean;
  provider: string;
}

export default function DealsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getDeals()
      .then((data) => {
        setProducts(Array.isArray((data as { items?: Product[] }).items)
          ? (data as { items: Product[] }).items
          : []);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load deals';
        setError(message);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={dealsStyles.container}>
      <header style={dealsStyles.header}>
        <h1 style={dealsStyles.title}>🛍️ Hot Affiliate Deals</h1>
        <p style={dealsStyles.sub}>Scraped price drops and tracking coupons updated hourly.</p>
      </header>

      {!loading && products.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: 'SIMIS Hot Deals',
              itemListElement: products.map((p, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'Product',
                  name: p.title,
                  url: p.url,
                  offers: {
                    '@type': 'Offer',
                    price: p.price,
                    priceCurrency: 'USD',
                    availability: p.availability
                      ? 'https://schema.org/InStock'
                      : 'https://schema.org/OutOfStock',
                  },
                },
              })),
            }),
          }}
        />
      )}

      {loading ? (
        <p role="status">Loading active deals feed...</p>
      ) : error ? (
        <div style={{ padding: '80px 20px', textAlign: 'center' }} role="alert">
          <h2 style={dealsStyles.cardTitle}>⚠️ Unable to Load Deals</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div style={{ padding: '80px 20px', textAlign: 'center' }} role="status">
          <h2 style={dealsStyles.cardTitle}>🛍️ No Active Deals</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            We are currently updating our price monitors. Check back soon.
          </p>
        </div>
      ) : (
        <div style={dealsStyles.grid}>
          {products.map((product) => {
            const disc =
              product.discount ??
              (product.original_price
                ? Math.round((1 - product.price / product.original_price) * 100)
                : 0);
            return (
              <article key={product.product_id} className="glass-container hover-lift" style={dealsStyles.card}>
                {disc > 0 && (
                  <div style={dealsStyles.badge} aria-label={`${disc}% discount`}>-{disc}% Off</div>
                )}
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} style={dealsStyles.img} />
                ) : (
                  <div style={dealsStyles.imgPlaceholder} aria-hidden="true">🛒 SIMIS PRODUCT</div>
                )}
                <h3 style={dealsStyles.cardTitle}>{product.title}</h3>
                <div style={dealsStyles.pricing}>
                  <span style={dealsStyles.price}>${product.price}</span>
                  {product.original_price && (
                    <span style={dealsStyles.original}>
                      <s>${product.original_price}</s>
                    </span>
                  )}
                </div>
                <div style={dealsStyles.providerInfo}>
                  <span style={dealsStyles.provider}>Source: {product.provider}</span>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={dealsStyles.buyBtn}
                    aria-label={`Buy ${product.title}`}
                  >
                    Buy Now
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

const dealsStyles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '32px' },
  header: { borderBottom: '2px solid var(--surface-border)', paddingBottom: '16px' },
  title: { fontSize: '32px', color: 'var(--text-primary)' },
  sub: { color: 'var(--text-secondary)', fontSize: '16px', marginTop: '6px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' },
  card: { padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' },
  badge: { position: 'absolute', top: '16px', right: '16px', background: 'var(--deal-badge-bg)', color: 'var(--deal-green)', fontWeight: 700, fontSize: '12px', padding: '4px 8px', borderRadius: '4px', zIndex: 10 },
  img: { width: '100%', height: '180px', objectFit: 'contain' },
  imgPlaceholder: { width: '100%', height: '180px', background: 'var(--background)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 },
  cardTitle: { fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: '1.4', height: '44px', overflow: 'hidden' },
  pricing: { display: 'flex', alignItems: 'baseline', gap: '8px' },
  price: { fontSize: '22px', fontWeight: 700, color: 'var(--deal-green)' },
  original: { fontSize: '14px', color: 'var(--text-secondary)' },
  providerInfo: { display: 'flex', justifyContent: 'space-between', fontSize: '13px' },
  provider: { color: 'var(--text-secondary)' },
  buyBtn: { background: 'var(--primary)', color: '#fff', textDecoration: 'none', fontWeight: 600, padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '13px' },
};
