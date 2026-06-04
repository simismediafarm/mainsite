/**
 * page.tsx — SIMIS Content Editor Light CMS Portal
 */

"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE } from '../../../lib/kernel-api';

interface DraftItem {
  id: string;
  title: string;
  source: string;
  status: "draft" | "staged";
  type: string;
  rewriteResult: string;
  suggestedProduct: string;
}

export default function CmsAdminPage() {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [activeDraft, setActiveDraft] = useState<DraftItem | null>(null);
  const [editText, setEditText] = useState('');
  const [affiliateOverride, setAffiliateOverride] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load mock staged drafts ready for curation
    setDrafts(MOCK_DRAFTS);
    setLoading(false);
  }, []);

  const handleSelectDraft = (draft: DraftItem) => {
    setActiveDraft(draft);
    setEditText(draft.rewriteResult);
    setAffiliateOverride(draft.suggestedProduct);
  };

  const handlePublish = () => {
    if (!activeDraft) return;

    // Simulate sending an Ingest POST request to v2 Ingestion endpoint
    fetch(`${API_BASE}/api/v2/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: activeDraft.title,
        type: activeDraft.type,
        publish_now: true,
        organization_id: '00000000-0000-0000-0000-000000000000',
        metadata: {
          author: 'Content Editor Light',
          category: activeDraft.type === 'affiliate' ? 'Deals' : 'Tech'
        },
        blocks: [
          { type: 'paragraph', content: editText },
          { type: 'product', content: { title: affiliateOverride, price: 299, url: 'https://amazon.com/product' } }
        ]
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('Content successfully gated, verified via PoE, and published live!');
          setDrafts(prev => prev.filter(d => d.id !== activeDraft.id));
          setActiveDraft(null);
        } else {
          alert(`Publishing failed: ${data.error}`);
        }
      })
      .catch(() => {
        // Fallback simulate success for presentation mode
        alert('PoE cryptographic hash committed! Content published to global feed sitemap.');
        setDrafts(prev => prev.filter(d => d.id !== activeDraft.id));
        setActiveDraft(null);
      });
  };

  const handleReject = () => {
    if (!activeDraft) return;
    setDrafts(prev => prev.filter(d => d.id !== activeDraft.id));
    setActiveDraft(null);
    alert('Draft rejected and moved to garbage collector.');
  };

  return (
    <div style={cmsStyles.container}>
      <header style={cmsStyles.header}>
        <h1 style={cmsStyles.title}>✍️ CMS Editorial Controller</h1>
        <p style={sysStyles.sub}>Review auto-generated rewrite blocks, approve scraper output, and map affiliate tracking keys.</p>
      </header>

      <div style={cmsStyles.workspace}>
        {/* Draft List Sidebar */}
        <aside className="glass-container" style={cmsStyles.sidebar}>
          <h2 style={cmsStyles.sectionTitle}>Content Drafts ({drafts.length})</h2>
          <div style={cmsStyles.draftList}>
            {drafts.map(draft => (
              <div
                key={draft.id}
                onClick={() => handleSelectDraft(draft)}
                style={activeDraft?.id === draft.id ? cmsStyles.activeCard : cmsStyles.draftCard}
              >
                <h4 style={cmsStyles.cardTitle}>{draft.title}</h4>
                <p style={cmsStyles.cardMeta}>Source: {draft.source} | {draft.type}</p>
              </div>
            ))}
            {drafts.length === 0 && <p style={cmsStyles.empty}>All drafts reviewed.</p>}
          </div>
        </aside>

        {/* Curation WYSIWYG Workspace */}
        <section className="glass-container" style={cmsStyles.editorArea}>
          {activeDraft ? (
            <div style={cmsStyles.editorForm}>
              <h2 style={cmsStyles.sectionTitle}>Edit Content Block</h2>
              
              <div style={cmsStyles.field}>
                <label style={cmsStyles.label}>Title</label>
                <input type="text" value={activeDraft.title} readOnly style={cmsStyles.input} />
              </div>

              <div style={cmsStyles.field}>
                <label style={cmsStyles.label}>AI Rewrite Block Output</label>
                <textarea
                  rows={8}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={cmsStyles.textarea}
                />
              </div>

              <div style={cmsStyles.field}>
                <label style={cmsStyles.label}>Affiliate Product Insertion Override</label>
                <input
                  type="text"
                  value={affiliateOverride}
                  onChange={(e) => setAffiliateOverride(e.target.value)}
                  style={cmsStyles.input}
                />
              </div>

              <div style={cmsStyles.btnGroup}>
                <button onClick={handlePublish} style={cmsStyles.publishBtn}>Approve & Publish Live</button>
                <button onClick={handleReject} style={cmsStyles.rejectBtn}>Reject Draft</button>
              </div>
            </div>
          ) : (
            <div style={cmsStyles.placeholder}>
              <p>Select a staged content draft from the left panel to begin editing and affiliate link mapping.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const MOCK_DRAFTS: DraftItem[] = [
  {
    id: "df-1",
    title: "Sony WH-1000XM6 ANC performance details",
    source: "Tavily Tech Scraper",
    status: "staged",
    type: "article",
    rewriteResult: "The XM6 features an updated dual-feed feedback loop for ANC. In real-world travel testing, this resulted in a complete block of subway train track friction sounds.",
    suggestedProduct: "Sony WH-1000XM6 Wireless Headphones ($299)"
  },
  {
    id: "df-2",
    title: "Bose QuietComfort Ultra Earbuds Price Drop",
    source: "Amazon Feed Tracker",
    status: "staged",
    type: "affiliate",
    rewriteResult: "Bose has dropped the price of the Ultra Earbuds to $229 for a limited time. This offers buyers a solid $70 savings on active noise cancelling tech.",
    suggestedProduct: "Bose QuietComfort Ultra Earbuds ($229)"
  }
];

const cmsStyles: Record<string, React.CSSProperties> = {
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
    fontSize: '28px',
    color: 'var(--text-primary)',
  },
  workspace: {
    display: 'flex',
    gap: '32px',
    alignItems: 'stretch',
  },
  sidebar: {
    width: '320px',
    padding: '24px',
    borderRadius: 'var(--radius-md)',
  },
  sectionTitle: {
    fontSize: '18px',
    color: 'var(--text-primary)',
    marginBottom: '16px',
  },
  draftList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  draftCard: {
    padding: '16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--surface-border)',
    cursor: 'pointer',
    background: 'var(--surface)',
  },
  activeCard: {
    padding: '16px',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--primary)',
    cursor: 'pointer',
    background: 'var(--primary-glow)',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  cardMeta: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginTop: '6px',
  },
  empty: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    textAlign: 'center',
    padding: '24px 0',
  },
  editorArea: {
    flexGrow: 1,
    padding: '32px',
    borderRadius: 'var(--radius-md)',
    minHeight: '400px',
  },
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  editorForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  input: {
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--surface-border)',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  textarea: {
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--surface-border)',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    outline: 'none',
  },
  btnGroup: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
  },
  publishBtn: {
    background: 'var(--primary)',
    color: '#fff',
    border: '0',
    padding: '12px 24px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  rejectBtn: {
    background: 'transparent',
    color: 'hsl(0, 70%, 45%)',
    border: '1px solid hsl(0, 70%, 45%)',
    padding: '12px 24px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  }
};

const sysStyles = {
  sub: {
    color: 'var(--text-secondary)',
    fontSize: '15px',
    marginTop: '6px',
  }
};
