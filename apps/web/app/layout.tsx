/**
 * layout.tsx — Root Layout for Next.js App Router
 */

import './index.css';
import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'SIMIS Media Platform — Programmatic AGC & affiliate network',
  description: 'Curated shopping comparisons, automated hot deals, and tech & finance reviews.',
  openGraph: {
    title: 'SIMIS Media Platform',
    description: 'Curated shopping comparisons and automated hot deals.',
    url: 'https://mediafarm.vercel.app',
    siteName: 'SIMIS Media',
    images: [{ url: '/logo.png', width: 800, height: 600 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SIMIS Media Platform',
    description: 'Curated shopping comparisons and automated hot deals.',
    images: ['/logo.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
};

const jsonLdOrg = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SIMIS Media',
  url: 'https://mediafarm.vercel.app',
  logo: 'https://mediafarm.vercel.app/logo.png',
  sameAs: ['https://twitter.com/simismedia']
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
        <div style={layoutStyles.container}>
          {/* Global Navigation Header */}
          <header style={layoutStyles.header}>
            <div style={layoutStyles.navWrapper}>
              <Link href="/" style={layoutStyles.logo}>
                🧭 SIMIS <span style={layoutStyles.logoSub}>MEDIA</span>
              </Link>
              <nav style={layoutStyles.nav}>
                <Link href="/" style={layoutStyles.navLink}>Home</Link>
                <Link href="/deals" style={layoutStyles.navLink}>Deals</Link>
                <Link href="/search" style={layoutStyles.navLink}>Search</Link>
                {/* Admin/Internal quick links (discreetly styled in footer or nav) */}
                <Link href="/admin/cms" style={layoutStyles.adminLink}>CMS</Link>
                <Link href="/admin/system" style={layoutStyles.adminLink}>SysOps</Link>
              </nav>
            </div>
          </header>

          {/* Core Page Content */}
          <main style={layoutStyles.mainContent}>
            {children}
          </main>

          {/* Global Footer */}
          <footer style={layoutStyles.footer}>
            <div style={layoutStyles.footerWrapper}>
              <p style={layoutStyles.copy}>&copy; 2026 SIMIS Media. All rights reserved. Automated via deterministic publishing engines.</p>
              <div style={layoutStyles.footerLinks}>
                <Link href="/sitemap.xml" style={layoutStyles.footerLink}>Sitemap</Link>
                <Link href="/rss.xml" style={layoutStyles.footerLink}>RSS Feed</Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

const layoutStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--surface-border)',
  },
  navWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '16px 24px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    textDecoration: 'none',
    fontFamily: 'var(--font-heading)',
    letterSpacing: '-0.03em',
  },
  logoSub: {
    color: 'var(--primary)',
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    marginLeft: '4px',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  navLink: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '15px',
    transition: 'color 0.2s',
  },
  adminLink: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '13px',
    opacity: 0.7,
    border: '1px solid var(--surface-border)',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  mainContent: {
    flexGrow: 1,
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '40px 24px',
  },
  footer: {
    background: 'var(--surface)',
    borderTop: '1px solid var(--surface-border)',
    padding: '24px 0',
    marginTop: '40px',
  },
  footerWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  copy: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  footerLinks: {
    display: 'flex',
    gap: '16px',
  },
  footerLink: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '14px',
  }
};
