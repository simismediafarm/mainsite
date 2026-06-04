# SIMIS TECHNICAL CONSTITUTION PACKAGE
## Parts 03–06: Feature, Data, Knowledge Graph, and AI Constitutions

---

# PART 03 — FEATURE CONSTITUTION

## 3.1 Discovery Features

### F-DISC-001: RSS/Atom Feed Ingestion

**User Goal:** Continuously receive intelligence signals from tracked sources without manual effort.

**Problem Solved:** Manual monitoring of dozens of sources is unsustainable at scale.

**Inputs:**
- Feed URL list
- Ingestion schedule (cron expression)
- Source priority weight
- Topic/entity filters

**Outputs:**
- Parsed signal objects stored in `signals` table
- Entity extraction results
- Affiliate opportunity detection flags

**Workflow:**
1. Trigger.dev cron job fires per schedule
2. Fetch feed XML via HTTP (with ETag/Last-Modified caching)
3. Parse feed items (title, URL, content, published date)
4. Deduplicate against existing signals (URL hash check)
5. Send new items to signal enrichment queue
6. Enrichment: extract entities (Groq), score revenue signal potential, assign topics
7. Store enriched signal in Supabase
8. Emit `SignalIngested` event

**Services:** Feed Parser, Deduplication Service, Enrichment Service
**Dependencies:** Trigger.dev, Groq API, Supabase
**Revenue Impact:** Surfaces affiliate opportunities from product announcements and news
**Learning Impact:** Feed signal → content creation → traffic/revenue correlation tracking

---

### F-DISC-002: SERP Intelligence Fetching

**User Goal:** Understand the competitive landscape for any keyword.

**Inputs:** Keyword, location (optional), device type (optional), competitor domains to track

**Outputs:**
- SERP snapshot object (top 10 results with metadata)
- Competitor content analysis objects
- Opportunity score
- Featured snippet analysis
- PAA (People Also Ask) list

**Workflow:**
1. Query Serper API (primary) or Brave Search (fallback)
2. Parse results: URL, title, meta description, ranking position
3. For each result: extract content via Crawl4AI (selective crawl, not full index)
4. Analyze content structure: word count, H2/H3 structure, entities mentioned, schema types
5. Compute gap analysis vs operator's existing content on this keyword
6. Score opportunity: volume × difficulty^-1 × intent score × revenue signal
7. Store SERP snapshot with timestamp
8. Return structured SERP intelligence object

**Services:** SERP Service, Content Analyzer, Gap Analyzer, Opportunity Scorer
**Dependencies:** Serper API, Brave Search API, Crawl4AI, Groq (classification), Gemini (analysis)

---

### F-DISC-003: Trend Detection

**User Goal:** Surface emerging topics before they become saturated.

**Inputs:** Tracked topic clusters, signal velocity thresholds, time window

**Outputs:**
- Trend alerts with velocity score
- Entity trend associations
- Content opportunity recommendations

**Workflow:**
1. Aggregate signal volume per topic/entity over rolling 1h, 6h, 24h, 7d windows
2. Compute velocity: signal count delta (current window vs previous equal window)
3. Identify anomalous velocity (> 2 standard deviations from baseline)
4. Enrich trend with entity associations, affiliate signals
5. Generate content opportunity recommendation if trend matches operator's niche profile
6. Alert operator or trigger Trend Response Agent

---

### F-DISC-004: Competitor Content Monitoring

**User Goal:** Track competitor content publishing patterns, gaps, and opportunities.

**Inputs:** Competitor domain list, monitoring frequency, alert thresholds

**Outputs:**
- New competitor content alerts
- Competitor content strategy analysis
- Content gap alerts (competitor published; operator has not)

**Workflow:**
1. Monitor competitor RSS feeds or crawl sitemaps on schedule
2. Detect new content publications
3. Classify content type and target keyword
4. Check if operator has equivalent coverage
5. Score competitive urgency
6. Alert operator with recommended response action

---

## 3.2 Research Features

### F-RES-001: Deep Research Session

**User Goal:** Generate comprehensive, synthesized intelligence on any topic or entity.

**Inputs:** Research query, depth level (Quick/Deep/Exhaustive), source types to include

**Outputs:**
- Structured research document (markdown)
- Extracted entities list
- Extracted facts with source citations
- Recommended content opportunities
- Affiliate signal detections

**Workflow:**
1. Decompose query into sub-queries (Gemini planning step)
2. Execute parallel searches across Brave, Serper, Tavily
3. For each relevant result: fetch full content via Firecrawl
4. Chunk and embed content in session vector store
5. Extract entities and facts via Groq
6. Synthesize research document via Gemini (long context)
7. Post-process: citation linking, entity resolution, affiliate signal detection
8. Store research session in Supabase
9. Return structured output

**AI Usage:** Gemini Flash for synthesis (long context), Groq for extraction tasks

---

### F-RES-002: Entity Research

**User Goal:** Build complete intelligence profile on any named entity.

**Inputs:** Entity name or ID, research depth

**Outputs:**
- Entity profile (facts, properties, relationships)
- Entity revenue signals
- Entity content map
- Entity authority signals

**Workflow:**
1. Check entity registry for existing profile
2. Fetch from Wikidata API (structured data)
3. Fetch from Wikipedia API (content summary)
4. Execute web search for recent news and updates
5. Crawl entity's official website/domain
6. Cross-reference with internal knowledge graph
7. Extract affiliate program associations
8. Merge and deduplicate information
9. Score entity authority and revenue signal strength
10. Upsert entity profile in entity registry

---

## 3.3 Content Features

### F-CONT-001: AI Content Brief Generation

**User Goal:** Generate a complete, intelligence-enriched brief for any content asset.

**Inputs:** Target keyword, content type, site context, affiliate constraints

**Outputs:**
- Content brief object:
  - Target keyword + semantic keywords
  - Content type recommendation
  - Recommended word count
  - Content outline (H1, H2s, H3s)
  - Required entities to mention
  - Required claims/facts to address
  - Competitor content reference list
  - Affiliate insertion recommendations
  - SEO requirements (title, meta, schema type)
  - Internal linking recommendations
  - Predicted performance metrics (traffic, revenue)

**Workflow:**
1. Fetch SERP data for target keyword
2. Analyze top 5 competitor content pieces
3. Extract common H2/H3 patterns from competitors
4. Identify differentiation opportunities
5. Map relevant entities to include
6. Detect affiliate programs matching content topic
7. Generate outline via Gemini (competitor gap filling + differentiation)
8. Generate SEO metadata
9. Record prediction: expected monthly traffic, expected monthly revenue
10. Return structured brief object

---

### F-CONT-002: AI Content Generation

**User Goal:** Generate publication-quality draft content from a brief.

**Inputs:** Brief object, generation model preference, tone, audience level

**Outputs:**
- Full-length draft content (markdown)
- Quality score
- Entity coverage report
- SEO coverage report
- Affiliate insertion suggestions

**Workflow:**
1. Load brief
2. Generate intro section (attention hook + thesis)
3. Generate each H2 section sequentially
4. For each section: fact-check flags inserted where claims are made
5. Generate conclusion with CTA
6. Post-process: entity verification, keyword density check, readability score
7. Affiliate insertion: scan for insertion opportunities, generate contextual anchor text
8. Compute quality score (composite: entity coverage, SEO coverage, readability, affiliate coverage)
9. Store versioned draft

**AI Usage:** Gemini 1.5 Pro for full draft generation (long context, high quality), Groq for post-processing

---

### F-CONT-003: Content Quality Scoring

**User Goal:** Objectively score content quality before publication.

**Inputs:** Content draft, target brief, site standards config

**Outputs:**
- Composite quality score (0–100)
- Sub-scores: SEO, Readability, Entity Coverage, Affiliate Coverage, Fact Density
- Specific improvement recommendations
- Pass/Fail gate recommendation

**Scoring Dimensions:**
- SEO Score (25%): keyword in title, meta, H1, H2s; keyword density 0.5–2.5%; semantic keyword coverage
- Entity Coverage Score (20%): required entities from brief present
- Readability Score (20%): Flesch-Kincaid grade level, sentence length, paragraph length
- Affiliate Coverage Score (20%): affiliate link insertion where opportunities exist
- Structural Score (15%): intro, body sections, conclusion, proper heading hierarchy

---

### F-CONT-004: Content Refresh Engine

**User Goal:** Identify and refresh underperforming or outdated content.

**Inputs:** Content asset ID, current performance metrics, freshness threshold

**Outputs:**
- Refresh priority score
- Specific refresh recommendations
- Updated brief for refresh
- Refreshed content draft (when agent-executed)

**Refresh Triggers:**
- Content age > 12 months (configurable)
- Ranking drop > 3 positions in 30 days
- Traffic drop > 20% month-over-month
- Competitor published higher-quality version
- Affiliate links returning errors
- New entities emerged that should be included

**Workflow:**
1. Score refresh priority based on triggers
2. Re-run SERP analysis for target keyword
3. Generate diff brief (what has changed, what needs updating)
4. Agent or operator executes refresh
5. Re-score quality
6. Re-publish
7. Record refresh prediction

---

## 3.4 Revenue Features

### F-REV-001: Affiliate Opportunity Detection

**User Goal:** Maximize affiliate revenue by ensuring all content assets have optimal affiliate link coverage.

**Inputs:** Content asset (existing or brief), affiliate program registry

**Outputs:**
- Detected affiliate opportunities (product mentions without links)
- Recommended programs per opportunity
- Contextual anchor text suggestions
- Expected EPC estimate

**Workflow:**
1. Parse content for product/service/brand mentions
2. Match mentions against affiliate program registry (exact match + fuzzy match)
3. Check if mention already has affiliate link
4. For unlinked mentions: rank available programs by EPC, cookie duration, relevance
5. Generate contextual anchor text recommendation
6. Return ordered opportunity list

---

### F-REV-002: Revenue Attribution

**User Goal:** Understand which content assets and intelligence decisions generate revenue.

**Inputs:** Revenue event (conversion, commission, ad impression), UTM parameters, session data

**Outputs:**
- Attribution chain: revenue event → page → content asset → brief → intelligence signal → research session
- Revenue credit allocation (multi-touch or last-touch, configurable)

**Workflow:**
1. Receive revenue event (from affiliate API webhook, ad network pixel, direct)
2. Extract UTM parameters / session identifiers
3. Look up session in analytics (PostHog event data)
4. Trace content asset from URL
5. Trace brief from content asset
6. Trace intelligence signals that informed brief
7. Assign revenue credit to each node in attribution chain
8. Store attribution record
9. Update RPM metrics for all credited assets

---

## 3.5 Learning Features

### F-LEARN-001: Prediction Recording

**User Goal:** Build a dataset of predicted vs actual outcomes to enable machine learning.

**Inputs:** Decision type, entity ID, expected outcome, confidence level (0.0–1.0), expiry date

**Outputs:**
- Prediction record stored with unique prediction ID
- Prediction confirmation to operator/agent

**Prediction Types:**
- `content.traffic` — expected monthly organic sessions
- `content.revenue` — expected monthly affiliate/ad revenue
- `content.ranking` — expected ranking position for target keyword
- `brief.quality_score` — expected quality score of generated content
- `affiliate.epc` — expected earnings per click for program
- `experiment.variant_winner` — expected winning variant

---

### F-LEARN-002: Outcome Observation

**User Goal:** Automatically capture actual outcomes and resolve open predictions.

**Inputs:** Prediction ID (or entity ID + type for auto-matching), actual measurement, measurement source

**Workflow:**
1. Observation events triggered by:
   - Analytics sync (PostHog → actual traffic)
   - Revenue sync (affiliate API → actual commissions)
   - SERP check (actual ranking)
   - Quality scorer (actual quality score on generation)
2. Match observations to open predictions by entity ID + type + date window
3. Compute delta: predicted − actual
4. Compute error percentage
5. Update prediction record status to `resolved`
6. Emit `LearningSignalComputed` event
7. Aggregate learning signals for model improvement pipeline

---

### F-LEARN-003: Confidence Calibration

**User Goal:** Ensure the system's confidence scores are accurate (90% confidence should be right 90% of the time).

**Inputs:** All resolved predictions with confidence scores

**Outputs:**
- Calibration curve per prediction type
- Confidence bias report (over/under confident)
- Calibration adjustment factors

**Method:** Platt scaling or isotonic regression applied to prediction scores per prediction type per model. Calibration runs weekly on rolling 90-day dataset.

---

## 3.6 Agent Features

### F-AGENT-001: Research Agent

**User Goal:** Autonomously execute deep research sessions on a schedule or trigger.

**Capabilities:** Deep research session execution, entity extraction, knowledge graph ingestion
**Trigger types:** Scheduled, on-demand, event-triggered (new trend detected)
**Memory:** Episodic (previous research sessions on same topic)
**Governance constraints:** Max searches per session, max cost per session, blocked domains

---

### F-AGENT-002: Content Pipeline Agent

**User Goal:** Autonomously move content from Planned → Published status.

**Capabilities:** Brief generation, content generation, quality scoring, affiliate insertion, publishing
**Trigger types:** Scheduled (daily content target), queue-based
**Governance constraints:** Minimum quality score threshold (default 75), human-in-loop for publish step (configurable off)
**Memory:** Content standards per site, brand voice specifications

---

### F-AGENT-003: Affiliate Intelligence Agent

**User Goal:** Continuously optimize affiliate link coverage and program selection.

**Capabilities:** Opportunity detection, link insertion, dead link detection, program comparison, commission sync
**Trigger types:** Scheduled (weekly audit), event-triggered (new content published)
**Governance constraints:** Max links per 1000 words, allowed/blocked programs per site

---

### F-AGENT-004: Discovery Agent

**User Goal:** Autonomously monitor signals and surface actionable intelligence.

**Capabilities:** Feed monitoring, trend detection, competitor monitoring, opportunity scoring
**Trigger types:** Continuous (feed polling), scheduled (competitor sitemap check)
**Memory:** Seen signal hashes (deduplication), topic interest profile

---

### F-AGENT-005: Learning Agent

**User Goal:** Continuously evaluate prediction accuracy and trigger model improvement loops.

**Capabilities:** Observation triggering, calibration computation, model feedback, anomaly detection
**Trigger types:** Scheduled (daily), event-triggered (prediction batch expiry)

---

# PART 04 — DATA CONSTITUTION

## 4.1 Data Layer Architecture

```
LAYER 1 — RAW LAYER
  Raw ingested data, unprocessed.
  Retention: 90 days (configurable)
  Tables: raw_feed_items, raw_serp_results, raw_crawl_content

LAYER 2 — ACQUISITION LAYER
  Parsed and normalized data, not yet enriched.
  Tables: signals, crawled_pages, feed_sources

LAYER 3 — PROCESSING LAYER
  Enriched data: entities extracted, topics assigned, embeddings computed.
  Tables: enriched_signals, entities, entity_mentions, topics

LAYER 4 — KNOWLEDGE LAYER
  Structured knowledge: graph nodes, edges, knowledge clusters.
  Tables: graph_nodes, graph_edges, knowledge_clusters, entity_properties

LAYER 5 — INTELLIGENCE LAYER
  Computed intelligence: opportunity scores, gap analyses, authority scores.
  Tables: keyword_intelligence, content_gaps, entity_intelligence

LAYER 6 — PREDICTION LAYER
  All predictions and their resolutions.
  Tables: predictions, observations, learning_signals

LAYER 7 — REVENUE LAYER
  Revenue events and attribution chains.
  Tables: revenue_events, revenue_attribution, affiliate_conversions

LAYER 8 — TELEMETRY LAYER
  System observability: agent logs, task traces, error logs.
  Tables: agent_tasks, agent_memory, system_events, audit_logs
```

---

## 4.2 Canonical Schema Definitions

### Table: `organizations`
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'founder',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `sites`
```sql
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  niche TEXT,
  target_audience TEXT,
  brand_voice JSONB DEFAULT '{}',
  monetization_config JSONB DEFAULT '{}',
  seo_config JSONB DEFAULT '{}',
  ai_config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
```

### Table: `feed_sources`
```sql
CREATE TABLE feed_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  url TEXT NOT NULL,
  name TEXT,
  source_type TEXT NOT NULL, -- 'rss', 'atom', 'json_feed', 'sitemap'
  topics TEXT[] DEFAULT '{}',
  priority_weight NUMERIC DEFAULT 1.0,
  fetch_interval_seconds INTEGER DEFAULT 3600,
  last_fetched_at TIMESTAMPTZ,
  last_etag TEXT,
  last_modified TEXT,
  error_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `signals`
```sql
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  source_id UUID REFERENCES feed_sources(id),
  url TEXT NOT NULL,
  url_hash TEXT UNIQUE NOT NULL, -- SHA256 of normalized URL
  title TEXT,
  summary TEXT,
  full_content TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  signal_type TEXT, -- 'article', 'product_launch', 'news', 'trend'
  topics TEXT[] DEFAULT '{}',
  entities JSONB DEFAULT '[]', -- [{id, name, type, confidence}]
  revenue_signal_score NUMERIC DEFAULT 0,
  affiliate_opportunities JSONB DEFAULT '[]',
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'new' -- 'new', 'reviewed', 'actioned', 'dismissed'
);
CREATE INDEX signals_embedding_idx ON signals USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX signals_organization_id_idx ON signals (organization_id, status, fetched_at DESC);
```

### Table: `entities`
```sql
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  canonical_name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'product', 'company', 'person', 'technology', 'location', 'concept', 'brand'
  aliases TEXT[] DEFAULT '{}',
  description TEXT,
  properties JSONB DEFAULT '{}',
  wikidata_id TEXT,
  wikipedia_slug TEXT,
  official_url TEXT,
  authority_score NUMERIC DEFAULT 0,
  revenue_signal_score NUMERIC DEFAULT 0,
  embedding vector(1536),
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_enriched_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active'
);
CREATE UNIQUE INDEX entities_canonical_org_idx ON entities (organization_id, lower(canonical_name));
CREATE INDEX entities_embedding_idx ON entities USING ivfflat (embedding vector_cosine_ops);
```

### Table: `graph_nodes`
```sql
CREATE TABLE graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  node_type TEXT NOT NULL, -- 'entity', 'topic', 'keyword', 'content', 'domain'
  ref_id UUID NOT NULL, -- FK to the referenced table
  label TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  authority_score NUMERIC DEFAULT 0,
  revenue_score NUMERIC DEFAULT 0,
  traffic_score NUMERIC DEFAULT 0,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `graph_edges`
```sql
CREATE TABLE graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  source_node_id UUID REFERENCES graph_nodes(id),
  target_node_id UUID REFERENCES graph_nodes(id),
  edge_type TEXT NOT NULL, -- 'is_a', 'part_of', 'related_to', 'competes_with', 'uses', 'owned_by', 'links_to'
  weight NUMERIC DEFAULT 1.0,
  confidence NUMERIC DEFAULT 1.0,
  evidence_count INTEGER DEFAULT 1,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX graph_edges_source_idx ON graph_edges (source_node_id, edge_type);
CREATE INDEX graph_edges_target_idx ON graph_edges (target_node_id, edge_type);
```

### Table: `content_assets`
```sql
CREATE TABLE content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  site_id UUID REFERENCES sites(id),
  brief_id UUID REFERENCES content_briefs(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  target_keyword TEXT,
  content_type TEXT NOT NULL, -- 'article', 'review', 'comparison', 'listicle', 'tool_page', 'directory'
  status TEXT DEFAULT 'draft', -- 'planned', 'briefed', 'draft', 'review', 'approved', 'published', 'archived'
  current_version_id UUID,
  published_url TEXT,
  published_at TIMESTAMPTZ,
  seo_metadata JSONB DEFAULT '{}',
  structured_data JSONB DEFAULT '{}',
  quality_score NUMERIC,
  word_count INTEGER,
  entity_ids UUID[] DEFAULT '{}',
  affiliate_link_count INTEGER DEFAULT 0,
  traffic_last_30d INTEGER,
  revenue_last_30d NUMERIC,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `content_versions`
```sql
CREATE TABLE content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_asset_id UUID REFERENCES content_assets(id),
  version_number INTEGER NOT NULL,
  content_markdown TEXT NOT NULL,
  content_html TEXT,
  word_count INTEGER,
  quality_score NUMERIC,
  quality_breakdown JSONB DEFAULT '{}',
  generated_by TEXT, -- 'human', agent_id, or model identifier
  generation_model TEXT,
  generation_prompt_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `affiliate_programs`
```sql
CREATE TABLE affiliate_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  network TEXT, -- 'impact', 'partnerstack', 'cj', 'awin', 'amazon', 'direct'
  tracking_url_template TEXT,
  commission_type TEXT, -- 'cpa', 'cps', 'recurring', 'cpl'
  commission_rate NUMERIC,
  commission_currency TEXT DEFAULT 'USD',
  cookie_duration_days INTEGER,
  average_epc NUMERIC,
  categories TEXT[] DEFAULT '{}',
  entities UUID[] DEFAULT '{}', -- associated entities
  status TEXT DEFAULT 'active',
  api_credentials JSONB DEFAULT '{}', -- encrypted
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `affiliate_links`
```sql
CREATE TABLE affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  program_id UUID REFERENCES affiliate_programs(id),
  content_asset_id UUID REFERENCES content_assets(id),
  short_code TEXT UNIQUE,
  destination_url TEXT NOT NULL,
  tracked_url TEXT NOT NULL,
  anchor_text TEXT,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  revenue_generated NUMERIC DEFAULT 0,
  last_health_check_at TIMESTAMPTZ,
  health_status TEXT DEFAULT 'healthy',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `predictions`
```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  entity_type TEXT NOT NULL, -- 'content_asset', 'keyword', 'affiliate_program', 'experiment'
  entity_id UUID NOT NULL,
  prediction_type TEXT NOT NULL, -- 'traffic', 'revenue', 'ranking', 'quality_score', 'epc'
  predicted_value NUMERIC NOT NULL,
  predicted_unit TEXT, -- 'sessions/month', 'USD/month', 'position', 'score_0_100'
  confidence NUMERIC NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  predicted_by TEXT NOT NULL, -- agent_id or 'operator'
  rationale TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'expired'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `observations`
```sql
CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predictions(id),
  organization_id UUID REFERENCES organizations(id),
  actual_value NUMERIC NOT NULL,
  measurement_source TEXT NOT NULL, -- 'posthog', 'affiliate_api', 'serp_check', 'manual'
  observed_at TIMESTAMPTZ DEFAULT now(),
  delta NUMERIC GENERATED ALWAYS AS (actual_value - (SELECT predicted_value FROM predictions WHERE id = prediction_id)) STORED,
  error_pct NUMERIC
);
```

### Table: `revenue_events`
```sql
CREATE TABLE revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  site_id UUID REFERENCES sites(id),
  revenue_type TEXT NOT NULL, -- 'affiliate_commission', 'ad_revenue', 'lead', 'sponsor', 'direct'
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  program_id UUID REFERENCES affiliate_programs(id),
  content_asset_id UUID REFERENCES content_assets(id),
  affiliate_link_id UUID REFERENCES affiliate_links(id),
  session_id TEXT,
  attribution_chain JSONB DEFAULT '[]',
  external_transaction_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'paid', 'reversed'
  event_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `agent_tasks`
```sql
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  agent_type TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT DEFAULT 'queued', -- 'queued', 'running', 'completed', 'failed', 'cancelled'
  inputs JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '{}',
  execution_trace JSONB DEFAULT '[]',
  error_message TEXT,
  token_usage JSONB DEFAULT '{}',
  cost_usd NUMERIC,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX agent_tasks_org_status_idx ON agent_tasks (organization_id, status, created_at DESC);
```

---

## 4.3 Vector Store Architecture

**Primary vector store:** Supabase pgvector

**Embedding model:** Google text-embedding-004 (768 dimensions for embeddings, upgrade to 1536 as needed)

**Indexed tables with embeddings:**
- `signals.embedding` — for semantic signal deduplication and similarity search
- `entities.embedding` — for entity matching and relationship inference
- `graph_nodes.embedding` — for semantic graph traversal
- `content_assets.embedding` — for content gap analysis and similarity detection
- `content_briefs.embedding` — for brief similarity and reuse detection

**Vector operations:**
```sql
-- Find semantically similar entities to a given text
SELECT id, canonical_name, 1 - (embedding <=> query_embedding) as similarity
FROM entities
WHERE organization_id = $1
ORDER BY embedding <=> query_embedding
LIMIT 10;

-- Find content gaps: entities with no content assets
SELECT e.id, e.canonical_name
FROM entities e
WHERE e.organization_id = $1
AND NOT EXISTS (
  SELECT 1 FROM content_assets ca
  WHERE $1 = ANY(ca.entity_ids) AND ca.status = 'published'
);
```

---

# PART 05 — KNOWLEDGE GRAPH CONSTITUTION

## 5.1 Graph Architecture

The SIMIS Knowledge Graph is a multi-layer property graph stored in PostgreSQL (adjacency list pattern) with semantic search via pgvector. For complex graph traversal queries in Phase 2+, FalkorDB is evaluated as an optional graph database layer.

---

## 5.2 Node Types

| Node Type | Description | Primary Properties |
|-----------|-------------|-------------------|
| `ENTITY` | Named real-world entity | canonical_name, entity_type, authority_score, revenue_score |
| `TOPIC` | Thematic topic cluster | name, search_volume_estimate, competition_score, traffic_score |
| `KEYWORD` | Target keyword | keyword, search_volume, difficulty, intent_type, cpc |
| `CONTENT` | Published or planned content asset | title, slug, content_type, quality_score, status |
| `DOMAIN` | Web domain / publisher | domain, authority_score, niche, competitor_flag |
| `PROGRAM` | Affiliate/monetization program | name, network, commission_type, epc |
| `SIGNAL` | Intelligence signal from acquisition | title, source, signal_type, revenue_signal_score |

---

## 5.3 Edge Types

| Edge Type | Source → Target | Weight Basis |
|-----------|-----------------|--------------|
| `IS_A` | ENTITY → ENTITY (parent category) | Confidence |
| `PART_OF` | ENTITY → ENTITY (compositional) | Confidence |
| `RELATED_TO` | ENTITY ↔ ENTITY | Co-occurrence count |
| `COMPETES_WITH` | ENTITY ↔ ENTITY | Market overlap score |
| `USES` | ENTITY → ENTITY (technology/tool) | Frequency |
| `OWNED_BY` | ENTITY → ENTITY (corporate hierarchy) | Confidence |
| `COVERS` | CONTENT → TOPIC | Coverage depth score |
| `MENTIONS` | CONTENT → ENTITY | Mention count / prominence |
| `TARGETS` | CONTENT → KEYWORD | Primary/secondary flag |
| `LINKS_TO` | CONTENT → CONTENT | Internal link (anchor strength) |
| `MONETIZES_VIA` | CONTENT → PROGRAM | EPC × coverage score |
| `RANKS_FOR` | CONTENT → KEYWORD | Ranking position (inverted) |
| `PUBLISHED_ON` | CONTENT → DOMAIN | Timestamp |
| `SIGNALS_ABOUT` | SIGNAL → ENTITY | Relevance score |
| `HAS_OPPORTUNITY` | TOPIC → CONTENT (gap) | Opportunity score |

---

## 5.4 Weight Systems

**Edge Weight Computation:**

```
RELATED_TO weight = co_occurrence_count / max_co_occurrence × confidence_factor
COMPETES_WITH weight = keyword_overlap_score × market_share_delta
COVERS weight = entity_mention_count × section_prominence_score
MONETIZES_VIA weight = program_epc × content_traffic_estimate × CTR_estimate
```

**Node Score Computation:**

```
ENTITY.authority_score = 
  (backlink_count × 0.3) + 
  (content_coverage_depth × 0.3) + 
  (search_volume × 0.2) + 
  (wikidata_presence × 0.2)

ENTITY.revenue_score = 
  (affiliate_program_count × 0.4) + 
  (avg_epc × 0.4) + 
  (commercial_intent_score × 0.2)
```

---

## 5.5 Graph Evolution

Weights are not static. The graph evolves continuously:

1. **Evidence accumulation:** Each new signal mentioning an entity pair increases edge weight
2. **Revenue feedback:** When revenue is attributed to a content → entity → program chain, edge weights in that chain are reinforced
3. **Decay:** Edges with no new evidence decay by 5% per month (configurable)
4. **Merging:** Duplicate entities are detected via embedding similarity threshold (0.95+) and merged
5. **Learning feedback:** When predictions resolve, graph weights are updated via the Learning Engine

---

## 5.6 Graph Queries (Abstracted Query Language)

```typescript
// Find all monetizable entities not yet covered by content
graph.query({
  match: 'ENTITY',
  where: {
    revenue_score: { gte: 0.7 },
    notConnectedTo: { nodeType: 'CONTENT', edgeType: 'MENTIONS', status: 'published' }
  },
  orderBy: 'revenue_score DESC',
  limit: 20
})

// Find content cluster gaps: topics covered by competitors but not operator
graph.query({
  match: 'TOPIC',
  where: {
    connectedTo: { nodeType: 'DOMAIN', edgeType: 'COVERS', domain: competitor_domain },
    notConnectedTo: { nodeType: 'CONTENT', edgeType: 'COVERS', organizationId: operator_org_id }
  },
  orderBy: 'traffic_score DESC'
})

// Find highest-value affiliate link insertion opportunities
graph.query({
  match: 'CONTENT',
  where: {
    status: 'published',
    connectedTo: { nodeType: 'ENTITY', edgeType: 'MENTIONS' },
    entityConnectedTo: { nodeType: 'PROGRAM', edgeType: 'MONETIZES_VIA', weight: { gte: 0.8 } }
  },
  notHaving: { edgeType: 'MONETIZES_VIA', direct: true }
})
```

---

## 5.7 Graph APIs

```typescript
// GraphService interface
interface GraphService {
  // Node operations
  upsertNode(node: GraphNodeInput): Promise<GraphNode>
  getNode(nodeId: string): Promise<GraphNode>
  findNodes(filters: NodeFilter): Promise<GraphNode[]>
  semanticSearch(query: string, nodeType?: string, limit?: number): Promise<GraphNode[]>

  // Edge operations
  upsertEdge(edge: GraphEdgeInput): Promise<GraphEdge>
  getEdges(nodeId: string, direction: 'in' | 'out' | 'both', types?: string[]): Promise<GraphEdge[]>
  
  // Graph traversal
  getNeighbors(nodeId: string, depth: number, edgeTypes?: string[]): Promise<GraphSubgraph>
  findPath(sourceId: string, targetId: string, maxDepth: number): Promise<GraphPath[]>
  
  // Intelligence queries
  findGaps(organizationId: string, gapType: GapType): Promise<GapResult[]>
  findOpportunities(organizationId: string): Promise<OpportunityResult[]>
  
  // Maintenance
  mergeEntities(primaryId: string, duplicateId: string): Promise<void>
  decayWeights(organizationId: string): Promise<void>
  computeClusterStats(organizationId: string): Promise<ClusterStats>
}
```

---

# PART 06 — AI CONSTITUTION

## 6.1 AI Layer Architecture

```
AI ABSTRACTION LAYER
├── ModelRouter — Routes tasks to optimal model based on task type and cost
├── PromptEngine — Manages prompt versions, variables, templates
├── ResponseParser — Structured output extraction and validation
├── FallbackChain — Automatic fallback on model failure
└── CostTracker — Real-time AI cost monitoring per organization

AI PROVIDERS
├── Primary: Gemini (Gemini 1.5 Pro / Flash) — via Google AI SDK
├── Fast: Groq (Llama 3.1 / Mixtral) — for low-latency classification ops
├── Fallback: OpenRouter — multi-model fallback and experimentation
└── Embedding: Google text-embedding-004 (via Gemini API)

AGENT LAYER
├── LangGraph — Stateful agent orchestration
├── Agent Registry — Registered agents with capabilities
├── Memory Layer — Supabase-persisted agent memory
└── Governance Layer — Policy enforcement
```

---

## 6.2 Model Router

```typescript
type TaskType =
  | 'research.synthesis'        // Gemini 1.5 Pro
  | 'research.search'           // Gemini 1.5 Flash
  | 'content.generation'        // Gemini 1.5 Pro
  | 'content.brief'             // Gemini 1.5 Flash
  | 'content.scoring'           // Groq Llama
  | 'classification.entity'     // Groq
  | 'classification.intent'     // Groq
  | 'classification.topic'      // Groq
  | 'extraction.entities'       // Groq
  | 'extraction.facts'          // Groq
  | 'extraction.structured'     // Groq with JSON mode
  | 'embedding.document'        // Google text-embedding-004
  | 'embedding.query'           // Google text-embedding-004
  | 'planning.agent'            // Gemini 1.5 Pro
  | 'routing.fallback'          // OpenRouter

const MODEL_ROUTING_TABLE: Record<TaskType, ModelConfig> = {
  'research.synthesis': {
    primary: 'gemini-1.5-pro',
    fallback: 'openrouter/anthropic/claude-3.5-sonnet',
    maxTokens: 8192,
    temperature: 0.3
  },
  'content.generation': {
    primary: 'gemini-1.5-pro',
    fallback: 'openrouter/openai/gpt-4o',
    maxTokens: 8192,
    temperature: 0.7
  },
  'classification.entity': {
    primary: 'groq/llama-3.1-8b-instant',
    fallback: 'groq/mixtral-8x7b-32768',
    maxTokens: 1024,
    temperature: 0.0,
    jsonMode: true
  },
  'extraction.entities': {
    primary: 'groq/llama-3.1-70b-versatile',
    fallback: 'gemini-1.5-flash',
    maxTokens: 2048,
    temperature: 0.0,
    jsonMode: true
  }
}
```

---

## 6.3 Agent Registry

### AGENT-001: ResearchAgent

```typescript
const ResearchAgent = {
  id: 'research-agent-v1',
  name: 'Research Agent',
  capabilities: [
    'web_search',
    'content_crawl',
    'entity_extraction',
    'synthesis',
    'knowledge_graph_ingestion'
  ],
  memory: {
    episodic: true,   // remembers past research sessions on same topic
    semantic: true,   // stores facts in knowledge graph
    procedural: false
  },
  graph: buildResearchGraph(), // LangGraph StateGraph
  governance: {
    maxSearchesPerSession: 20,
    maxCostPerSession: 0.50, // USD
    blockedDomains: [],
    requireHumanApproval: false
  }
}
```

**LangGraph State:**
```typescript
interface ResearchState {
  query: string
  subQueries: string[]
  searchResults: SearchResult[]
  crawledContent: CrawledPage[]
  extractedEntities: Entity[]
  extractedFacts: Fact[]
  synthesizedDocument: string
  citations: Citation[]
  status: 'planning' | 'searching' | 'crawling' | 'extracting' | 'synthesizing' | 'complete'
  errorLog: string[]
}
```

**LangGraph Nodes:**
1. `planQueries` — decompose main query into sub-queries
2. `executeSearches` — parallel search across providers
3. `crawlTopResults` — fetch full content for top N results
4. `extractEntitiesAndFacts` — parallel Groq extraction
5. `synthesizeResearch` — Gemini synthesis
6. `ingestToKnowledgeGraph` — graph upsert
7. `recordPredictions` — record expected impact predictions

---

### AGENT-002: ContentPipelineAgent

```typescript
const ContentPipelineAgent = {
  id: 'content-pipeline-agent-v1',
  name: 'Content Pipeline Agent',
  capabilities: [
    'brief_generation',
    'content_generation',
    'quality_scoring',
    'affiliate_insertion',
    'seo_optimization',
    'publish_scheduling'
  ],
  memory: {
    episodic: false,
    semantic: true,  // brand voice, site standards
    procedural: true // publishing workflows per site
  },
  governance: {
    minimumQualityScore: 75,
    requireHumanApprovalForPublish: true, // configurable
    maxContentPerDay: 10,
    allowedSites: [] // scoped per agent instance
  }
}
```

---

### AGENT-003: AffiliateIntelligenceAgent

```typescript
const AffiliateIntelligenceAgent = {
  id: 'affiliate-intelligence-agent-v1',
  name: 'Affiliate Intelligence Agent',
  capabilities: [
    'opportunity_detection',
    'link_insertion',
    'dead_link_detection',
    'program_comparison',
    'commission_sync',
    'epc_forecasting'
  ],
  governance: {
    maxLinksPerThousandWords: 3,
    requireHumanApprovalForLinkInsertion: false,
    blockedPrograms: [],
    preferredPrograms: []
  }
}
```

---

### AGENT-004: DiscoveryAgent

```typescript
const DiscoveryAgent = {
  id: 'discovery-agent-v1',
  name: 'Discovery Agent',
  capabilities: [
    'feed_monitoring',
    'trend_detection',
    'competitor_monitoring',
    'signal_enrichment',
    'opportunity_scoring'
  ],
  memory: {
    episodic: true,  // seen signal hashes for dedup
    semantic: false,
    procedural: false
  },
  schedule: '*/15 * * * *', // every 15 minutes
  governance: {
    maxSignalsPerRun: 500,
    maxCrawlsPerRun: 50
  }
}
```

---

### AGENT-005: LearningAgent

```typescript
const LearningAgent = {
  id: 'learning-agent-v1',
  name: 'Learning Agent',
  capabilities: [
    'prediction_observation',
    'calibration_computation',
    'anomaly_detection',
    'model_feedback',
    'performance_reporting'
  ],
  schedule: '0 2 * * *', // daily at 2am
  governance: {
    requireHumanApprovalForModelUpdates: true
  }
}
```

---

## 6.4 Memory Layer

```typescript
interface AgentMemory {
  // Episodic: session-level memories
  episodic: {
    store: (agentId: string, sessionId: string, memory: EpisodicMemory) => Promise<void>
    recall: (agentId: string, query: string, limit: number) => Promise<EpisodicMemory[]>
  }
  
  // Semantic: factual knowledge stored in knowledge graph
  semantic: {
    store: (agentId: string, fact: SemanticFact) => Promise<void>
    query: (agentId: string, query: string) => Promise<SemanticFact[]>
  }
  
  // Procedural: learned task patterns
  procedural: {
    store: (agentId: string, pattern: ProceduralPattern) => Promise<void>
    retrieve: (agentId: string, taskType: string) => Promise<ProceduralPattern[]>
  }
  
  // Working: in-session state (Redis)
  working: {
    set: (sessionId: string, key: string, value: unknown, ttlSeconds: number) => Promise<void>
    get: (sessionId: string, key: string) => Promise<unknown>
    clear: (sessionId: string) => Promise<void>
  }
}
```

**Storage:**
- Episodic + Semantic + Procedural → Supabase `agent_memory` table with vector embeddings
- Working memory → Upstash Redis with TTL

---

## 6.5 Agent Governance Policy Engine

```typescript
interface GovernancePolicy {
  agentId: string
  organizationId: string

  // Cost controls
  maxCostPerTask: number  // USD
  maxCostPerDay: number   // USD
  maxTokensPerTask: number

  // Scope controls
  allowedSites: string[]   // empty = all sites
  blockedDomains: string[] // domains agent cannot crawl
  allowedTaskTypes: string[] // restrict agent capabilities

  // Human-in-loop controls
  requireApprovalFor: string[] // task types requiring human approval
  autoApproveBelow: number // risk score below which auto-approve is allowed

  // Rate controls
  maxTasksPerHour: number
  maxTasksPerDay: number

  // Quality controls
  minimumQualityThreshold: number // for content tasks
}
```

**Policy enforcement:**
Every agent task is evaluated against its governance policy before execution. Policy violations produce a `GovernanceViolationDetected` event and halt the task with a human-review requirement.

---

## 6.6 Prompt Engine

All prompts are versioned, tracked, and stored in Supabase `prompt_templates` table.

```typescript
interface PromptTemplate {
  id: string
  name: string
  task_type: TaskType
  version: number
  system_prompt: string
  user_prompt_template: string // Handlebars syntax for variable injection
  output_schema?: JSONSchema   // for structured output prompts
  model_requirements: {
    min_context_tokens: number
    json_mode: boolean
    temperature: number
  }
  performance_metrics: {
    avg_quality_score: number
    avg_latency_ms: number
    avg_cost_usd: number
    usage_count: number
  }
  status: 'draft' | 'testing' | 'active' | 'deprecated'
}
```

Prompt A/B testing: Multiple prompt versions can be simultaneously active with traffic splits. Learning Agent monitors quality scores and promotes winning version.

---

## 6.7 Resource Integration Matrix

### LangGraph
- **Role:** Stateful agent workflow orchestration. Primary backbone for all multi-step agent tasks.
- **Justification:** Enables complex conditional workflows with state persistence, human-in-loop, and parallel execution.
- **Integration Pattern:** Each SIMIS agent is a LangGraph `StateGraph`. State persisted in Supabase between runs via custom checkpointer.
- **MVP Recommendation:** Yes — required for agents.
- **Alternative:** CrewAI (simpler but less flexible)

### DSPy
- **Role:** Prompt optimization. Automatically improve prompt performance based on prediction error signals.
- **Justification:** Replaces manual prompt engineering with programmatic optimization.
- **Integration Pattern:** Learning Agent runs DSPy optimization on underperforming prompt templates. New prompt version generated and staged for testing.
- **MVP Recommendation:** Phase 2. Not required at MVP.

### LlamaIndex
- **Role:** RAG pipelines for knowledge retrieval in agents.
- **Justification:** Handles chunking, embedding, retrieval, and reranking for document-heavy research tasks.
- **Integration Pattern:** ResearchAgent uses LlamaIndex for processing crawled content.
- **MVP Recommendation:** Optional at MVP (can use direct pgvector queries); recommended for Phase 2.

### CrewAI
- **Role:** Multi-agent coordination for complex tasks requiring multiple specialized agents.
- **Alternative to LangGraph** for simpler orchestration patterns.
- **Integration Pattern:** Evaluate as fallback if LangGraph complexity becomes a blocker.
- **MVP Recommendation:** No — use LangGraph.

### PydanticAI
- **Role:** Structured output validation and type-safe AI interactions.
- **Integration Pattern:** Wrap all AI API calls in PydanticAI for guaranteed schema compliance.
- **MVP Recommendation:** Yes — critical for reliability.

### pgvector
- **Role:** Semantic search and vector similarity in PostgreSQL.
- **Integration Pattern:** All embeddings stored in Supabase. Index with ivfflat for approximate NN.
- **MVP Recommendation:** Yes — required from day one.

### FalkorDB
- **Role:** Graph database for complex relationship traversal beyond SQL adjacency lists.
- **Integration Pattern:** Optional mirror of graph_nodes/graph_edges for complex Cypher queries.
- **MVP Recommendation:** No — start with PostgreSQL adjacency list. Add in Phase 2 if traversal performance degrades.

### spaCy
- **Role:** Production-grade NLP for entity recognition, dependency parsing.
- **Integration Pattern:** Used in Enrichment Service for local entity extraction (zero API cost). Supplements Groq for high-volume processing.
- **MVP Recommendation:** Yes — run as a FastAPI microservice.

### Crawl4AI
- **Role:** AI-native crawler that extracts clean markdown from web pages.
- **Integration Pattern:** Primary crawling layer for ResearchAgent and DiscoveryAgent. Self-hosted as Docker container.
- **MVP Recommendation:** Yes — required.

### Firecrawl
- **Role:** Managed crawling API for complex JavaScript-rendered pages.
- **Integration Pattern:** Fallback when Crawl4AI fails on dynamic content. Also used for initial competitor deep crawls.
- **MVP Recommendation:** Optional (free tier available). Use for complex pages.

### PostHog
- **Role:** Analytics platform for traffic, engagement, conversion, and event tracking.
- **Integration Pattern:** Deployed on every site. Server-side events for revenue attribution. Used by Learning Agent for observation data.
- **MVP Recommendation:** Yes — critical for learning loop.

### Ezoic
- **Role:** Programmatic ad platform with API for revenue reporting.
- **Integration Pattern:** Revenue events synced via Ezoic API. Attribution tracked to content assets.
- **MVP Recommendation:** Phase 2 (requires traffic threshold).

### Impact / PartnerStack
- **Role:** Affiliate network APIs for commission tracking and program management.
- **Integration Pattern:** Webhook receiver for conversion events. API polling for commission status. Revenue events created from API data.
- **MVP Recommendation:** Impact for Phase 1 (if using Impact-tracked programs). PartnerStack for SaaS affiliate programs.

---
