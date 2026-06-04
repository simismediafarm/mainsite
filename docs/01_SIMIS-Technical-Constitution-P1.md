# SIMIS TECHNICAL CONSTITUTION PACKAGE
## Version 2.0 — Implementation-Ready Architecture Specification
### Classification: Constitutional Law — Do Not Modify Without Full Review

---

# PART 01 — SYSTEM CONSTITUTION

## 1.1 Vision Architecture

SIMIS is a Self-Improving Media Intelligence Operating System. Its fundamental premise is that information has latent economic value that is systematically unlocked through a closed-loop cycle of acquisition, structuring, enhancement, distribution, monetization, and machine learning from outcomes.

The system is not a tool. It is an operating system for media businesses.

### 1.1.1 System Identity Matrix

| Dimension | Definition |
|-----------|------------|
| Product Identity | Media Business Operating System |
| Intelligence Identity | Self-Improving Intelligence Platform |
| Data Identity | Data Arbitrage Platform |
| Economic Identity | Revenue Intelligence Engine |
| Operational Identity | Autonomous Content Operations Platform |
| Evolution Identity | Founder → SaaS → Franchise Infrastructure |

### 1.1.2 What SIMIS Is Not

SIMIS is not an AI writer. Content generation is a sub-function, not the purpose.
SIMIS is not a CMS. Publishing is an output channel, not the core.
SIMIS is not an SEO tool. Search optimization is one revenue optimization strategy.
SIMIS is not an AGC system. Volume without intelligence is explicitly rejected.
SIMIS is not a scraper. Acquisition is a means to intelligence, not an end.

---

## 1.2 Mission Architecture

### 1.2.1 Core Transformation Chain

```
RAW DATA
  → STRUCTURED KNOWLEDGE
    → ACTIONABLE INTELLIGENCE
      → OPTIMIZED DECISIONS
        → EXECUTED ACTIONS
          → TRAFFIC + ENGAGEMENT
            → CONVERSIONS
              → REVENUE
                → LEARNING DATA
                  → BETTER DECISIONS (loop)
```

### 1.2.2 Economic Intelligence Principle

Every system component must be traceable to an economic outcome. Components that cannot demonstrate economic contribution are candidates for removal. Intelligence compounds: the system must become measurably smarter each cycle.

---

## 1.3 Core Principles

### P-01: Intelligence Over Volume
Quality of intelligence beats quantity of content. A single high-intelligence asset outperforms a thousand low-intelligence assets.

### P-02: Revenue Attribution Mandatory
Every content asset, every agent action, every system decision must carry traceable revenue attribution metadata.

### P-03: Prediction Before Action
No major action (content creation, publishing, link insertion) executes without a recorded prediction of expected outcome. This generates the learning dataset.

### P-04: Closed-Loop Learning
Every prediction generates an observation counterpart. The gap between prediction and observation is learning data. Learning data feeds model improvement.

### P-05: Entity-First Architecture
All content, all knowledge, all intelligence is organized around entities. Entities have relationships. Relationships have weights. Weights evolve with evidence.

### P-06: Zero Single Points of Failure
All AI providers, all data sources, all infrastructure components must have failover alternatives. No component dependency is singular.

### P-07: Founder-Operable at MVP
The system must be operable by one non-engineer at Phase 1. Complexity hides behind intelligent defaults and automation.

### P-08: Revenue-Aware UI
Every UI surface that presents content or intelligence must surface revenue opportunity signals alongside editorial signals.

### P-09: Modularity Over Monolith
Every major capability is a bounded context. Bounded contexts communicate through defined contracts. Internal implementation is replaceable.

### P-10: Observability as Default
No action, agent task, prediction, or outcome is unlogged. Observability is infrastructure, not a feature.

---

## 1.4 System Boundaries

### 1.4.1 Inside System Boundary

- Intelligence acquisition (crawling, feeds, APIs, search)
- Knowledge structuring (entity extraction, graph building, embedding)
- Content planning (brief generation, keyword strategy, gap analysis)
- Content generation (AI-assisted drafting, enrichment, enhancement)
- Content editing (workspace, version control, quality scoring)
- Publishing operations (multi-site, multi-format, scheduled)
- Monetization intelligence (affiliate insertion, ad optimization, sponsor matching)
- Revenue tracking (attribution, performance, forecasting)
- Learning loops (prediction recording, outcome observation, model feedback)
- Agent orchestration (task planning, execution, monitoring)
- Analytics (traffic, engagement, conversion, revenue)
- Knowledge graph (entity graph, topic graph, authority graph, revenue graph)

### 1.4.2 Outside System Boundary (Integrations)

- Domain registrars (Cloudflare, Namecheap)
- Email delivery (Resend, Postmark)
- External CMS platforms when used as output channels
- Payment processors (Stripe) — Phase 3+
- Third-party affiliate networks (Impact, PartnerStack, CJ)
- External ad networks (Google AdSense, Ezoic, Mediavine)
- AI model providers (Gemini API, Groq, OpenRouter)
- Search APIs (Brave, Serper, Tavily)

---

## 1.5 Domain Map

```
SIMIS Domain Map
├── INTELLIGENCE DOMAIN
│   ├── Discovery Subdomain
│   ├── Research Subdomain
│   ├── Entity Intelligence Subdomain
│   └── Competitor Intelligence Subdomain
│
├── KNOWLEDGE DOMAIN
│   ├── Knowledge Graph Subdomain
│   ├── Entity Registry Subdomain
│   ├── Topic Graph Subdomain
│   └── Authority Graph Subdomain
│
├── CONTENT DOMAIN
│   ├── Planning Subdomain
│   ├── Brief Generation Subdomain
│   ├── Generation Subdomain
│   ├── Editing Subdomain
│   └── Publishing Subdomain
│
├── REVENUE DOMAIN
│   ├── Affiliate Intelligence Subdomain
│   ├── Ads Intelligence Subdomain
│   ├── Sponsorship Subdomain
│   ├── Lead Generation Subdomain
│   └── Revenue Attribution Subdomain
│
├── LEARNING DOMAIN
│   ├── Prediction Engine Subdomain
│   ├── Observation Engine Subdomain
│   ├── Learning Engine Subdomain
│   └── Reward Engine Subdomain
│
├── AGENT DOMAIN
│   ├── Agent Registry Subdomain
│   ├── Task Orchestration Subdomain
│   ├── Memory Subdomain
│   └── Agent Governance Subdomain
│
├── ANALYTICS DOMAIN
│   ├── Traffic Analytics Subdomain
│   ├── Engagement Analytics Subdomain
│   ├── Conversion Analytics Subdomain
│   └── Revenue Analytics Subdomain
│
└── PLATFORM DOMAIN
    ├── Auth Subdomain
    ├── Site Management Subdomain
    ├── Portfolio Management Subdomain
    ├── Feed Management Subdomain
    └── Settings Subdomain
```

---

## 1.6 DDD Architecture — Bounded Contexts

### BC-01: Intelligence Context

**Responsibility:** Acquire, process, and structure raw information from external sources into actionable intelligence signals.

**Aggregates:**
- `IntelligenceSource` — Source registry with health monitoring
- `IntelligenceSignal` — Processed intelligence unit with confidence score
- `ResearchSession` — Bounded research task with inputs/outputs

**Domain Events:**
- `SourceDiscovered`
- `FeedIngested`
- `SignalExtracted`
- `EntityDetected`
- `TrendIdentified`
- `CompetitorPageCrawled`

**External Dependencies:** Brave Search API, Serper, Tavily, Crawl4AI, Firecrawl, RSS feeds

**Internal Contracts:**
- Publishes `IntelligenceSignal` objects to Knowledge Context
- Publishes `EntityDetected` events to Knowledge Graph Context

---

### BC-02: Knowledge Graph Context

**Responsibility:** Build and maintain the graph representation of all entities, topics, relationships, and their economic weights.

**Aggregates:**
- `Entity` — Canonical entity with type, properties, embeddings
- `Topic` — Topic node with authority score, traffic potential
- `EntityRelationship` — Typed, weighted relationship between entities
- `KnowledgeCluster` — Grouped topic/entity cluster

**Domain Events:**
- `EntityCreated`
- `EntityMerged`
- `RelationshipEstablished`
- `AuthorityScoreUpdated`
- `RevenueWeightUpdated`

**Database:** Supabase PostgreSQL with pgvector + JSONB
**Optional Graph DB:** FalkorDB for complex traversal queries

---

### BC-03: Content Context

**Responsibility:** Plan, brief, generate, edit, score, and version content assets.

**Aggregates:**
- `ContentPlan` — Editorial calendar item with intelligence dependencies
- `ContentBrief` — Structured brief with outline, intent signals, affiliate signals
- `ContentAsset` — Versioned content with quality scores
- `ContentVersion` — Immutable snapshot of content at a point in time

**Domain Events:**
- `BriefCreated`
- `ContentDraftGenerated`
- `ContentPublished`
- `ContentRefreshed`
- `QualityScoreUpdated`

---

### BC-04: Revenue Context

**Responsibility:** Track, attribute, optimize, and forecast revenue across all monetization streams.

**Aggregates:**
- `AffiliateLink` — Tracked link with program, product, commission metadata
- `RevenueEvent` — Atomic revenue event (click, conversion, impression)
- `RevenueAttribution` — Attribution chain from content to revenue
- `RevenueProgram` — Affiliate/sponsor/ad program configuration

**Domain Events:**
- `AffiliateClickTracked`
- `ConversionRecorded`
- `RevenueAttributed`
- `CommissionConfirmed`

---

### BC-05: Learning Context

**Responsibility:** Record predictions, observe outcomes, compute learning signals, feed improvement loops.

**Aggregates:**
- `Prediction` — Expected outcome for a content or agent decision
- `Observation` — Actual measured outcome
- `LearningSignal` — Delta between prediction and observation
- `ExperimentResult` — A/B test or multivariate experiment outcome

**Domain Events:**
- `PredictionRecorded`
- `OutcomeObserved`
- `LearningSignalComputed`
- `ModelImproved`

---

### BC-06: Agent Context

**Responsibility:** Define, schedule, execute, monitor, and govern autonomous agent operations.

**Aggregates:**
- `Agent` — Registered agent with capabilities, memory, governance rules
- `AgentTask` — Atomic task with inputs, expected outputs, execution trace
- `AgentMemory` — Persistent agent memory (episodic, semantic, procedural)
- `AgentGovernancePolicy` — Rules constraining agent behavior

**Domain Events:**
- `AgentTaskScheduled`
- `AgentTaskStarted`
- `AgentTaskCompleted`
- `AgentTaskFailed`
- `GovernanceViolationDetected`

---

## 1.7 Capability Map

```
CAPABILITY TIER 1 — FOUNDATION
├── Data Acquisition
├── Feed Ingestion
├── Entity Extraction
├── Vector Embedding
└── Basic Knowledge Graph

CAPABILITY TIER 2 — INTELLIGENCE
├── SERP Intelligence
├── Competitor Intelligence
├── Entity Intelligence
├── Topic Clustering
└── Trend Detection

CAPABILITY TIER 3 — CONTENT OPERATIONS
├── Content Brief Generation
├── AI Content Generation
├── Content Quality Scoring
├── Content Publishing
└── Content Refresh Engine

CAPABILITY TIER 4 — MONETIZATION
├── Affiliate Link Management
├── Affiliate Opportunity Detection
├── Revenue Attribution
├── Ad Placement Intelligence
└── Sponsor Opportunity Detection

CAPABILITY TIER 5 — INTELLIGENCE LOOP
├── Prediction Recording
├── Outcome Observation
├── Learning Signal Computation
├── Model Self-Improvement
└── Confidence Calibration

CAPABILITY TIER 6 — AUTONOMY
├── Agent Orchestration
├── Autonomous Research
├── Autonomous Content Operations
├── Autonomous Revenue Optimization
└── Autonomous Learning Loop
```

---

## 1.8 Platform Layers

```
LAYER 7 — PRESENTATION
  Next.js 15 Frontend | React 19 | Tailwind | shadcn/ui

LAYER 6 — ORCHESTRATION
  Agent Layer | LangGraph Workflows | Trigger.dev Jobs

LAYER 5 — APPLICATION
  FastAPI Services | Next.js Server Actions | Domain Services

LAYER 4 — INTELLIGENCE
  AI Provider Abstraction | Prompt Engine | Model Router

LAYER 3 — KNOWLEDGE
  Knowledge Graph | Vector Store | Entity Registry

LAYER 2 — DATA
  Supabase PostgreSQL | pgvector | Upstash Redis | Supabase Storage

LAYER 1 — INFRASTRUCTURE
  Vercel | Supabase | Cloudflare | GitHub Actions
```

---

## 1.9 Founder → SaaS → Franchise Evolution

### Phase 1: Founder Operating System (MVP)

**Single operator. Single portfolio. Single intelligence layer.**

Database: Supabase (free tier)
AI: Gemini (free tier primary) + Groq (free tier fast ops)
Frontend: Vercel (hobby/pro)
Search: Brave Search API (free tier)
Crawler: Crawl4AI (self-hosted/open-source)
Queue: Trigger.dev (free tier)
Analytics: PostHog (open-source self-hosted or cloud free tier)

Feature set:
- Single site management
- RSS/feed ingestion
- Manual research + AI-assisted briefs
- Content generation + publishing
- Basic affiliate link management
- Basic revenue tracking
- Dashboard with key metrics

---

### Phase 2: Multi-Site Media Platform

**Multiple sites. Multiple niches. Multiple revenue streams. Single intelligence layer.**

New capabilities:
- Portfolio management
- Cross-site knowledge graph
- Multi-site affiliate optimization
- Cross-site revenue intelligence
- Team access (basic roles)
- Automated content pipelines

Infrastructure scaling:
- Supabase Pro
- Vercel Pro
- Dedicated queue workers
- Redis caching layer

---

### Phase 3: SaaS Platform

**Multi-tenant. User onboarding. Subscription billing.**

New capabilities:
- Tenant isolation (Row Level Security per organization)
- Stripe integration
- Self-service onboarding
- Usage metering
- Plan-based feature gating
- White-label option

Infrastructure:
- Supabase Organization tier
- Vercel Enterprise or self-hosted
- Multi-region deployment

---

### Phase 4: Agency Infrastructure

**Agency accounts. Client management. Managed operations.**

New capabilities:
- Agency → Client hierarchy
- Client reporting
- Managed agent workflows
- White-label dashboards
- SLA management

---

### Phase 5: Franchise Infrastructure

**Distributed operators. Central intelligence. Franchise intelligence sharing.**

New capabilities:
- Franchise master account
- Franchisee accounts
- Shared intelligence layers (opt-in)
- Franchise benchmarking
- Revenue share tracking

---

# PART 02 — PRODUCT CONSTITUTION

## 2.1 Information Architecture

### 2.1.1 Primary Navigation Structure

```
SIMIS WORKSPACE
├── Dashboard
├── Intelligence Hub
│   ├── Research Hub
│   ├── Discovery Hub
│   ├── SERP Intelligence
│   ├── News Intelligence
│   ├── Trend Intelligence
│   ├── Competitor Intelligence
│   └── Entity Intelligence
├── Knowledge
│   ├── Knowledge Graph
│   ├── Entity Registry
│   ├── Topic Map
│   └── Knowledge Manager
├── Content
│   ├── Content Planner
│   ├── Content Brief Builder
│   ├── Content Generator
│   ├── Content Editor
│   ├── Content Refresh Center
│   └── Media Library
├── Publishing
│   ├── Publishing Center
│   ├── Site Manager
│   └── Portfolio Manager
├── Revenue
│   ├── Affiliate Center
│   ├── Ads Intelligence
│   ├── Sponsor Center
│   ├── Lead Center
│   ├── Partner Center
│   └── Revenue Center
├── Analytics
│   ├── Traffic Analytics
│   ├── Revenue Analytics
│   └── Content Analytics
├── Learning
│   ├── Prediction Center
│   ├── Learning Center
│   └── Experiment Center
├── Automation
│   ├── Agent Center
│   ├── Automation Center
│   └── Prompt Manager
└── Settings
    ├── API Manager
    ├── Feed Manager
    ├── Source Manager
    ├── Model Manager
    └── Marketplace Manager
```

---

## 2.2 Page Specifications

### PAGE: Dashboard

**Purpose:** Central command view of the platform's operational and economic health.

**Users:** All operators

**Components:**
- Revenue Pulse Widget — today / 7d / 30d revenue across all streams
- Traffic Pulse Widget — sessions, pageviews, engagement rate
- Content Velocity Widget — content published this week vs target
- Intelligence Queue Widget — pending signals requiring action
- Agent Activity Feed — real-time agent task stream
- Top Performing Assets — top 10 by revenue, top 10 by traffic
- Prediction Accuracy Gauge — rolling prediction vs actual accuracy
- Alert Center — anomaly alerts, opportunity alerts, failure alerts
- Quick Actions Bar — create brief, run research, check top affiliate

**Backend Services:**
- `analytics.getDashboardMetrics(organizationId, dateRange)`
- `revenue.getSummary(organizationId, dateRange)`
- `agents.getRecentActivity(organizationId, limit: 20)`
- `predictions.getAccuracyScore(organizationId, window: 30)`
- `content.getPublishingVelocity(organizationId)`

**Data Sources:** PostHog analytics, Revenue attribution table, Agent activity log, Prediction/observation tables

**Success Metrics:**
- Dashboard load time < 1.5s (P95)
- All widgets populated within 3s
- Zero blank states for active operators

---

### PAGE: Research Hub

**Purpose:** Structured research workspace where operators or agents conduct deep-dive research on topics, entities, competitors, or keywords.

**Users:** Operators, Research Agents

**Components:**
- Research Query Input — natural language or keyword query
- Research Mode Selector — Quick / Deep / Exhaustive
- Source Selector — Web, Feeds, Internal Knowledge, Entity Sources
- Research Canvas — structured output zone with sections
- Evidence Panel — sourced evidence with citation tracking
- Entity Extractor — auto-detected entities from research output
- Intelligence Signals Panel — extracted signals for knowledge graph
- Export Actions — export to Brief, export to Knowledge Graph, export to Content Plan
- Research History — saved research sessions

**Backend Services:**
- `research.initSession(query, mode, sources)`
- `research.executeSearch(sessionId, providers: ['brave', 'serper', 'tavily'])`
- `research.synthesize(sessionId, aiProvider: 'gemini')`
- `entities.extractFromText(text)`
- `knowledge.ingestResearchSession(sessionId)`

**API Dependencies:**
- Brave Search API
- Serper API
- Tavily API
- Gemini API (synthesis)
- Groq API (entity extraction, classification)

**Intelligence Dependencies:** Entity Registry, Topic Graph, existing research sessions on same topic

**Revenue Dependencies:** Affiliate opportunity detection during research synthesis

---

### PAGE: Discovery Hub

**Purpose:** Continuous signal discovery from RSS feeds, news APIs, content aggregators, and trending topics.

**Users:** Operators, Discovery Agents

**Components:**
- Feed Stream — real-time/near-real-time feed of all ingested signals
- Signal Filters — by source, topic, entity, sentiment, revenue signal strength
- Signal Cards — individual signal with title, summary, source, extracted entities, revenue signal
- Trending Signals Panel — velocity-ranked signals
- Saved Signals — signals saved for later action
- Signal Actions — Create Brief, Add to Planner, Add to Knowledge Graph, Dismiss
- Source Health Monitor — feed sources with last-fetch status, error rates
- Discovery Agent Controls — configure auto-discovery rules

**Backend Services:**
- `feeds.getSignalStream(organizationId, filters, pagination)`
- `feeds.getSourceHealth(organizationId)`
- `signals.saveSignal(signalId, operatorId)`
- `signals.createBriefFromSignal(signalId)`
- `feeds.getTrendingSignals(organizationId, window: '1h' | '6h' | '24h')`

**Data Sources:** Feed ingestion queue, Signal processing pipeline, Source registry

---

### PAGE: SERP Intelligence

**Purpose:** Deep competitive analysis of search engine result pages for tracked keywords and topics.

**Users:** Operators, SEO Intelligence Agents

**Components:**
- Keyword Input / Bulk Import
- SERP Results Viewer — current top 10 with metadata
- SERP Competitor Profiles — domain authority, content structure analysis
- Gap Analyzer — topics covered by competitors not covered by operator
- Featured Snippet Detector — current snippet holder + opportunity score
- PAA (People Also Ask) Extractor
- SERP Volatility Score — historical rank change data
- Opportunity Score Widget — composite score per keyword
- Content Recommendation Engine — recommended content type per SERP
- Batch SERP Queue — bulk keyword SERP fetch and analysis

**Backend Services:**
- `serp.fetchResults(keyword, location, device)`
- `serp.analyzeCompetitors(keyword, results)`
- `serp.detectGaps(keyword, organizationId)`
- `serp.computeOpportunityScore(keyword)`
- `serp.batchQueue(keywords[], priority)`

**API Dependencies:** Serper, Brave Search, Tavily

**Intelligence Dependencies:** Knowledge Graph (existing content mapping), Competitor Intelligence

---

### PAGE: Entity Intelligence

**Purpose:** Deep-dive intelligence on any named entity — brand, product, person, company, technology, location.

**Users:** Operators, Entity Intelligence Agents

**Components:**
- Entity Search / Create
- Entity Profile Card — type, canonical name, aliases, description
- Entity Knowledge Panel — facts, properties, relationships
- Entity Traffic Data — search volume, trend data
- Entity Revenue Signal Panel — affiliate programs, monetization opportunities
- Related Entities Graph (visual) — D3-rendered entity relationship map
- Entity Content Map — existing content mapped to entity
- Entity Gap Analyzer — uncovered sub-topics
- Entity Authority Score — composite score
- Entity Action Center — create content, add to graph, research entity

**Backend Services:**
- `entities.getProfile(entityId)`
- `entities.getRelationships(entityId, depth: 2)`
- `entities.getContentMap(entityId, organizationId)`
- `entities.getRevenueSignals(entityId)`
- `entities.enrichFromWikidata(entityId)`
- `entities.computeAuthorityScore(entityId)`

**External Sources:** Wikidata API, Wikipedia API, Brave Search

---

### PAGE: Knowledge Graph

**Purpose:** Visual and queryable exploration of the platform's accumulated knowledge graph.

**Users:** Operators, Knowledge Agents

**Components:**
- Graph Canvas (D3 / Cytoscape.js) — interactive node-link visualization
- Graph Filter Panel — by node type, edge type, weight threshold, date
- Node Inspector — selected node full profile
- Edge Inspector — selected relationship details
- Graph Search — natural language or structured query
- Graph Statistics Panel — node counts, edge counts, cluster stats
- Knowledge Import — import from research session, CSV, structured data
- Knowledge Export — export subgraph as JSON, CSV, or markdown
- Graph Health Monitor — orphan nodes, low-confidence edges, stale data

**Backend Services:**
- `graph.getNodes(filters, pagination)`
- `graph.getEdges(nodeId, depth, filters)`
- `graph.query(cypherLike: string)` — abstracted graph query language
- `graph.importFromResearch(sessionId)`
- `graph.computeClusterStats()`
- `graph.findOrphans()`

**Database:** Supabase PostgreSQL with adjacency list tables + pgvector for semantic search

---

### PAGE: Content Planner

**Purpose:** Editorial calendar and content prioritization engine.

**Users:** Operators, Content Planning Agents

**Components:**
- Calendar View (month/week/day)
- Kanban View — by status: Planned → Briefed → In Progress → Review → Published
- Content Pipeline — prioritized queue with opportunity scores
- Batch Planner — bulk content plan generation from keyword lists or topics
- Content Cluster Planner — pillar + cluster planning view
- Revenue-Priority Sort — sort content queue by projected revenue impact
- Deadline Manager — scheduled publish dates with agent assignments
- Plan Import — import from CSV, research session, SERP analysis

**Backend Services:**
- `planner.getCalendar(organizationId, dateRange, siteId?)`
- `planner.getPrioritizedQueue(organizationId, sortBy: 'revenue' | 'traffic' | 'date')`
- `planner.createPlanItem(data)`
- `planner.bulkCreate(items[])`
- `planner.generateClusterPlan(pillarKeyword, organizationId)`

---

### PAGE: Content Brief Builder

**Purpose:** Structured brief generation with intelligence pre-population from knowledge graph, SERP data, and affiliate signals.

**Users:** Operators, Brief Generation Agents

**Components:**
- Brief Wizard — step-by-step brief creation
- Target Keyword Input + Intent Classifier
- SERP Analysis Panel — auto-loaded SERP data for target keyword
- Competitor Content Analyzer — auto-analysis of top-ranking content
- Content Outline Generator — AI-generated outline with H2/H3 structure
- Entity Requirements Panel — entities that must be mentioned
- Affiliate Opportunity Panel — recommended affiliate products/links for this brief
- SEO Requirements Panel — title tags, meta description, semantic keywords
- Word Count Recommendation
- Content Type Selector — article, comparison, review, listicle, tool page, etc.
- Brief Export — export to Content Generator or external

**Backend Services:**
- `briefs.create(planItemId, operatorId)`
- `briefs.generateOutline(keyword, serpData, competitorData)`
- `briefs.getAffiliateOpportunities(keyword, entities[])`
- `briefs.generateSEORequirements(keyword, serpData)`
- `briefs.export(briefId, format: 'json' | 'markdown' | 'google-docs')`

**AI Dependencies:** Gemini (outline generation, competitor analysis synthesis)

---

### PAGE: Content Generator

**Purpose:** AI-assisted content generation workspace with brief integration, real-time quality scoring, and affiliate insertion.

**Users:** Operators, Content Generation Agents

**Components:**
- Brief Sidebar — always-visible brief panel
- Generation Canvas — primary draft zone
- Generation Controls — model selector, tone selector, length control
- Section-by-Section Generator — generate per H2/H3
- Real-time Quality Scorer — live scoring as content is written/generated
- Affiliate Insertion Assistant — contextual affiliate link recommendations
- Entity Highlighter — entities detected in draft
- SEO Checker Panel — keyword density, semantic coverage, title/meta check
- Fact Check Signals — flagged claims requiring verification
- Version History — all generation attempts preserved
- Generate Full Draft — one-click full article generation from brief

**Backend Services:**
- `generator.generateSection(briefId, sectionId, model, tone)`
- `generator.generateFullDraft(briefId, model, tone)`
- `generator.scoreQuality(contentId, version)`
- `generator.insertAffiliateLinks(contentId, opportunities[])`
- `generator.detectEntities(text)`
- `versions.save(contentId, content, metadata)`

**AI Dependencies:** Gemini (primary generation), Groq (quality scoring, entity detection)

---

### PAGE: Publishing Center

**Purpose:** Multi-site publishing operations — staging, review, scheduling, and live publication.

**Users:** Operators, Publishing Agents

**Components:**
- Publish Queue — content ready for publication across all sites
- Site Selector — target site/destination
- Staging Preview — live render of content as it will appear
- SEO Final Check — title, meta, canonical, schema markup validator
- Structured Data Builder — Article, Product, FAQ, Review schema
- Affiliate Link Audit — verify all affiliate links are tracked and valid
- Publish Scheduler — date/time scheduling with timezone support
- Bulk Publisher — batch publish approved content
- Post-Publish Tracker — indexing status, initial traffic signal
- Syndication Controls — configure content syndication channels

**Backend Services:**
- `publishing.stageContent(contentId, siteId)`
- `publishing.validateSEO(contentId)`
- `publishing.generateStructuredData(contentId)`
- `publishing.schedule(contentId, datetime, siteId)`
- `publishing.publishNow(contentId, siteId)`
- `publishing.getIndexingStatus(contentId)`

---

### PAGE: Affiliate Center

**Purpose:** Affiliate program management, link tracking, opportunity detection, and performance analytics.

**Users:** Operators, Affiliate Intelligence Agents

**Components:**
- Program Registry — all enrolled affiliate programs
- Link Library — all created affiliate links with tracking params
- Opportunity Detector — content gaps where affiliate links are missing
- Commission Tracker — pending and confirmed commissions
- Top Performers Table — programs, links, content assets by EPC/revenue
- Affiliate Content Map — which content contains which programs
- Program Comparison Engine — compare EPC across competing programs
- Dead Link Monitor — affiliate links returning 404/redirect errors
- Program Discovery — recommended programs based on content niche
- API Key Manager — affiliate API credentials

**Backend Services:**
- `affiliate.getPrograms(organizationId)`
- `affiliate.detectOpportunities(contentId)`
- `affiliate.trackClick(linkId, userId?, metadata)`
- `affiliate.syncCommissions(programId)`
- `affiliate.getPerformance(programId, dateRange)`
- `affiliate.checkLinkHealth(organizationId)`

---

### PAGE: Revenue Center

**Purpose:** Unified revenue intelligence — all streams, attribution, forecasting, and optimization recommendations.

**Users:** Operators

**Components:**
- Revenue Dashboard — all streams in one view
- Revenue Timeline — stacked area chart by stream
- Attribution Explorer — trace revenue event → content → intelligence signal
- Revenue Forecast — ML-based 30/60/90 day projections
- RPM Intelligence — per-content, per-topic, per-site revenue per mille
- Revenue Opportunity Ranker — highest-opportunity actions ranked by projected revenue
- Content Revenue Profiles — per-content revenue breakdown
- Monthly Revenue Report Generator
- Revenue Anomaly Detector — spikes and drops with explanations

**Backend Services:**
- `revenue.getByStream(organizationId, dateRange)`
- `revenue.getAttribution(revenueEventId)`
- `revenue.getForecast(organizationId, window: 30 | 60 | 90)`
- `revenue.getRPM(entityId: contentId | topicId | siteId)`
- `revenue.detectAnomalies(organizationId)`
- `revenue.generateMonthlyReport(organizationId, month)`

---

### PAGE: Prediction Center

**Purpose:** Record, track, and analyze predictions vs actual outcomes — the core learning engine interface.

**Users:** Operators, Learning Agents

**Components:**
- Active Predictions Table — all open predictions awaiting observation
- Prediction Creator — manually record a prediction for any action
- Prediction vs Outcome Visualizer — timeline comparison charts
- Prediction Accuracy Metrics — by domain, by content type, by agent
- Calibration Charts — confidence vs accuracy correlation
- Learning Insights Panel — extracted learning signals from resolved predictions
- Counterfactual Explorer — what would have happened if decision was different
- Confidence Decay Monitor — predictions becoming stale without observation

**Backend Services:**
- `predictions.create(entityType, entityId, expectedOutcome, confidence, expiresAt)`
- `predictions.resolve(predictionId, actualOutcome)`
- `predictions.getAccuracyReport(organizationId, window)`
- `predictions.getCalibrationData(organizationId)`
- `learning.extractSignals(resolvedPredictions[])`

---

### PAGE: Agent Center

**Purpose:** Configure, monitor, and govern all autonomous agents.

**Users:** Operators (admin)

**Components:**
- Agent Registry — all available agents with capabilities
- Active Agents Monitor — currently running agents with status
- Agent Task History — all completed/failed tasks with traces
- Agent Configuration Panel — per-agent settings, schedule, scope
- Agent Governance Rules — behavioral constraints per agent
- Agent Memory Inspector — view agent memory state
- Agent Performance Metrics — tasks completed, error rate, revenue attribution
- Agent Queue — pending tasks with priority
- Agent Audit Log — immutable activity record

**Backend Services:**
- `agents.getRegistry(organizationId)`
- `agents.getActiveAgents(organizationId)`
- `agents.getTaskHistory(agentId, pagination)`
- `agents.configure(agentId, config)`
- `agents.setGovernancePolicy(agentId, policy)`
- `agents.getMemory(agentId)`
- `agents.pause(agentId)` / `agents.resume(agentId)`

---

### PAGE: Settings

**Sub-pages:** API Manager, Feed Manager, Source Manager, Model Manager, Prompt Manager, Marketplace Manager

#### Settings > API Manager

- Credential vault for all external API keys
- API health status and rate limit monitors
- Usage tracking per provider
- Failover configuration
- Key rotation reminders

#### Settings > Feed Manager

- RSS/Atom feed registry
- Feed health monitoring
- Ingestion schedule configuration
- Feed categorization and tagging
- Feed priority weighting

#### Settings > Model Manager

- AI provider configuration (Gemini, Groq, OpenRouter)
- Model routing rules — which model handles which task type
- Cost-per-operation tracking
- Fallback chain configuration
- Model performance benchmarks (internal)

#### Settings > Prompt Manager

- Prompt library — all prompts organized by task type
- Prompt versioning
- Prompt performance tracking
- Prompt A/B testing
- System prompt templates

#### Settings > Source Manager

- All intelligence sources (crawled, API, feed)
- Source quality scoring
- Source authority assignment
- Source block/allowlist management

---

## 2.3 User States

### State 1: New Operator (Onboarding)
- Guided setup wizard
- Site configuration
- Feed setup
- Affiliate program setup
- First research task
- First content brief

### State 2: Active Operator (Daily Operations)
- Dashboard review
- Signal triage
- Content pipeline management
- Revenue monitoring
- Agent supervision

### State 3: Power Operator (Advanced)
- Custom agent configuration
- Knowledge graph curation
- Prediction tracking
- Experiment management
- Portfolio optimization

### State 4: SaaS User (Phase 3+)
- Self-service onboarding
- Plan management
- Usage monitoring
- Support access

---
