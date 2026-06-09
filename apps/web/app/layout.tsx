import './globals.css';
import React from 'react';
import { Inter, Source_Serif_4, JetBrains_Mono } from 'next/font/google';
import TopBar from '../components/TopBar';
import { ThemeProvider } from '../components/ThemeProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif', weight: ['400', '600'] });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['500'] });

export const metadata = {
  metadataBase: new URL('https://mediafarm.vercel.app'),
  title: { default: 'SIMIS MediaFarm', template: '%s | SIMIS MediaFarm' },
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

// Anti-FOUC: apply saved/system theme before first paint
const themeScript = `(function(){try{var t=localStorage.getItem('theme')||((window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');document.documentElement.setAttribute('data-theme',t);document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})()`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let mainNavItems: { label: string; href: string; icon?: string }[] = [];
  let footerCopy = `© 2026 SIMIS Platform.`;

  try {
    const { registry } = await import('@/lib/registryClient');
    const [navRes, widgetRes] = await Promise.allSettled([
      registry.getNavigationByKey('main_menu'),
      registry.getWidgetByKey('footer_config'),
    ]);
    if (navRes.status === 'fulfilled' && navRes.value?.schema) {
      try { mainNavItems = JSON.parse(navRes.value.schema).items || []; } catch {}
    }
    if (widgetRes.status === 'fulfilled' && widgetRes.value?.schema) {
      try { const p = JSON.parse(widgetRes.value.schema); if (p.copy) footerCopy = p.copy; } catch {}
    }
  } catch {
    // Registry unavailable at build time — render with defaults
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Material Symbols: icon font, not a custom page font — safe in <head> */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0a0a] text-[#e5e2e1] min-h-screen flex flex-col font-sans">
        <ThemeProvider>
          <TopBar items={mainNavItems} />
          <main className="flex-1 w-full">
            {children}
          </main>
          <footer className="border-t border-[#222222] bg-[#0f0f0f] py-8 mt-16">
            <div className="max-w-[1440px] mx-auto px-6 flex justify-center">
              <p className="text-[#bac9cc] text-xs font-mono">{footerCopy}</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
