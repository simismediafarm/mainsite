import { test, expect } from '@playwright/test';
import http from 'http';
import crypto from 'crypto';

let server: http.Server;

test.beforeAll(async () => {
  // Start a dummy API server on port 3001 to respond to the SSR backend fetches
  server = http.createServer((req, res) => {
    if (req.url?.includes('/artifact')) {
      const mockSignature = crypto
        .createHash("sha256")
        .update(`n/afphash1.0.0`)
        .digest("hex");

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        artifactUid: "test-uid",
        compilerVersion: "1.0.0",
        compilerHash: "hash",
        dependencyFingerprint: "fp",
        payloadHash: "phash",
        cssVariables: { "--simis-primary": "red" },
        componentMappings: {},
        provenance: {
          compiledFromBundleHash: "n/a",
          artifactSignature: mockSignature,
          sourceManifest: { themeVersionUid: "test-theme" }
        }
      }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(3001, () => resolve());
  });
});

test.afterAll(() => {
  server.close();
});

// Scenario A: JS Enabled (Default)
test.describe('Scenario A: JS Enabled', () => {
  test('Renders styles on first paint with JS enabled', async ({ page }) => {
    // Intercept API calls to backend if needed to ensure we simulate delay, 
    // but the Next.js SSR should already inject the style tag.
    await page.goto('/');
    
    // Check for the dynamically injected theme style tag
    const styleTag = page.locator('style[id^="simis-theme-"]');
    await expect(styleTag).toBeAttached();
    
    // Check that CSS variables are correctly injected
    const cssContent = await styleTag.textContent();
    expect(cssContent).toContain('--simis-');
  });
});

// Scenario B: JS Disabled
test.describe('Scenario B: JS Disabled', () => {
  test.use({ javaScriptEnabled: false });

  test('Renders styles on first paint with JS disabled', async ({ page }) => {
    await page.goto('/');
    
    const styleTag = page.locator('style[id^="simis-theme-"]');
    await expect(styleTag).toBeAttached();
    
    const cssContent = await styleTag.textContent();
    expect(cssContent).toContain('--simis-');
  });
});

// Scenario C: Slow 3G Simulation
test.describe('Scenario C: Slow 3G', () => {
  test('Renders styles immediately before full load on Slow 3G', async ({ page, context }) => {
    // Simulate slow network using CDP session
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: ((500 * 1024) / 8),
      uploadThroughput: ((500 * 1024) / 8),
      latency: 400,
    });
    
    await page.goto('/');
    const styleTag = page.locator('style[id^="simis-theme-"]');
    await expect(styleTag).toBeAttached({ timeout: 15000 }); // Give it time to load the HTML
  });
});

// Scenario D: Hydration Delayed
test.describe('Scenario D: Hydration delayed', () => {
  test('Renders styles even if hydration is blocked', async ({ page }) => {
    // Intercept and delay all JS files by 5 seconds
    await page.route('**/*.js', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.continue();
    });

    await page.goto('/');
    const styleTag = page.locator('style[id^="simis-theme-"]');
    
    // Style tag must be present immediately on initial HTML, long before JS arrives
    await expect(styleTag).toBeAttached();
  });
});
