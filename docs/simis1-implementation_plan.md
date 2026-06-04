# SIMIS — COMPLETE ARCHITECTURE BLUEPRINT
## Autonomous Digital Asset Intelligence Engine
### Version 3.0 — Canonical Architecture Specification
#### Synthesized from: Master Constitution v1.0 + Technical Constitution v2.0 (P1–P3) + v2.1 Addendum

> *This document supersedes all prior planning documents. It is the single source of architectural truth.*
> *Inconsistencies between source documents have been resolved herein.*

---

# DELIVERABLE 1 — EXECUTIVE SYSTEM SYNTHESIS

## 1.1 Project Identity

### Mission
To democratize the ownership of high-yield digital media empires by automating the entire lifecycle of discovery, synthesis, publishing, and monetization through a deterministic, self-improving intelligence flywheel — making it possible for a single founder to operate what previously required entire editorial teams.

### Vision
The world's first **Autonomous Digital Asset Intelligence Engine (ADAI)** — a platform class that self-assembles information systems, builds its own media portfolios, and continuously optimizes economic output under minimal human management.

### System Identity Matrix

| Dimension | Definition |
|-----------|-----------|
| **Product Identity** | Media Business Operating System |
| **Intelligence Identity** | Self-Improving Intelligence Platform |
| **Data Identity** | Data Arbitrage & Knowledge Sovereignty Platform |
| **Economic Identity** | Revenue Intelligence & Attribution Engine |
| **Operational Identity** | Autonomous Content Operations Platform |
| **Evolution Identity** | Founder OS → Multi-Site Network → SaaS Platform → Franchise |
| **Public Identity** | Premium Media Publisher & Research Platform |

### What SIMIS Is NOT
- Not an AI writer (content generation is a sub-function)
- Not a CMS (publishing is an output channel)
- Not an SEO tool (search optimization is one strategy)
- Not an AGC system (volume without intelligence is explicitly rejected)
- Not a dashboard (the dashboard exists to operate the media business)

---

## 1.2 Core Principles (Canonical — 13 Principles)

*Resolves conflict: v2.0 defines P-01→P-10; v2.1 adds P-11→P-13. Canonical set is all 13.*

| ID | Principle | Definition |
|----|-----------|-----------|
| **P-01** | Intelligence Over Volume | Quality of intelligence beats quantity of content |
| **P-02** | Revenue Attribution Mandatory | Every action must carry traceable revenue attribution |
| **P-03** | Prediction Before Action | No major action executes without a recorded prediction |
| **P-04** | Closed-Loop Learning | Every prediction generates an observation; the gap is learning data |
| **P-05** | Entity-First Architecture | All knowledge is organized around entities with weighted relationships |
| **P-06** | Zero Single Points of Failure | All providers must have failover alternatives |
| **P-07** | Founder-Operable at MVP | Operable by one non-engineer; complexity hides behind intelligent defaults |
| **P-08** | Revenue-Aware UI | Every UI surface must surface revenue opportunity signals |
| **P-09** | Modularity Over Monolith | Every capability is a bounded context with defined contracts |
| **P-10** | Observability as Default | No action, agent task, or outcome is unlogged |
| **P-11** | Cost Attribution Mandatory | Every AI API call must track cost to organization and content asset |
| **P-12** | Idempotency as Default | All agent operations are safe to retry without side effects |
| **P-13** | Graceful Degradation | System operates in reduced capacity when dependencies fail |

---

## 1.3 Six-Axis System Philosophy

### Founder-First
Single operator can run the entire system in 1 hour/day. The Founder Control Tower surfaces only what requires human judgment; agents handle everything else.

### Media-First
The media business is the product. Every system component serves the creation, distribution, and optimization of digital media assets. The dashboard is an instrument panel, not the aircraft.

### Revenue-First
Revenue attribution is constitutional law. Every entity in the knowledge graph carries a `revenue_score`. Every content decision is weighted by projected and historical revenue contribution.

### Intelligence-First
Raw data is worthless. The system's value is in its accumulated intelligence — the knowledge graph, the prediction history, the calibrated confidence models, the entity authority network.

### Learning-First
Every decision is a hypothesis. Every outcome is evidence. The system must become measurably smarter with each cycle. Prediction accuracy is a first-class metric, tracked and displayed prominently.

### Audience-First *(Missing from v2.0/v2.1 — added here)*
The public media experience is a first-class product, not an afterthought. Audience trust, engagement, and retention are tracked and optimized with the same rigor as affiliate conversion rates.

---

## 1.4 Architectural North Star

### 3 Months (Phase 1 Complete)
Single site operating autonomously. 20+ content assets published. First affiliate revenue attributed. All learning loop infrastructure live. Founder spending < 1 hour/day on operations.

### 12 Months (Phase 3 Complete)
3–5 sites across 2–3 niches. 200+ content assets. Knowledge graph with 5,000+ entities. Predictable monthly revenue > $1,000. Automated content refresh engine active. Newsletter list > 500 subscribers.

### 24 Months (Phase 5 Complete)
10+ sites, multi-niche network. Knowledge graph with 50,000+ entities. Sponsor engine generating direct deals. Revenue from 4+ streams. System approaching true autonomy (< 30 min/day human input required).

### 60 Months (Phase 7 Complete)
SaaS platform launched. Multiple external customers. Franchise program active. Knowledge graph licensed as API. System is a global media intelligence platform operating across dozens of niches with a revenue share model.

---

## 1.5 Evolution Path

```
STAGE 1: FOUNDER OPERATING SYSTEM (Months 0–6)
  └── Single founder, single portfolio, single intelligence layer
  └── Goal: Revenue positive, system fully automated

STAGE 2: MULTI-SITE MEDIA NETWORK (Months 6–18)
  └── Multiple sites, multiple niches, cross-site intelligence
  └── Goal: $5,000/month revenue, team access enabled

STAGE 3: MEDIA INTELLIGENCE SAAS (Months 18–36)
  └── Multi-tenant platform, subscription billing, self-service onboarding
  └── Goal: 50+ paying customers, $50,000/month ARR

STAGE 4: MEDIA INTELLIGENCE FRANCHISE PLATFORM (Months 36–60+)
  └── Franchise operators, niche packs, shared intelligence network
  └── Goal: 500+ operators, platform becomes the category definition
```

---

# DELIVERABLE 2 — COMPLETE DOMAIN MAP

## 2.1 Canonical Domain Architecture

*Resolves gap: v2.0/v2.1 define 8 bounded contexts. Full canonical model requires 14.*

```
SIMIS CANONICAL DOMAIN MAP
│
├── MEDIA DOMAIN ──────────────────────────────────── [NEW — Missing from v2.0/v2.1]
│   ├── Brands Subdomain
│   │   └── Entities: Brand, BrandVoice, BrandGuideline, BrandPortfolio
│   ├── Sites Subdomain
│   │   └── Entities: Site, SiteConfig, SiteCategory, SiteTemplate
│   ├── Publications Subdomain
│   │   └── Entities: Publication, PublicationSchedule, PublicationRule
│   ├── Categories Subdomain
│   │   └── Entities: Category, CategoryHierarchy, CategorySEOConfig
│   ├── Topics Subdomain
│   │   └── Entities: Topic, TopicCluster, PillarTopic, SupportingTopic
│   ├── Authors Subdomain
│   │   └── Entities: Author, AuthorProfile, AuthorExpertise, GhostAuthor
│   └── Media Assets Subdomain
│       └── Entities: Image, Video, Infographic, Dataset, Tool, Calculator
│
├── AUDIENCE DOMAIN ────────────────────────────────── [NEW — Missing from v2.0/v2.1]
│   ├── Subscribers Subdomain
│   │   └── Entities: Subscriber, SubscriberProfile, NewsletterList, Segment
│   ├── Leads Subdomain
│   │   └── Entities: Lead, LeadProfile, LeadScore, LeadSource
│   ├── Segments Subdomain
│   │   └── Entities: Segment, SegmentRule, BehavioralTag, IntentSignal
│   ├── Funnel Subdomain
│   │   └── Entities: FunnelStage, ConversionEvent, FunnelPath, DropoffPoint
│   └── Communities Subdomain (Phase 3+)
│       └── Entities: CommunityMember, Forum, Comment, Reputation
│
├── DISCOVERY DOMAIN
│   ├── Signals Subdomain
│   │   └── Entities: Signal, FeedSource, RawFeedItem, SignalEnrichment
│   ├── SERP Subdomain
│   │   └── Entities: SERPSnapshot, SERPResult, FeaturedSnippet, PAA
│   ├── Trends Subdomain
│   │   └── Entities: TrendSignal, VelocityScore, TrendAlert, TrendHistory
│   ├── Competitors Subdomain
│   │   └── Entities: CompetitorDomain, CompetitorContent, ContentGap
│   └── Sources Subdomain
│       └── Entities: Source, SourceCredibility, SourceHealth, SourceCategory
│
├── RESEARCH DOMAIN
│   ├── Research Sessions Subdomain
│   │   └── Entities: ResearchSession, SubQuery, ResearchResult, Citation
│   ├── Entity Research Subdomain
│   │   └── Entities: EntityResearch, WikidataRecord, EntityFact
│   └── Competitive Intelligence Subdomain
│       └── Entities: CompetitorAnalysis, GapReport, OpportunityReport
│
├── KNOWLEDGE DOMAIN
│   ├── Knowledge Graph Subdomain
│   │   └── Entities: GraphNode, GraphEdge, NodeProperty, EdgeWeight
│   ├── Entity Registry Subdomain
│   │   └── Entities: Entity, EntityAlias, EntityRelationship, EntityMerge
│   ├── Topic Graph Subdomain
│   │   └── Entities: TopicNode, TopicCluster, TopicAuthority, SemanticPath
│   ├── Authority Graph Subdomain
│   │   └── Entities: AuthorityNode, BacklinkRecord, InternalLinkMap
│   ├── Revenue Graph Subdomain
│   │   └── Entities: RevenueNode, RevenueEdge, EPCScore, ConversionPath
│   └── Intelligence Graph Subdomain (Phase 2+)
│       └── Entities: PredictionNode, OutcomeNode, LearningEdge, CausalLink
│
├── CONTENT DOMAIN
│   ├── Planning Subdomain
│   │   └── Entities: ContentPlan, EditorialCalendar, ContentCluster, PriorityQueue
│   ├── Brief Generation Subdomain
│   │   └── Entities: ContentBrief, BriefOutline, SEORequirement, AffiliateHint
│   ├── Generation Subdomain
│   │   └── Entities: ContentDraft, GenerationJob, GenerationModel, QualityScore
│   ├── Editing Subdomain
│   │   └── Entities: ContentVersion, EditHistory, FactCheckFlag, HumanEdit
│   ├── Publishing Subdomain
│   │   └── Entities: PublishJob, PublishedAsset, PublishTarget, SitemapEntry
│   └── Refresh Subdomain
│       └── Entities: RefreshTrigger, RefreshBrief, RefreshHistory, DecayScore
│
├── REVENUE DOMAIN
│   ├── Affiliate Subdomain
│   │   └── Entities: AffiliateProgram, AffiliateLink, Click, Commission
│   ├── Ads Subdomain
│   │   └── Entities: AdPlacement, AdNetwork, RPMRecord, AdImpression
│   ├── Sponsor Subdomain
│   │   └── Entities: Sponsor, SponsorDeal, SponsorPlacement, MediaKit
│   ├── Lead Generation Subdomain
│   │   └── Entities: LeadForm, LeadCaptured, LeadValue, LeadRoute
│   ├── Digital Products Subdomain (Phase 2+)
│   │   └── Entities: DigitalProduct, ProductDownload, ProductRevenue
│   ├── Memberships Subdomain (Phase 3+)
│   │   └── Entities: MembershipPlan, Member, AccessGate, MemberContent
│   ├── Attribution Subdomain
│   │   └── Entities: RevenueEvent, AttributionChain, RPMScore, TouchPoint
│   └── Intelligence Subdomain
│       └── Entities: RevenueForecast, AnomalyAlert, OptimizationSignal
│
├── PARTNER DOMAIN ─────────────────────────────────── [NEW — Missing from v2.0/v2.1]
│   ├── Network Partners Subdomain
│   │   └── Entities: PartnerNetwork, PartnerProgram, NetworkContract
│   ├── Direct Partners Subdomain
│   │   └── Entities: DirectPartner, PartnerDeal, PartnerPlacement
│   ├── Syndication Subdomain (Phase 2+)
│   │   └── Entities: SyndicationPartner, SyndicationDeal, SyndicatedContent
│   └── API Partners Subdomain (Phase 3+)
│       └── Entities: APIPartner, APILicense, APIUsageEvent
│
├── LEARNING DOMAIN
│   ├── Prediction Subdomain
│   │   └── Entities: Prediction, PredictionFeature, ConfidenceScore
│   ├── Observation Subdomain
│   │   └── Entities: Observation, ObservationSource, Delta
│   ├── Signal Subdomain
│   │   └── Entities: LearningSignal, FeatureImportance, SignalBatch
│   ├── Calibration Subdomain
│   │   └── Entities: CalibrationModel, CalibrationCurve, ECEScore
│   ├── Experiment Subdomain
│   │   └── Entities: Experiment, Variant, ExperimentResult, ConfidenceInterval
│   └── Meta Learning Subdomain
│       └── Entities: MetaReport, ModelDrift, PerformanceTrend
│
├── AGENT DOMAIN
│   ├── Registry Subdomain
│   │   └── Entities: Agent, AgentCapability, AgentVersion, AgentConfig
│   ├── Execution Subdomain
│   │   └── Entities: AgentTask, TaskTrace, ExecutionLog, DeadLetterJob
│   ├── Memory Subdomain
│   │   └── Entities: EpisodicMemory, SemanticMemory, ProceduralMemory, WorkingMemory
│   ├── Governance Subdomain
│   │   └── Entities: GovernancePolicy, PolicyViolation, ApprovalRequest, CostBudget
│   └── Workflow Subdomain
│       └── Entities: Workflow, WorkflowStep, WorkflowTrigger, WorkflowState
│
├── ANALYTICS DOMAIN
│   ├── Traffic Subdomain
│   │   └── Entities: PageView, Session, UserJourney, ReferralSource
│   ├── Engagement Subdomain
│   │   └── Entities: ScrollDepth, TimeOnPage, BounceRate, ReturnVisitor
│   ├── Conversion Subdomain
│   │   └── Entities: ConversionEvent, ConversionFunnel, ConversionRate
│   └── Revenue Analytics Subdomain
│       └── Entities: RPMTrend, RevenueByChannel, RevenueByContent
│
├── ADMINISTRATION DOMAIN ──────────────────────────── [NEW — Missing from v2.0/v2.1]
│   ├── Organizations Subdomain
│   │   └── Entities: Organization, OrgPlan, OrgSettings, OrgBilling
│   ├── Users Subdomain
│   │   └── Entities: User, OrgMember, Role, Permission, Invitation
│   ├── API Management Subdomain
│   │   └── Entities: APIKey, APICredential, APIUsage, OrgSecret
│   ├── Billing Subdomain (Phase 3+)
│   │   └── Entities: Subscription, Invoice, UsageRecord, PaymentMethod
│   └── Compliance Subdomain
│       └── Entities: ConsentRecord, DataRetentionPolicy, AuditLog
│
└── INFRASTRUCTURE DOMAIN
    ├── Observability Subdomain
    │   └── Entities: SystemAlert, OperationCost, HealthCheck, SLORecord
    ├── Queue Subdomain
    │   └── Entities: QueuedJob, JobResult, DLQRecord, JobSchedule
    ├── Storage Subdomain
    │   └── Entities: StorageObject, StorageBucket, StoragePolicy
    └── Integration Subdomain
        └── Entities: Integration, IntegrationConfig, WebhookEndpoint, Webhook
```

---

# DELIVERABLE 3 — BOUNDED CONTEXT ARCHITECTURE

## BC-01: Media Context *(NEW)*

**Purpose:** Own and manage all media brands, sites, authors, and the public-facing media infrastructure. This is the product that audiences experience.

**Owned Data:** organizations, sites, brands, categories, authors, media_assets, site_configs, publication_schedules

**Owned Services:** SiteService, BrandService, AuthorService, CategoryService, MediaAssetService

**Consumed Data:** ContentAssets (from Content Context), RevenueMetrics (from Revenue Context)

**Produced Events:** `SiteCreated`, `SiteConfigUpdated`, `AuthorPublished`, `CategoryCreated`

**Key APIs:**
- `POST /v1/sites` — Create managed site
- `GET /v1/sites/{id}/health` — Site health metrics
- `POST /v1/authors` — Register author profile

**UI Surfaces:** Site Manager, Portfolio Manager, Author Manager, Category Manager, Media Library

**Success Metrics:** Sites active, content published per site, author credibility scores

**Future Evolution:** Multi-site portfolio management dashboard, site acquisition scoring, white-label site generation

---

## BC-02: Audience Context *(NEW)*

**Purpose:** Build, segment, retain, and convert audience. Manage the subscriber lifecycle from anonymous visitor to loyal subscriber to paying customer.

**Owned Data:** subscribers, subscriber_segments, leads, lead_profiles, funnel_events, newsletter_lists, consent_records

**Owned Services:** SubscriberService, SegmentationService, LeadScoringService, FunnelTrackingService, NewsletterService

**Consumed Data:** ContentAssets (for context), TrafficEvents (from Analytics), RevenueEvents (for LTV tracking)

**Produced Events:** `SubscriberAcquired`, `LeadCaptured`, `SegmentUpdated`, `ConversionCompleted`

**Key APIs:**
- `POST /v1/subscribers` — Create subscriber
- `GET /v1/subscribers/segments` — List segments
- `POST /v1/leads` — Capture lead
- `GET /v1/audience/funnel` — Funnel analytics

**UI Surfaces:** Audience Hub, Newsletter Manager, Lead Center, Subscriber Segments

**Success Metrics:** Subscriber growth rate, email open rate, lead-to-conversion rate, newsletter RPM

**Future Evolution:** Community platform, paid membership, subscriber monetization optimization

---

## BC-03: Discovery Context

**Purpose:** Continuous acquisition of intelligence signals from external sources. The eyes and ears of the system.

**Owned Data:** feed_sources, signals, raw_feed_items, serp_snapshots, trend_signals, competitor_content

**Owned Services:** FeedIngestionService, SERPService, TrendDetectionService, CompetitorMonitoringService, SignalEnrichmentService

**Consumed Data:** Entity Registry (for entity matching), Knowledge Graph (for deduplication), Affiliate Programs (for revenue signal detection)

**Produced Events:** `FeedIngested`, `SignalCreated`, `TrendDetected`, `CompetitorContentDiscovered`, `SERPSnapshotCreated`

**Dependencies:** Brave Search API, Serper API, Tavily API, Crawl4AI, RSS feeds, Trigger.dev

**Key APIs:**
- `GET /v1/signals` — Stream of enriched signals
- `POST /v1/feed-sources` — Register feed source
- `GET /v1/serp/{keyword}` — Fetch SERP data
- `GET /v1/trends` — Current trend signals

**UI Surfaces:** Discovery Hub, Feed Manager, SERP Intelligence, Trend Intelligence, Competitor Intelligence

**Success Metrics:** Signals per day, signal enrichment rate, SERP freshness, competitor monitoring coverage

---

## BC-04: Research Context

**Purpose:** Deep, structured research synthesis on demand. Converts signals into actionable knowledge.

**Owned Data:** research_sessions, research_results, citations, entity_research_profiles

**Owned Services:** ResearchSessionService, EntityResearchService, SynthesisService, CitationService

**Consumed Data:** Discovery signals, Knowledge Graph (for context enrichment), SERP data

**Produced Events:** `ResearchSessionCompleted`, `EntityResearched`, `CitationExtracted`

**Dependencies:** Gemini API (synthesis), Groq API (extraction), Firecrawl, Crawl4AI

**Key APIs:**
- `POST /v1/research/sessions` — Start research session
- `GET /v1/research/sessions/{id}` — Get research results
- `POST /v1/research/entity/{entityId}` — Research entity

**UI Surfaces:** Research Hub, Research Session Canvas, Entity Research Profile

**Success Metrics:** Research session quality score, entity enrichment rate, citation accuracy

---

## BC-05: Knowledge Context

**Purpose:** Accumulate, structure, and serve the system's growing intelligence base. The brain of SIMIS.

**Owned Data:** graph_nodes, graph_edges, entities, entity_properties, entity_embeddings, knowledge_clusters, topic_nodes

**Owned Services:** GraphService, EntityService, EmbeddingService, ClusterService, KnowledgeImportService

**Consumed Data:** Research sessions (for ingestion), Signals (for entity detection), Revenue events (for weight reinforcement)

**Produced Events:** `EntityCreated`, `EntityMerged`, `RelationshipEstablished`, `AuthorityScoreUpdated`, `RevenueWeightUpdated`, `GraphDecayed`

**Key APIs:**
- `POST /v1/graph/nodes` — Upsert node
- `GET /v1/graph/nodes/{id}/neighbors` — Traverse graph
- `POST /v1/entities` — Create/upsert entity
- `GET /v1/entities/search` — Semantic entity search
- `GET /v1/graph/gaps` — Find content gaps
- `GET /v1/graph/opportunities` — Find revenue opportunities

**UI Surfaces:** Knowledge Graph Explorer, Entity Registry, Topic Map, Knowledge Manager

**Success Metrics:** Node count, edge count, entity enrichment rate, graph query latency

---

## BC-06: Content Context

**Purpose:** Plan, brief, generate, edit, score, version, and publish content assets.

**Owned Data:** content_plans, content_briefs, content_assets, content_versions, content_refresh_jobs, prompt_templates

**Owned Services:** PlannerService, BriefService, GenerationService, QualityService, RefreshService, VersionService

**Consumed Data:** SERP data, Entity profiles, Affiliate opportunities, Knowledge Graph gaps

**Produced Events:** `BriefCreated`, `ContentDraftGenerated`, `ContentPublished`, `ContentRefreshed`, `QualityScoreUpdated`

**Key APIs:**
- `POST /v1/content/briefs` — Create brief
- `POST /v1/content/generate` — Generate draft
- `POST /v1/content/{id}/publish` — Publish content
- `GET /v1/content/refresh-queue` — Content refresh priorities

**UI Surfaces:** Content Planner, Brief Builder, Content Generator, Content Editor, Refresh Center

**Success Metrics:** Content velocity (pieces/week), average quality score, time-to-publish, refresh coverage rate

---

## BC-07: Publishing Context

**Purpose:** Distribute approved content to target sites/channels. Manage the deployment layer.

**Owned Data:** publish_jobs, published_pages, sitemap_entries, publication_targets, static_build_triggers

**Owned Services:** PublishService, StaticBuildService, SitemapService, RedirectService, SchemaService

**Consumed Data:** ContentAssets (from Content Context), SiteConfig (from Media Context)

**Produced Events:** `PagePublished`, `SitemapUpdated`, `StaticBuildTriggered`, `PageUnpublished`

**Key APIs:**
- `POST /v1/publish/jobs` — Create publish job
- `GET /v1/publish/jobs/{id}/status` — Job status
- `POST /v1/publish/sitemap/rebuild` — Rebuild sitemap

**UI Surfaces:** Publishing Center, Build Status Monitor, Sitemap Manager

**Success Metrics:** Publish success rate, build time, page indexing rate, sitemap freshness

**Architecture Note:** Published content is SSG (Astro/Next.js static export) deployed to Cloudflare Pages or Vercel. The Publishing Context is the bridge between the internal content system and the public-facing static site.

---

## BC-08: Revenue Context

**Purpose:** Track, attribute, optimize, and forecast all monetization streams.

**Owned Data:** affiliate_programs, affiliate_links, revenue_events, revenue_attribution, ad_placements, sponsor_deals, lead_captures, digital_products

**Owned Services:** AffiliateService, AttributionService, ForecastService, AnomalyService, OpportunityService

**Consumed Data:** Analytics events (PostHog), Content assets, Entity profiles (for program matching)

**Produced Events:** `AffiliateClickTracked`, `ConversionRecorded`, `RevenueAttributed`, `CommissionConfirmed`, `RevenueAnomalyDetected`

**Key APIs:**
- `POST /v1/revenue/affiliate/programs` — Register program
- `POST /v1/revenue/affiliate/links` — Generate tracked link
- `POST /v1/revenue/events` — Record revenue event (webhook handler)
- `GET /v1/revenue/attribution/{id}` — Get attribution chain
- `GET /v1/revenue/forecast` — Revenue forecast

**UI Surfaces:** Affiliate Center, Revenue Center, Sponsor Center, Lead Center, Revenue Intelligence

**Success Metrics:** Total MRR, RPM per content asset, affiliate EPC, attribution accuracy rate

---

## BC-09: Partner Context *(NEW)*

**Purpose:** Manage strategic partnerships, syndication deals, API licensing, and affiliate network relationships.

**Owned Data:** partners, partner_deals, syndication_agreements, api_licenses, media_kits, partner_portals

**Owned Services:** PartnerService, SponsorOutreachService, MediaKitService, SyndicationService, APILicenseService

**Consumed Data:** Audience metrics, Content performance (for media kit generation), Revenue data (for deal valuation)

**Produced Events:** `PartnerDealCreated`, `SponsorActivated`, `SyndicationPublished`

**Key APIs:**
- `POST /v1/partners` — Create partner record
- `GET /v1/partners/{id}/media-kit` — Generate media kit
- `POST /v1/partners/sponsor-outreach` — Trigger sponsor outreach

**UI Surfaces:** Partner Center, Sponsor Manager, Media Kit Builder, API License Manager

**Success Metrics:** Active sponsor deals, partner deal value, syndication reach

---

## BC-10: Analytics Context

**Purpose:** Collect, process, and serve traffic, engagement, and conversion analytics data.

**Owned Data:** Mirrors PostHog data; local aggregates in: page_analytics, content_performance, conversion_funnels, audience_segments

**Owned Services:** AnalyticsAggregatorService, PerformanceReportService, FunnelAnalysisService

**Consumed Data:** PostHog events (via API), Revenue events (for conversion tracking)

**Produced Events:** `DailyAnalyticsProcessed`, `PerformanceAnomalyDetected`

**Key APIs:**
- `GET /v1/analytics/dashboard` — Dashboard metrics
- `GET /v1/analytics/content/{id}` — Content performance
- `GET /v1/analytics/funnel` — Conversion funnel

**UI Surfaces:** Traffic Analytics, Revenue Analytics, Content Analytics, Audience Analytics

**Success Metrics:** Data freshness, analytics query latency, PostHog sync reliability

---

## BC-11: Learning Context

**Purpose:** Convert every decision into a learning signal. Make the system measurably smarter over time.

**Owned Data:** predictions, observations, learning_signals, experiments, calibration_models, meta_reports

**Owned Services:** PredictionService, ObservationService, CalibrationService, ExperimentService, MetaLearningService, CounterfactualService

**Consumed Data:** Analytics data (for observations), Revenue events (for outcome measurement), Content quality scores

**Produced Events:** `PredictionRecorded`, `OutcomeObserved`, `LearningSignalComputed`, `CalibrationUpdated`, `ModelImproved`

**Key APIs:**
- `POST /v1/predictions` — Record prediction
- `POST /v1/observations` — Record observation
- `GET /v1/learning/accuracy` — System accuracy score
- `GET /v1/learning/signals` — Recent learning signals

**UI Surfaces:** Prediction Center, Learning Center, Experiment Center, Accuracy Dashboard

**Success Metrics:** Prediction accuracy (ECE < 0.05), average error percentage, learning signal volume

---

## BC-12: Agent Context

**Purpose:** Define, schedule, execute, monitor, and govern autonomous agent operations.

**Owned Data:** agents, agent_tasks, agent_memory, governance_policies, approval_requests, dead_letter_queue

**Owned Services:** AgentRegistry, TaskExecutorService, GovernanceService, MemoryService, WorkflowService

**Consumed Data:** Intelligence signals (for triggering), Content plans (for execution targets)

**Produced Events:** `AgentTaskScheduled`, `AgentTaskCompleted`, `AgentTaskFailed`, `GovernanceViolationDetected`, `ApprovalRequested`

**Key APIs:**
- `POST /v1/agents/tasks` — Queue agent task
- `GET /v1/agents/{id}/tasks` — Get task history
- `POST /v1/agents/{id}/approve/{taskId}` — Approve pending task
- `GET /v1/agents/activity` — Real-time activity feed

**UI Surfaces:** Agent Hub, Agent Activity Feed, Governance Console, Approval Queue

**Success Metrics:** Task success rate, average cost per task, human intervention rate, governance violation rate

---

## BC-13: Administration Context *(NEW)*

**Purpose:** Platform administration, user management, billing, and compliance.

**Owned Data:** organizations, org_members, users, roles, invitations, subscriptions, billing_records, consent_records, audit_logs

**Owned Services:** OrganizationService, MemberService, BillingService (Phase 3+), ComplianceService, AuditService

**Produced Events:** `UserInvited`, `MemberJoined`, `RoleChanged`, `SubscriptionChanged`, `ConsentRecorded`

**Key APIs:**
- `POST /v1/admin/organizations` — Create org
- `POST /v1/admin/invitations` — Invite member
- `GET /v1/admin/audit-logs` — Audit trail

**UI Surfaces:** Organization Settings, Team Management, Billing Dashboard, Audit Log, Compliance Center

---

## BC-14: Infrastructure Context

**Purpose:** Platform health, queue management, observability, cost tracking, disaster recovery.

**Owned Data:** operation_costs, system_alerts, dead_letter_queue, health_checks, slo_records

**Owned Services:** CostTrackingService, AlertingService, HealthCheckService, DLQService, BackupService

**Produced Events:** `CostThresholdExceeded`, `SLOBurnRateHigh`, `ServiceDegraded`, `BackupCompleted`

**Key APIs:**
- `GET /v1/infrastructure/health` — System health
- `GET /v1/infrastructure/costs` — Cost summary
- `GET /v1/infrastructure/dlq` — Dead letter queue

**UI Surfaces:** System Health Dashboard, Cost Monitor, Alert Center, DLQ Manager

---

# DELIVERABLE 4 — COMPLETE PRODUCT SURFACE INVENTORY

## 4.1 Internal Operating System

### CONTROL TOWER (Dashboard)
| Element | Detail |
|---------|--------|
| **Purpose** | Central command view — portfolio RPM, agent status, predictions, alerts |
| **Primary Users** | Founder/Operator |
| **Core Widgets** | Revenue Pulse (today/7d/30d), Traffic Pulse, Content Velocity, Intelligence Queue, Agent Activity Feed, Top Performing Assets, Prediction Accuracy Gauge, System Health, Quick Actions |
| **UX Reference** | Bloomberg Terminal + Notion + HubSpot blend |
| **Key Actions** | Approve pending agent actions, drill into anomalies, quick-launch research |
| **Future** | Multi-portfolio view, team activity, SaaS customer metrics |

### INTELLIGENCE HUB
**Research Hub** — Deep research workspace for topics, entities, competitors, keywords
**Discovery Hub** — Real-time signal stream from feeds, news, trends
**SERP Intelligence** — Keyword SERP analysis, gap detection, opportunity scoring
**News Intelligence** — Curated news stream from monitored topics
**Trend Intelligence** — Velocity-ranked emerging topics with content opportunity scoring
**Competitor Intelligence** — Competitor content monitoring, publishing patterns, gap analysis
**Entity Intelligence** — Deep entity profiles with knowledge graph visualization, revenue signals

### KNOWLEDGE HUB
**Knowledge Graph** — Interactive D3/Cytoscape graph visualization, queryable, filterable
**Entity Registry** — Full entity database with search, enrichment status, property management
**Topic Map** — Hierarchical topic cluster visualization with coverage gaps
**Knowledge Manager** — Import/export, orphan detection, weight decay management

### CONTENT HUB
**Content Planner** — Editorial calendar + Kanban board + Revenue-priority queue
**Brief Builder** — Wizard-driven brief creation with SERP, competitor, affiliate pre-population
**Content Generator** — AI-assisted generation workspace with real-time quality scoring
**Content Editor** — Rich markdown editor with entity highlighting, affiliate insertion assistant
**Refresh Center** — Decay detection, refresh priority queue, one-click refresh trigger

### PUBLISHING HUB
**Publishing Center** — Approve-and-deploy workflow, build status, publish queue
**Site Manager** — Site configuration, domain, SEO config, brand voice
**Portfolio Manager** — Multi-site overview, cross-site performance comparison

### REVENUE HUB
**Affiliate Center** — Program registry, link management, opportunity detection, health monitor
**Ads Intelligence** — Ad network integration, placement optimization, RPM tracking
**Sponsor Center** — Sponsor discovery, media kit generation, deal management
**Lead Center** — Lead capture forms, lead scoring, routing configuration
**Partner Center** — Partner deals, API licenses, syndication management
**Revenue Center** — Multi-stream revenue dashboard, attribution explorer, forecasting

### AUDIENCE HUB *(NEW)*
**Subscriber Manager** — Newsletter list management, segmentation, growth tracking
**Lead Manager** — Lead database, scoring, qualification workflow
**Audience Analytics** — Segment performance, funnel analysis, LTV modeling
**Newsletter Studio** — Template editor, automation rules, campaign performance

### ANALYTICS HUB
**Traffic Analytics** — Sessions, pageviews, sources, geographic data, device breakdown
**Revenue Analytics** — Revenue by channel, content, time period, attribution model
**Content Analytics** — Top performers, decay detection, engagement depth, comparison
**Conversion Analytics** — Funnel visualization, drop-off analysis, A/B experiment results

### LEARNING HUB
**Prediction Center** — Open predictions, accuracy history, confidence calibration charts
**Learning Center** — Learning signals, feature importance, model improvement history
**Experiment Center** — A/B test creation, variant performance, statistical significance

### AUTOMATION HUB
**Agent Hub** — Agent status, task queue, approval queue, governance console
**Automation Center** — Workflow definitions, trigger rules, automation templates
**Prompt Manager** — Prompt library, version history, A/B test results, model routing

### SETTINGS
**API Manager** — External API key management (encrypted vault)
**Feed Manager** — Feed source configuration, health monitoring, ingestion schedules
**Source Manager** — Crawl targets, blocklists, priority weights
**Model Manager** — AI provider configuration, routing rules, cost budgets
**Team Manager** — User invitations, roles, permissions
**Organization Settings** — Plan, billing, data export, compliance

---

## 4.2 Public Media Experience *(Missing from v2.0/v2.1 — Complete specification)*

> [!IMPORTANT]
> The public-facing media site is a **first-class product**, not a side effect of the internal system. It is the asset that generates all revenue. It must be designed and built with the same rigor as the internal OS.

### Homepage (`/`)
**Purpose:** Brand entry point, topical authority signal, audience acquisition funnel
**Users:** First-time visitors, returning readers, AI crawlers
**Core Elements:** Hero with value proposition, Featured content cluster, Trending topics, Recent articles, Newsletter capture, Category navigation, Entity spotlights, Latest deals/reviews
**Technical:** SSG, JSON-LD Organization schema, Core Web Vitals optimized (LCP < 1.5s), Open Graph

### Category Pages (`/category/{slug}`)
**Purpose:** Topical authority hub, cluster landing page for SEO and audience
**Core Elements:** Category overview, pillar content links, supporting articles grid, related entities, affiliate opportunities for category, newsletter for category topic, latest category news
**Technical:** SSG, BreadcrumbList schema, ContentSection schema, paginated infinite scroll

### Topic Pages (`/topic/{slug}`)
**Purpose:** Topic cluster hub — deep topical authority signal for search engines and AI retrievers
**Core Elements:** Topic definition, related entities, content cluster map, in-depth guides, tools for topic, data tables, trending news for topic
**Technical:** SSG, Article/HowTo schema as appropriate

### Entity Pages (`/entity/{slug}`)
**Purpose:** Canonical reference page for any entity (brand, product, person, company, technology)
**Core Elements:** Entity overview, key facts (structured), pricing tables (where applicable), related entities network, latest news about entity, content about entity, affiliate links for entity
**Technical:** SSG, Product/Organization/Person schema, Wikidata sameAs markup

### Review Pages (`/review/{slug}`)
**Purpose:** In-depth product/service reviews with affiliate conversion intent
**Core Elements:** Summary box with score, pros/cons structured list, in-depth analysis sections, comparison with alternatives, affiliate CTA button (persistent), structured rating data, author disclosure
**Technical:** SSG, Product/Review schema with ratings, affiliate disclosure

### Comparison Pages (`/compare/{slug-vs-slug}`)
**Purpose:** High-commercial-intent comparison content optimized for buyer decision stage
**Core Elements:** Side-by-side comparison table, winner recommendation, feature-by-feature analysis, pricing comparison, use case recommendations, affiliate CTAs for both products
**Technical:** SSG, Table schema, comparison structured data

### Deal Pages (`/deals/{slug}`) *(NEW)*
**Purpose:** Timely deal content capturing commercial search intent
**Core Elements:** Deal summary with discount/price, expiry indicator, verification status, product context, affiliate link, related deals
**Technical:** SSG with revalidation (deals expire), Offer schema

### News Pages (`/news/{slug}`)
**Purpose:** News content for freshness signals and trending topic capture
**Core Elements:** News article with entity tags, related coverage links, journalist/author byline, date prominent, entity sidebar, related affiliate opportunities, share mechanisms
**Technical:** SSG + ISR (Incremental Static Regeneration), NewsArticle schema

### Glossary Pages (`/glossary/{slug}`) *(NEW)*
**Purpose:** Capture definitional searches, establish authority, serve AI retrievers
**Core Elements:** Term definition (structured), related terms network, examples, industry context, content using this term
**Technical:** SSG, DefinedTerm schema, speakable for voice/AI

### Directory Pages (`/directory/{slug}`) *(NEW)*
**Purpose:** Structured database pages — highest value density content type
**Core Elements:** Filterable/sortable data table, search widget, comparison constructor, individual entity cards with key specs, export options (CSV), affiliate integration per row
**Technical:** SSG + Client-side filtering JS, Dataset schema, interactive widgets

### Tool Pages (`/tools/{slug}`) *(NEW)*
**Purpose:** Utility content with high engagement, recurring traffic, and lead generation
**Core Elements:** Interactive tool interface (calculator, configurator, finder), input forms, results display, explain results section, related content, email-gate for advanced features, affiliate context
**Technical:** SSR or client-side, SoftwareApplication schema

### Author Pages (`/author/{slug}`)
**Purpose:** E-E-A-T signals, author authority, trust-building
**Core Elements:** Author bio, expertise areas, credentials, published articles list, social proof, contact/newsletter
**Technical:** SSG, Person schema, sameAs for social profiles

### Newsletter Pages (`/newsletter/{slug}`) *(NEW)*
**Purpose:** Newsletter landing pages for specific list segments
**Core Elements:** Value proposition, sample issues preview, subscriber count social proof, subscribe form, recent issues archive
**Technical:** SSG, Newsletter schema

### Search Pages (`/search`)
**Purpose:** Internal search for content discovery, engagement retention
**Core Elements:** Search input, results with filters (by type, category, date, topic), entity results, content results, related suggestions
**Technical:** Client-side with API, fast typeahead

### Programmatic Pages (`/[taxonomy]/[slug]`) *(NEW)*
**Purpose:** Scalable structured content pages generated from database entities
**Core Elements:** Dynamically populated from entity database, structured data, comparison widgets, affiliate integration, internal linking mesh
**Technical:** SSG with database-driven generation at build time, massive scale (1,000s of pages)

### Landing Pages (`/lp/{slug}`) *(NEW)*
**Purpose:** Conversion-optimized pages for specific affiliate programs or lead campaigns
**Core Elements:** Benefit-focused hero, social proof, feature breakdown, CTA prominent, FAQ, trust signals, affiliate/lead CTA
**Technical:** SSG, custom layout, conversion tracking

### Partner Pages (`/partner/{slug}`) *(NEW)*
**Purpose:** Sponsor disclosure and partner portal for brands
**Core Elements:** Sponsor content with clear disclosure, brand integration, performance portal link
**Technical:** SSG, Sponsor disclosure markup

---

# DELIVERABLE 5 — DATA ARCHITECTURE MASTERPLAN

## 5.1 Eight-Layer Data Architecture

```
LAYER 1: RAW LAYER
  Purpose: Unprocessed external data
  Retention: 30 days (storage optimization)
  Tables: raw_feed_items, raw_serp_results, raw_crawl_content, raw_webhook_events
  Growth: ~500MB/month at scale; rotated aggressively

LAYER 2: ACQUISITION LAYER
  Purpose: Parsed, normalized, deduplicated
  Retention: 90 days
  Tables: signals, feed_sources, crawled_pages, serp_snapshots, sitemap_entries
  Growth: ~100MB/month retained

LAYER 3: PROCESSING LAYER
  Purpose: Enriched with entities, topics, embeddings
  Retention: Indefinite (core knowledge)
  Tables: enriched_signals, entities, entity_mentions, topics, entity_embeddings
  Growth: ~200MB/month; vectors dominate (1536-dim per entity)

LAYER 4: KNOWLEDGE LAYER
  Purpose: Graph structure — nodes, edges, clusters
  Retention: Indefinite; weights decay over time
  Tables: graph_nodes, graph_edges, knowledge_clusters, entity_properties
  Growth: ~50MB/month; dense but bounded by unique entities

LAYER 5: INTELLIGENCE LAYER
  Purpose: Computed scores, opportunity analysis
  Retention: Rolling 12 months; older replaced by new computations
  Tables: keyword_intelligence, content_gaps, entity_intelligence, opportunity_scores
  Growth: ~30MB/month

LAYER 6: PREDICTION/LEARNING LAYER
  Purpose: The learning dataset — single most valuable data asset
  Retention: PERMANENT (Rank 01 dataset per Master Constitution)
  Tables: predictions, observations, learning_signals, calibration_models, experiments
  Growth: ~10MB/month; small but irreplaceable

LAYER 7: REVENUE LAYER
  Purpose: All revenue events and attribution chains
  Retention: PERMANENT (financial records)
  Tables: revenue_events, revenue_attribution, affiliate_links, affiliate_commissions, ad_revenue, sponsor_deals
  Growth: ~5MB/month initially, scales with revenue

LAYER 8: OPERATIONAL/TELEMETRY LAYER
  Purpose: System health, cost tracking, agent logs
  Retention: 90 days rolling
  Tables: agent_tasks, agent_memory, operation_costs, system_alerts, dead_letter_queue, audit_logs
  Growth: ~50MB/month; rotated at 90 days
```

## 5.2 Canonical Entity Inventory (40+ Core Tables)

### Platform Layer
| Table | Purpose | RLS | Retention |
|-------|---------|-----|-----------|
| `organizations` | Multi-tenant root | No (root) | Permanent |
| `org_members` | Org membership | Yes | Permanent |
| `users` | Extended user profiles | Yes | Permanent |
| `roles` | Role definitions | Yes | Permanent |
| `invitations` | Pending invitations | Yes | 30 days post-accept |
| `organization_secrets` | Encrypted API keys (Vault) | Yes | Active only |

### Media Layer
| Table | Purpose | RLS | Retention |
|-------|---------|-----|-----------|
| `sites` | Managed sites | Yes | Permanent |
| `site_categories` | Content taxonomy | Yes | Permanent |
| `authors` | Author profiles | Yes | Permanent |
| `media_assets` | Images, files, tools | Yes | Per retention policy |

### Discovery Layer
| Table | Purpose | RLS | Retention |
|-------|---------|-----|-----------|
| `feed_sources` | RSS/Atom feed registry | Yes | Active |
| `raw_feed_items` | Unprocessed feed items | Yes | 30 days |
| `signals` | Enriched intelligence signals | Yes | 90 days |
| `serp_snapshots` | SERP result snapshots | Yes | 90 days |
| `competitor_content` | Monitored competitor pages | Yes | 90 days |

### Knowledge Layer
| Table | Purpose | RLS | Retention |
|-------|---------|-----|-----------|
| `entities` | Entity registry | Yes | Permanent |
| `graph_nodes` | Knowledge graph nodes | Yes | Permanent |
| `graph_edges` | Knowledge graph edges | Yes | Permanent |
| `entity_properties` | Flexible entity attributes | Yes | Permanent |

### Content Layer
| Table | Purpose | RLS | Retention |
|-------|---------|-----|-----------|
| `content_plans` | Editorial calendar items | Yes | Permanent |
| `content_briefs` | Generation briefs | Yes | Permanent |
| `content_assets` | Content asset registry | Yes | Permanent |
| `content_versions` | Versioned content snapshots | Yes | 12 versions/asset |
| `prompt_templates` | AI prompt library | Yes | Version history |
| `content_refresh_jobs` | Refresh queue | Yes | 90 days |

### Audience Layer *(NEW)*
| Table | Purpose | RLS | Retention |
|-------|---------|-----|-----------|
| `subscribers` | Newsletter subscribers | Yes | Until unsubscribed |
| `subscriber_segments` | Audience segments | Yes | Active |
| `leads` | Captured leads | Yes | 24 months |
| `consent_records` | GDPR/CCPA consent | Yes | 7 years (legal) |
| `funnel_events` | Audience funnel tracking | Yes | 12 months |

### Revenue Layer
| Table | Purpose | RLS | Retention |
|-------|---------|-----|-----------|
| `affiliate_programs` | Affiliate program registry | Yes | Active |
| `affiliate_links` | Individual tracked links | Yes | Permanent |
| `revenue_events` | All revenue events | Yes | Permanent (financial) |
| `revenue_attribution` | Attribution chains | Yes | Permanent |
| `sponsor_deals` | Direct sponsor agreements | Yes | Permanent |
| `lead_captures` | Individual lead records | Yes | 24 months |

### Learning Layer
| Table | Purpose | RLS | Retention |
|-------|---------|-----|-----------|
| `predictions` | All predictions | Yes | PERMANENT |
| `observations` | Prediction outcomes | Yes | PERMANENT |
| `learning_signals` | Extracted signals | Yes | PERMANENT |
| `calibration_models` | Calibration parameters | Yes | Version history |
| `experiments` | A/B experiments | Yes | Permanent |

### Agent/Operational Layer
| Table | Purpose | RLS | Retention |
|-------|---------|-----|-----------|
| `agent_tasks` | Task execution log | Yes | 90 days |
| `agent_memory` | Agent memory store | Yes | Configurable TTL |
| `operation_costs` | AI cost tracking | Yes | 90 days |
| `system_alerts` | Operational alerts | Yes | 30 days |
| `dead_letter_queue` | Failed jobs | Yes | 30 days |
| `audit_logs` | Security audit trail | Yes | 7 years |

## 5.3 Embedding Dimension Resolution

*Inconsistency found: v2.0/P2 specifies 1536-dim; v2.0/P2 also mentions "768 dimensions, upgrade to 1536". v2.1 specifies 512-dim for Phase 1.*

**Canonical Resolution:**
- **Phase 1**: `text-embedding-004` at 768 dimensions (Google's optimal dimension, best quality/cost ratio)
- **Phase 2+**: Upgrade to 1536 dimensions with full re-embedding job
- **Storage optimization**: Use `vector(768)` columns; migrate with zero-downtime strategy when upgrading

## 5.4 Partitioning Strategy

```sql
-- Partition agent_tasks by month (high-volume telemetry)
CREATE TABLE agent_tasks PARTITION BY RANGE (created_at);
CREATE TABLE agent_tasks_2026_01 PARTITION OF agent_tasks
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Partition revenue_events by month (reporting)
CREATE TABLE revenue_events PARTITION BY RANGE (event_at);

-- Auto-partition via pg_partman (Supabase compatible)
```

## 5.5 Growth Model

| Timeframe | Database Size | Vector Rows | Key Driver |
|-----------|-------------|-------------|------------|
| Month 1 | 50MB | 1,000 | Initial setup |
| Month 3 | 150MB | 5,000 | Active discovery |
| Month 6 | 300MB | 15,000 | Content + entities |
| Month 12 | 500MB | 40,000 | Approaching Supabase free limit |
| Month 18 | 2GB | 100,000 | Pro tier required |

---

# DELIVERABLE 6 — REVENUE ARCHITECTURE

## 6.1 Eleven Revenue Streams (Canonical)

| Stream | Phase | Automation Level | Value Density | Expected RPM Range |
|--------|-------|-----------------|---------------|-------------------|
| 1. Affiliate Marketing | 1 | Full | High | $20–$80 |
| 2. Programmatic Ads | 2 | Full | Low-Medium | $5–$40 |
| 3. Direct Sponsorships | 2 | Semi-auto | Very High | $100–$500/placement |
| 4. Lead Generation | 2 | Full | Very High | $5–$200/lead |
| 5. Digital Products | 2 | Full | High | $10–$200/sale |
| 6. Premium Memberships | 3 | Semi-auto | High | $10–$50/month/member |
| 7. SaaS Micro-tools | 3 | Full | Very High | $5–$30/month/user |
| 8. Research Syndication | 3 | Semi-auto | Extreme | $500–$5,000/report |
| 9. Knowledge Graph Licensing | 4 | Full | Extreme | Custom enterprise |
| 10. Platform SaaS | 3 | Full | Extreme | $99–$999/month/tenant |
| 11. Engine Franchising | 4 | Semi-auto | Extreme | Setup fee + royalty |

## 6.2 Six Revenue Engines

### Affiliate Engine
```
Registration → Program Validation → Link Generation →
Content Insertion → Click Tracking → Conversion Webhook →
Commission Sync → Attribution → Learning Signal
```
- Auto-detect opportunities in content during generation
- Nightly link health checks (HEAD requests)
- Weekly EPC benchmarking across programs
- Automatic replacement suggestion for dead links

### Ads Engine
- Phase 1: Google AdSense (fallback, always available)
- Phase 2: Ezoic (programmatic optimization, lower traffic threshold)
- Phase 2+: Mediavine/Raptive (premium, requires 50K+ sessions/month)
- Ad placement intelligence: optimal density × position × content type
- RPM tracking per content asset per day (PostHog + ad network sync)

### Sponsor Engine
```
Performance Threshold Detection (>5K sessions/month) →
Sponsor Category Matching (topic overlap) →
Media Kit Auto-Generation (audience data + traffic stats) →
Outreach Sequence Trigger (agent-driven email) →
Deal Documentation → Placement Activation →
Performance Reporting Portal (sponsor self-serve)
```

### Lead Engine
- Lead magnets: contextual PDF generation from knowledge graph data
- Form injection: targeted forms based on content topic and audience intent signal
- Lead scoring: behavioral + demographic scoring
- Routing: webhook delivery to buyer or CRM integration
- Lead value: $5–$200 per qualified lead depending on niche

### Attribution Engine
```
Revenue Event Received (webhook/API) →
Session Lookup (PostHog) →
Pageview Chain Retrieved →
Content Asset Mapping →
Attribution Model Applied (last-touch default) →
Revenue Credit Distributed →
RPM Updated per Asset →
Learning Signal Generated
```

### Revenue Intelligence Engine
- Daily forecast update (rolling 30/60/90-day projections)
- Anomaly detection (>25% day-over-day drop triggers alert)
- Opportunity signals (high-traffic/low-monetization content flagged)
- Revenue graph updates (entity nodes reinforced by attribution data)
- Monthly revenue forecast vs actual comparison report

## 6.3 Complete Revenue Loops

**Loop 1: Content → Traffic → Affiliate → Learning**
```
Brief Created (affiliate opportunity embedded) →
Content Generated with affiliate links →
Content Published →
Traffic Arrives (organic/AI search) →
Affiliate Click (tracked) →
Conversion (webhook from network) →
Revenue Event Created →
Attribution to Content Asset →
RPM Score Updated →
Prediction Resolved →
Learning Signal: "keyword X + affiliate Y = $Z EPC" →
Future briefs for keyword X automatically include program Y
```

**Loop 2: Entity → Knowledge → Opportunity → Revenue**
```
Entity Ingested (from signal or research) →
Entity Revenue Score Computed (affiliate programs matched) →
Graph Node Created with revenue_score →
Gap Detection: entity has no content coverage →
Opportunity Alert Generated →
Content Plan Item Created →
Brief Generated (entity-focused, affiliate pre-populated) →
Content Published →
Revenue Generated →
Revenue Graph Edge Reinforced →
Entity revenue_score increased →
More content opportunities surfaced for same entity cluster
```

**Loop 3: Sponsor Discovery → Deal → Performance**
```
Content Performance Threshold Met →
Sponsor Opportunity Detected (topic × advertiser overlap) →
Media Kit Generated (auto) →
Outreach Email Sent (agent) →
Deal Negotiated (human-in-loop) →
Placement Activated across entity-tagged content →
Sponsor Attribution Portal Created →
Performance Data Synced to Portal →
Deal Renewal Triggered at expiry →
Deal Value Learning Signal Generated
```

---

# DELIVERABLE 7 — AI & LEARNING ARCHITECTURE

## 7.1 Agent Fleet (7 Canonical Agents)

*Resolves gap: v2.0/v2.1 define 5 agents. 2 additional agents required for complete system.*

| Agent ID | Name | Primary Function | Trigger | Cost Budget/Run |
|----------|------|-----------------|---------|----------------|
| AGENT-001 | Research Agent | Deep research synthesis | On-demand, scheduled, event | $0.50 |
| AGENT-002 | Content Pipeline Agent | Brief → Publish workflow | Scheduled, queue-based | $0.30 |
| AGENT-003 | Affiliate Intelligence Agent | Link optimization, dead link detection | Weekly + on-publish | $0.10 |
| AGENT-004 | Discovery Agent | Feed monitoring, trend detection | Every 15min (batched hourly) | $0.05 |
| AGENT-005 | Learning Agent | Prediction observation, calibration | Daily 2am | $0.20 |
| AGENT-006 | **Audience Agent** *(NEW)* | Newsletter curation, segment analysis | Weekly | $0.15 |
| AGENT-007 | **SEO Intelligence Agent** *(NEW)* | Ranking monitoring, internal link optimization | Weekly | $0.20 |

### AGENT-006: Audience Agent *(NEW)*
**Capabilities:** Newsletter content curation, subscriber segment analysis, lead scoring, churn detection
**LangGraph Nodes:** `segmentSubscribers` → `curateNewsletterContent` → `scoreLeads` → `detectChurn` → `generateInsights`
**Memory:** Episodic (past newsletters), Semantic (content preferences per segment)
**Governance:** Max 1,000 emails/run, requires human approval for sends

### AGENT-007: SEO Intelligence Agent *(NEW)*
**Capabilities:** Ranking position monitoring, internal link gap detection, schema validation, Core Web Vitals monitoring, competitor publishing velocity tracking
**LangGraph Nodes:** `checkRankings` → `auditInternalLinks` → `validateSchema` → `checkCWV` → `generateSEOReport`
**Memory:** Procedural (ranking history per keyword)
**Governance:** Max 100 SERP checks per run, max cost $0.20

## 7.2 Four-Tier Memory Architecture

```
TIER 1: WORKING MEMORY (in-session)
  Storage: Upstash Redis
  TTL: Session duration (max 24 hours)
  Content: Current task state, intermediate results, partial computations
  Access: Immediate (<5ms latency)

TIER 2: EPISODIC MEMORY (recent history)
  Storage: Supabase agent_memory table with vector embedding
  TTL: Configurable per agent (default 90 days)
  Content: Past research sessions, past actions, what worked/failed
  Access: Semantic search (~50ms)

TIER 3: SEMANTIC MEMORY (persistent facts)
  Storage: Knowledge Graph (graph_nodes + embeddings)
  TTL: Permanent (decay applied to confidence)
  Content: Facts extracted, entity relationships, learned patterns
  Access: Graph query + vector search (~100ms)

TIER 4: PROCEDURAL MEMORY (learned workflows)
  Storage: Supabase agent_memory table (procedural type)
  TTL: Permanent
  Content: Optimal sequences for recurring tasks, site-specific publishing workflows, brand voice patterns
  Access: Retrieval by task type + context
```

## 7.3 Eight-Component Learning System

```
1. PREDICTION ENGINE
   Before any action → record expected outcome + confidence
   Auto-prediction for: content publishing, brief creation, affiliate insertion

2. OBSERVATION ENGINE
   After action window → measure actual outcome from 4 sources:
   - PostHog (traffic observations)
   - Revenue Events table (revenue observations)
   - SERP Check (ranking observations)
   - Quality Scorer (quality observations)

3. DELTA ENGINE
   delta = actual_value - predicted_value
   error_pct = abs(delta) / predicted_value

4. LEARNING SIGNAL ENGINE
   When error_pct > 15%: extract structured learning signal
   Feature vector: [content_type, keyword_difficulty, site_authority, topic_cluster, affiliate_density]
   Correlation: feature_vector → outcome → error_direction

5. CONFIDENCE ENGINE (Platt Scaling)
   Weekly calibration run (90-day rolling window)
   calibrated_conf = sigmoid(a × raw_conf + b)
   Target: ECE < 0.05

6. REWARD ENGINE
   Positive reward: prediction_error < 5%, revenue_attributed > $0
   Negative reward: prediction_error > 30%, content_removed_or_penalized
   Reward shapes future agent decision weights

7. COUNTERFACTUAL ENGINE
   "What if" analysis on resolved predictions
   Surfaces alternative decisions that would have performed better
   Displayed in Learning Center as actionable insights

8. META LEARNING ENGINE
   Monthly: evaluates the learning system's own accuracy
   Detects data drift, identifies domains with highest calibration error
   Recommends observation window adjustments
```

## 7.4 How the System Improves Over Time

```
CYCLE 1 (Month 0-1): Baseline
  - System makes predictions with low confidence (0.5-0.6)
  - Observations resolve predictions with high error rates (~40%)
  - Learning signals start populating

CYCLE 2 (Month 1-3): Pattern Recognition
  - Feature-outcome correlations emerge
  - Confidence calibration runs, ECE improves to ~0.15
  - Prediction accuracy improves to ~70%
  - Agent prompts begin auto-optimization (DSPy, Phase 2)

CYCLE 3 (Month 3-6): Intelligence Accumulation
  - Knowledge graph entity count exceeds 1,000
  - Revenue graph reinforces high-value entity clusters
  - Prediction accuracy ~80%, ECE < 0.08
  - Counterfactual engine surfacing valuable alternative paths

CYCLE 4 (Month 6-12): Self-Optimization
  - System identifies highest-value content patterns autonomously
  - Agent decision quality measurably improves (lower human intervention rate)
  - Prediction accuracy approaching 85%, ECE < 0.05
  - Revenue compound growth begins (compounding knowledge graph value)

CYCLE N (Ongoing): Compound Intelligence
  - Each new piece of content trains future content decisions
  - Each revenue event reinforces knowledge graph weights
  - Each calibration cycle improves confidence accuracy
  - System becomes progressively more autonomous and more accurate
```

---

# DELIVERABLE 8 — INFRASTRUCTURE BLUEPRINT

## 8.1 Hosting Architecture (Free-Tier First)

### Frontend: Vercel
- **Plan**: Hobby (free) → Pro ($20/month at scale)
- **Usage**: Next.js 15 App Router deployment
- **Free limits**: 100GB bandwidth, unlimited deployments
- **Public sites**: Deployed as separate Vercel projects (SSG/ISR)
- **Migration path**: Vercel Pro at Month 3; Enterprise when SaaS launched

### Backend API: Fly.io
- **Plan**: Free tier (3 shared-CPU VMs, 256MB RAM each)
- **Usage**: FastAPI Docker container
- **Free limits**: 3 machines, 160GB outbound bandwidth
- **Scaling**: Fly.io Pro at ~$7/month when needed
- **Alternative**: Railway ($5/month, simpler DX)

### Database: Supabase
- **Plan**: Free (500MB, 50MB file storage, 50K MAU)
- **Usage**: PostgreSQL 15 + pgvector + RLS
- **Critical**: Monitor storage from Day 1; 500MB reached at ~Month 12
- **Migration path**: Supabase Pro ($25/month) at ~450MB
- **Backup**: Supabase daily backups (free plan: 7 days)

### Cache: Upstash Redis
- **Plan**: Free (10,000 requests/day, 256MB)
- **Usage**: Agent working memory, SERP result caching, dashboard metrics
- **Free limits sufficient for**: Phase 1-2; upgrade at Phase 3

### Queue: Trigger.dev
- **Plan**: Free (50,000 task runs/month)
- **CRITICAL CONSTRAINT**: Feed polling at 15min × 24h × 30d = 2,880 runs for 1 feed source. At 10 feed sources = 28,800 runs. Keep feed sources ≤ 15 on free tier.
- **Solution**: Batch all feed sources into 1 hourly job = 720 runs/month

### Storage: Supabase Storage
- **Plan**: Free (1GB)
- **Usage**: Media assets, generated files, crawl cache
- **Alternative**: Cloudflare R2 (10GB free, zero egress cost)

### Analytics: PostHog
- **Plan**: Cloud free (1M events/month)
- **Usage**: User behavior tracking on all public sites + internal OS
- **Deployment**: PostHog JS snippet on all sites; server-side events for revenue

### Error Tracking: Sentry
- **Plan**: Free (5K errors/month, 1 team member)
- **Usage**: Both Next.js frontend and FastAPI backend
- **Upgrade path**: Team plan ($26/month) when team grows

### Crawler: Crawl4AI
- **Plan**: Self-hosted (open source, free)
- **Hosting**: Fly.io container (within free tier)
- **Fallback**: Firecrawl cloud (free 500 pages/month)

### DNS / CDN / WAF: Cloudflare
- **Plan**: Free
- **Usage**: DNS, SSL, DDoS protection, caching for public sites, R2 storage
- **Worker**: Cloudflare Workers for link shortener (`/go/{code}`) — 100K requests/day free

### AI Providers
- **Gemini API**: Free tier (60 RPM Gemini Flash, 2 RPM Gemini Pro); upgrade to Tier 1 at ~$10/month spend
- **Groq**: Free tier (30 RPM, 6K TPM for extraction tasks)
- **OpenRouter**: Pay-per-token fallback (no free tier, ~$0.001/1K tokens average)

## 8.2 Network Architecture

```
INTERNET
    ↓
Cloudflare (DNS + WAF + DDoS + CDN)
    ↓
  ┌─────────────────────────────────────────┐
  │  Vercel Edge Network                    │
  │  ├── /app.simis.io → SIMIS Dashboard    │
  │  └── /site.com → Public Media Sites     │
  └─────────────────────────────────────────┘
    ↓ API calls
  ┌─────────────────────────────────────────┐
  │  Fly.io (FastAPI Container)             │
  │  ├── /api → REST API                   │
  │  ├── /agents → Agent task endpoints     │
  │  └── /webhooks → Revenue webhooks       │
  └─────────────────────────────────────────┘
    ↓ DB + Storage
  ┌─────────────────────────────────────────┐
  │  Supabase (Managed PostgreSQL)          │
  │  ├── PostgreSQL + pgvector + RLS        │
  │  ├── Supabase Auth (JWT)                │
  │  ├── Supabase Realtime (WebSockets)     │
  │  └── Supabase Storage (objects)         │
  └─────────────────────────────────────────┘
    ↓ Background jobs
  ┌─────────────────────────────────────────┐
  │  Trigger.dev (Job Queue)                │
  │  ├── Scheduled: feed ingestion, learning│
  │  └── Event-triggered: enrichment, gen   │
  └─────────────────────────────────────────┘
```

## 8.3 CDN & Caching Strategy

| Layer | Technology | Cache TTL | Content |
|-------|-----------|----------|---------|
| L1 | Cloudflare CDN | 24h–7d | Static HTML, images, CSS, JS |
| L2 | Vercel Edge Cache | 60s–1h | ISR pages (news, deals) |
| L3 | Upstash Redis | 5min–24h | SERP data, entity profiles, dashboard metrics |
| L4 | Next.js `unstable_cache` | 60s | Dashboard widget data |
| L5 | Browser cache | 1h–7d | Static assets (hashed filenames) |

**Cache invalidation:**
- On content publish: purge Cloudflare page cache for that URL
- On entity update: purge all entity-related cached pages
- On SERP refresh: invalidate Redis SERP cache for keyword

## 8.4 Search Engine Optimization Architecture *(SEO/AEO/GEO)*

### Technical SEO Foundation
- Core Web Vitals targets: LCP < 1.5s, INP < 200ms, CLS < 0.1
- All public pages: SSG with JSON-LD schema
- Structured data per page type (per Deliverable 4.2)
- XML sitemap auto-generated and updated on each publish
- robots.txt managed via Site Manager

### AEO (Answer Engine Optimization)
- Every entity page: Claim-Evidence-Citation structure
- Speakable markup for voice/AI question answering
- FAQ schema on review and comparison pages
- Direct answer blocks at top of articles

### GEO (Generative Engine Optimization)
- Rich JSON-LD on all entity pages with `sameAs` Wikidata URIs
- High entity density per page (minimum 5 named entities per article)
- Factual claim density with source citations (Citation Rule from Master Constitution)
- Structured data readable by AI crawlers (Perplexity, Gemini, ChatGPT Search)
- Information freshness signals (explicit dates, update timestamps)

## 8.5 Monitoring Strategy

| Metric Category | Tool | Alert Threshold | Runbook |
|----------------|------|----------------|---------|
| Error rate | Sentry | >1% error rate | Runbook-001 |
| API latency | OpenTelemetry | P95 > 3s | Runbook-002 |
| DB storage | Supabase Dashboard | >400MB | Runbook-003 |
| AI cost | operation_costs table | >$5/day | Runbook-004 |
| Job queue | Trigger.dev | DLQ > 10 items | Runbook-005 |
| Revenue anomaly | Revenue Intelligence | >25% drop | Runbook-006 |
| Prediction accuracy | Learning Center | ECE > 0.15 | Runbook-007 |

## 8.6 Disaster Recovery

| Scenario | RTO | RPO | Recovery Procedure |
|----------|-----|-----|--------------------|
| Supabase outage | 30min | 1hr | Fail to read-only mode; restore from daily backup |
| Vercel outage | 10min | 0 | Redeploy to Cloudflare Pages (pre-built static) |
| Fly.io outage | 15min | 5min | Redeploy API to Railway (Docker image maintained) |
| AI provider outage | 0 | 0 | Automatic fallback chain (Gemini → Groq → OpenRouter) |
| Trigger.dev outage | 30min | 1hr | Manual job execution via FastAPI admin endpoints |

**Backup strategy:**
- Supabase: Automated daily backups (7-day retention on free, 30-day on Pro)
- Code: GitHub (always current)
- Media: Cloudflare R2 (geo-replicated)
- Manual: Monthly `pg_dump` to Supabase Storage for long-term retention

## 8.7 Cost Model (Phase 1 Free-Tier Budget)

| Service | Free Tier | Expected Usage | Cost at MVP | Cost at $1K MRR |
|---------|----------|---------------|-------------|----------------|
| Supabase | 500MB | ~150MB/month | $0 | $25/month (Pro) |
| Vercel | 100GB bandwidth | ~5GB/month | $0 | $0 |
| Fly.io | 3 VMs | 2 VMs | $0 | $0-7/month |
| Upstash Redis | 10K req/day | ~3K req/day | $0 | $0 |
| Trigger.dev | 50K runs/month | ~5K runs/month | $0 | $0 |
| Gemini API | 60 RPM Flash | ~20 RPM avg | $0 | ~$5/month |
| Groq | 30 RPM | ~15 RPM avg | $0 | $0 |
| PostHog | 1M events | ~100K events | $0 | $0 |
| Cloudflare | Free plan | Standard | $0 | $0 |
| Sentry | 5K errors | <1K errors | $0 | $0 |
| **TOTAL** | | | **$0** | **~$30-37/month** |

**5% compute:revenue rule** (Master Constitution): At $1,000 MRR, compute budget = $50. We operate at $37. ✅

---

# DELIVERABLE 9 — MULTI-PHASE IMPLEMENTATION MASTERPLAN

> [!NOTE]
> Phases replace sprints at the macro planning level. Each phase will be broken into sprints during execution. No phase should begin without completing the preceding phase's success criteria.

## Phase 0: Constitutional Preparation (Pre-Development, Week 0)

**Goals:** Everything that must exist before the first line of code is written.

**Activities:**
- Niche selection (single niche commitment — Master Constitution mandate)
- Domain registration (Cloudflare Registrar)
- Account creation: Supabase, Vercel, Fly.io, GitHub, Gemini API, Groq, Trigger.dev, PostHog, Sentry
- Keyword seed list creation (minimum 50 target keywords)
- Affiliate program research (identify 3–5 programs to register for)
- Brand identity: name, color palette, typography
- Competitor analysis: identify top 5 competitors in niche

**Success Criteria:**
- [ ] Niche confirmed and documented
- [ ] Domain registered and pointed to Cloudflare
- [ ] All accounts created and free tiers confirmed
- [ ] GitHub org/repo created
- [ ] Affiliate applications submitted (takes 1–2 weeks for approval)

---

## Phase 1: Foundation (Weeks 1–2)

**Goals:** System authenticates, stores data, API alive, dashboard shell deployed.

**Capabilities Unlocked:** Login, organization creation, site creation, basic dashboard shell

**Required Systems:** Supabase Auth, PostgreSQL (migration 001), FastAPI skeleton, Next.js dashboard shell, Vercel deployment

**Required Pages:** Login, Dashboard (shell), Settings, Site Manager

**Required APIs:** Auth endpoints, Organization CRUD, Site CRUD, Health check

**Required Infrastructure:** Supabase project, Vercel project, Fly.io API deployment, GitHub Actions CI

**Dependencies:** Phase 0 complete, all accounts created

**Risks:** Supabase free tier storage limit planning not established; migration schema errors

**Success Criteria:**
- [ ] Login with email/Google OAuth works
- [ ] Organization and site creation flow complete
- [ ] Dashboard loads in < 2s
- [ ] API `/health` returns 200
- [ ] Deployed to production URLs
- [ ] Cost monitoring table live (operation_costs)
- [ ] `.agent/` context files in repository

---

## Phase 2: Discovery Engine (Weeks 3–4)

**Goals:** The system begins ingesting intelligence from the real world.

**Capabilities Unlocked:** RSS/Atom feed ingestion, signal enrichment, signal stream in Discovery Hub, SERP fetching, basic entity extraction

**Required Systems:** Trigger.dev (feed ingestion job), Crawl4AI deployment, Groq entity extraction, pgvector enabled, signal enrichment pipeline

**Required Pages:** Discovery Hub, Feed Manager, Source Manager, SERP Intelligence (basic)

**Required APIs:** `/v1/signals`, `/v1/feed-sources`, `/v1/serp/{keyword}`, `/v1/entities` (basic)

**Required Infrastructure:** Trigger.dev project, Crawl4AI on Fly.io, Groq API key

**Dependencies:** Phase 1 complete, Crawl4AI running

**Risks:** Trigger.dev job count limits (must use hourly batches); Groq rate limits during enrichment bursts

**Success Criteria:**
- [ ] 5+ feed sources ingesting automatically
- [ ] Signals appearing in Discovery Hub within 2 hours of publication
- [ ] Entity extraction running on all new signals
- [ ] SERP data fetchable for any keyword
- [ ] Zero cost overruns (operation_costs table monitored)

---

## Phase 3: Knowledge Graph (Weeks 5–6)

**Goals:** The system builds its first entity graph and surfaces intelligence from accumulated knowledge.

**Capabilities Unlocked:** Entity registry full CRUD, graph node/edge creation, semantic entity search (pgvector), content gap detection, entity profile pages, knowledge graph visualization

**Required Systems:** pgvector with entity embeddings, Google text-embedding-004, graph query service, gap analysis queries, D3/Cytoscape.js graph visualization

**Required Pages:** Knowledge Graph, Entity Registry, Entity Intelligence, Topic Map

**Required APIs:** `/v1/graph/*`, `/v1/entities/*` (complete), `/v1/graph/gaps`, `/v1/graph/opportunities`

**Dependencies:** Phase 2 complete, 100+ entities ingested from signal enrichment

**Risks:** Vector index performance with <1000 rows (low initially); embedding cost accumulation

**Success Criteria:**
- [ ] 500+ entities in registry with embeddings
- [ ] Graph visualization renders entity relationships
- [ ] Content gap query returns actionable results
- [ ] Entity semantic search returning relevant results
- [ ] Knowledge graph auto-populates from new signals

---

## Phase 4: Content Intelligence (Weeks 7–9)

**Goals:** The system can plan, brief, generate, and score content assets at production quality.

**Capabilities Unlocked:** Content planning (kanban + calendar), AI brief generation with SERP + entity + affiliate pre-population, Gemini content generation, quality scoring, content version history, prediction recording (first predictions!)

**Required Systems:** Content Planner, Brief Builder with SERP integration, Gemini API content generation, Quality scoring engine, PydanticAI structured outputs, Prediction Engine (first use)

**Required Pages:** Content Planner, Brief Builder, Content Generator, Content Editor, Prediction Center (basic)

**Required APIs:** `/v1/content/*` (complete), `/v1/predictions` (create)

**Dependencies:** Phase 3 complete, SERP Intelligence functional, affiliate programs registered

**Risks:** Gemini Pro rate limits (2 RPM free); brief generation latency (target < 30s)

**Success Criteria:**
- [ ] Brief generation with SERP + competitor analysis < 45 seconds
- [ ] Content generation producing quality score > 70 on first pass
- [ ] Predictions recorded for every content generation job
- [ ] Content versions stored correctly
- [ ] First 5 content assets in "approved" status

---

## Phase 5: Publishing & First Revenue (Weeks 10–12)

**Goals:** Content reaches the public. First affiliate revenue attributed. Learning loop closes for the first time.

**Capabilities Unlocked:** Publishing pipeline, affiliate link management, first public site live, PostHog analytics on public site, revenue event webhooks, attribution engine, first learning cycle

**Required Systems:** Static site generator (Astro or Next.js export), Cloudflare Pages/Vercel public site, Affiliate link redirect service (Cloudflare Worker), PostHog on public site, affiliate network webhooks, Observation Engine

**Required Pages (Public):** Homepage, Category pages, Article pages, Author pages — all with full schema markup
**Required Pages (Internal):** Affiliate Center, Revenue Center (basic), Learning Center (basic)

**Required APIs:** `/v1/revenue/*` (affiliate), `/v1/publish/*`, `/v1/observations` (first use)

**Dependencies:** Phase 4 complete, affiliate programs approved (applied in Phase 0), static site infrastructure

**Risks:** Affiliate program approval delays; webhook reliability; first revenue may be $0 (normal)

**Success Criteria:**
- [ ] Public site live with 10+ published articles
- [ ] PostHog tracking all page views
- [ ] Affiliate links tracked via Cloudflare Worker redirect
- [ ] First revenue event recorded (even $0.01)
- [ ] First prediction resolution (observation matches prediction)
- [ ] Attribution chain constructed for any revenue event

---

## Phase 6: Intelligence Deepening (Weeks 13–16)

**Goals:** Full SERP intelligence, competitor monitoring, content refresh engine, entity intelligence, Research Hub with Research Agent, first agents live.

**Capabilities Unlocked:** Deep SERP analysis, competitor content monitoring, Content Refresh Engine, Research Agent (AGENT-001), Discovery Agent fully autonomous (AGENT-004), entity enrichment from Wikidata/Wikipedia

**Required Systems:** ResearchAgent LangGraph graph, ContentRefreshEngine, competitor sitemap monitoring, Wikidata/Wikipedia API integration, LangGraph state persistence

**Required Pages:** Research Hub, SERP Intelligence (complete), Trend Intelligence, Competitor Intelligence, Entity Intelligence (complete), Agent Hub

**Dependencies:** Phase 5 complete, LangGraph installed, 30+ days of learning data

**Success Criteria:**
- [ ] Research Agent produces quality research sessions autonomously
- [ ] Competitor content monitoring alerting on new publications
- [ ] Content refresh queue identifying decay candidates
- [ ] 20+ published articles with performance data
- [ ] First learning signals showing prediction improvement

---

## Phase 7: Revenue Optimization & Audience (Weeks 17–24)

**Goals:** Multiple revenue streams active, newsletter audience building, sponsor engine engaged, full agent autonomy, content velocity at scale.

**Capabilities Unlocked:** Content Pipeline Agent (AGENT-002), Affiliate Intelligence Agent (AGENT-003), Audience Agent (AGENT-006), newsletter system, sponsor outreach pipeline, ads integration (Ezoic), digital products (basic), full prediction calibration running

**Required Systems:** Newsletter service (Resend), subscriber management, email automation, Ezoic integration, digital product delivery (Gumroad or self-hosted), sponsor outreach automation, DSPy prompt optimization (optional)

**Required Pages (Public):** Newsletter pages, Tool pages, Directory pages, Programmatic pages
**Required Pages (Internal):** Audience Hub, Newsletter Studio, Sponsor Center, Learning Center (complete), Experiment Center

**Dependencies:** Phase 6 complete, 1,000+ entities, 50+ content assets, PostHog tracking established

**Success Criteria:**
- [ ] $500+/month recurring revenue
- [ ] 3+ active affiliate programs
- [ ] Newsletter list > 200 subscribers
- [ ] Content Pipeline Agent running autonomously (human approves publish only)
- [ ] Sponsor outreach pipeline active
- [ ] Prediction accuracy improved vs Phase 5 baseline
- [ ] System demonstrably self-improving (measured by ECE improvement)

---

# DELIVERABLE 10 — AI IDE AGENT BUILD CONSTITUTION

## 10.1 Repository Structure

```
simis/
├── apps/
│   ├── web/                      # Next.js 15 — internal dashboard OS
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   └── (dashboard)/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   ├── api/                      # FastAPI — AI/agent backend
│   │   ├── routers/
│   │   ├── services/
│   │   ├── agents/
│   │   ├── models/
│   │   └── config/
│   └── site/                     # Astro or Next.js static — public media site
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── layouts/
│       │   └── content/
│       └── astro.config.mjs
│
├── packages/
│   ├── database/                 # Migrations, types, seed
│   │   ├── migrations/
│   │   │   ├── 001_foundation.sql
│   │   │   ├── 002_discovery.sql
│   │   │   └── ...
│   │   ├── types/                # Generated Supabase types
│   │   └── seed/
│   ├── shared-types/             # Shared TS interfaces
│   ├── ai-client/                # AI provider abstraction
│   │   ├── providers/
│   │   │   ├── gemini.ts
│   │   │   ├── groq.ts
│   │   │   └── openrouter.ts
│   │   ├── router.ts             # ModelRouter
│   │   ├── cost-tracker.ts
│   │   └── circuit-breaker.ts
│   ├── graph-client/             # Knowledge graph client
│   └── config/                   # Shared configs (eslint, ts, tailwind)
│
├── services/
│   ├── crawler/                  # Crawl4AI Docker service
│   └── enrichment/               # spaCy entity extraction service
│
├── agents/
│   ├── research/
│   ├── content-pipeline/
│   ├── affiliate-intelligence/
│   ├── discovery/
│   ├── learning/
│   ├── audience/                 # NEW
│   └── seo-intelligence/         # NEW
│
├── docs/
│   ├── constitution/             # All 5 constitutional documents
│   ├── adr/                      # Architecture Decision Records
│   │   └── ADR-001-template.md
│   └── runbooks/                 # Operational runbooks
│
├── scripts/
│   ├── seed-knowledge/           # Initial knowledge graph seeding
│   ├── migrate/                  # Migration runner scripts
│   └── validate/                 # Pre-deploy validation scripts
│
├── .agent/                       # AI IDE agent context system
│   ├── context.md                # System identity and constraints
│   ├── planning.md               # Feature planning decision tree
│   ├── self-audit.md             # Pre-commit checklist
│   ├── collaboration.md          # Multi-agent rules
│   ├── skills/
│   │   ├── create-new-feature.md
│   │   ├── create-migration.md
│   │   ├── create-agent.md
│   │   └── create-api-endpoint.md
│   ├── tasks/
│   │   └── TASK-{ID}-template.md
│   └── prompts/
│       └── production-prompts/
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                # Lint, test, type-check
│   │   ├── deploy-api.yml        # Deploy API to Fly.io
│   │   ├── deploy-web.yml        # Deploy to Vercel (automatic)
│   │   └── db-migrate.yml        # Run migrations
│   └── copilot-instructions.md   # GitHub Copilot/IDE agent context
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── CONSTITUTION.md               # Index and summary of all constitutional docs
└── .env.example
```

## 10.2 `.agent/` System Specification

### `.agent/context.md` (Full Specification)

```markdown
# SIMIS AI IDE Agent Context

## System Identity
SIMIS is an Autonomous Digital Asset Intelligence Engine (ADAI).
Current Phase: [PHASE_NUMBER]
Active Site: [SITE_DOMAIN]
Organization ID: [ORG_ID]

## The Five Non-Negotiables
Every code change must pass all five:
1. ✅ RLS enabled on all new tables
2. ✅ organization_id present on all new tables (except organizations)
3. ✅ Cost tracking on all AI API calls (operation_costs insert)
4. ✅ Error handling on all external calls (retry + circuit breaker)
5. ✅ No hardcoded API keys or credentials

## Constitutional References
When implementing a feature, always read the relevant section first:
- Discovery features → docs/constitution/02_P2.md Section 3.1
- Knowledge graph → docs/constitution/02_P2.md Section 5
- Content features → docs/constitution/02_P2.md Section 3.3
- Revenue features → docs/constitution/02_P2.md Section 3.4/8
- Learning system → docs/constitution/03_P3.md Section 7
- Agent patterns → docs/constitution/02_P2.md Section 6
- Error handling → docs/constitution/simis_v21_p1.md Section 3.5
- Database → docs/constitution/03_P3.md Section 9.4

## Architecture Decisions
- Single database: Supabase PostgreSQL (DO NOT add a second DB)
- All embeddings: Google text-embedding-004 at 768 dimensions
- Agent orchestration: LangGraph (DO NOT use CrewAI or AutoGen)
- Frontend state: TanStack Query (server) + Zustand (client) minimal
- All prompts: versioned in prompt_templates table, NOT hardcoded

## Cost Discipline
- Gemini Flash for: SERP analysis, entity extraction, briefs, scoring
- Gemini Pro for: full article generation, research synthesis ONLY
- Groq for: classification, extraction, fast ops
- Every AI call inserts a record to operation_costs table
- Daily AI cost alert threshold: $5.00 USD
```

### `.agent/self-audit.md` (Pre-Commit Checklist)

```markdown
# SIMIS Agent Self-Audit Checklist
## Run before every commit. Block commit if any CRITICAL item fails.

### CRITICAL (commit blocked if any fail)
- [ ] New tables have RLS enabled
- [ ] New tables have organization_id column
- [ ] External API calls have try/except + error handling
- [ ] No API keys or secrets in code
- [ ] AI calls insert to operation_costs
- [ ] New migrations are sequential and reversible

### IMPORTANT (flag for review if fail)
- [ ] New functions have type annotations (Python) or TypeScript types
- [ ] New API endpoints have auth middleware
- [ ] New agent tasks record to agent_tasks table
- [ ] Predictions recorded before significant agent actions
- [ ] Cache invalidation handled for cached data mutations

### RECOMMENDED
- [ ] Unit tests for new service functions
- [ ] Error messages are user-friendly (not raw exceptions)
- [ ] Logging includes organization_id and operation name
- [ ] New features have feature flag (PostHog)

### CONSTITUTIONAL COMPLIANCE
- [ ] Feature aligns with current Phase capabilities
- [ ] No new external database dependencies added
- [ ] Revenue attribution considered for new content features
- [ ] Learning signals considered for new decision points
```

## 10.3 Coding Standards

### Python (FastAPI/Agents)
- Python 3.12+, strict type annotations required
- PydanticAI for all AI interactions (type-safe structured outputs)
- `asyncio` throughout — no sync IO in async context
- SQLAlchemy 2.0 async for DB operations
- Naming: `snake_case` for everything, `PascalCase` for classes
- All service functions: `async def`, return Pydantic models
- Error handling: `with_retry()` wrapper on all external calls

### TypeScript (Next.js)
- Strict TypeScript (`"strict": true`)
- React Server Components by default; `"use client"` only when necessary
- TanStack Query for all server state
- Zod for all form validation and API response validation
- Naming: `camelCase` functions, `PascalCase` components, `kebab-case` files

### SQL (Migrations)
- Sequential numbered files: `001_foundation.sql`, `002_discovery.sql`
- Every table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- Every table: `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`
- Every table: `ALTER TABLE {name} ENABLE ROW LEVEL SECURITY`
- Index naming: `{table}_{columns}_{type}_idx`
- Never use `DROP TABLE` — use `ALTER TABLE` or soft deletes

## 10.4 Agent Collaboration Rules

1. **Single writer rule:** Only one agent may write to a content asset at a time. Acquire lock via `agent_tasks` status flag before starting.
2. **Organization scope:** Agents may only access data belonging to their assigned `organization_id`.
3. **Cost reporting:** Every agent task must update `agent_tasks.cost_usd` and `agent_tasks.token_usage` on completion.
4. **Governance before action:** Check governance policy before every task execution. Halt and create `approval_requests` record if policy requires human approval.
5. **Idempotency:** All agent operations must be safe to retry. Use `idempotency_key` pattern for operations with side effects.
6. **Dead letter handling:** Failed tasks after 3 retries go to `dead_letter_queue`. Never silently drop failures.
7. **Handoff protocol:** When one agent produces output for another agent, create a `domain_event` record. The consuming agent polls for its event type.

## 10.5 Agent Handoff Rules

```
ResearchAgent → KnowledgeGraph → ContentPipelineAgent
  Discovery:  SignalCreated event → enrichment → EntityDetected event → graph ingest
  Research:   ResearchCompleted event → KnowledgeImport → EntityCreated events
  Content:    BriefCreated event → ContentPipelineAgent task queued

ContentPipelineAgent → Publishing → RevenueContext → LearningContext
  Generation: ContentDraftGenerated → quality score → approval request (human or auto)
  Publish:    ContentPublished → PredictionCreated (traffic/revenue expected)
  Revenue:    AffiliateClickTracked → ConversionWebhook → RevenueAttributed
  Learning:   RevenueAttributed → ObservationCreated → PredictionResolved → LearningSignal

LearningAgent → All Other Agents
  Daily: LearningSignalBatch event → agents update their weights/confidence
  Weekly: CalibrationCompleted event → all prediction confidence scores recalibrated
```

---

# RESOLUTION LOG — Constitutional Inconsistencies

The following inconsistencies between source documents have been resolved:

| # | Inconsistency | Source 1 | Source 2 | Resolution |
|---|--------------|----------|----------|------------|
| 1 | Embedding dimensions | P2: "768, upgrade to 1536" | P2 schema: vector(1536) | **768 for Phase 1**, migrate to 1536 in Phase 2 |
| 2 | Principal discovery agent schedule | P2: "every 15 minutes" | v2.1: "batched hourly" | **Batched hourly** (free tier compliance) |
| 3 | Bounded context count | P1: 6 contexts | P3: 8+ contexts | **14 canonical bounded contexts** (this document) |
| 4 | Evolution phases | Master: 3 stages | P1: 5 phases | **4 Stages + 8 Implementation Phases** (this document) |
| 5 | Confidence encoding | P3: 0.5–0.95 scale | v2.1: different thresholds | **P3 scale is canonical** (more detailed) |
| 6 | Database mandatory | Master: "Supabase or Neon" | P1/v2.1: "Supabase only" | **Supabase only** (v2.1 supersedes Master) |
| 7 | Agent count | P2: 5 agents | Required: Research + Content + Affiliate + Discovery + Learning | **7 canonical agents** (+ Audience + SEO Intelligence) |
| 8 | Frontend framework | Master: "Astro or Next.js" | P3: "Next.js 15 only" | **Next.js for dashboard; Astro option for public site** |
| 9 | Public experience | All docs: implicit/absent | Required product | **Full public experience spec added** (Deliverable 4.2) |
| 10 | Audience/subscriber system | Master: mentioned briefly | P3: absent | **Full Audience Domain and BC-02 added** |

---

*End of SIMIS Complete Architecture Blueprint v3.0*
*This document is canonical. All prior planning documents are superseded.*
*Next step: Phase 0 validation → Phase 1 execution.*
