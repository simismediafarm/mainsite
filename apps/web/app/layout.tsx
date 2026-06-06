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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let mainNavItems: { label: string, href: string, icon?: string }[] = [];
  let footerCopy = `\u00A9 2026 SIMIS Platform.`;

  try {
    const { registry } = await import('@/lib/registryClient');
    const [navRes, widgetRes] = await Promise.allSettled([
      registry.getNavigationByKey('main_menu'),
      registry.getWidgetByKey('footer_config')
    ]);

    if (navRes.status === 'fulfilled' && navRes.value?.schema) {
      try {
        const parsed = JSON.parse(navRes.value.schema);
        mainNavItems = parsed.items || [];
      } catch (e) {
        console.error("Failed to parse navigation schema");
      }
    }

    if (widgetRes.status === 'fulfilled' && widgetRes.value?.schema) {
      try {
        const parsed = JSON.parse(widgetRes.value.schema);
        if (parsed.copy) footerCopy = parsed.copy;
      } catch (e) {
        console.error("Failed to parse footer schema");
      }
    }
  } catch (err) {
    console.error("Failed to fetch layout configuration", err);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline Theme Hydration Guard to prevent flash of unstyled theme */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Source+Serif+4:wght@400;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="layout-container">
          <TopBar items={mainNavItems} />
          
          <main className="main-content">
            {children}
          </main>

          <footer style={styles.footer}>
            <div style={styles.footerWrapper}>
              <p style={styles.copy}>{footerCopy}</p>
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
