import Link from 'next/link';

export default function CMSDashboard() {
  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Editorial CMS Dashboard</h1>
        <nav>
          <Link href="/">Back to Feed</Link>
          <Link href="/cms/review">Review Queue</Link>
          <Link href="/ads/revenue">Revenue Dashboard</Link>
        </nav>
      </header>

      <div className="admin-stats">
        <div className="stat-card">
          <h3>Drafts</h3>
          <p className="stat-value">12</p>
        </div>
        <div className="stat-card">
          <h3>Pending Review</h3>
          <p className="stat-value">4</p>
        </div>
        <div className="stat-card">
          <h3>Approved</h3>
          <p className="stat-value">8</p>
        </div>
      </div>

      <div className="admin-content">
        <h2>Editorial Workflow</h2>
        <p>The SIMIS MediaFarm CMS orchestrates content via strict roles and rules. 
        Editors can approve, feature, or reject content submitted by authors.</p>
        
        <div style={{ marginTop: '2rem' }}>
          <Link href="/cms/review" className="btn btn-primary">
            Go to Review Queue &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
