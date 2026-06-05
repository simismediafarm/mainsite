import './index.css';
import React from 'react';
import TopBar from '../components/TopBar';

export const metadata = {
  metadataBase: new URL('https://mediafarm.vercel.app'),
  title: {
    default: 'SIMIS MediaFarm',
    template: '%s | SIMIS MediaFarm',
  },
  description: 'An Autonomous Content Distribution and Monetization Network.',
  openGraph: {
    title: 'SIMIS MediaFarm',
    description: 'An Autonomous Content Distribution and Monetization Network.',
    url: 'https://mediafarm.vercel.app',
    siteName: 'SIMIS MediaFarm',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SIMIS MediaFarm',
    description: 'An Autonomous Content Distribution and Monetization Network.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

const themeScript = `
  (function() {
    try {
      var savedTheme = localStorage.getItem('theme');
      var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      var activeTheme = savedTheme || systemTheme;
      document.documentElement.setAttribute('data-theme', activeTheme);
    } catch (e) {
      console.error('Theme hydration script error:', e);
    }
  })()
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline Theme Hydration Guard to prevent flash of unstyled theme */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="layout-container">
          <TopBar />
          
          <main className="main-content">
            {children}
          </main>

          <footer style={styles.footer}>
            <div style={styles.footerWrapper}>
              <p style={styles.copy}>&copy; 2026 SIMIS MediaFarm. Content-first reading experience.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    padding: '30px 20px',
    borderTop: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    marginTop: '60px',
  },
  footerWrapper: {
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copy: {
    color: 'var(--text-secondary)',
    fontSize: '13px',
    textAlign: 'center',
  },
};
