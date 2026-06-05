import Link from 'next/link';

export default function AdsDashboard() {
  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Monetization & Ads Dashboard</h1>
        <nav>
          <Link href="/">Back to Feed</Link>
          <Link href="/ads/revenue">Revenue Hub</Link>
          <Link href="/cms">CMS</Link>
        </nav>
      </header>

      <div className="admin-content">
        <h2>SIMIS Content Economy OS</h2>
        <p>This is the deterministic simulation of the ad auction and revenue loop.</p>
        
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <Link href="/ads/revenue" className="btn btn-primary">
            View Revenue Metrics
          </Link>
        </div>
      </div>
    </div>
  );
}
