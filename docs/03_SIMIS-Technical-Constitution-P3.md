# SIMIS TECHNICAL CONSTITUTION PACKAGE
## Parts 07–11: Learning, Revenue, Technical, Engineering, and AI IDE Agent Constitutions

---

# PART 07 — LEARNING CONSTITUTION

## 7.1 Learning System Architecture

The Learning System is SIMIS's core competitive moat. It converts every decision into a data point, every outcome into a learning signal, and every learning signal into a future improvement. The system is deterministic and traceable — no black-box learning.

```
LEARNING SYSTEM COMPONENTS
├── Prediction Engine      — Records expected outcomes before action
├── Observation Engine     — Measures actual outcomes after action
├── Delta Engine           — Computes prediction vs actual gap
├── Learning Signal Engine — Extracts structured learning signals from deltas
├── Reward Engine          — Assigns reward signals to agent decisions
├── Confidence Engine      — Calibrates confidence scores to actuals
├── Counterfactual Engine  — Models alternative decision paths
└── Meta Learning Engine   — Improves the learning system itself
```

---

## 7.2 Prediction Engine

**Responsibility:** Before any significant action, record what outcome is expected and with what confidence.

**Prediction lifecycle:**
```
CREATED → PENDING → OBSERVED (auto) or EXPIRED (if observation window passes)
```

**Prediction domains:**

| Domain | Prediction Type | Metric | Observation Window |
|--------|----------------|--------|-------------------|
| Content | `traffic` | Monthly organic sessions | 90 days |
| Content | `revenue` | Monthly affiliate/ad revenue | 90 days |
| Content | `ranking` | Target keyword ranking position | 60 days |
| Content | `quality_score` | Quality score 0–100 | 24 hours |
| Affiliate | `epc` | Earnings per click USD | 30 days |
| Affiliate | `conversion_rate` | Conversion rate % | 30 days |
| Experiment | `variant_winner` | Winning variant ID | 30 days |
| Agent | `task_quality` | Task output quality 0–100 | 1 hour |

**Confidence encoding:**
```
0.5  = Educated guess (low signal data)
0.65 = Some supporting evidence
0.75 = Strong supporting evidence
0.85 = Very strong evidence + historical precedent
0.95 = Near-certain based on strong evidence
```

**Auto-prediction:** Major agent actions (content generation, publishing) automatically generate predictions using the `PredictionAI` component which analyzes:
- Historical performance of similar content on same site
- SERP competition for target keyword
- Affiliate program historical EPC
- Content quality score at time of prediction

---

## 7.3 Observation Engine

**Responsibility:** Automatically measure actual outcomes and link them to open predictions.

**Observation sources:**

```typescript
const OBSERVATION_SOURCES = {
  'content.traffic': {
    source: 'posthog',
    query: 'pageview_count_30d WHERE url = content.url',
    frequency: 'weekly'
  },
  'content.revenue': {
    source: 'revenue_events',
    query: 'SUM(amount) WHERE content_asset_id = prediction.entity_id AND month = observation_month',
    frequency: 'monthly'
  },
  'content.ranking': {
    source: 'serp_check',
    query: 'SERP position for content.target_keyword',
    frequency: 'weekly'
  },
  'content.quality_score': {
    source: 'quality_scorer',
    query: 'quality_score WHERE content_version_id = latest',
    frequency: 'on_publish'
  }
}
```

**Observation matching:**
1. Daily: Observation Engine queries all open predictions expiring within 7 days
2. Triggers appropriate observation source query
3. Matches observation to prediction by entity_id + prediction_type
4. Creates `observations` record with actual_value
5. Computes delta and error_pct
6. Emits `OutcomeObserved` event

---

## 7.4 Learning Signal Engine

**Responsibility:** Convert raw prediction/observation deltas into structured learning signals.

**Learning signal types:**

```typescript
interface LearningSignal {
  id: string
  prediction_id: string
  signal_type: LearningSignalType
  signal_data: {
    feature_vector: Record<string, number>  // features present at prediction time
    error_direction: 'over_predicted' | 'under_predicted' | 'accurate'
    error_magnitude: number  // abs(error_pct)
    contributing_factors: FactorAnalysis[]
  }
  actionable_insight: string  // human-readable learning
  confidence: number
  created_at: string
}
```

**Signal extraction:**
When a prediction error > 15% (configurable threshold), the Learning Signal Engine:
1. Retrieves features present at prediction time (content type, keyword difficulty, site authority, topic cluster)
2. Identifies similar historical predictions and their outcomes
3. Generates structured feature-outcome correlation
4. Produces actionable insight text via Gemini
5. Updates feature importance weights in Prediction Engine

---

## 7.5 Confidence Engine

**Method:** Platt scaling per prediction_type per organization

**Calibration process (weekly cron):**
1. Retrieve all resolved predictions with confidence scores for past 90 days
2. Bin predictions by confidence level (0.5–0.55, 0.55–0.65, etc.)
3. Compute actual accuracy rate per bin
4. Fit Platt scaling parameters (sigmoid calibration)
5. Apply calibration: calibrated_confidence = 1 / (1 + exp(-(a × raw_confidence + b)))
6. Store calibration parameters per org per prediction_type
7. All future predictions apply calibration before display

**Calibration quality metric:**
`Expected Calibration Error (ECE)` — target < 0.05

---

## 7.6 Counterfactual Engine

**Purpose:** Model alternative decision paths to improve future decision-making.

**Example counterfactuals:**
- "If we had targeted keyword X instead of Y, expected traffic would have been..."
- "If we had used affiliate program A instead of B, expected revenue would have been..."
- "If we had published 2 days earlier (before competitor), expected ranking would have been..."

**Implementation:**
Counterfactual engine uses historical data + causal inference (simple do-calculus approximation) to estimate alternative outcomes. This is logged as `counterfactual_analysis` records and surfaced in the Prediction Center UI.

---

## 7.7 Meta Learning Engine

**Purpose:** Improve the learning system itself.

**Meta learning tasks:**
1. Evaluate prediction model accuracy over time (are we getting better?)
2. Identify prediction domains with highest calibration error (where do we learn least?)
3. Identify features with highest predictive power (what matters most?)
4. Recommend observation window adjustments based on convergence analysis
5. Detect data drift in prediction inputs (has the environment changed?)

**Schedule:** Monthly. Output: Meta Learning Report in Learning Center.

---

# PART 08 — REVENUE CONSTITUTION

## 8.1 Revenue Architecture

```
REVENUE ENGINE
├── Affiliate Engine          — Affiliate link lifecycle management
├── Ads Engine                — Ad placement and optimization intelligence
├── Sponsor Engine            — Sponsor opportunity detection and management
├── Lead Engine               — Lead generation tracking and optimization
├── Newsletter Engine         — Newsletter monetization
├── Revenue Attribution Engine — Multi-touch attribution
└── Revenue Intelligence Engine — Forecasting, optimization, anomaly detection
```

---

## 8.2 Affiliate Engine

**Core data flow:**
```
Affiliate Program Registration
  → Link Generation (with tracking params)
    → Link Insertion (in content)
      → Click Tracking (PostHog event or redirect)
        → Conversion Webhook (from network)
          → Commission Record
            → Revenue Attribution
              → Learning Signal
```

**Affiliate Link Management:**

```typescript
// Link URL structure
// Direct: https://site.com/go/{short_code}
// Tracked: {affiliate_network_link}?{tracking_params}&simis_link_id={link_id}

interface AffiliateLink {
  shortCode: string           // /go/abc123
  destinationUrl: string      // actual affiliate URL
  trackedUrl: string          // tracked version
  programId: string
  contentAssetId: string
  anchorText: string
  insertionContext: string    // surrounding sentence for context
}
```

**Link health monitoring:**
- Nightly cron: HEAD request to all active affiliate links
- Flag links with 4xx responses as `broken`
- Alert operator for manual review
- Auto-suggest replacement programs via Affiliate Intelligence Agent

**Commission syncing:**
- Impact API: webhook on conversion events
- PartnerStack API: polling every 6 hours
- CJ, Awin: CSV import + API (where available)
- Manual entry: fallback for programs without API

---

## 8.3 Ads Engine

**Purpose:** Intelligently manage ad placement, RPM optimization, and ad network integration.

**Ad placement intelligence:**
```typescript
interface AdPlacementIntelligence {
  contentId: string
  recommendedPlacements: {
    position: 'above_fold' | 'in_content_33' | 'in_content_66' | 'sidebar' | 'footer'
    adType: 'display' | 'native' | 'sticky'
    expectedRPM: number
    conflictWithAffiliate: boolean  // avoid competing CTAs
  }[]
  optimalAdDensity: number  // ads per 1000 words
  estimatedMonthlyRevenue: number
}
```

**Ad network priority:**
1. Mediavine / Raptive (premium RPM, requires traffic threshold)
2. Ezoic (programmatic optimization)
3. Google AdSense (fallback, always available)
4. Direct ads (highest RPM when available)

**RPM tracking per content asset:**
Daily PostHog + ad network sync. Revenue events created per content asset per day.

---

## 8.4 Sponsor Engine

**Sponsor opportunity detection:**
1. Monitor content performance: identify articles with > 5,000 monthly sessions
2. Identify content topic overlap with potential sponsor categories
3. Score sponsor fit: audience intent match × traffic × engagement rate
4. Generate sponsor outreach brief with audience data

**Sponsor content types:**
- Sponsored article (disclosed)
- Sponsored newsletter section
- Sponsored tool/calculator
- Sponsored directory listing
- Brand mention in review content (direct paid)

**Sponsor tracking:**
- Sponsored content assets tagged with `sponsor_id` and disclosure metadata
- Revenue events created per sponsorship payment
- Attribution tracked through content performance metrics

---

## 8.5 Revenue Attribution Engine

**Attribution models supported:**

| Model | Description | Use Case |
|-------|-------------|----------|
| Last Touch | 100% credit to last content touchpoint | Default for affiliate |
| First Touch | 100% credit to first touchpoint | Awareness content measurement |
| Linear | Equal credit across all touchpoints | Newsletter + content chains |
| Position Based | 40/20/40 first/middle/last | Full funnel analysis |
| Data Driven | ML-based attribution weights | Phase 3+ |

**Attribution chain construction:**
1. Revenue event received with session identifier
2. PostHog session lookup: retrieve all pageviews in session
3. For each pageview: map URL to content asset
4. Construct attribution chain: [content_asset_1, content_asset_2, ... revenue_event]
5. Apply attribution model to distribute revenue credit
6. Store `revenue_attribution` records
7. Update RPM metrics on all credited content assets

**Revenue schema:**
```typescript
interface RevenueAttribution {
  revenueEventId: string
  attributedAmount: number
  attributedAt: string
  contentAssets: {
    contentAssetId: string
    attributionWeight: number
    attributedRevenue: number
    touchPosition: number
  }[]
  model: AttributionModel
}
```

---

## 8.6 Revenue Intelligence Engine

**Forecast model:**
```
Monthly Revenue Forecast = 
  Σ (content_traffic_forecast × RPM_estimate) [Ads]
  + Σ (content_traffic_forecast × affiliate_CTR_estimate × EPC_estimate) [Affiliate]
  + Σ (sponsor_revenue_contracted) [Sponsors]
  + Σ (lead_volume_estimate × lead_value_estimate) [Leads]
```

Forecasts use:
- Historical 90-day rolling averages (base)
- Trend factors from Learning Engine
- Prediction Engine outputs for planned content
- Seasonal adjustment factors (configurable)

**Revenue anomaly detection:**
- Day-over-day: alert if > 40% revenue drop vs same day last week
- Week-over-week: alert if > 25% revenue drop vs same week last month
- Affiliate link failure correlation: if revenue drop correlates with link failure
- Anomaly explanations generated by Gemini via contextual analysis

---

# PART 09 — TECHNICAL CONSTITUTION

## 9.1 Frontend Architecture

**Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui

**Project structure:**
```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── layout.tsx         # Main dashboard shell
│   │   ├── page.tsx           # Dashboard home
│   │   ├── intelligence/
│   │   │   ├── research/
│   │   │   ├── discovery/
│   │   │   ├── serp/
│   │   │   ├── trends/
│   │   │   ├── competitors/
│   │   │   └── entities/
│   │   ├── knowledge/
│   │   │   ├── graph/
│   │   │   ├── entities/
│   │   │   └── topics/
│   │   ├── content/
│   │   │   ├── planner/
│   │   │   ├── briefs/
│   │   │   ├── generator/
│   │   │   ├── editor/
│   │   │   └── refresh/
│   │   ├── publishing/
│   │   ├── revenue/
│   │   │   ├── affiliate/
│   │   │   ├── ads/
│   │   │   ├── sponsors/
│   │   │   ├── leads/
│   │   │   └── center/
│   │   ├── analytics/
│   │   ├── learning/
│   │   │   ├── predictions/
│   │   │   ├── insights/
│   │   │   └── experiments/
│   │   ├── automation/
│   │   │   ├── agents/
│   │   │   └── workflows/
│   │   └── settings/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── intelligence/          # Intelligence-specific components
│   ├── content/               # Content workspace components
│   ├── graph/                 # Knowledge graph visualization
│   ├── revenue/               # Revenue components
│   ├── agents/                # Agent monitoring components
│   └── shared/                # Shared layout, nav, etc.
├── lib/
│   ├── api/                   # API client functions
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # Zustand state stores
│   └── utils/                 # Utility functions
└── types/                     # Shared TypeScript types
```

**State management:**
- Server state: TanStack Query (React Query) v5
- Client state: Zustand (minimal — prefer server state)
- Form state: React Hook Form + Zod validation
- Realtime: Supabase Realtime channels for agent activity feeds

**Rendering strategy:**
- Dashboard pages: Server Components with client islands for interactive elements
- Real-time feeds (Discovery Hub, Agent Activity): Client Components with Supabase Realtime
- Knowledge Graph visualization: Client Component with Cytoscape.js
- Static marketing pages: Static export

---

## 9.2 Backend Architecture

**Primary backend:** FastAPI (Python) for AI/agent-heavy operations

**Secondary:** Next.js Server Actions for CRUD operations that don't need agent capabilities

**FastAPI service structure:**
```
services/api/
├── main.py
├── routers/
│   ├── intelligence.py    # Research, SERP, discovery endpoints
│   ├── knowledge.py       # Graph and entity endpoints
│   ├── content.py         # Content generation and management
│   ├── revenue.py         # Revenue and affiliate endpoints
│   ├── agents.py          # Agent task management
│   ├── learning.py        # Prediction and observation endpoints
│   └── webhooks.py        # External webhook receivers
├── services/
│   ├── intelligence/
│   │   ├── research_service.py
│   │   ├── serp_service.py
│   │   ├── crawl_service.py
│   │   └── feed_service.py
│   ├── knowledge/
│   │   ├── graph_service.py
│   │   ├── entity_service.py
│   │   └── embedding_service.py
│   ├── content/
│   │   ├── brief_service.py
│   │   ├── generation_service.py
│   │   ├── quality_service.py
│   │   └── publishing_service.py
│   ├── revenue/
│   │   ├── affiliate_service.py
│   │   ├── attribution_service.py
│   │   └── forecast_service.py
│   ├── agents/
│   │   ├── agent_registry.py
│   │   ├── task_executor.py
│   │   └── governance.py
│   └── learning/
│       ├── prediction_service.py
│       ├── observation_service.py
│       └── calibration_service.py
├── agents/
│   ├── research_agent.py
│   ├── content_pipeline_agent.py
│   ├── affiliate_agent.py
│   ├── discovery_agent.py
│   └── learning_agent.py
├── models/                # Pydantic models
├── db/                    # Database layer (SQLAlchemy + asyncpg)
└── config/                # Settings and environment config
```

---

## 9.3 API Architecture

**API design principles:**
- REST for CRUD operations
- All endpoints require Bearer token (Supabase JWT)
- Rate limiting per organization per endpoint family
- Pagination: cursor-based for all list endpoints
- Versioning: `/v1/` prefix, no breaking changes without version bump

**API response envelope:**
```typescript
interface APIResponse<T> {
  data: T | null
  error: string | null
  meta?: {
    pagination?: { cursor: string; hasMore: boolean; total?: number }
    requestId: string
    processingMs: number
  }
}
```

**Key API surface:**
```
POST /v1/intelligence/research          — Start research session
GET  /v1/intelligence/serp/{keyword}    — Get SERP data
GET  /v1/signals                        — List signals with filters
POST /v1/entities                       — Create/upsert entity
GET  /v1/graph/nodes                    — Query graph nodes
POST /v1/content/briefs                 — Create content brief
POST /v1/content/generate               — Generate content from brief
GET  /v1/content/assets                 — List content assets
POST /v1/revenue/affiliate/links        — Create affiliate link
GET  /v1/revenue/attribution/{id}       — Get revenue attribution chain
POST /v1/predictions                    — Create prediction
POST /v1/agents/tasks                   — Queue agent task
GET  /v1/agents/{id}/tasks              — Get agent task history
```

---

## 9.4 Database Architecture

**Primary:** Supabase PostgreSQL 15+

**Key extensions:**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";          -- pgvector
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";       -- GIN indexes on arrays
```

**Row Level Security — universal policy pattern:**
```sql
-- Enable RLS on all tables
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- Organization isolation policy
CREATE POLICY "{table_name}_org_isolation" ON {table_name}
  USING (organization_id = (
    SELECT organization_id FROM org_members 
    WHERE user_id = auth.uid()
  ));
```

**Indexing strategy:**
```sql
-- Always index: organization_id + status + created_at (common query pattern)
CREATE INDEX {table}_org_status_created_idx 
  ON {table} (organization_id, status, created_at DESC);

-- Trigram search for entity names
CREATE INDEX entities_name_trgm_idx ON entities 
  USING gin (canonical_name gin_trgm_ops);

-- Array containment (entity_ids on content_assets)
CREATE INDEX content_entity_ids_idx ON content_assets 
  USING gin (entity_ids);
```

**Supabase Realtime subscriptions:**
- `agent_tasks` — operator subscribes to their organization's task updates
- `signals` — operator subscribes to new signals
- `revenue_events` — optional real-time revenue alerts

---

## 9.5 Search Architecture

**Multi-level search:**

| Level | Technology | Use Case |
|-------|-----------|----------|
| Full-text | PostgreSQL `tsvector` + `tsquery` | Fast keyword search within titles/content |
| Fuzzy | pg_trgm similarity | Entity name matching with typos |
| Semantic | pgvector cosine similarity | Semantic content/entity search |
| External | Brave/Serper/Tavily | Web search for fresh content |

**Search query routing:**
```typescript
async function search(query: string, context: SearchContext): Promise<SearchResults> {
  const [fullTextResults, semanticResults] = await Promise.all([
    searchFullText(query, context),
    searchSemantic(await embedQuery(query), context)
  ])
  return mergeAndRankResults(fullTextResults, semanticResults)
}
```

---

## 9.6 Queue Architecture

**Primary:** Trigger.dev v3

**Job types:**
```typescript
// Scheduled jobs
export const feedIngestionJob = schedules.task({
  id: 'feed-ingestion',
  cron: '*/15 * * * *',
  run: async () => { /* ingest all active feeds */ }
})

export const learningObservationJob = schedules.task({
  id: 'learning-observation',
  cron: '0 2 * * *',
  run: async () => { /* run observation engine */ }
})

// Event-triggered jobs
export const signalEnrichmentJob = task({
  id: 'signal-enrichment',
  run: async (payload: { signalId: string }) => { /* enrich signal */ }
})

export const contentGenerationJob = task({
  id: 'content-generation',
  run: async (payload: { briefId: string; model: string }) => { /* generate content */ }
})
```

---

## 9.7 Caching Architecture

**Cache layers:**

| Layer | Technology | TTL | Use Case |
|-------|-----------|-----|----------|
| L1 | Upstash Redis | 5m–24h | SERP results, entity profiles, computed scores |
| L2 | Next.js unstable_cache | 60s–1h | Dashboard metrics, feed summaries |
| L3 | Cloudflare CDN | varies | Static assets, public content pages |
| L4 | Browser cache | varies | Static assets |

**Cache key conventions:**
```
serp:{keyword_slug}:{location}:{device} → TTL 6h
entity:{entity_id}:profile → TTL 1h
entity:{entity_id}:revenue_signals → TTL 12h
org:{org_id}:dashboard_metrics → TTL 5m
org:{org_id}:revenue_summary:{date_range} → TTL 15m
```

---

## 9.8 Observability Architecture

**Observability stack:**

| Tool | Role |
|------|------|
| PostHog | Product analytics (user behavior, funnel, cohorts) |
| Sentry | Error tracking and performance monitoring |
| OpenTelemetry | Distributed tracing across services |
| Trigger.dev | Job queue observability (built-in) |
| Supabase Dashboard | Database query performance |

**Logging standards:**
```python
# All log entries include:
{
  "timestamp": "ISO8601",
  "level": "INFO|WARNING|ERROR",
  "service": "api|worker|agent",
  "organization_id": "uuid",
  "trace_id": "uuid",
  "operation": "research.synthesis",
  "duration_ms": 1234,
  "model": "gemini-1.5-pro",
  "tokens_used": 2048,
  "cost_usd": 0.0023,
  "message": "...",
  "metadata": {}
}
```

---

## 9.9 Security Architecture

**Authentication:** Supabase Auth (JWT)
- Email/password
- OAuth (Google)
- Magic link for Phase 3+

**Authorization:** Row Level Security (Supabase) + API middleware

**Secret management:**
- API keys stored encrypted in `organization_secrets` table using Supabase Vault
- Never stored in environment variables per-organization
- Key access requires organization membership check

**API governance:**
```python
# Every API endpoint validates:
1. Valid Supabase JWT (authentication)
2. Organization membership (authorization)
3. Rate limit not exceeded (rate limiting)
4. Request payload within size limits (input validation)
5. Output filtered by RLS (data isolation)
```

**Agent governance (additional):**
```python
# Every agent action validates:
1. Agent is active and not paused
2. Action is within agent's allowed capabilities
3. Target resource belongs to agent's scoped organization
4. Cost estimate within governance limits
5. Human approval obtained if required
```

---

## 9.10 Deployment Architecture

```
PRODUCTION ENVIRONMENT

Frontend:        Vercel (Next.js)
API Service:     Fly.io or Railway (FastAPI Docker)
Database:        Supabase (managed PostgreSQL)
Cache:           Upstash Redis (managed Redis)
Storage:         Supabase Storage
Queue:           Trigger.dev cloud
Crawler:         Fly.io (Crawl4AI Docker)
Analytics:       PostHog cloud
Error tracking:  Sentry
DNS/CDN/WAF:     Cloudflare
```

**Environment configuration:**
```
ENVIRONMENTS:
- development (local)
- staging (preview deployments on Vercel)
- production

Required environment variables:
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
GEMINI_API_KEY
GROQ_API_KEY
OPENROUTER_API_KEY
BRAVE_SEARCH_API_KEY
SERPER_API_KEY
TRIGGER_SECRET_KEY
POSTHOG_API_KEY
SENTRY_DSN
```

---

# PART 10 — ENGINEERING CONSTITUTION

## 10.1 Monorepo Structure

```
simis/
├── apps/
│   ├── web/                   # Next.js 15 frontend
│   └── api/                   # FastAPI Python backend
├── packages/
│   ├── database/              # Supabase migrations + type generation
│   ├── shared-types/          # TypeScript types shared between apps
│   ├── ai-client/             # AI provider abstraction layer
│   ├── graph-client/          # Knowledge graph client
│   └── config/                # Shared ESLint, TypeScript, Tailwind configs
├── services/
│   ├── crawler/               # Crawl4AI Docker service
│   └── enrichment/            # spaCy entity extraction service
├── agents/
│   ├── research/              # ResearchAgent LangGraph definition
│   ├── content-pipeline/      # ContentPipelineAgent
│   ├── affiliate/             # AffiliateIntelligenceAgent
│   ├── discovery/             # DiscoveryAgent
│   └── learning/              # LearningAgent
├── docs/
│   ├── constitution/          # This document and supporting specs
│   ├── architecture/          # Architecture decision records (ADRs)
│   ├── api/                   # OpenAPI specs
│   └── agents/                # Agent specifications
├── scripts/
│   ├── seed/                  # Database seed scripts
│   └── migrations/            # Manual migration scripts
├── .github/
│   └── workflows/             # CI/CD pipelines
├── turbo.json                 # Turborepo config
├── pnpm-workspace.yaml
└── package.json
```

---

## 10.2 Coding Standards

### TypeScript Standards

```typescript
// Use strict TypeScript everywhere
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}

// All functions must have explicit return types
async function createBrief(input: CreateBriefInput): Promise<Brief> { ... }

// No `any` — use `unknown` and narrow
function processData(data: unknown): ProcessedData {
  if (!isValidData(data)) throw new Error('Invalid data')
  return process(data)
}

// Use Zod for all external input validation
const CreateBriefSchema = z.object({
  targetKeyword: z.string().min(1).max(200),
  contentType: ContentTypeEnum,
  siteId: z.string().uuid()
})
```

### Python Standards

```python
# Use Python 3.12+
# All functions type-annotated
# Pydantic models for all data contracts
# async/await for all I/O operations
# Never use synchronous HTTP calls in async context

from pydantic import BaseModel
from typing import Annotated
import asyncio

class BriefInput(BaseModel):
    target_keyword: Annotated[str, Field(min_length=1, max_length=200)]
    content_type: ContentType
    site_id: UUID

async def create_brief(input: BriefInput) -> Brief:
    ...
```

### Database Standards

```sql
-- All tables must have:
-- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
-- organization_id UUID (for multi-tenant tables)
-- created_at TIMESTAMPTZ DEFAULT now()
-- updated_at TIMESTAMPTZ DEFAULT now() (with trigger)
-- RLS enabled

-- Migrations: sequential numbered files
-- 001_initial_schema.sql
-- 002_add_graph_tables.sql
-- etc.

-- All indexes named explicitly:
-- {table}_{columns}_{type}_idx
-- Example: signals_organization_status_idx
```

---

## 10.3 Testing Standards

```
TEST PYRAMID:
├── Unit Tests (70%)    — services, utilities, data transformations
├── Integration Tests (20%) — API endpoints, database operations
└── E2E Tests (10%)    — critical user journeys
```

**Testing tools:**
- TypeScript: Vitest + Testing Library
- Python: pytest + pytest-asyncio
- E2E: Playwright
- API: Supertest (Node) / httpx (Python)

**Required coverage:** 80% minimum for services and API layers

**Test naming:**
```typescript
describe('BriefService', () => {
  describe('createBrief', () => {
    it('should generate outline from SERP data when SERP data is available')
    it('should generate outline from knowledge graph when SERP data is unavailable')
    it('should throw ValidationError when keyword is empty')
    it('should record prediction after brief creation')
  })
})
```

---

## 10.4 CI/CD Standards

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  typecheck:     # tsc --noEmit
  lint:          # eslint + prettier check
  unit-test:     # vitest run
  integration:   # test against supabase local
  e2e:           # playwright (on main branch only)
  build:         # next build
  deploy-preview: # vercel deploy preview
  deploy-prod:   # vercel deploy production (main branch only)
```

**Branch strategy:**
```
main          → production
develop       → staging
feature/*     → preview deployments
hotfix/*      → direct to main with fast-track review
```

---

## 10.5 Documentation Standards

**Architecture Decision Records (ADRs):**
Every significant architecture decision must have an ADR:
```markdown
# ADR-{number}: {Title}
Date: YYYY-MM-DD
Status: Proposed | Accepted | Deprecated

## Context
What is the problem?

## Decision
What was decided?

## Consequences
What are the tradeoffs?
```

**API documentation:** OpenAPI 3.1 spec auto-generated from FastAPI. Published at `/docs` in development.

**Agent documentation:** Each agent has a `AGENT_SPEC.md` in its directory covering capabilities, state schema, governance constraints, and example tasks.

---

# PART 11 — AI IDE AGENT CONSTITUTION

## 11.1 Repository Agent Instructions

**File:** `.github/copilot-instructions.md` (also readable by Claude Code, Cursor, Gemini Code Assist)

```markdown
# SIMIS Repository Agent Instructions

## Project Identity
SIMIS is a Self-Improving Media Intelligence Operating System.
This is not a simple web app. It is a complex multi-domain platform.

## Architecture Context
- Monorepo managed with Turborepo + pnpm workspaces
- Frontend: apps/web (Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui)
- Backend: apps/api (FastAPI, Python 3.12)
- Agents: agents/* (LangGraph-based autonomous agents)
- Database: Supabase PostgreSQL with pgvector + RLS

## Critical Rules
1. NEVER write code without RLS policies for new tables
2. NEVER create direct database queries without organization_id scoping
3. NEVER store API keys in code — all secrets via organization_secrets (Supabase Vault)
4. NEVER write sync HTTP calls in async context
5. ALWAYS add Pydantic validation to new Python endpoints
6. ALWAYS add Zod validation to TypeScript API inputs
7. ALWAYS add prediction recording when creating content or running major agent tasks
8. ALWAYS emit domain events (Supabase Realtime) for state-changing operations
9. NEVER add dependencies without checking phase compatibility (see ARCHITECTURE.md)
10. ALWAYS write tests for new service functions

## Domain Knowledge
- Every action should be traceable to an economic outcome
- All content assets must carry entity_ids for knowledge graph linkage
- All revenue events must have attribution chains
- Agent tasks must respect governance policies before execution

## Code Generation Preferences
- Prefer server components with minimal client islands
- Use TanStack Query for all server state in client components
- Use React Hook Form + Zod for forms
- Use shadcn/ui components, not custom UI from scratch
- FastAPI routers should be thin — logic lives in service layer
- Use async/await consistently — no sync operations in hot paths
```

---

## 11.2 Agent Context Files

**File:** `.agent/context.md`

```markdown
# SIMIS Agent Context

## System Purpose
Convert information into revenue-producing digital assets via a closed intelligence loop.

## Core Intelligence Loop
DATA → KNOWLEDGE → INTELLIGENCE → DECISION → EXECUTION → TRAFFIC → CONVERSION → REVENUE → LEARNING → BETTER DECISION

## Primary Domains
1. Intelligence: Acquiring and processing information from external sources
2. Knowledge: Structuring information into entity/topic/relationship graphs
3. Content: Planning, generating, and publishing optimized content
4. Revenue: Attributing and optimizing all monetization streams
5. Learning: Recording predictions vs outcomes to improve decisions

## Technology Stack
- Database: Supabase PostgreSQL (see packages/database for schema)
- AI: Gemini 1.5 Pro (reasoning/generation), Groq (fast ops), OpenRouter (fallback)
- Agents: LangGraph stateful workflows (see agents/ directory)
- Queue: Trigger.dev v3
- Cache: Upstash Redis

## Multi-Tenancy
All database tables are scoped by organization_id with RLS.
Agent code always receives organization_id in task payload.
Never cross organization boundaries.

## Revenue Sensitivity
All content creation MUST check affiliate opportunities before completion.
All publishing MUST validate affiliate links are healthy.
Revenue attribution MUST be triggered on all new content publishing.
```

---

## 11.3 Planning Files

**File:** `.agent/planning.md`

```markdown
# SIMIS Planning Guide for AI Agents

## When Planning New Features
1. Identify which bounded context(s) are affected
2. Check existing domain events that can be leveraged
3. Design data model changes (new tables, new columns, indexes)
4. Define API endpoints needed
5. Define UI components needed
6. Define agent capabilities needed
7. Define tests required
8. Estimate prediction types to add for learning loop

## Feature Checklist
- [ ] Data model designed and migration written
- [ ] RLS policies defined
- [ ] API endpoints defined with Pydantic/Zod schemas
- [ ] Service layer functions written with unit tests
- [ ] Domain events emitted for state changes
- [ ] UI components use shadcn/ui base
- [ ] Loading and error states handled
- [ ] Prediction recording added where applicable
- [ ] Revenue attribution hooks added where applicable

## Phase Compatibility
Before adding infrastructure:
- Is this dependency available in free tier? (Phase 1 requirement)
- Is this self-hostable? (preferred)
- Is this replaceable without migration? (modularity requirement)
```

---

## 11.4 Task Files

**File:** `.agent/tasks/content-generation-task.md` (example task specification)

```markdown
# Task: Generate Content From Brief

## Task ID
content-generation-v1

## Objective
Generate a publication-quality content draft from a structured content brief.

## Preconditions
- Brief exists and status = 'ready'
- Site brand voice config exists
- Affiliate programs loaded for site

## Inputs
- brief_id: UUID
- model: 'gemini-1.5-pro' | 'gemini-1.5-flash'
- tone: 'professional' | 'conversational' | 'technical'
- operator_id: UUID (for RLS)
- organization_id: UUID

## Steps
1. Load brief from database
2. Load site brand voice from site.brand_voice
3. Load SERP data for brief.target_keyword (from cache or fetch)
4. Load competitor content analysis (from brief.competitor_refs or re-analyze)
5. Generate intro section
6. For each H2 in brief.outline: generate section content
7. Generate conclusion with CTA
8. Run quality scorer
9. Run affiliate opportunity detector
10. If quality_score < 75: retry with enriched context once
11. Save content version
12. Record prediction: expected_traffic, expected_revenue, predicted_quality_score
13. Return content version ID

## Outputs
- content_version_id: UUID
- quality_score: number
- affiliate_opportunities: AffiliateOpportunity[]
- prediction_ids: UUID[]
- word_count: number

## Error Handling
- AI API failure: retry 3 times with exponential backoff, then fall back to alternative model
- Quality score < 60 after retry: flag for human review, do not auto-publish
- Affiliate detection failure: continue without affiliate data, log warning

## Governance Checks
- organization_id must match brief.organization_id
- model must be in organization's allowed_models list
- cost estimate must be within governance.maxCostPerTask
```

---

## 11.5 Self-Audit Instructions

**File:** `.agent/self-audit.md`

```markdown
# SIMIS Self-Audit Instructions for AI Agents

## Before Submitting Code

### Security Audit
- [ ] No API keys or secrets in code (check git diff for key patterns)
- [ ] All new tables have RLS enabled
- [ ] All queries include organization_id where applicable
- [ ] Input validation exists on all new API endpoints
- [ ] No SQL injection via string concatenation (use parameterized queries)

### Architecture Audit
- [ ] New code follows domain boundaries (not cross-context imports at model level)
- [ ] Domain events emitted for state changes
- [ ] Error handling uses established patterns (not new patterns)
- [ ] New async functions are truly async (no blocking operations)

### Data Quality Audit
- [ ] New tables have appropriate indexes for anticipated query patterns
- [ ] Embeddings computed for new text-heavy entities
- [ ] entity_ids populated on content assets when entities are known

### Revenue Intelligence Audit
- [ ] New content creation paths include affiliate opportunity detection
- [ ] New publishing paths include prediction recording
- [ ] Revenue attribution hooks included for new revenue event types

### Learning Loop Audit
- [ ] New agent decisions record predictions before execution
- [ ] New outcome sources wire into observation engine

### Testing Audit
- [ ] Unit tests written for new service functions
- [ ] Tests cover error/edge cases, not only happy path
- [ ] Integration tests for new API endpoints

## Code Review Checklist for Humans
Same as above, plus:
- [ ] Performance impact assessed (N+1 queries, expensive joins)
- [ ] Cache invalidation considered for changed data
- [ ] Breaking change impact on existing agent tasks assessed
- [ ] Migration is reversible or has rollback plan
```

---

## 11.6 Agent Collaboration Rules

**File:** `.agent/collaboration.md`

```markdown
# Agent Collaboration Rules

## Multi-Agent Coordination
When multiple agents operate concurrently:
1. Agents MUST NOT modify the same content asset simultaneously
   - ResearchAgent and ContentPipelineAgent cannot operate on same content_id in parallel
   - Lock via `agent_locks` Redis key: SET nx ex 300 (5 minute max lock)

2. Agents share knowledge graph writes via queue
   - Do not write directly to graph_nodes/graph_edges from multiple agents simultaneously
   - Route all graph writes through GraphWriteQueue (single writer)

3. Revenue event creation is idempotent
   - Use external_transaction_id as unique constraint
   - Duplicate events silently ignored (not error)

## Agent Priority Hierarchy
When resources are constrained (API rate limits, cost limits):
1. LearningAgent (highest priority — maintains system quality)
2. AffiliateIntelligenceAgent (direct revenue impact)
3. ContentPipelineAgent (content production)
4. DiscoveryAgent (feed monitoring)
5. ResearchAgent (background intelligence)

## Communication Protocol
Agents communicate via Supabase Realtime events:
- Agent publishes completion event to `agent_events` channel
- Other agents subscribed to relevant event types react accordingly
- No direct agent-to-agent calls (loose coupling)

## Governance Escalation
If a governance policy is violated:
1. Task halted immediately
2. `GovernanceViolationDetected` event emitted
3. Task status set to 'requires_human_review'
4. Operator notified via notification system
5. Agent does NOT self-authorize override

## Memory Sharing
- Episodic memory is agent-private (agent_id scoped)
- Semantic memory (knowledge graph) is organization-shared
- Working memory (Redis) is session-scoped, not cross-agent
```

---

## 11.7 Constitution Files Index

**File:** `CONSTITUTION.md` (repository root)

```markdown
# SIMIS Constitution Index

This repository implements the SIMIS Technical Constitution.
All architecture decisions are constitutional — do not deviate without an ADR.

## Constitutional Documents
| Document | Location | Purpose |
|----------|----------|---------|
| Technical Constitution | docs/constitution/TECHNICAL_CONSTITUTION.md | This document |
| System Constitution | docs/constitution/system.md | Vision, principles, boundaries |
| Data Constitution | docs/constitution/data.md | Schema definitions |
| AI Constitution | docs/constitution/ai.md | Agent and model specifications |
| Revenue Constitution | docs/constitution/revenue.md | Monetization architecture |
| Learning Constitution | docs/constitution/learning.md | Prediction/learning system |
| Security Constitution | docs/constitution/security.md | Security requirements |

## Agent Instructions
| File | Purpose |
|------|---------|
| .agent/context.md | System context for AI coding agents |
| .agent/planning.md | Planning guide for new features |
| .agent/self-audit.md | Pre-submission audit checklist |
| .agent/collaboration.md | Multi-agent coordination rules |
| .github/copilot-instructions.md | IDE agent instructions |

## Architecture Decision Records
All ADRs in: docs/architecture/

## Current Phase
Phase 1 — Founder Operating System
Target: Single operator, single portfolio, free-tier infrastructure
```

---

# APPENDIX A — TECHNOLOGY DEPENDENCY MATRIX

| Technology | Phase | Role | Free Tier | Self-Hostable | Replaceable |
|-----------|-------|------|-----------|---------------|-------------|
| Next.js 15 | 1+ | Frontend framework | Yes (Vercel) | Yes | Yes (Remix, Nuxt) |
| FastAPI | 1+ | Backend API | Yes | Yes | Yes (Express, Hono) |
| Supabase | 1+ | DB + Auth + Storage | Yes (500MB) | Yes | Difficult |
| Upstash Redis | 1+ | Cache + working memory | Yes (10k req/day) | Via Redis | Yes |
| Trigger.dev | 1+ | Job queue | Yes (50k runs/mo) | Yes | Yes (Inngest, BullMQ) |
| Gemini API | 1+ | Primary AI | Yes (free tier) | No | Yes (any LLM) |
| Groq | 1+ | Fast AI ops | Yes (free tier) | No | Yes (Ollama local) |
| OpenRouter | 1+ | AI fallback | Pay per use | No | Yes |
| Crawl4AI | 1+ | Web crawling | Open-source | Yes | Yes (Firecrawl) |
| Firecrawl | 1+ | Managed crawling | Yes (500 pages/mo) | Yes (OSS) | Yes |
| Brave Search | 1+ | Search API | Yes (2000 req/mo) | No | Yes (Serper, Tavily) |
| Serper | 1+ | SERP API | Yes (2500 searches) | No | Yes |
| PostHog | 1+ | Analytics | Yes (1M events/mo) | Yes | Yes (Plausible) |
| Sentry | 1+ | Error tracking | Yes (5k errors/mo) | Yes | Yes |
| Vercel | 1+ | Frontend hosting | Yes (hobby) | Partial | Yes (Netlify, Cloudflare) |
| Cloudflare | 1+ | CDN + DNS + WAF | Yes | N/A | Yes |
| LangGraph | 1+ | Agent orchestration | Open-source | Yes | Yes (CrewAI) |
| pgvector | 1+ | Vector search | Supabase native | Yes | Yes (Qdrant) |
| spaCy | 1+ | NLP/NER | Open-source | Yes | Yes (NLTK, Stanza) |
| FalkorDB | 2+ | Graph DB | Open-source | Yes | Yes (Memgraph, Neo4j) |
| DSPy | 2+ | Prompt optimization | Open-source | Yes | Yes |
| LlamaIndex | 2+ | RAG pipeline | Open-source | Yes | Yes (Haystack) |
| Ezoic | 2+ | Programmatic ads | Revenue share | No | Yes (Raptive) |
| Impact | 1+ | Affiliate network | Per program | No | Yes (PartnerStack, CJ) |

---

# APPENDIX B — MVP IMPLEMENTATION SEQUENCE

## Sprint 1 (Foundation — 2 weeks)
- [ ] Monorepo setup (Turborepo + pnpm)
- [ ] Supabase project + schema (organizations, sites, users)
- [ ] Supabase Auth (email + Google OAuth)
- [ ] Next.js 15 app with dashboard shell
- [ ] FastAPI skeleton with health check
- [ ] RLS policies for all tables
- [ ] Basic site configuration page

## Sprint 2 (Discovery — 2 weeks)
- [ ] Feed source management
- [ ] RSS/Atom feed ingestion (Trigger.dev job)
- [ ] Signal enrichment (Groq entity extraction)
- [ ] Discovery Hub page
- [ ] Signal filtering and actions

## Sprint 3 (Intelligence — 2 weeks)
- [ ] SERP intelligence (Serper integration)
- [ ] Entity registry with Wikidata enrichment
- [ ] Basic knowledge graph (PostgreSQL adjacency list)
- [ ] Entity Intelligence page
- [ ] SERP Intelligence page

## Sprint 4 (Content — 3 weeks)
- [ ] Content brief generation (Gemini)
- [ ] Content generation workspace
- [ ] Quality scorer
- [ ] Content planner / kanban
- [ ] Content Editor with versions

## Sprint 5 (Revenue — 2 weeks)
- [ ] Affiliate program registry
- [ ] Affiliate link generation and tracking
- [ ] Affiliate opportunity detection
- [ ] Basic revenue dashboard
- [ ] Revenue attribution (last-touch)

## Sprint 6 (Learning — 2 weeks)
- [ ] Prediction recording
- [ ] Observation engine (traffic + revenue)
- [ ] Prediction Center UI
- [ ] Basic calibration report

## Sprint 7 (Agents — 3 weeks)
- [ ] LangGraph Research Agent
- [ ] LangGraph Content Pipeline Agent
- [ ] Agent Center UI
- [ ] Agent governance policies
- [ ] Agent task history

---

*End of SIMIS Technical Constitution Package v2.0*
*This document is constitutional law for all engineering decisions.*
*Amendments require ADR documentation.*
