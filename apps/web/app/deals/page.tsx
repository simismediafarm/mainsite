/**
 * page.tsx — SIMIS Deals Stream Directory Page
 */

"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE } from '../../lib/kernel-api';

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

  useEffect(() => {
    fetch(`${API_BASE}/api/v2/deals`)
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setProducts(data.items);
        } else {
          setProducts(MOCK_PRODUCTS);
        }
        setLoading(false);
      })
      .catch(() => {
        setProducts(MOCK_PRODUCTS);
        setLoading(false);
      });
  }, []);

  return (
    <div style={dealsStyles.container}>
      <header style={dealsStyles.header}>
        <h1 style={dealsStyles.title}>🛍️ Hot Affiliate Deals</h1>
        <p style={dealsStyles.sub}>Scraped price drops and tracking coupons updated hourly.</p>
      </header>

      {loading ? (
        <p>Loading active deals feed...</p>
      ) : (
        <div style={dealsStyles.grid}>
          {products.map(product => {
            const disc = product.discount ?? (product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : 0);
            return (
              <div key={product.product_id} className="glass-container hover-lift" style={dealsStyles.card}>
                {disc > 0 && (
                  <div style={dealsStyles.badge}>-{disc}% Off</div>
                )}
                {product.image_url ? (
                  /* @eslint-disable-next-line @next/next/no-img-element */
                  <img src={product.image_url} alt={product.title} style={dealsStyles.img} />
                ) : (
                  <div style={dealsStyles.imgPlaceholder}>🛒 SIMIS PRODUCT</div>
                )}
                <h3 style={dealsStyles.cardTitle}>{product.title}</h3>
                <div style={dealsStyles.pricing}>
                  <span style={dealsStyles.price}>${product.price}</span>
                  {product.original_price && (
                    <span style={dealsStyles.original}>${product.original_price}</span>
                  )}
                </div>
                <div style={dealsStyles.providerInfo}>
                  <span style={dealsStyles.provider}>Source: {product.provider}</span>
                  <span style={product.availability ? dealsStyles.instock : dealsStyles.out}>
                    {product.availability ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                <a href={product.url} target="_blank" rel="noopener noreferrer" style={dealsStyles.btn}>
                  Buy on {product.provider}
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const MOCK_PRODUCTS: Product[] = [
  {
    product_id: "p1",
    title: "Sony WH-1000XM6 Wireless Noise-Cancelling Headphones",
    url: "https://amazon.com/sony-xm6",
    price: 299.00,
    original_price: 399.00,
    image_url: "",
    availability: true,
    provider: "Amazon"
  },
  {
    product_id: "p2",
    title: "Bose QuietComfort Ultra Over-Ear Bluetooth Headphones",
    url: "https://shopee.com/bose-ultra",
    price: 329.00,
    original_price: 429.00,
    image_url: "",
    availability: true,
    provider: "Shopee"
  },
  {
    product_id: "p3",
    title: "Apple AirPods Max (USB-C Connection, Green)",
    url: "https://tokopedia.com/airpods-max-c",
    price: 449.00,
    original_price: 549.00,
    image_url: "",
    availability: false,
    provider: "Tokopedia"
  }
];

const dealsStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  header: {
    borderBottom: '2px solid var(--surface-border)',
    paddingBottom: '16px',
  },
  title: {
    fontSize: '32px',
    color: 'var(--text-primary)',
  },
  sub: {
    color: 'var(--text-secondary)',
    fontSize: '16px',
    marginTop: '6px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  card: {
    padding: '24px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'var(--deal-badge-bg)',
    color: 'var(--deal-green)',
    fontWeight: 700,
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '4px',
    zIndex: 10,
  },
  img: {
    width: '100%',
    height: '180px',
    objectFit: 'contain',
  },
  imgPlaceholder: {
    width: '100%',
    height: '180px',
    background: 'var(--background)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: '1.4',
    height: '44px',
    overflow: 'hidden',
  },
  pricing: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  price: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--deal-green)',
  },
  original: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    textDecoration: 'line-through',
  },
  providerInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  provider: {
    color: 'var(--text-secondary)',
  },
  instock: {
    color: 'var(--deal-green)',
    fontWeight: 600,
  },
  out: {
    color: 'hsl(0, 70%, 45%)',
    fontWeight: 600,
  },
  btn: {
    background: 'var(--primary)',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 600,
    textAlign: 'center',
    padding: '10px 0',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px',
  }
};
