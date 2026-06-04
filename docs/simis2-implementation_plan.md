# SIMIS — CONSOLIDATED CONSTITUTIONAL ARCHITECTURE BLUEPRINT (v4.0)
## Autonomous Digital Asset Intelligence Engine (ADAI)

This constitutional blueprint establishes the canonical system design, repositories, infrastructure policies, domain layers, and operational roadmaps for **SIMIS**. This document is the permanent reference framework for all future implementation by autonomous agents (Claude Code, Gemini Pro/Flash, Cursor, OpenHands, Copilot, Antigravity IDE) and engineering teams.

> [!IMPORTANT]
> **ABSOLUTE EXECUTION RULE:** All code generation, migration building, repository scaffolding, and component development are suspended. No implementation may proceed until this architecture blueprint is finalized.

---

## Goal Description

SIMIS is not a CMS, blogging system, SEO tool, or content publisher. It is an **Autonomous Digital Asset Intelligence Engine (ADAI)**. It acts as an environment-agnostic intelligence utility that crawls fragmented inputs, builds dynamic semantic knowledge graphs, evaluates commercial viability, schedules executions, attributes revenue events back to knowledge vectors, and refines its prediction parameters through a closed learning loop.

This blueprint consolidates the technical specifications into 15 foundational constitutions to govern code boundaries, dynamic inheritance parameters, provider fallback matrices, security policies, and an incremental 16-phase roadmap.

---

## User Review Required

> [!IMPORTANT]
> **Kernel Ownership of Intelligence:** Brands do not own data or intelligence. All signals, entity relationships, prediction histories, and conversion weights are consolidated in the central SIMIS Kernel. Brands function strictly as dynamic, client-side projection targets.
>
> **Bayesian Learning Framework:** Every agent task requires an upfront prediction payload. The learning engine operates on observation discrepancies to adjust the confidence weights of provider configurations and topical targets.
>
> **Universal Abstraction Isolation:** Applications (Next.js/FastAPI) are forbidden from directly referencing vendor SDKs. All inputs are routed through the Provider Abstraction Layer (PROV-AB), which governs failover circuits and dynamic billing limits.

---

## Open Questions

> [!NOTE]
> **Cross-Domain Data Interlacing:** Should the Kernel allow entitative linkages between isolated domains (e.g., linking a health entity to a finance company entity)? We have designed this blueprint to support cross-domain links natively in the Knowledge Graph but enable isolation constraints at the Site configuration level.

---

## Proposed Changes

We will rewrite `/Users/mac/.gemini/antigravity-ide/brain/28fca6fc-f626-45a2-bd55-680bdc3ff2c2/implementation_plan.md` to represent the complete constitutional blueprint.

---

# CONSTITUTION 1: IDENTITY CONSTITUTION

To insulate internal configurations and separate administrative execution environments from consumer-facing properties, the system operates across three strictly segregated architectural layers.

```
┌────────────────────────────────────────────────────────┐
│                   LAYER 1: SIMIS                       │
│    Intelligence Kernel, Knowledge Graph, Learning,     │
│    Attribution, and Agent Task Executor Engine.        │
└──────────────────────────┬─────────────────────────────┘
                           │ Data/Decisions
                           ▼
┌────────────────────────────────────────────────────────┐
│                 LAYER 2: MEDIAFARM                     │
│    Administrative Operating System, Control Tower,     │
│    Operator Workspaces, and Governance Approvals.      │
└──────────────────────────┬─────────────────────────────┘
                           │ Static Build Projection
                           ▼
┌────────────────────────────────────────────────────────┐
│               LAYER 3: PUBLIC BRANDS                   │
│   SleepAtlas  │  MoneyAtlas  │  HealthAtlas  │  Etc.   │
│   Dynamic web output layers optimized for audiences.   │
└────────────────────────────────────────────────────────┘
```

### 1. Layer Definitions & Boundaries
*   **Layer 1: SIMIS (Internal Kernel):** The central core containing database engines, pgvector indices, LLM orchestrators, scraping pipelines, and learning modules.
    *   *Ownership:* Holds all master data, user authentication records, global provider logs, and prediction arrays.
    *   *Visibility:* Strictly inaccessible from the public internet. No customer or public web crawler can communicate directly with SIMIS.
    *   *Responsibility:* Entity deduplication, web crawling, cost tracking, outcome attribution, agent orchestration.
*   **Layer 2: MediaFarm (Operator OS):** The administration console. It maps the internal data structures of Layer 1 to a unified operator workspace.
    *   *Ownership:* Holds operator accounts, org settings, sitemaps, manually approved editing briefs, and layout configurations.
    *   *Visibility:* Accessible to authorized operators only. Behind multi-factor authentication (MFA) and tenant domain locks.
    *   *Responsibility:* Governance approvals, system status reporting, brand guidelines curation, and manual research launches.
*   **Layer 3: Public Brands (Brand Experience):** Distributed web properties deployed on edge CDN nodes (e.g., SleepAtlas, MoneyAtlas, HealthAtlas).
    *   *Ownership:* Contains zero internal DB configurations. Composed of statically generated HTML files, styles, dynamic script widgets, and analytics tags.
    *   *Visibility:* Completely public. Optimized for search engines, answer engines, and human users.
    *   *Responsibility:* Displaying highly authoritative knowledge, generating user interactions, tracking clicks, routing lead captures.

### 2. Visibility & Dependency Rules
1.  **Strict Downward Flow:** Information flow is strictly downward (SIMIS -> MediaFarm -> Public Brands). Public brands have no knowledge of MediaFarm database links or SIMIS API paths.
2.  **Edge Isolation:** If a public brand domain is compromised, the breach is isolated to the static hosting bucket (Vercel/Cloudflare Pages). No database connections or API tokens are exposed.
3.  **Proxy Communication:** Interaction from the Public Brands back to SIMIS (e.g., lead forms, conversion tracking) passes through a CDN rewrite rule to an isolated backend gateway proxy. This proxy rate-limits, sanitizes, and signs requests before passing them to the SIMIS API.

---

# CONSTITUTION 2: KERNEL CONSTITUTION (KERNEL-FIRST)

The SIMIS Kernel is the single source of intelligence. Decisions, content, and revenue actions are outputs of the Kernel's processing loops rather than side effects of a brand workspace.

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  KNOWLEDGE   │ ───> │ INTELLIGENCE │ ───> │   DECISION   │
│    ENGINE    │      │    ENGINE    │      │    ENGINE    │
└──────────────┘      └──────────────┘      └──────────────┘
                                                    │
┌──────────────┐      ┌──────────────┐      ┌───────▼──────┐
│   LEARNING   │ <─── │   REVENUE    │ <─── │  EXECUTION   │
│    ENGINE    │      │    ENGINE    │      │    ENGINE    │
└──────────────┘      └──────────────┘      └──────────────┘
```

### 1. Six Functional Core Engines
1.  **Knowledge Engine:** Ingests raw text, feeds, and files. Normalizes them into entities, properties, and relationships. Builds the local index.
2.  **Intelligence Engine:** Analyzes nodes for gaps, checks SERP ranking profiles, scores entity authority, and matches monetization models.
3.  **Decision Engine:** Weights alternative directions, forecasts expected values, records prediction payloads, and triggers tasks.
4.  **Execution Engine:** Coordinates agent fleets, fetches web assets, compiles static layouts, and deploys pages to CDN targets.
5.  **Revenue Engine:** Tracks affiliate clicks, captures webhook outputs from partner platforms, and traces attribution loops to content elements.
6.  **Learning Engine:** Resolves differences between predictions and real-world results. Calculates delta errors, recalibrates models, and updates entity scores.

### 2. Bounded Context Segregation
*   **Knowledge Domain:** Bounded by entity registries and the semantic graph. Does not handle billing, rendering, or model pricing.
*   **Intelligence Domain:** Bounded by prediction records, keyword rankings, and opportunity scores.
*   **Execution Domain:** Bounded by agent task locks, API tokens, and running scripts.
*   **Revenue Domain:** Bounded by affiliate accounts, advertiser profiles, offers, clicks, and webhook receipts.
*   **Learning Domain:** Bounded by calibration models, Bayesean probability updates, and experiment variables.

---

# CONSTITUTION 3: DOMAIN CONSTITUTION

SIMIS does not structure assets around flat directories. Knowledge is classified along a strict hierarchy of domain scopes, allowing domain isolation or cross-domain relationships without modifications to the database structure.

```
[DOMAIN]
   └── [SUBDOMAIN]
          └── [TOPIC CLUSTER]
                     └── [ENTITY]
                            └── [ASSET]
```

### 1. Hierarchy Rules
*   **Domain:** The high-level market boundary (e.g., `Health`, `Finance`, `Technology`). It defines the global entity rules and terminology models.
*   **Subdomain:** A focused segment of a domain (e.g., `Sleep`, `Investing`, `SaaS`).
*   **Topic Cluster:** A semantic grouping of related keywords and concepts (e.g., `Sleep Tracking`, `ETFs`, `Project Management Tools`).
*   **Entity:** The canonical object (e.g., `Oura Ring`, `Vanguard S&P 500 ETF`, `Asana`). Each entity is uniquely identified and holds structured specifications.
*   **Asset:** The final user-facing content unit (e.g., `Oura Ring Gen 3 Review`, `Vanguard ETF vs Blackrock ETF Comparison`, `Asana Calculator Tool`).

### 2. Multi-Domain Routing and Relationships
*   **Niche Isolation:** A Site is configured to inherit from one or more Domains. The build pipeline queries the Kernel only for entities linked to the inherited domains.
*   **Cross-Domain Relationships:** Edges in the Knowledge Graph can connect nodes from different domains (e.g., connecting `Health/Sleep` to `Technology/Smart Home`). This allows the system to discover multi-domain content opportunities (e.g., "Smart Home Automations to Improve Deep Sleep").

---

# CONSTITUTION 4: CONFIGURATION CONSTITUTION

Hardcoded strings representing sites, niche parameters, models, or brand voices are strictly prohibited. Configuration follows an inheritance chain, where child scopes inherit settings from parent scopes unless overridden.

```
GLOBAL CONFIG
   └── ORGANIZATION CONFIG
          └── DOMAIN CONFIG
                 └── BRAND CONFIG
                        └── SITE CONFIG
                               └── CAMPAIGN CONFIG
```

### 1. Scoping Levels & Inheritance Rules
1.  **Global:** System defaults, fallback provider URLs, global security rate limits, and default template models.
2.  **Organization:** Billing plans, user permissions, master API vault keys.
3.  **Domain:** Default category layouts, default SEO titles, domain-specific terminology rules.
4.  **Brand:** Mission statements, logo URLs, voice guidelines, trust standards, sponsor policies.
5.  **Site:** Domain name, localization code (`en-US`), CDNs, PostHog project IDs.
6.  **Campaign:** Specific tracking parameters, affiliate overrides, content expiration thresholds.

### 2. Override & Conflict Resolution
*   *Child Overrides:* Lower-level configurations override higher-level configurations. For instance, a `SITE_CONFIG` setting overrides `BRAND_CONFIG`, which overrides `GLOBAL_CONFIG`.
*   *Validation Engine:* All configuration inputs must match strict schemas validated by Pydantic models before database commits.
*   *Inheritance Merging:* For arrays and JSON structures (e.g., keyword blocks or voice parameters), configurations can choose to **replace** or **merge with** parent configurations, using a reserved `_merge: true` property in the payload.

---

# CONSTITUTION 5: SOURCE INTELLIGENCE CONSTITUTION

Data collection is decoupled from hardcoded feeds. The Source Intelligence Layer evaluates, schedules, and scores external information streams based on their utility and cost.

### 1. Ingestion Source Taxonomy
*   **RSS / News Feeds:** Real-time event detection.
*   **Government / Official Registries:** Regulatory updates, clinical trial records, corporate filings.
*   **Academic / Research Portals:** PubMed, arXiv, bioRxiv (for scientific claims).
*   **Community Forums:** Reddit, Hacker News, specialized forums (for real-world feedback).
*   **Social & Media Feeds:** YouTube transcribers, podcasts, newsletters.
*   **Competitor Properties:** Sitemap monitoring, pricing tables.

### 2. Source Scoring Engine
Every source in the registry is evaluated across seven dimensions, stored as a real-time vector:

$$\text{Source Score} = f(\text{Trust}, \text{Authority}, \text{Freshness}, \text{Relevance}, \text{Signal}, \text{Cost}, \text{Reliability})$$

*   `Trust (0.00-1.00)`: Frequency of factual errors or corrections.
*   `Authority (0.00-1.00)`: Root domain backlink profile and industry recognition.
*   `Freshness (0.00-1.00)`: Ingestion delta between publication and discovery.
*   `Relevance (0.00-1.00)`: Matching ratio with target niche keywords.
*   `Signal (0.00-1.00)`: Ratio of unique claims to duplicate content.
*   `Cost (0.00-1.00)`: API tokens, proxy cost, and compute resources consumed per fetch.
*   `Reliability (0.00-1.00)`: HTTP success rate and structure consistency.

### 3. Source Lifecycle & Governance
```
[DISCOVERED] ──> [EVALUATING] ──> [ACTIVE] ──> [PAUSED] (if failures hit threshold)
                     │
                     └──> [REJECTED] (if trust score drops below limit)
```
*   *Rate Governance:* Sources are fetched dynamically based on their Freshness score. High-freshness sources are checked hourly; low-freshness sources are checked weekly.
*   *API Access:* The Source Intelligence APIs expose endpoints for signal filtering, feed health updates, and domain exclusion lists.

---

# CONSTITUTION 6: ENTITY & KNOWLEDGE GRAPH CONSTITUTION

To prevent search engine penalties and ensure high-trust output, the Knowledge Graph is organized around a Canonical Entity Layer. Nodes represent resolved real-world concepts, not raw text strings.

```
┌────────────────────────────────────────────────────────┐
│               CANONICAL ENTITY REGISTRY                │
│    Canonical Name  │  Unique UUID  │  Wikipedia ID    │
└──────────────────────────┬─────────────────────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   ALIASES    │    │   MENTIONS   │    │ RELATIONSHIPS│
│ "Oura", etc. │    │ Raw articles │    │ "competitor" │
└──────────────┘    └──────────────┘    └──────────────┘
```

### 1. Canonical Entity Structure
*   **Canonical Entity:** Holds the verified name, description, category, specifications, and external authority links (Wikidata, Wikipedia, official website).
*   **Aliases:** Alternative spelling configurations, model numbers, and acronyms used during extraction (e.g., `Oura Ring`, `Oura Smart Ring`, `Oura 3`).
*   **Mentions:** Records of when and where the entity is referenced in external source articles or local content assets.
*   **Relationships:** Directed, semantic edges connecting to other canonical nodes.

### 2. Graph Ingestion Pipeline
1.  **Extraction:** The crawler extracts entities and claims from raw content.
2.  **Deduplication & Resolution:** The resolution engine matches extracted terms against the Alias index. If a match is found, the term is linked to the existing Canonical Entity.
3.  **Ambiguity Verification:** If a term matches multiple aliases, semantic context embeddings are checked. If the cosine distance is $> 0.25$, it is flagged for manual review. Otherwise, it is resolved to the nearest match.
4.  **Graph Synthesis:** New edges are created. Edge weight is derived from confidence in the relationship source.
5.  **Decay Model:** Weights decay by $5\%$ per month unless reinforced by new signal mentions.

---

# CONSTITUTION 7: REVENUE CONSTITUTION

Revenue is the primary feedback signal. Every financial conversion is tracked and attributed to content, entities, and configurations.

```
┌────────────────────────────────────────────────────────┐
│                   REVENUE SOURCE                       │
│    Affiliate Networks, Direct Sponsors, Lead Forms     │
└──────────────────────────┬─────────────────────────────┘
                           │ Click ID
                           ▼
┌────────────────────────────────────────────────────────┐
│               ATTRIBUTION ENGINE                       │
│  Resolves Click ID to Content Asset, Entity, and Brand │
└──────────────────────────┬─────────────────────────────┘
                           │ Attribution Metrics
                           ▼
┌────────────────────────────────────────────────────────┐
│                 REVENUE INTELLIGENCE                   │
│   Update Opportunity Scores & Re-weight Content Plan   │
└────────────────────────────────────────────────────────┘
```

### 1. Context Boundaries
*   **Affiliate Programs:** Captures tracking IDs, commission tables, and programmatic networks (e.g., PartnerStack, ShareASale, Impact).
*   **Sponsor Management:** Manages advertiser agreements, package options, and delivery states.
*   **Lead Generation Routing:** Validates, scores, and routes captured leads to buying partners.
*   **Offer Index:** Unified catalog of active affiliate deals, pricing discount states, and tracking links.

### 2. Attribution & Analytics Rules
*   **First-Touch/Last-Touch Attribution:** Default to last-touch content asset matching. Support fractional multi-touch attribution along a user's pageview sequence.
*   **attributable_revenue:** Calculated as direct payouts minus proxy and API processing costs.
*   **Yield Calibration Loop:** Entities associated with high-attribution revenue nodes receive an increase in their `revenue_score`, prioritizing them for future research sessions and content refreshes.

---

# CONSTITUTION 8: LEARNING CONSTITUTION

Every decision is a recorded hypothesis. The system evaluates real-world deviations from predicted states to adjust its models.

```
┌────────────────────────┐       ┌────────────────────────┐
│       PREDICT          │ ────> │        EXECUTE         │
│  Expected RPM, Traffic │       │  Publish Asset / Link  │
└────────────────────────┘       └────────────────────────┘
            ▲                                 │
            │ Calibrate                       ▼
┌────────────────────────┐       ┌────────────────────────┐
│        LEARNING        │ <──── │        OBSERVE         │
│ Bayesian weight update │       │ PostHog/Affiliate Sync │
└────────────────────────┘       └────────────────────────┘
```

### 1. Prediction Loop Specification
1.  **Hypothesis Recording:** Before an asset is published or updated, the system records:
    *   Target keyword difficulty.
    *   Expected organic search clicks (30/90 days).
    *   Expected RPM and conversion rate.
    *   Confidence level ($0.00-1.00$).
2.  **Observation Window:** After the observation period (e.g., 90 days), the system fetches actual clicks, pageviews, and attributed revenue.
3.  **Delta Calculation:**
    
    $$\Delta = \text{Actual} - \text{Predicted}$$

4.  **Bayesian Update:** The delta recalibrates the confidence weights of the model configurations that generated the plan.
5.  **Learning Logging:** High prediction errors ($>30\%$) trigger a system anomaly report, automatically adjusting the keyword selection criteria in that niche.

---

# CONSTITUTION 9: PROVIDER CONSTITUTION (PROV-AB)

To ensure zero single points of failure, the Provider Abstraction Layer (PROV-AB) wraps all third-party APIs. It handles routing, circuit breaking, fallback tracking, and cost auditing.

### 1. Priority & Fallback Matrices

```
               ┌───────────────────────┐
               │    REQUEST TRIGGER    │
               └───────────┬───────────┘
                           ▼
               ┌───────────────────────┐  No  ┌───────────────────────┐
               │  Primary Active OK?   ├─────>│  Fallback Active OK?  │
               └───────────┬───────────┘      └───────────┬───────────┘
                           │ Yes                          │ Yes
                           ▼                              ▼
               ┌───────────────────────┐      ┌───────────────────────┐
               │  Execute & Log Cost   │      │  Execute & Alert Admin│
               └───────────────────────┘      └───────────────────────┘
```

| Request Category | Primary Provider | Fallback 1 | Fallback 2 | Timeout (ms) |
|---|---|---|---|---|
| **Text Generation** | Gemini 1.5 Pro | OpenRouter (Claude) | Groq (Llama-3) | 30,000 |
| **Data Extraction** | Groq (Llama-3-8B) | Gemini 1.5 Flash | OpenRouter | 10,000 |
| **Search Queries** | Brave Search API | Serper API | Tavily API | 5,000 |
| **Web Crawling** | Crawl4AI (Local Docker) | Firecrawl Cloud | Playwright (Local) | 20,000 |
| **Embeddings** | Gemini text-embedding-004 | OpenRouter (OpenAI) | Local (Sentence-BERT) | 3,000 |
| **Email Delivery** | Resend | SendGrid | Mailgun | 5,000 |
| **File Storage** | Cloudflare R2 | Supabase Storage | AWS S3 | 10,000 |

### 2. Circuit Breaker & Failover Rules
*   *Failure Threshold:* 3 consecutive HTTP 5xx or timeout errors within a 5-minute window deactivates the provider.
*   *Recovery Period:* The system attempts a single connection check after 15 minutes. If successful, the provider is reactivated.
*   *Rate-Limit Handling:* HTTP 429 errors instantly route the active task to the next fallback provider, and suspend the primary provider for the duration specified in the `Retry-After` header.

---

# CONSTITUTION 10: PUBLIC EXPERIENCE CONSTITUTION

The public brand site is designed for speed, search engine visibility, accessibility, and compatibility with AI retrieval engines.

### 1. Search, Answer, & Generative Engine Optimization (SEO/AEO/GEO)
*   **Search Engine Optimization (SEO):** High-speed serverless hosting, descriptive title templates, automatic XML sitemaps, and programmatic robots.txt files.
*   **Answer Engine Optimization (AEO):** Articles include a verified **Direct Answer Block** at the top of the page. Content follows a clear "Question -> Concise Answer" format.
*   **Generative Engine Optimization (GEO):** High density of canonical entities, verified source citations, and Wikidata mappings. This helps LLM scrapers associate facts with specific brand domains.

### 2. Structured Schema Inventory
Every page template requires structured JSON-LD schema generation:

```
[ARTICLE PAGE]      ──> NewsArticle + ClaimReview + BreadcrumbList
[REVIEW PAGE]       ──> Product + Review + QuantitativeRating + Offer
[COMPARISON PAGE]   ──> Product + ItemList + Table
[DIRECTORY PAGE]    ──> Dataset + ItemList
[GLOSSARY PAGE]     ──> DefinedTerm + WebPage
```

### 3. Build & Performance Targets
*   *Performance Budgets:* Core Web Vitals targets: LCP $< 1.2\text{s}$, INP $< 100\text{ms}$, CLS $< 0.05$.
*   *Markup Constraints:* Accessibility-compliant HTML structure (WCAG 2.1 AA). Fast styling with custom CSS variables. High-contrast themes.
*   *Edge Deployment:* Fully static SSG pages with Incremental Static Regeneration (ISR) deployed on Cloudflare CDN edges.

---

# CONSTITUTION 11: SECURITY & COMPLIANCE CONSTITUTION

The system is designed with security and compliance configurations. All data operations are bounded by tenant access control rules.

```
                    ┌─────────────────────────┐
                    │      USER REQUEST       │
                    └────────────┬────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │      Supabase Auth      │
                    └────────────┬────────────┘
                                 │ JWT Validation
                                 ▼
                    ┌─────────────────────────┐
                    │   Row Level Security    │
                    │   Checks org_members    │
                    └────────────┬────────────┘
                                 │ Authorized?
                                 ▼
                    ┌─────────────────────────┐
                    │   Data Access Granted   │
                    └─────────────────────────┘
```

### 1. Tenancy Isolation & RLS
*   *Universal Tenant Identifier:* Every table (except system-wide directories) has an `organization_id` column.
*   *Row-Level Security (RLS):* Direct queries without an authenticated tenant header are blocked at the database level.
*   *Secret Isolation:* API keys and access keys are stored in an encrypted table (`organization_secrets`) using AES-256 keys managed by Google Cloud KMS.

### 2. Compliance & Data Retention
*   *Auditing:* Every administrative change, agent operation, and configuration edit generates an immutable entry in the `audit_logs` table.
*   *Consent & Privacy:* Built-in support for GDPR/CCPA request handling, cookie consent management, and automated user data deletion.
*   *Rate Limiting:* Middleware rate limiters protect the API gateway, returning HTTP 429 when threshold limits are exceeded.

---

# CONSTITUTION 12: INFRASTRUCTURE CONSTITUTION

The stack is optimized for low operating costs, ease of development, and high reliability, utilizing free-tier resources where possible.

### 1. Technology Stacks

```
┌────────────────────────────────────────────────────────┐
│                   FRONTEND HOSTING                     │
│           Vercel (Dashboard & Site Templates)          │
└──────────────────────────┬─────────────────────────────┘
                           │ API calls
                           ▼
┌────────────────────────────────────────────────────────┐
│                   BACKEND COMPUTE                      │
│            Fly.io (FastAPI App Container)              │
└──────────────────────────┬─────────────────────────────┘
                           │ Queries
                           ▼
┌────────────────────────────────────────────────────────┐
│                   DATABASE & STORAGE                   │
│             Supabase (PostgreSQL + pgvector)            │
└────────────────────────────────────────────────────────┘
```

*   **Frontend Framework:** Next.js 15 (App Router).
*   **API Framework:** FastAPI (Python 3.12+).
*   **Database Engine:** Supabase PostgreSQL with `pgvector` enabled.
*   **Task Queue:** Trigger.dev (scheduled jobs and webhook ingestion queues).
*   **Edge CDN & WAF:** Cloudflare.
*   **Cache Store:** Upstash Redis (session states, active crawlers, and API cache).

### 2. Operational Strategies
*   *Scaling Strategy:* Scale compute resources horizontally (Fly.io VMs) behind a round-robin load balancer.
*   *Free-Tier Boundaries:* Use database connection pooling (Supabase PgBouncer) to minimize open connections. Batched scraper schedules keep executions within Free limits.
*   *Disaster Recovery:* Daily automated database backups with a secondary write mirror hosted in a separate region. Failover to secondary static buckets if CDN endpoints degrade.

---

# CONSTITUTION 13: REPOSITORY & BUILD CONSTITUTION

To manage the multi-site, multi-domain runtime environment, code assets are structured in a monorepo setup using `pnpm` workspaces.

### 1. Monorepo Workspaces Layout
```
simis/
├── apps/
│   ├── web/                      # Next.js 15 Admin Console Workspace
│   ├── site/                     # Astro/Next.js Dynamic Public Page Workspace
│   └── api/                      # FastAPI Python Kernel API Workspace
├── packages/
│   ├── database/                 # Prisma schema, migrations, and seed scripts
│   ├── ai-client/                # Provider Abstraction package (PROV-AB)
│   └── config/                   # Shared styling and lint rules
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### 2. Build Pipeline dependencies
*   *Turborepo Configuration:* Turborepo manages the build pipeline. Changes in `packages/ai-client` trigger tests across dependent workspace projects.
*   *Agent Build Protocols:* Agents must check lint configurations, type consistency, and migration constraints before pushing pull requests.

---

# CONSTITUTION 14: CONSTITUTIONAL ROADMAP (PHASE 0 — PHASE 15)

```
0. Architecture Consolidation (Pre-dev)
   └── 1. Foundation Infrastructure (DB, API shell)
         └── 2. Configuration Engine (Dynamic settings)
               └── 3. Source Intelligence (Feeds, Crawler)
                     └── 4. Knowledge Graph (pgvector, resolution)
                           └── 5. Discovery Engine (Signals, trends)
                                 └── 6. Research Engine (Deep synthesis agents)
                                       └── 7. Content Intelligence (AI drafting, scoring)
                                             └── 8. Publishing Intelligence (SSG, sitemaps)
                                                   └── 9. Revenue Intelligence (Attribution, clicks)
                                                         └── 10. Analytics Intelligence (PostHog sync)
                                                               └── 11. Prediction Engine (Expected values)
                                                                     └── 12. Learning Engine (Calibration)
                                                                           └── 13. Agent Runtime (Fleet controls)
                                                                                 └── 14. Multi-Brand Scaling (Expansion)
                                                                                       └── 15. SaaS & Franchise Tools (Multi-tenant)
```

---

## Phase 0: Architecture Consolidation

*   **Objectives:** Establish the constitutional boundaries, finalize configurations, and freeze the implementation strategy.
*   **Dependencies:** None.
*   **Required Outputs:** Canonical `implementation_plan.md` artifact. Identity specifications.
*   **Risks:** Design paralysis.
*   **Success Criteria:** This blueprint is approved and locked.
*   **Future Impact:** Prevents architectural drift during the subsequent execution phases.

---

## Phase 1: Foundation Infrastructure

*   **Objectives:** Spin up core infrastructure services. Establish database connectivity and build pipeline automation.
*   **Dependencies:** Phase 0.
*   **Required Outputs:** Active Supabase project. Monorepo shell directory. Next.js and FastAPI starter deployments.
*   **Risks:** Initial deployment configuration mismatches.
*   **Success Criteria:** Live API `/health` endpoint returns `200 OK`. DB migrations run.
*   **Future Impact:** Solidifies the runtime network environment for all subsequent services.

---

## Phase 2: Configuration Engine

*   **Objectives:** Build the hierarchical configuration engine (Global -> Organization -> Domain -> Brand -> Site -> Campaign).
*   **Dependencies:** Phase 1.
*   **Required Outputs:** Central configuration database tables. Pydantic validation models.
*   **Risks:** Complex inheritance rules.
*   **Success Criteria:** Pydantic validation catches invalid overrides. Settings resolve correctly down the inheritance chain.
*   **Future Impact:** Removes all hardcoded values from downstream components.

---

## Phase 3: Source Intelligence

*   **Objectives:** Deploy the dynamic crawler infrastructure and centralized dataset registry.
*   **Dependencies:** Phase 2.
*   **Required Outputs:** Source registry database tables. Crawl4AI local container. Ingestion scripts.
*   **Risks:** Target site blocks, proxy cost management.
*   **Success Criteria:** Ingestion pipeline successfully parses 10 mock RSS and HTML targets without structure failures.
*   **Future Impact:** Ingests the raw data streams needed to build the knowledge graph.

---

## Phase 4: Knowledge Graph

*   **Objectives:** Implement the Entity Registry, pgvector indices, and relationship graph.
*   **Dependencies:** Phase 3.
*   **Required Outputs:** Entity extraction pipelines, pgvector search endpoints.
*   **Risks:** Entity duplication, high vector latency.
*   **Success Criteria:** Semantic deduplication matches aliases with $>95\%$ accuracy. Node queries execute in under 100ms.
*   **Future Impact:** Creates the central structured knowledge repository.

---

## Phase 5: Discovery Engine

*   **Objectives:** Activate signal identification, trend detection, and competitive monitoring modules.
*   **Dependencies:** Phase 4.
*   **Required Outputs:** Ingested signals dashboard. Trend detection workers.
*   **Risks:** Low signal-to-noise ratio.
*   **Success Criteria:** System successfully extracts and groups 5 emerging trends from ingested data.
*   **Future Impact:** Automates the search for content opportunities.

---

## Phase 6: Research Engine

*   **Objectives:** Launch the deep research synthesis workflow powered by the Research Agent.
*   **Dependencies:** Phase 5.
*   **Required Outputs:** LangGraph research workflows. Synthesis result models.
*   **Risks:** Hallucinations during claims extraction.
*   **Success Criteria:** Verification check maps extracted claims to verified citations with $100\%$ accuracy.
*   **Future Impact:** Provides structured information for the content generation pipeline.

---

## Phase 7: Content Intelligence

*   **Objectives:** Implement brief builder wizards, drafting services, and content quality scoring engines.
*   **Dependencies:** Phase 6.
*   **Required Outputs:** Dynamic brief templates. PydanticAI drafting scripts. Quality assessment metrics.
*   **Risks:** Poor writing style, missing keywords.
*   **Success Criteria:** Generated drafts pass the quality threshold ($>70/100$) on the first attempt.
*   **Future Impact:** Automates the creation of high-trust content assets.

---

## Phase 8: Publishing Intelligence

*   **Objectives:** Deploy the dynamic site templates and build pipeline integrations.
*   **Dependencies:** Phase 7.
*   **Required Outputs:** Static builder engines. Page template configurations. Edge CDN routing rules.
*   **Risks:** Build time limits on edge hosts.
*   **Success Criteria:** Statically generated pages display correctly at edge URLs. JSON-LD schema validates.
*   **Future Impact:** Delivers content assets to the public experience layer.

---

## Phase 9: Revenue Intelligence

*   **Objectives:** Deploy lead forms, affiliate redirects, click trackers, and webhook processors.
*   **Dependencies:** Phase 8.
*   **Required Outputs:** Redirection worker scripts. Attribution database tables.
*   **Risks:** Commission reconciliation errors.
*   **Success Criteria:** Clicks are tracked, and webhook revenue inputs attribute to content assets.
*   **Future Impact:** Ingests the financial data needed to guide the learning loop.

---

## Phase 10: Analytics Intelligence

*   **Objectives:** Sync traffic data from PostHog and construct conversion funnels.
*   **Dependencies:** Phase 9.
*   **Required Outputs:** Analytics syncing pipeline. Funnel reporting models.
*   **Risks:** PostHog API rate limits.
*   **Success Criteria:** System pulls pageview counts daily. Funnel dashboards show conversion paths.
*   **Future Impact:** Provides engagement metrics for performance reviews.

---

## Phase 11: Prediction Engine

*   **Objectives:** Implement prediction logging hooks across all decision points.
*   **Dependencies:** Phase 10.
*   **Required Outputs:** Prediction database tables. expected_value scoring modules.
*   **Risks:** Inaccurate initial confidence scoring.
*   **Success Criteria:** Every generation task generates and logs an expected value payload.
*   **Future Impact:** Records the prediction datasets needed for the learning loop.

---

## Phase 12: Learning Engine

*   **Objectives:** Implement outcome tracking, prediction reconciliation, and confidence calibration.
*   **Dependencies:** Phase 11.
*   **Required Outputs:** Bayesian calibration engines. Outcome log views.
*   **Risks:** Data sparsity in early loops.
*   **Success Criteria:** System successfully identifies low-accuracy predictions and updates model weights.
*   **Future Impact:** Automates the refinement of system decisions over time.

---

## Phase 13: Agent Runtime

*   **Objectives:** Implement agent governance policies, execution tracing, and budget locks.
*   **Dependencies:** Phase 12.
*   **Required Outputs:** Agent registry. Task dashboards. Budget control middleware.
*   **Risks:** Running out of control API credits.
*   **Success Criteria:** Budget rules stop tasks that exceed cost limits. Task activity logs track token usage.
*   **Future Impact:** Enables autonomous system operations within defined parameters.

---

## Phase 14: Multi-Brand Scaling

*   **Objectives:** Deploy additional sites and domains using different configurations.
*   **Dependencies:** Phase 13.
*   **Required Outputs:** Additional brand profiles and domain endpoints.
*   **Risks:** Cross-tenant resource leaks.
*   **Success Criteria:** A single SIMIS instance runs three distinct brands on separate domains without performance degradation.
*   **Future Impact:** Validates the scalability of the architecture.

---

## Phase 15: SaaS & Franchise Infrastructure

*   **Objectives:** Deploy billing pipelines and tenant portal utilities.
*   **Dependencies:** Phase 14.
*   **Required Outputs:** Stripe billing integration. Tenant admin dashboards.
*   **Risks:** Security vulnerabilities in multi-tenant environments.
*   **Success Criteria:** Third-party operators can deploy custom niche profiles on independent nodes.
*   **Future Impact:** Transitions SIMIS into a multi-tenant franchise model.

---

## Verification Plan

### Technical Validation Checks
1.  **Verification of Tenant Isolation (RLS):**
    *   Verify that RLS is active on database tables and that cross-tenant queries return empty arrays when tenant credentials are not present.
2.  **Abstractions Interface Verification:**
    *   Test the routing engine by shutting down primary providers and verifying automatic fallback to secondary options.
3.  **Inheritance Rules Verification:**
    *   Verify that child configurations correctly override parent configurations without altering the parent settings.
4.  **Schema Consistency Verification:**
    *   Validate dynamic page markup using Google Structured Data Linter and accessibility checks.
