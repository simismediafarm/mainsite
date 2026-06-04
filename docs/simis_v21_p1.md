# SIMIS TECHNICAL CONSTITUTION PACKAGE
## Version 2.1 — Completed & Production-Ready
### Classification: Constitutional Law — Do Not Modify Without Full Review
### Supersedes: Version 2.0
### Authors: Principal Systems Architect, Technical Constitution Lead, Risk & Operations Strategist

---

> **Telah menginternalisasi ketiga dokumen Technical Constitution Package Version 2.0 secara lengkap dan melakukan gap analysis menyeluruh.**

---

# SECTION 0 — EXECUTIVE TECHNICAL SUMMARY & GAP ANALYSIS

## 0.1 Executive Summary

SIMIS Technical Constitution Package Version 2.1 adalah evolusi langsung dari Version 2.0 yang telah mature secara arsitektur namun memiliki **gap kritis** pada lapisan operasional, ekonomi, dan eksekusi. Version 2.0 sangat kuat pada visi, domain model, data schema, dan AI agent architecture. Version 2.1 melengkapi lapisan yang hilang tanpa mengubah satu pun prinsip konstitusional yang telah ditetapkan.

**Constitutional core tetap tidak berubah.** Semua tambahan bersifat additive — mengisi void yang ada antara arsitektur yang dideskripsikan dan realitas produksi yang harus dihadapi.

## 0.2 Gap Analysis — Perspektif Founder (Business & Operational)

| Gap | Severity | Impact | Status di v2.0 | Status di v2.1 |
|-----|----------|--------|----------------|----------------|
| Unit Economics & burn rate tidak terdefinisi | CRITICAL | Founder bisa kehabisan runway tanpa tahu | Tidak ada | Lengkap (Section 5) |
| Cost per asset / cost per operation tidak dihitung | CRITICAL | AI cost bisa membengkak tanpa kontrol | Tidak ada | Lengkap (Section 5) |
| 90-Day MVP plan terlalu high-level (sprint list saja) | HIGH | Tidak ada milestone + kill criteria | Sprint list saja | Detail per minggu (Section 6) |
| Kill/Pivot criteria tidak ada | HIGH | Kapan harus berhenti? Tidak diketahui | Tidak ada | Lengkap (Section 6.5) |
| Numeric KPI per phase tidak ada | HIGH | Success tidak measurable | Tidak ada | Lengkap (Section 6.3) |
| Risk Register tidak ada | HIGH | Risk tidak terdefinisi, tidak ada owner | Tidak ada | Lengkap (Section 3) |
| Exit criteria tidak ada | MEDIUM | Investor/partner perlu clarity | Tidak ada | Lengkap (Section 6.5) |

## 0.3 Gap Analysis — Perspektif Developer / Manager (Execution)

| Gap | Severity | Impact | Status di v2.0 | Status di v2.1 |
|-----|----------|--------|----------------|----------------|
| Error handling patterns tidak ada (retry, circuit breaker, DLQ) | CRITICAL | System tidak fault-tolerant di produksi | Implisit saja | Explicit patterns (Section 9.2) |
| Database migration strategy tidak ada | HIGH | Zero-downtime deploy tidak mungkin tanpa ini | Sequential files disebut saja | Full strategy (Section 8.3) |
| SLO/SLA tidak terdefinisi | HIGH | Tidak bisa tahu kalau system degraded | Tidak ada | Defined (Section 8.2) |
| Alerting & self-healing tidak ada | HIGH | Outage tidak terdeteksi otomatis | Tidak ada | Full alerting (Section 8.4) |
| Rate limiting implementation tidak ada | HIGH | AI API cost bisa explode | Disebutkan tapi tidak diimplementasikan | Explicit implementation (Section 5.4) |
| Testing strategy terlalu singkat | HIGH | 80% coverage disebutkan tapi tidak ada strategi | Singkat | Full strategy (Section 9.3) |
| CI/CD pipeline tidak lengkap | MEDIUM | Rollback, feature flags tidak ada | Hanya job names | Full pipeline (Section 9.4) |
| Maintenance runbooks tidak ada | HIGH | Operator tidak tahu procedure harian | Tidak ada | Full runbooks (Section 4) |
| Idempotency patterns tidak ada | HIGH | Duplicate processing di queue | Disebutkan satu kali | Patterns (Section 9.2) |
| Dead Letter Queue tidak ada | HIGH | Failed jobs hilang tanpa trace | Tidak ada | Implementation (Section 9.2) |

## 0.4 Gap Analysis — Perspektif AI IDE Agent (Cursor, Claude Code, Gemini)

| Gap | Severity | Impact | Status di v2.0 | Status di v2.1 |
|-----|----------|--------|----------------|----------------|
| Starter templates / boilerplate tidak ada | HIGH | Agent harus infer dari scratch | Tidak ada | Full templates (Section 7) |
| Atomic task catalog tidak ada | HIGH | Agent tidak bisa break down task sendiri | Tidak ada | Catalog (Section 7.5) |
| Naming conventions tidak granular | MEDIUM | Inconsistency antar agent | Partial | Granular (Section 7.2) |
| Prompt library tidak ada | HIGH | Inconsistent prompting | Tidak ada | Library (Section 7.7) |
| Context files terlalu singkat | MEDIUM | Agent kurang context | Basic | Enriched (Section 7.1) |
| Self-audit checklist ada tapi tidak lengkap | MEDIUM | AI bisa miss checks | Partial | Lengkap (Section 7.6) |
| AI task tidak bisa dijalankan tanpa ambiguity | HIGH | Agent butuh interpretasi | Tidak ada | Atomic spec (Section 7.5) |

## 0.5 Apa yang TIDAK Diubah

Sesuai instruksi constitutional, hal berikut TIDAK dimodifikasi:
- Vision Architecture (1.1)
- Mission Architecture (1.2)
- Core Principles P-01 sampai P-10
- System Boundaries (1.4)
- Domain Map (1.5)
- Bounded Context definitions (1.6)
- Phase evolution (1.9)
- Feature Constitution seluruhnya (Part 03)
- Data schema definitions (Part 04)
- Learning Constitution (Part 07)
- Revenue Constitution (Part 08)
- AI Constitution core (Part 06)

---

# SECTION 1 — UPDATED SYSTEM CONSTITUTION

*Parts 01–02 dari v2.0 dipertahankan sepenuhnya. Section ini hanya menambah amendment yang diperlukan.*

## 1.1 Constitutional Amendment CA-001: Economic Principle Extension

**Amendment to P-02 (Revenue Attribution Mandatory):**

Tambahan klarifikasi: Revenue attribution bukan hanya pada publishing, tetapi pada **setiap AI API call yang dilakukan**. Setiap token yang dikonsumsi harus bisa ditraced ke content asset → revenue potential. Token yang dikonsumsi untuk task yang tidak menghasilkan revenue traceable adalah kandidat optimasi.

**New Principle P-11: Cost Attribution Mandatory**

> Setiap operasi yang mengkonsumsi biaya (AI tokens, API calls, compute) harus memiliki `cost_metadata` yang mencatat estimated_cost_usd, actual_cost_usd, dan content_asset_id atau agent_task_id sebagai cost owner. Operasi tanpa cost attribution adalah anomali.

**New Principle P-12: Idempotency as Default**

> Semua operasi yang dipicu oleh event, queue, atau webhook harus idempoten. Setiap operasi harus aman untuk dieksekusi ulang tanpa side effects. Idempotency key harus disertakan pada semua async operations.

**New Principle P-13: Graceful Degradation**

> SIMIS tidak boleh memiliki binary fail state. Ketika komponen gagal, sistem harus degradasi ke mode terbatas yang tetap fungsional. Content generation bisa fallback ke model lebih murah. Research bisa fallback ke cached results. Revenue tracking harus selalu berjalan bahkan ketika komponen lain gagal.

## 1.2 Constitutional Amendment CA-002: Phase 1 Economic Guardrails

Tambahan pada Phase 1 definition (Section 1.9):

**Phase 1 Economic Constraints:**
- Maximum AI cost per content asset: **$0.15 USD** (hard cap, not soft cap)
- Maximum AI cost per research session: **$0.30 USD**
- Maximum total AI spend per day (Phase 1): **$5.00 USD**
- Target cost per published asset: **< $0.10 USD** (blended, all AI costs)
- Break-even traffic target: **500 organic sessions/month** per content asset

Jika guardrail dilanggar, sistem harus:
1. Log `CostGuardrailViolated` event
2. Pause task dan escalate ke operator
3. NOT auto-proceed

---

# SECTION 2 — RISK REGISTER & MITIGATION CONSTITUTION

## 2.1 Risk Register Framework

Semua risk dikatalogkan dengan format:
- **ID** — Risk identifier
- **Category** — Technical / Business / Operational / Security
- **Description** — Deskripsi risiko
- **Probability** — Low (< 20%) / Medium (20–50%) / High (> 50%)
- **Impact** — Low / Medium / High / Critical
- **Risk Score** — Probability × Impact (1–9)
- **Owner** — Who is responsible
- **Mitigation** — Concrete mitigation actions
- **Trigger** — What signals this risk is materializing
- **Contingency** — What to do if risk materializes

## 2.2 Technical Risks

### RISK-T-001: AI Provider Rate Limit / Outage
- **Probability:** High (Gemini free tier has aggressive rate limits)
- **Impact:** High (content generation stops)
- **Risk Score:** 9
- **Owner:** Systems Architect
- **Mitigation:**
  1. Implement multi-provider fallback chain: Gemini → Groq → OpenRouter
  2. Implement exponential backoff with jitter (see Section 9.2)
  3. Implement request queuing — never drop requests, queue them
  4. Cache all SERP and research results for minimum 6 hours
  5. Pre-compute and cache content briefs to decouple from live AI dependency
- **Trigger:** Error rate on Gemini API > 5% in 15-minute window
- **Contingency:** Switch to Groq primary + alert operator. Estimated impact: quality slightly lower, latency better.

```python
# Implementation: AI Provider Fallback Chain
AI_PROVIDER_CHAIN = {
    "generation": [
        {"provider": "gemini", "model": "gemini-1.5-pro", "cost_per_1k_tokens": 0.00125},
        {"provider": "groq", "model": "llama-3.1-70b", "cost_per_1k_tokens": 0.0008},
        {"provider": "openrouter", "model": "anthropic/claude-3-haiku", "cost_per_1k_tokens": 0.00025},
    ],
    "extraction": [
        {"provider": "groq", "model": "llama-3.1-8b", "cost_per_1k_tokens": 0.0001},
        {"provider": "gemini", "model": "gemini-1.5-flash", "cost_per_1k_tokens": 0.000075},
    ],
    "embedding": [
        {"provider": "gemini", "model": "text-embedding-004", "cost_per_1k_tokens": 0.000025},
        {"provider": "openrouter", "model": "openai/text-embedding-3-small", "cost_per_1k_tokens": 0.00002},
    ]
}
```

### RISK-T-002: Supabase Free Tier Limits
- **Probability:** High (500MB DB, 1GB storage, 50MB file uploads)
- **Impact:** High (data loss, new data rejected)
- **Risk Score:** 9
- **Owner:** Systems Architect
- **Mitigation:**
  1. Implement data retention policies from Day 1
  2. Raw layer (Layer 1) retention: 30 days (not 90)
  3. Compress embeddings: use 512-dim instead of 1536 for early phase
  4. Archive resolved signals > 60 days to Supabase Storage (compressed JSON)
  5. Monitor DB size daily — alert at 400MB
  6. Schema: add `archived_at` column to all major tables
- **Trigger:** DB size > 400MB
- **Contingency:** Emergency archival job runs, purges raw layer, compresses old signals.

```sql
-- Data retention policy (run weekly via Trigger.dev)
-- Archive old signals to storage, then delete from DB
DELETE FROM raw_feed_items WHERE fetched_at < NOW() - INTERVAL '30 days';
DELETE FROM signals WHERE status = 'dismissed' AND created_at < NOW() - INTERVAL '60 days';

-- Compress embeddings for storage (run during low-traffic)
-- Phase 1: store 512-dim embeddings (reduce storage 66%)
ALTER TABLE signals ALTER COLUMN embedding TYPE vector(512);
```

### RISK-T-003: LangGraph Agent Infinite Loop / Runaway Cost
- **Probability:** Medium (complex state machines can enter unexpected loops)
- **Impact:** Critical (unlimited AI cost consumption)
- **Risk Score:** 9
- **Owner:** Systems Architect
- **Mitigation:**
  1. Every agent task has `max_iterations` hard limit (default: 20)
  2. Every agent has `max_cost_usd` per task (governance policy — already defined)
  3. Dead man's switch: agent task TTL = 30 minutes. Auto-terminate after.
  4. Cost tracking middleware on every AI call — abort task if budget exceeded
  5. Circuit breaker: if 3 tasks from same agent fail in 10 minutes, pause agent
- **Trigger:** Agent task exceeds 15 iterations OR cost > $0.20 on single task
- **Contingency:** Force-stop task, emit `AgentRunawayDetected`, lock agent pending review.

```python
# Agent cost guard middleware
class AgentCostGuard:
    def __init__(self, max_cost_usd: float, task_id: str):
        self.max_cost_usd = max_cost_usd
        self.task_id = task_id
        self.accumulated_cost = 0.0
    
    async def check_and_track(self, cost_usd: float) -> None:
        self.accumulated_cost += cost_usd
        await self._persist_cost(self.task_id, self.accumulated_cost)
        if self.accumulated_cost > self.max_cost_usd:
            raise AgentCostLimitExceeded(
                f"Task {self.task_id} exceeded cost limit: "
                f"${self.accumulated_cost:.4f} > ${self.max_cost_usd:.4f}"
            )
    
    async def _persist_cost(self, task_id: str, cost: float) -> None:
        await redis.set(f"agent_cost:{task_id}", cost, ex=3600)
```

### RISK-T-004: pgvector Performance Degradation
- **Probability:** Medium (at scale, ivfflat requires maintenance)
- **Impact:** Medium (search becomes slow, user experience degrades)
- **Risk Score:** 4
- **Owner:** Developer
- **Mitigation:**
  1. Set `ivfflat.probes = 10` for better recall (Phase 1)
  2. Run `VACUUM ANALYZE` on vector tables weekly
  3. Monitor index bloat — recreate index if ratio > 2x
  4. Phase 2: migrate to HNSW index for better performance
- **Trigger:** Vector search query time > 500ms (P95)

```sql
-- Performance maintenance (weekly Trigger.dev job)
VACUUM ANALYZE signals;
VACUUM ANALYZE entities;
VACUUM ANALYZE graph_nodes;

-- Check index health
SELECT schemaname, tablename, indexname, 
       pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE indexname LIKE '%embedding%';

-- Phase 2 upgrade: HNSW (much better performance, more memory)
CREATE INDEX CONCURRENTLY signals_embedding_hnsw_idx 
  ON signals USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### RISK-T-005: Crawl4AI Docker Instability
- **Probability:** Medium (self-hosted, browser-based, memory intensive)
- **Impact:** Medium (research and discovery degraded)
- **Risk Score:** 4
- **Owner:** Developer
- **Mitigation:**
  1. Health check endpoint polled every 60 seconds
  2. Auto-restart via Docker health check: `--health-cmd="curl -f http://localhost:11235/health"`
  3. Fallback to Firecrawl API when Crawl4AI is unavailable
  4. Queue-based crawl requests (never direct sync calls)
  5. Memory limit: 1GB per container (prevent OOM)
- **Trigger:** Health check fails 3 consecutive times

### RISK-T-006: Trigger.dev Free Tier Exhaustion (50k runs/month)
- **Probability:** High (feed ingestion every 15 minutes = 2,880 runs/day = 86k/month)
- **Impact:** High (all scheduled jobs stop)
- **Risk Score:** 9 — **THIS IS A DAY-1 CRITICAL ISSUE**
- **Owner:** Systems Architect
- **Mitigation:**
  1. **IMMEDIATE:** Reduce feed polling to every 60 minutes (not 15) for Phase 1
  2. Batch feed ingestion: one job processes ALL feeds (not one job per feed)
  3. Use conditional triggers: only queue enrichment if new items found
  4. Calculate: 1 batch job/hour × 24 × 30 = 720 runs/month. Budget: 50k. Safe.
  5. Upgrade to Trigger.dev Pro ($20/month) when > 30k runs/month
- **Trigger:** > 35k runs in current month

## 2.3 Business Risks

### RISK-B-001: Zero Organic Traffic for 90+ Days
- **Probability:** High (new sites have sandbox period)
- **Impact:** High (no revenue signal, no learning data)
- **Risk Score:** 9
- **Owner:** Founder
- **Mitigation:**
  1. Target "low competition, buyer intent" keywords from Day 1
  2. Minimum 3 content assets published per week
  3. Internal linking structure from Day 1 (pillar + cluster)
  4. Submit sitemap to Google Search Console Week 1
  5. Alternative traffic: Pinterest, Reddit, Quora seeding for Phase 1
  6. Track search impressions (not just clicks) as leading indicator
- **Trigger:** Zero organic sessions at Day 60 with 20+ published assets
- **Contingency (Kill/Pivot):** See Section 6.5

### RISK-B-002: Affiliate Program Rejection / Commission Withholding
- **Probability:** Medium (new sites sometimes rejected; fraud concerns)
- **Impact:** High (primary Phase 1 revenue channel blocked)
- **Risk Score:** 6
- **Owner:** Founder
- **Mitigation:**
  1. Apply to Amazon Associates first (easiest approval)
  2. Diversify: minimum 3 affiliate programs before targeting revenue
  3. Use direct affiliate programs (brand's own programs) when available
  4. Document all content quality scores before affiliate application
  5. Build traffic first (100+ sessions) before applying to premium networks
- **Trigger:** Primary affiliate program rejected or commission rate reduced > 30%
- **Contingency:** Switch to alternative programs. Impact Intelligence Agent with program swap.

### RISK-B-003: Google Algorithm Update (Traffic Spike or Drop)
- **Probability:** High (multiple core updates per year)
- **Impact:** High (traffic and revenue can change ±50% overnight)
- **Risk Score:** 9
- **Owner:** Founder + Systems Architect
- **Mitigation:**
  1. Diversify content across multiple topical clusters
  2. Diversify traffic sources (not 100% SEO)
  3. Content quality score minimum 80 before publishing (not 75)
  4. E-E-A-T signals: author bios, citations, expertise demonstrations
  5. Revenue anomaly detector already in architecture — must be operational
- **Trigger:** Traffic drop > 30% in single day with no other explanation
- **Contingency:** Activate Content Refresh Engine immediately on affected assets.

### RISK-B-004: AI Content Detection and Ranking Penalty
- **Probability:** Medium (Google has stated AI content quality > source matters)
- **Impact:** High (entire site could be deranked)
- **Risk Score:** 6
- **Owner:** Founder
- **Mitigation:**
  1. Quality score minimum 80 enforced (architecture already has this)
  2. Human review layer for all content before publish (Phase 1)
  3. Fact-checking flags must be resolved, not ignored
  4. Unique data integration: statistics, case studies, original research
  5. Entity enrichment: real citations, Wikidata references
- **Trigger:** Sudden ranking drop on AI-generated content cluster

### RISK-B-005: Single Niche Saturation
- **Probability:** Medium (if wrong niche chosen)
- **Impact:** Medium (growth ceiling)
- **Risk Score:** 4
- **Owner:** Founder
- **Mitigation:**
  1. Niche selection criteria: min $50k monthly affiliate volume, < 40 KD avg
  2. SERP intelligence used before niche commitment
  3. Portfolio approach: multiple micro-niches (Phase 2)
  4. Moat: prediction dataset and knowledge graph provide advantage vs pure AI tools

## 2.4 Operational Risks

### RISK-O-001: Founder Bandwidth Overload
- **Probability:** High (single operator managing complex system)
- **Impact:** High (system not utilized, momentum lost)
- **Risk Score:** 9
- **Owner:** Founder
- **Mitigation:**
  1. P-07 (Founder-Operable) is constitutional — must be enforced strictly
  2. Daily operator time budget: maximum 2 hours/day in Phase 1
  3. Auto-pilot mode: DiscoveryAgent + ContentPipelineAgent run autonomously
  4. Weekly review session: 1 hour to review predictions, adjust priorities
  5. Dashboard KPI: show only 5 key metrics (not everything)
- **Trigger:** Founder reports > 3 hours/day operational time

### RISK-O-002: Data Quality Degradation (Garbage In)
- **Probability:** Medium (poor sources produce poor signals)
- **Impact:** High (knowledge graph corrupted, content quality drops)
- **Risk Score:** 6
- **Owner:** Developer
- **Mitigation:**
  1. Source quality scoring from Day 1 (already in architecture)
  2. Block/allowlist management for domains
  3. Entity confidence thresholds: minimum 0.70 before adding to graph
  4. Weekly graph health check: orphan nodes, low-confidence edges
  5. Content quality minimum 80 acts as output quality gate
- **Trigger:** Average signal quality score drops below 0.5 for 3 consecutive days

## 2.5 Security Risks

### RISK-S-001: API Key Exposure
- **Probability:** Low (Supabase Vault used)
- **Impact:** Critical (financial loss from key abuse)
- **Risk Score:** 6
- **Owner:** Developer
- **Mitigation:**
  1. All keys in Supabase Vault (already constitutional)
  2. Key rotation reminder: 90-day auto-alert
  3. Per-provider spend alerts: $5/day trigger on any AI provider
  4. Webhook signature validation on all incoming webhooks
  5. CORS whitelist: only allow known domains
- **Trigger:** Unexpected API spend spike > 200% vs 7-day average

### RISK-S-002: Prompt Injection via Crawled Content
- **Probability:** Medium (crawled web content can contain adversarial instructions)
- **Impact:** High (agent could be manipulated into unauthorized actions)
- **Risk Score:** 6
- **Owner:** Developer
- **Mitigation:**
  1. Sandbox all crawled content: NEVER include raw crawled content in agent system prompts
  2. Sanitize crawled content before inclusion in prompts
  3. Agent governance policy already prevents unauthorized actions
  4. Input/output monitoring for anomalous agent behavior

```python
# Prompt injection sanitizer
import re

INJECTION_PATTERNS = [
    r"ignore (previous|above|all) instructions",
    r"you are now",
    r"system prompt",
    r"<\|im_start\|>",
    r"\[INST\]",
    r"act as",
]

def sanitize_crawled_content(content: str) -> str:
    """Remove potential prompt injection patterns from crawled content."""
    sanitized = content
    for pattern in INJECTION_PATTERNS:
        sanitized = re.sub(pattern, "[REDACTED]", sanitized, flags=re.IGNORECASE)
    # Limit injection surface: max 2000 chars of crawled content per prompt
    return sanitized[:2000]
```

---

# SECTION 3 — OPERATIONAL & MAINTENANCE CONSTITUTION

## 3.1 Daily Operations Protocol

### Daily Operator Routine (Target: < 60 minutes)

**08:00 — Morning Dashboard Review (15 min)**
1. Check Revenue Pulse: today vs yesterday, today vs last week same day
2. Check Alert Center: any anomalies, agent failures, affiliate link errors
3. Check Agent Activity Feed: what ran overnight, any failures
4. Check Intelligence Queue: new high-priority signals to action
5. Check Content Pipeline: what's scheduled to publish today

**Decision tree from morning review:**
```
Revenue anomaly detected?
  → YES: Check Revenue Anomaly Detector. Is it affiliate link failure? → Fix links.
         Is it traffic drop? → Check Google Search Console. Flag for investigation.
  → NO: Continue

Agent failure detected?
  → YES: Check agent task history. Is it API rate limit? → Will auto-recover.
         Is it data issue? → Check specific task error trace. Fix input data.
  → NO: Continue

High-priority signal in queue?
  → YES: Review signal. Worth a content brief? → Create brief.
  → NO: Continue
```

**10:00 — Content Pipeline Check (10 min)**
1. Review content drafts in "Review" status
2. Check quality scores: below 80 → review and improve before publish
3. Approve content for today's scheduled publish
4. Check affiliate link audit: all links healthy?

**16:00 — Intelligence Review (10 min)**
1. Check trending signals (24h window)
2. Any competitor content published that needs response?
3. Any affiliate program updates or commission changes?

**Optional — Weekly (Friday, 30 min)**
1. Prediction vs Actual review: how accurate were last week's predictions?
2. Revenue by content asset: top 10 earners — what pattern can be replicated?
3. Content pipeline planning: brief 3–5 new content assets for next week

## 3.2 Maintenance Runbooks

### RUNBOOK-001: Feed Ingestion Failure

**Symptom:** Discovery Hub shows stale data (no new signals in > 2 hours)

**Diagnosis steps:**
```bash
# Step 1: Check Trigger.dev job status
# Go to Trigger.dev dashboard → Jobs → feed-ingestion → Last runs

# Step 2: Check feed source health in SIMIS
# Settings → Feed Manager → check error_count and last_fetched_at columns

# Step 3: Check specific feed error
# Select feed with high error_count → check metadata.last_error field

# Step 4: Test feed manually
curl -I "https://example.com/feed.xml"
# Expected: 200 OK with Content-Type: application/rss+xml
```

**Resolution:**
- If feed URL changed: update URL in Feed Manager
- If feed returns 403/429: reduce fetch frequency or remove feed
- If Trigger.dev job failed: manually trigger from Trigger.dev dashboard
- If Groq enrichment failing: check GROQ_API_KEY in environment → rotate if needed

**Post-fix verification:** New signals should appear in Discovery Hub within 15 minutes.

---

### RUNBOOK-002: Content Generation AI Error

**Symptom:** Content generation task fails with AI provider error

**Diagnosis steps:**
```bash
# Check agent task history
# Agent Center → ResearchAgent/ContentPipelineAgent → Failed Tasks

# Check error message in task trace:
# "rate_limit_exceeded" → rate limit hit
# "model_not_found" → model name changed (provider update)
# "context_length_exceeded" → brief too long for model
# "invalid_api_key" → key expired or invalid
```

**Resolution by error type:**

```python
# Rate limit: system should auto-retry with backoff
# If not auto-recovering after 30 min → manually trigger task
# Agent Center → Task → Retry

# Model not found: update model name in Settings → Model Manager
# Standard fallback names:
GEMINI_MODELS = {
    "pro": "gemini-1.5-pro-latest",
    "flash": "gemini-1.5-flash-latest",
}

# Context length exceeded: reduce brief length
# Content Brief Builder → target word count → reduce by 20%
# Or use chunked generation (H2 by H2 instead of full draft)

# Invalid API key: Settings → API Manager → Gemini → Rotate key
```

---

### RUNBOOK-003: Database Storage Alert (> 400MB)

**Symptom:** Storage alert fires, Supabase approaching 500MB limit

**Immediate actions (in order):**

```sql
-- Step 1: Check what's taking up space
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- Step 2: Archive old raw data
DELETE FROM raw_feed_items WHERE fetched_at < NOW() - INTERVAL '14 days';
DELETE FROM raw_serp_results WHERE created_at < NOW() - INTERVAL '14 days';
DELETE FROM raw_crawl_content WHERE created_at < NOW() - INTERVAL '7 days';

-- Step 3: Archive dismissed signals
DELETE FROM signals 
WHERE status = 'dismissed' 
AND created_at < NOW() - INTERVAL '30 days';

-- Step 4: Reclaim space
VACUUM FULL signals;
VACUUM FULL raw_feed_items;

-- Step 5: Check new size
SELECT pg_size_pretty(pg_database_size(current_database()));
```

**Long-term:** Upgrade to Supabase Pro ($25/month) or implement S3-compatible archival.

---

### RUNBOOK-004: Affiliate Link Health Failure

**Symptom:** Affiliate Center shows broken links; or revenue anomaly correlated with link failures

**Steps:**

```bash
# Step 1: Identify broken links
# Affiliate Center → Dead Link Monitor → filter by status = 'broken'

# Step 2: For each broken link, diagnose:
# 301/302 to competitor: affiliate program changed structure → get new link
# 404: product discontinued → remove link or replace with alternative
# 429: rate limited during health check → not actually broken, clear error
# 403: requires cookie/session → test manually in browser

# Step 3: Auto-replacement suggestion
# Affiliate Center → Dead Link → Suggest Replacement
# System queries affiliate program registry for same product category

# Step 4: Bulk update if program changed all URLs
# Use "Bulk Link Update" in Affiliate Center → update by program_id
```

**Priority:** P1 — broken links directly bleed revenue. Fix within 24 hours.

---

### RUNBOOK-005: Agent Governance Violation

**Symptom:** Alert: `GovernanceViolationDetected` event in Agent Center

**Steps:**
```
1. Agent Center → Agent Audit Log → find violation event
2. Check violation type:
   a. Cost limit exceeded → Review task complexity, adjust governance.maxCostPerTask
   b. Blocked domain crawled → Update blockedDomains in governance policy
   c. Quality threshold not met → Review content, increase enrichment context
   d. Unauthorized task type → Check agent capabilities list

3. Decision:
   - Was violation legitimate (edge case)? → Allow once, document, update policy
   - Was violation a bug? → Fix code, re-deploy, resume agent
   - Was violation malicious/prompt injection? → Audit all recent agent output

4. Resume agent:
   Agent Center → Agent → Resume
```

## 3.3 Weekly Maintenance Schedule

| Day | Task | Duration | Tool |
|-----|------|----------|------|
| Monday | Review prediction accuracy (last 7 days) | 20 min | Prediction Center |
| Tuesday | Content pipeline review: queue full for week? | 15 min | Content Planner |
| Wednesday | Affiliate opportunity scan on all published content | 10 min | Affiliate Center |
| Thursday | SERP position check on top 20 keywords | 15 min | SERP Intelligence |
| Friday | Revenue review + next week planning | 30 min | Revenue Center |
| Saturday | DB maintenance job (auto via Trigger.dev) | Automated | - |
| Sunday | Agent performance review + configuration tuning | 20 min | Agent Center |

## 3.4 Monthly Maintenance Schedule

| Week | Task | Duration |
|------|------|----------|
| W1 | Full content audit: quality scores, affiliate coverage | 2 hours |
| W2 | Knowledge graph health: orphan nodes, low-confidence edges | 1 hour |
| W3 | Revenue attribution accuracy review | 1 hour |
| W4 | API key rotation check; dependency security updates | 1 hour |
| W4 | Monthly revenue report generation | 30 min |
| W4 | Prediction calibration review | 30 min |

## 3.5 Error Handling Patterns

### Pattern EP-001: Exponential Backoff with Jitter

All AI API calls and external HTTP requests MUST use this pattern:

```python
import asyncio
import random
from typing import TypeVar, Callable, Any

T = TypeVar('T')

async def with_retry(
    func: Callable[..., T],
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    retryable_exceptions: tuple = (Exception,),
    *args: Any,
    **kwargs: Any
) -> T:
    """
    Exponential backoff with jitter.
    Jitter prevents thundering herd when multiple agents retry simultaneously.
    """
    for attempt in range(max_attempts):
        try:
            return await func(*args, **kwargs)
        except retryable_exceptions as e:
            if attempt == max_attempts - 1:
                raise  # Final attempt: re-raise
            
            # Exponential backoff: 1s, 2s, 4s, 8s...
            delay = min(base_delay * (2 ** attempt), max_delay)
            # Add jitter: ±25% of delay
            jitter = delay * 0.25 * (2 * random.random() - 1)
            actual_delay = delay + jitter
            
            await asyncio.sleep(actual_delay)
    
    raise RuntimeError("Unreachable")  # Satisfy type checker

# Usage
result = await with_retry(
    gemini_client.generate,
    max_attempts=3,
    base_delay=2.0,
    retryable_exceptions=(RateLimitError, ServiceUnavailableError),
    prompt=prompt,
    model="gemini-1.5-pro"
)
```

### Pattern EP-002: Circuit Breaker

For external services that can fail in a sustained way:

```python
from enum import Enum
from datetime import datetime, timedelta

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing — reject requests
    HALF_OPEN = "half_open"  # Testing recovery

class CircuitBreaker:
    def __init__(
        self,
        service_name: str,
        failure_threshold: int = 5,
        success_threshold: int = 2,
        timeout_seconds: int = 60,
    ):
        self.service_name = service_name
        self.failure_threshold = failure_threshold
        self.success_threshold = success_threshold
        self.timeout = timedelta(seconds=timeout_seconds)
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: datetime | None = None
    
    async def call(self, func: Callable, *args, **kwargs):
        if self.state == CircuitState.OPEN:
            if datetime.now() - self.last_failure_time > self.timeout:
                self.state = CircuitState.HALF_OPEN
                self.success_count = 0
            else:
                # Fail fast — don't even try
                raise CircuitOpenError(f"Circuit OPEN for {self.service_name}")
        
        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise
    
    def _on_success(self):
        self.failure_count = 0
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.success_threshold:
                self.state = CircuitState.CLOSED
    
    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

# Global circuit breakers (initialized at startup)
gemini_circuit = CircuitBreaker("gemini", failure_threshold=5, timeout_seconds=120)
serper_circuit = CircuitBreaker("serper", failure_threshold=3, timeout_seconds=60)
crawl4ai_circuit = CircuitBreaker("crawl4ai", failure_threshold=3, timeout_seconds=300)
```

### Pattern EP-003: Dead Letter Queue

All failed Trigger.dev jobs must be captured and retrievable:

```typescript
// Trigger.dev v3 DLQ pattern
import { task, logger } from "@trigger.dev/sdk/v3"

export const signalEnrichmentJob = task({
  id: "signal-enrichment",
  
  // Retry configuration
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
    factor: 2,  // exponential backoff
    randomize: true,
  },
  
  run: async (payload: { signalId: string }, { ctx }) => {
    try {
      return await enrichSignal(payload.signalId)
    } catch (error) {
      // Log structured error for DLQ analysis
      logger.error("Signal enrichment failed", {
        signalId: payload.signalId,
        attempt: ctx.attempt.number,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      
      // On final attempt: persist to DLQ table for human review
      if (ctx.attempt.number >= 3) {
        await persistToDLQ({
          job_id: "signal-enrichment",
          payload,
          error: error instanceof Error ? error.message : String(error),
          failed_at: new Date().toISOString(),
          requires_human_review: true,
        })
      }
      
      throw error  // Re-throw to trigger Trigger.dev retry mechanism
    }
  },
})

// DLQ table (add to migrations)
// CREATE TABLE dead_letter_queue (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   organization_id UUID,
//   job_id TEXT NOT NULL,
//   payload JSONB NOT NULL,
//   error TEXT,
//   failed_at TIMESTAMPTZ DEFAULT now(),
//   requires_human_review BOOLEAN DEFAULT true,
//   reviewed_at TIMESTAMPTZ,
//   reviewed_by UUID,
//   resolution TEXT
// );
```

### Pattern EP-004: Idempotency Guard

```python
from functools import wraps
import hashlib
import json

def idempotent(key_fields: list[str], ttl_seconds: int = 86400):
    """
    Decorator that ensures a function runs at most once per unique key combination.
    Uses Redis for state. TTL defines the dedup window.
    
    Usage:
        @idempotent(key_fields=["signal_url_hash", "enrichment_version"])
        async def enrich_signal(signal_url_hash: str, enrichment_version: str):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Build idempotency key from specified fields
            key_values = {field: kwargs.get(field) for field in key_fields}
            key_hash = hashlib.sha256(
                json.dumps(key_values, sort_keys=True).encode()
            ).hexdigest()
            redis_key = f"idempotency:{func.__name__}:{key_hash}"
            
            # Check if already executed
            existing = await redis.get(redis_key)
            if existing:
                return json.loads(existing)  # Return cached result
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Store result with TTL
            await redis.setex(
                redis_key, 
                ttl_seconds, 
                json.dumps(result, default=str)
            )
            return result
        return wrapper
    return decorator

# Usage
@idempotent(key_fields=["signal_url_hash", "enrichment_version"])
async def enrich_signal(signal_url_hash: str, enrichment_version: str = "v1") -> EnrichedSignal:
    ...
```

---

# SECTION 4 — COST CONTROL & ECONOMIC GUARDRAILS CONSTITUTION

## 4.1 Unit Economics Model

### Phase 1 Target Unit Economics

| Metric | Target | Warning | Critical |
|--------|--------|---------|---------|
| Cost per content asset (AI only) | < $0.10 | $0.10–$0.15 | > $0.15 |
| Cost per research session | < $0.20 | $0.20–$0.30 | > $0.30 |
| Cost per SERP analysis | < $0.01 | $0.01–$0.02 | > $0.02 |
| Cost per signal enrichment | < $0.001 | $0.001–$0.002 | > $0.002 |
| Monthly infrastructure cost (Phase 1) | < $20 | $20–$50 | > $50 |
| Monthly AI cost (Phase 1) | < $30 | $30–$60 | > $60 |
| Revenue per content asset (Month 3) | > $1 | $0.50–$1 | < $0.50 |
| RPM (Revenue per 1000 sessions) | > $5 | $2–$5 | < $2 |
| Break-even traffic per asset | < 500 sessions/mo | 500–1000 | > 1000 |

### Phase 1 Monthly Budget Allocation

```
PHASE 1 MONTHLY COST STRUCTURE (Target Total: < $50/month)

Infrastructure:
  Supabase Free: $0
  Vercel Hobby: $0
  Upstash Redis: $0 (10k req/day free)
  Trigger.dev: $0 (50k runs/month free)
  Cloudflare: $0
  PostHog: $0 (1M events/month free)
  Sentry: $0 (5k errors/month free)
  ─────────────────────────────────
  Infrastructure Total: $0

AI Costs (Estimated for 20 content assets/month):
  Gemini 1.5 Pro (content generation): ~$15
    (20 assets × 3000 tokens avg × $0.00125/1k input + $0.005/1k output)
  Gemini 1.5 Flash (research synthesis): ~$5
  Groq (entity extraction, fast ops): ~$2
  Embedding generation: ~$1
  ─────────────────────────────────
  AI Total: ~$23

External APIs:
  Brave Search (2000/month free): $0
  Serper (2500 searches free): $0
  Firecrawl (500 pages/month free): $0
  ─────────────────────────────────
  API Total: $0

Domain + Hosting:
  Domain: ~$12/year (~$1/month)
  ─────────────────────────────────
  Domain Total: $1

TOTAL PHASE 1 BURN: ~$24/month
REVENUE TARGET (Month 3): $150+/month
BREAK-EVEN: Month 2–3 (achievable)
```

### Token Optimization Targets

```python
# Token budgets per operation type
TOKEN_BUDGETS = {
    # Content generation: most expensive, highest value
    "content.full_article": {
        "input": 8000,   # Brief + SERP data + examples
        "output": 5000,  # ~3000 words article
        "model": "gemini-1.5-pro",
        "est_cost_usd": 0.035,
    },
    "content.section": {
        "input": 2000,
        "output": 800,
        "model": "gemini-1.5-flash",  # Use flash for sections
        "est_cost_usd": 0.003,
    },
    # Research: high value, moderate cost
    "research.synthesis": {
        "input": 20000,  # Long context: multiple crawled pages
        "output": 3000,
        "model": "gemini-1.5-flash",  # Flash has 1M context
        "est_cost_usd": 0.012,
    },
    # Fast ops: low cost, high volume
    "extraction.entities": {
        "input": 2000,
        "output": 500,
        "model": "groq/llama-3.1-8b",
        "est_cost_usd": 0.00025,
    },
    "scoring.quality": {
        "input": 3000,
        "output": 300,
        "model": "groq/llama-3.1-8b",
        "est_cost_usd": 0.00033,
    },
}
```

## 4.2 Cost Tracking Implementation

```sql
-- Add to migrations: cost tracking table
CREATE TABLE operation_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  agent_task_id UUID,
  content_asset_id UUID,
  operation_type TEXT NOT NULL,  -- matches TOKEN_BUDGETS keys
  provider TEXT NOT NULL,        -- 'gemini', 'groq', 'openrouter'
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost_usd NUMERIC(10, 6),
  actual_cost_usd NUMERIC(10, 6),
  budget_usd NUMERIC(10, 6),
  over_budget BOOLEAN GENERATED ALWAYS AS (actual_cost_usd > budget_usd) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX operation_costs_org_type_created_idx 
  ON operation_costs (organization_id, operation_type, created_at DESC);

-- Daily cost view
CREATE VIEW daily_ai_costs AS
SELECT 
  organization_id,
  DATE(created_at) as date,
  operation_type,
  provider,
  COUNT(*) as operation_count,
  SUM(actual_cost_usd) as total_cost_usd,
  AVG(actual_cost_usd) as avg_cost_usd,
  SUM(CASE WHEN over_budget THEN 1 ELSE 0 END) as over_budget_count
FROM operation_costs
GROUP BY organization_id, DATE(created_at), operation_type, provider;
```

```python
# Cost tracking middleware for all AI calls
class AIClientWithCostTracking:
    def __init__(self, provider: str, db: AsyncSession):
        self.provider = provider
        self.db = db
    
    async def generate(
        self,
        prompt: str,
        model: str,
        operation_type: str,
        organization_id: str,
        content_asset_id: str | None = None,
        agent_task_id: str | None = None,
    ) -> AIResponse:
        budget = TOKEN_BUDGETS.get(operation_type, {})
        start_time = time.monotonic()
        
        try:
            response = await self._call_provider(prompt, model)
            actual_cost = self._calculate_cost(
                response.usage.input_tokens,
                response.usage.output_tokens,
                model
            )
            
            # Persist cost record (non-blocking)
            asyncio.create_task(self._persist_cost(
                organization_id=organization_id,
                operation_type=operation_type,
                model=model,
                input_tokens=response.usage.input_tokens,
                output_tokens=response.usage.output_tokens,
                actual_cost_usd=actual_cost,
                budget_usd=budget.get("est_cost_usd", 0),
                content_asset_id=content_asset_id,
                agent_task_id=agent_task_id,
            ))
            
            # Emit cost guard check
            if actual_cost > budget.get("est_cost_usd", 0) * 2:
                await self._emit_cost_warning(operation_type, actual_cost, budget)
            
            return response
        except Exception as e:
            raise
    
    def _calculate_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        # Pricing per 1k tokens (update as providers change pricing)
        PRICING = {
            "gemini-1.5-pro": {"input": 0.00125, "output": 0.005},
            "gemini-1.5-flash": {"input": 0.000075, "output": 0.0003},
            "groq/llama-3.1-8b": {"input": 0.0001, "output": 0.0001},
            "groq/llama-3.1-70b": {"input": 0.0008, "output": 0.0008},
        }
        pricing = PRICING.get(model, {"input": 0.001, "output": 0.001})
        return (input_tokens / 1000 * pricing["input"]) + \
               (output_tokens / 1000 * pricing["output"])
```

## 4.3 Rate Limiting Implementation

```python
# Rate limiter using Redis sliding window
class SIMISRateLimiter:
    """
    Sliding window rate limiter per organization per endpoint family.
    Prevents AI cost abuse and respects provider limits.
    """
    
    # Limits per organization per time window
    LIMITS = {
        # Internal operations (per org)
        "content.generate": {"requests": 10, "window_seconds": 3600},  # 10/hour
        "research.session": {"requests": 5, "window_seconds": 3600},   # 5/hour
        "serp.fetch": {"requests": 50, "window_seconds": 3600},         # 50/hour
        
        # Provider-level (global, not per-org)
        "gemini.api": {"requests": 60, "window_seconds": 60},           # Gemini free tier
        "groq.api": {"requests": 100, "window_seconds": 60},
        "brave.api": {"requests": 5, "window_seconds": 1},              # Brave: 1 req/sec free
        "serper.api": {"requests": 10, "window_seconds": 60},
    }
    
    def __init__(self, redis_client):
        self.redis = redis_client
    
    async def check_and_increment(
        self,
        limit_key: str,
        identifier: str,  # org_id for org limits, "global" for provider limits
    ) -> tuple[bool, int]:
        """
        Returns (is_allowed, remaining_requests).
        Uses Redis sorted set for sliding window.
        """
        limit_config = self.LIMITS.get(limit_key)
        if not limit_config:
            return True, 999
        
        now = time.time()
        window = limit_config["window_seconds"]
        max_requests = limit_config["requests"]
        
        redis_key = f"rate_limit:{limit_key}:{identifier}"
        
        # Sliding window: remove old entries, add current, count
        pipe = self.redis.pipeline()
        pipe.zremrangebyscore(redis_key, 0, now - window)
        pipe.zadd(redis_key, {str(now): now})
        pipe.zcard(redis_key)
        pipe.expire(redis_key, window * 2)
        results = await pipe.execute()
        
        current_count = results[2]
        remaining = max(0, max_requests - current_count)
        is_allowed = current_count <= max_requests
        
        return is_allowed, remaining
```

## 4.4 Cost Guardrail Alerts

```python
# Alerting thresholds (checked hourly via Trigger.dev)
COST_ALERT_THRESHOLDS = {
    "daily_ai_spend": {
        "warning": 3.0,   # $3/day warning
        "critical": 5.0,  # $5/day critical → pause non-essential ops
    },
    "single_operation": {
        "warning": 0.15,  # $0.15 per single AI call
        "critical": 0.30, # $0.30 → log and investigate
    },
    "monthly_projection": {
        "warning": 40.0,  # $40 projected monthly
        "critical": 60.0, # $60 → alert founder
    }
}

async def check_cost_guardrails(organization_id: str) -> None:
    """Run every hour. Pause system if critical threshold reached."""
    today_cost = await get_daily_ai_cost(organization_id)
    
    if today_cost >= COST_ALERT_THRESHOLDS["daily_ai_spend"]["critical"]:
        # PAUSE all non-essential agent operations
        await pause_agents(
            organization_id, 
            exclude=["learning-agent"],  # LearningAgent always runs (low cost)
            reason=f"Daily AI cost threshold exceeded: ${today_cost:.2f}"
        )
        await emit_alert(
            organization_id,
            level="critical",
            message=f"Daily AI spend: ${today_cost:.2f}. Non-essential agents paused.",
            action_required=True,
        )
```

## 4.5 ROI Tracking per Content Asset

```sql
-- ROI view per content asset
CREATE VIEW content_asset_roi AS
SELECT 
  ca.id,
  ca.title,
  ca.target_keyword,
  ca.published_at,
  
  -- Costs
  COALESCE(SUM(oc.actual_cost_usd), 0) AS total_ai_cost_usd,
  
  -- Revenue (last 30 days)
  COALESCE(ca.revenue_last_30d, 0) AS revenue_30d,
  
  -- ROI
  CASE 
    WHEN COALESCE(SUM(oc.actual_cost_usd), 0) = 0 THEN NULL
    ELSE ((COALESCE(ca.revenue_last_30d, 0) - COALESCE(SUM(oc.actual_cost_usd), 0)) 
          / COALESCE(SUM(oc.actual_cost_usd), 0)) * 100
  END AS roi_pct,
  
  -- Payback period (days)
  CASE 
    WHEN COALESCE(ca.revenue_last_30d, 0) = 0 THEN NULL
    ELSE COALESCE(SUM(oc.actual_cost_usd), 0) / (ca.revenue_last_30d / 30)
  END AS payback_days,
  
  ca.traffic_last_30d,
  ca.quality_score
  
FROM content_assets ca
LEFT JOIN operation_costs oc ON oc.content_asset_id = ca.id
WHERE ca.status = 'published'
GROUP BY ca.id, ca.title, ca.target_keyword, ca.published_at, 
         ca.revenue_last_30d, ca.traffic_last_30d, ca.quality_score;
```

---

# SECTION 5 — 90-DAY FOUNDER MVP EXECUTION PLAN

## 5.1 Pre-Conditions for Launch

Sebelum Day 1, founder HARUS memiliki:
- [ ] Domain terdaftar dan pointed ke Cloudflare
- [ ] Niche decision final (gunakan SERP Intelligence untuk validasi)
- [ ] Primary affiliate program dipilih (minimal Amazon Associates)
- [ ] Supabase project dibuat, organization record seeded
- [ ] Gemini API key aktif (free tier)
- [ ] Groq API key aktif (free tier)
- [ ] GitHub repository private dengan monorepo structure

**Niche Validation Checklist (use SERP data):**
```
Niche Score = (Monthly Search Volume) × (Commercial Intent %) / (Average KD)

Target: Score > 500
Minimum affiliate commission: $20 avg order value or recurring
Minimum programs available: 3+ programs with API/webhook support
Competition assessment: No more than 2 dominant DA80+ sites on first page
```

## 5.2 Week-by-Week Execution Plan

### WEEK 1 — Foundation (Sprint 1 equivalent)

**Goal:** System can authenticate, store data, serve dashboard shell.

**Developer Tasks (AI-assisted):**
```
DAY 1-2:
□ Monorepo init: turborepo + pnpm workspaces
□ Supabase project setup + enable pgvector, pg_trgm, uuid-ossp
□ Run migration 001: organizations, users, org_members, sites tables
□ Supabase Auth configured (email + Google OAuth)
□ Next.js 15 app scaffolded at apps/web
□ Dashboard shell: layout, nav, placeholder pages

DAY 3-4:
□ FastAPI skeleton at apps/api with health endpoint
□ Authentication middleware (Supabase JWT validation)
□ RLS policies for all tables
□ Onboarding wizard: create organization → create site
□ Settings page: site configuration

DAY 5:
□ Deploy to Vercel (frontend) + Railway/Fly.io (API)
□ Environment variables configured
□ Sentry integrated
□ Basic smoke test: can login, see dashboard, create site
```

**Founder Tasks:**
```
□ Register domain, point to Cloudflare
□ Set up Google Search Console for domain
□ Apply for Amazon Associates (takes 3–7 days to approve)
□ Research 20 target keywords using keyword tool (Ahrefs free trial or Ubersuggest)
□ Document brand voice: tone, audience, key messages
```

**Week 1 Success Metrics:**
- Dashboard loads in < 2s
- Can create organization and site
- Deployed to production URL

---

### WEEK 2 — Discovery Engine

**Goal:** RSS feeds ingesting, signals appearing in Discovery Hub.

**Developer Tasks:**
```
DAY 6-7:
□ Migration 002: feed_sources, signals, raw_feed_items tables
□ Feed Parser service (Python): fetch RSS/Atom, parse, deduplicate
□ Trigger.dev setup + feed ingestion job (hourly batch)
□ Feed Manager page: add/remove feeds, see status

DAY 8-9:
□ Signal enrichment: Groq entity extraction
□ Discovery Hub page: signal stream with filters
□ Signal actions: Save, Create Brief (stub), Dismiss
□ Source Health Monitor in Discovery Hub

DAY 10:
□ Add 10–15 RSS feeds in founder's niche
□ Verify signals ingesting correctly
□ Manual signal review: are entities being extracted correctly?
```

**Founder Tasks:**
```
□ Curate RSS feed list: 15–20 authoritative sources in niche
□ Review first batch of signals: are they relevant?
□ Start building mental model of content opportunities
```

**Week 2 Success Metrics:**
- At least 50 new signals per day
- Entity extraction working (> 60% of signals have entities)
- Discovery Hub usable for signal review

---

### WEEK 3 — SERP Intelligence

**Goal:** Can analyze any keyword's competitive landscape.

**Developer Tasks:**
```
DAY 11-12:
□ Migration 003: serp_snapshots, keyword_intelligence tables
□ Serper API integration (primary) + Brave Search (fallback)
□ SERP Intelligence page: keyword input, results display
□ SERP snapshot storage with TTL (cache 6h in Redis)

DAY 13-14:
□ Competitor content analysis: Crawl4AI integration
□ Gap analyzer: topics covered by top 10 not covered by operator
□ Opportunity scorer: volume × difficulty^-1 × intent × revenue signal
□ Entity registry: tables + Wikidata enrichment

DAY 15:
□ Analyze top 50 target keywords
□ Build initial keyword priority list
□ Document 10 content opportunities with gap analysis
```

**Founder Tasks:**
```
□ Run SERP analysis on 50 target keywords
□ Identify top 20 by opportunity score
□ Select first 5 content targets
□ Verify affiliate programs match keyword intent
```

**Week 3 Success Metrics:**
- SERP data returns in < 5 seconds
- Gap analysis working on target keywords
- Top 20 keywords identified and prioritized

---

### WEEK 4 — Content Infrastructure

**Goal:** First content asset generated and ready for human review.

**Developer Tasks:**
```
DAY 16-17:
□ Migration 004: content_briefs, content_assets, content_versions tables
□ Content Brief Builder: keyword → SERP data → outline generation
□ Gemini integration for outline generation
□ Brief export to Content Generator

DAY 18-19:
□ Content Generator workspace
□ Gemini full draft generation from brief
□ Quality scorer (SEO, readability, entity coverage, structure)
□ Content versioning

DAY 20:
□ Generate first content asset
□ Founder reviews and edits
□ Quality score target: > 75
```

**Founder Tasks:**
```
□ Review first generated content brief: is it accurate?
□ Review first generated draft: edit for voice, facts, uniqueness
□ Add unique insights, data, personal experience
□ Document brand voice feedback for system improvement
```

**Week 4 Success Metrics:**
- Brief generation < 30 seconds
- Draft generation < 3 minutes for 2000-word article
- Quality score > 70 on first attempt

---

### WEEK 5 — Publishing & Affiliate Integration

**Goal:** First content asset published. Affiliate links inserted.

**Developer Tasks:**
```
DAY 21-22:
□ Affiliate program registry tables + program entry
□ Affiliate link generation with tracking
□ Affiliate opportunity detection in content
□ Link insertion assistant in Content Generator

DAY 23-24:
□ Publishing pipeline: staging, SEO validation, structured data
□ WordPress API integration (if using WordPress) or direct headless CMS
□ Publish scheduler
□ Post-publish tracker: Google Search Console API integration

DAY 25:
□ Publish first content asset
□ Submit sitemap to Google Search Console
□ Verify affiliate links are tracking correctly
□ Set up revenue attribution for affiliate clicks
```

**Founder Tasks:**
```
□ Set up affiliate program credentials in SIMIS
□ Verify tracking links before publish
□ Submit to Google Search Console
□ Share content on relevant communities (Reddit, forums, etc.)
```

**Week 5 Success Metrics:**
- First content asset live with affiliate links
- Affiliate click tracking working
- Sitemap submitted to GSC
- SEO metadata complete (title, meta, schema)

---

### WEEK 6 — Revenue Foundation

**Goal:** Revenue tracking operational. Attribution working.

**Developer Tasks:**
```
DAY 26-27:
□ Revenue events table + attribution table
□ Affiliate webhook receiver (Impact/PartnerStack)
□ PostHog integration on published site
□ Revenue Attribution Engine: session → content → revenue chain

DAY 28-29:
□ Revenue Center page
□ Revenue by stream widget
□ Top performers table
□ Basic forecasting (rolling average)

DAY 30:
□ Validate end-to-end: click affiliate link → revenue event created → attributed to content
□ Revenue Center shows data
```

**Founder Tasks:**
```
□ Test affiliate tracking: click own links, verify in network dashboard
□ Review Revenue Center: does it match affiliate network data?
□ Plan content refresh schedule for Week 8 onwards
```

**Week 6 Success Metrics:**
- Revenue attribution working end-to-end
- Revenue Center populated
- PostHog events flowing from published site

---

### WEEK 7 — Content Velocity

**Goal:** Content pipeline producing 3+ assets per week autonomously.

**Developer Tasks:**
```
DAY 31-32:
□ Content Planner (kanban + calendar)
□ Batch brief generation from keyword list
□ Content Pipeline Agent (LangGraph): Brief → Generate → Score → Queue for Review
□ Agent Center page (basic)

DAY 33-34:
□ Content scheduling
□ Bulk publisher
□ Affiliate link health checker (nightly job)

DAY 35:
□ Test full pipeline: keyword → brief → draft → affiliate → publish
□ Measure time: target < 20 minutes per asset (excluding review)
```

**Week 7 Success Metrics:**
- Full pipeline < 20 minutes per asset
- 3+ drafts queued for review
- No critical pipeline failures in 48-hour test

---

### WEEK 8 — Prediction & Learning Foundation

**Goal:** Learning loop recording predictions before every publish.

**Developer Tasks:**
```
DAY 36-37:
□ Predictions table + observations table
□ Prediction recording hooks on: content publish, brief creation
□ Prediction Center UI: active predictions, history
□ Observation Engine: PostHog → actual traffic

DAY 38-39:
□ Learning Agent (basic): daily observation trigger
□ Calibration computation (weekly job)
□ Prediction accuracy display in dashboard

DAY 40:
□ Verify: every published asset has prediction record
□ Verify: observations being recorded from PostHog data
```

**Week 8 Success Metrics:**
- Predictions recorded for all published content
- Observation engine running daily
- Prediction Center accessible

---

### WEEK 9-10 — Scale & Optimize

**Goal:** 20+ content assets published. Revenue signal visible.

**Tasks:**
```
□ Publish 15+ additional content assets (3/week minimum)
□ Content refresh engine: update Week 1 content if needed
□ SERP position tracking: set up monitoring for published keywords
□ Affiliate opportunity scan: all published content has optimal links
□ Knowledge graph: review entity coverage, fill gaps
□ Discovery agent: automate 80% of signal processing
```

**Week 9-10 Success Metrics:**
- 20+ content assets published
- First organic impressions in Google Search Console
- First affiliate clicks tracked
- < 2 hours/day founder operational time

---

### WEEK 11-12 — Intelligence Optimization

**Goal:** System learning from data. First revenue if ranking achieved.

**Tasks:**
```
□ Review prediction accuracy: how close were traffic predictions?
□ Learning signal extraction: what features predict success?
□ Prompt optimization: improve prompts based on quality score data
□ Affiliate program optimization: which programs perform best?
□ Revenue anomaly detection: set up alerts
□ A/B test content titles (2 variants per high-traffic target)
```

**Week 11-12 Success Metrics:**
- First organic traffic (any amount)
- Prediction accuracy improving (calibration error decreasing)
- Learning signals producing actionable insights
- System operating > 80% autonomously

---

## 5.3 Phase 1 KPIs (Numeric)

| KPI | Day 30 Target | Day 60 Target | Day 90 Target |
|-----|---------------|---------------|---------------|
| Content assets published | 10 | 20 | 40 |
| Organic sessions/month | 0 (sandbox) | 50–200 | 500–2000 |
| Affiliate clicks/month | 0 | 20–50 | 100–500 |
| Revenue/month ($) | $0 | $0–$20 | $50–$300 |
| Content pipeline time (mins/asset) | 45 | 30 | 20 |
| Founder operational time/day | 3h | 2h | 1.5h |
| Prediction accuracy (MAPE) | N/A (no data) | 50% | 40% |
| Content quality score (avg) | 72 | 76 | 80 |
| Affiliate link coverage | 50% | 75% | 90% |
| AI cost/asset | $0.15 | $0.12 | $0.10 |

## 5.4 Risk Checkpoints

**Day 30 Checkpoint:**
- [ ] System deployed and operational? If NO → assess blocker
- [ ] 10 content assets published? If < 5 → content pipeline blocked
- [ ] Affiliate tracking working? If NO → fix before proceeding
- [ ] Daily burn < $5? If NO → activate cost guardrails

**Day 60 Checkpoint:**
- [ ] GSC showing impressions? If ZERO at Day 60 → SEO technical audit
- [ ] Content quality consistently > 75? If NO → improve prompts
- [ ] Any revenue signal (even $1)? If NO with 20+ assets → affiliate strategy review
- [ ] Founder < 2 hours/day? If NO → identify automation gaps

**Day 90 Checkpoint:**
- [ ] > 500 organic sessions? If NO → keyword strategy review
- [ ] > $50 revenue? If NO with good traffic → monetization optimization
- [ ] < $30/month total cost? If NO → cost audit
- [ ] System > 70% autonomous? If NO → agent development backlog

## 5.5 Kill / Pivot Criteria

### Kill Signal (Consider stopping Phase 1 track):
- Day 90: Zero organic traffic despite 40+ published assets AND GSC impressions < 100
- Day 90: AI costs consistently > $60/month with < $10 revenue
- Day 90: Quality scores consistently < 65 despite prompt optimization
- Founder burns out (> 4 hours/day after Week 8)

### Pivot Options (Before killing):
1. **Niche Pivot:** Same system, different niche. 2-week switch cost.
2. **Revenue Model Pivot:** From affiliate to lead generation or info products.
3. **Tech Stack Simplification:** Remove agents, run manually-triggered only.
4. **Platform Pivot:** Build as agency tool instead of personal operator.

### Continue Signal (All green lights):
- Day 60: Any organic traffic + first affiliate click
- Day 90: > $50 revenue + growing traffic trend

---

# SECTION 6 — AI IDE AGENT CONTEXT & VIBE CODING GUIDELINES

## 6.1 Enriched Agent Context Files

### File: `.agent/context.md` (v2.1 — replaces v2.0 version)

```markdown
# SIMIS Agent Context — Version 2.1

## Project Identity
SIMIS (Self-Improving Media Intelligence System) branded as MediaFarm.
This is a multi-domain platform, NOT a simple CRUD app.
Constitutional documents: docs/constitution/ — READ before coding.

## Core Intelligence Loop (MEMORIZE THIS)
RAW DATA → KNOWLEDGE → INTELLIGENCE → DECISION → EXECUTION 
→ TRAFFIC → CONVERSION → REVENUE → LEARNING → BETTER DECISION

## Domain Map (8 Bounded Contexts)
1. Intelligence: BC-01 — Acquisition and processing of external information
2. Knowledge: BC-02 — Entity/topic/relationship graph
3. Content: BC-03 — Planning, generation, publishing
4. Revenue: BC-04 — Affiliate, ads, attribution
5. Learning: BC-05 — Predictions, observations, calibration
6. Agent: BC-06 — Orchestration, governance, memory
7. Analytics: PostHog integration layer
8. Platform: Auth, multi-tenancy, settings

## Technology Fingerprint
Frontend: Next.js 15 / React 19 / TypeScript / Tailwind / shadcn/ui
Backend: FastAPI / Python 3.12 / Pydantic v2 / SQLAlchemy async
DB: Supabase PostgreSQL 15 + pgvector + pg_trgm + RLS
Cache: Upstash Redis (Sliding window rate limiting + agent locks + idempotency)
Queue: Trigger.dev v3 (scheduled + event-triggered jobs)
AI: Gemini 1.5 Pro (generation/synthesis) / Groq (fast extraction) / OpenRouter (fallback)
Agents: LangGraph stateful workflows (StateGraph pattern)
Crawler: Crawl4AI (self-hosted Docker) + Firecrawl (fallback)
Analytics: PostHog (product + revenue events)
Error: Sentry (distributed tracing)
Monorepo: Turborepo + pnpm workspaces

## Multi-Tenancy Rules (NON-NEGOTIABLE)
- EVERY database table (except system tables) has organization_id UUID
- EVERY query must include WHERE organization_id = $1
- EVERY new table needs RLS: ALTER TABLE x ENABLE ROW LEVEL SECURITY
- EVERY RLS policy scopes to: WHERE organization_id = (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
- Agent payloads ALWAYS include organization_id

## Economic Constitution
- EVERY AI call must be cost-tracked via operation_costs table
- EVERY content asset must trace to revenue potential
- TOKEN_BUDGETS in services/ai/cost_config.py must be respected
- If operation type not in TOKEN_BUDGETS → add it before implementing

## Error Handling Constitution
- ALL async I/O calls use with_retry() from lib/resilience.py
- ALL external service calls wrapped in circuit breaker
- ALL Trigger.dev jobs implement DLQ pattern on final failure
- ALL queue-triggered functions decorated with @idempotent()
- NEVER swallow exceptions silently — log or re-raise

## Testing Constitution
- Unit tests: pytest (Python) / Vitest (TypeScript)
- Minimum 80% coverage on service layer
- Test file naming: test_{module_name}.py / {module_name}.test.ts
- ALWAYS test happy path + error path + edge cases

## File/Package Boundaries
apps/web/           → Next.js frontend only. NO direct DB queries. Use API or Server Actions.
apps/api/           → FastAPI. Business logic lives in services/. Routers are thin.
packages/database/  → Migrations ONLY. No business logic.
packages/ai-client/ → AI provider abstraction. Import this, not raw AI SDKs.
agents/             → LangGraph agent definitions. Each agent has own directory.
services/           → Shared Python services (not a separate process — library)

## Coding Style Quick Reference
Python:
  - Type annotations on ALL functions
  - Pydantic BaseModel for all data contracts
  - async def for ALL I/O operations
  - snake_case for all names
  - max function length: 50 lines (extract helpers)

TypeScript:
  - Strict mode, no `any`
  - Explicit return types on all functions
  - camelCase functions/variables, PascalCase components/types
  - Server Components by default, Client Components only when needed
  - Zod for all external input validation

Database:
  - UUID primary keys (gen_random_uuid())
  - Timestamps: created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
  - Index every: (organization_id, status, created_at DESC)
  - Index every: foreign keys used in JOINs
  - No raw SQL string concatenation — use parameterized queries
```

### File: `.agent/skills/create-new-feature.md`

```markdown
# Skill: Create New Feature in SIMIS

## Decision Tree

1. Which bounded context does this feature belong to?
   → Check docs/constitution/system.md section 1.6
   
2. Does it require a new database table?
   → YES: Create migration file. Follow schema standards.
   → NO: Skip to step 4.

3. New table checklist:
   □ id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   □ organization_id UUID REFERENCES organizations(id)
   □ created_at TIMESTAMPTZ DEFAULT now()
   □ updated_at TIMESTAMPTZ DEFAULT now() + trigger
   □ RLS enabled + isolation policy created
   □ Index: (organization_id, status, created_at DESC)
   □ Index: all foreign keys used in queries

4. Does it require new API endpoints?
   → YES: Create FastAPI router + Pydantic models + service functions
   → NO: Use existing endpoints or Server Actions

5. API endpoint checklist:
   □ Pydantic request/response models defined
   □ organization_id extracted from JWT, not from request body
   □ Rate limit check at endpoint level
   □ Error handling returns structured APIResponse
   □ Prediction recording if this is a "major action"

6. Does it require agent capability?
   → YES: Add to agent capabilities list + governance policy
   → NO: Skip

7. UI checklist:
   □ Server Component (default) or Client Component (if realtime/interactive)
   □ Loading state implemented
   □ Error state implemented
   □ Revenue signal visible alongside editorial signal (P-08)
   □ Uses shadcn/ui components (not custom)

8. Testing checklist:
   □ Unit test: service function happy path
   □ Unit test: service function error path
   □ Unit test: edge cases (empty inputs, boundary values)
   □ Integration test: API endpoint

9. Learning loop checklist:
   □ If content-related: prediction recorded on execution
   □ If revenue-related: attribution hooks added
   □ If agent task: task trace persisted
```

## 6.2 Granular Naming Conventions

### TypeScript/JavaScript

```typescript
// ✅ CORRECT naming patterns

// Files
// Components: PascalCase
// ContentBriefBuilder.tsx
// RevenueAttributionChart.tsx

// Services/utilities: camelCase
// briefService.ts
// affiliateOpportunityDetector.ts
// costCalculator.ts

// Types/interfaces: PascalCase with descriptive suffix
interface ContentBriefInput {}       // Input to a service function
interface ContentBrief {}            // Domain entity
interface ContentBriefResponse {}    // API response
type ContentBriefStatus = 'planned' | 'ready' | 'generating' | 'complete'

// Constants: SCREAMING_SNAKE_CASE
const MAX_CONTENT_GENERATION_RETRIES = 3
const DEFAULT_QUALITY_THRESHOLD = 75
const GEMINI_FLASH_MODEL = "gemini-1.5-flash-latest"

// Functions: camelCase, verb-first
async function generateContentBrief(input: ContentBriefInput): Promise<ContentBrief>
async function detectAffiliateOpportunities(contentId: string): Promise<AffiliateOpportunity[]>
async function recordContentPrediction(briefId: string, expected: PredictionInput): Promise<Prediction>

// React components: PascalCase, noun
function ContentBriefBuilder({ briefId }: { briefId: string }) {}
function RevenueAttributionExplorer() {}
function AgentActivityFeed({ organizationId }: Props) {}

// Hooks: camelCase, "use" prefix
function useContentBrief(briefId: string) {}
function useRevenueSummary(dateRange: DateRange) {}
function useAgentTasks(agentId: string) {}

// Events: PascalCase, past tense
type BriefCreated = { briefId: string; organizationId: string; timestamp: string }
type ContentPublished = { contentId: string; siteId: string; url: string }
type PredictionRecorded = { predictionId: string; entityId: string; type: PredictionType }

// Zustand stores: camelCase + Store suffix
const useContentStore = create<ContentStore>(...)
const useAgentStore = create<AgentStore>(...)

// ❌ INCORRECT patterns to avoid
// Don't use: data, info, item (too generic)
// Don't use: handleXxx for non-event-handler functions
// Don't use: getXxxData (just getXxx)
// Don't use: IInterface or TType prefixes
```

### Python

```python
# ✅ CORRECT naming patterns

# Files: snake_case
# brief_service.py
# affiliate_opportunity_detector.py
# cost_calculator.py

# Classes: PascalCase
class BriefService:
class AffiliateOpportunityDetector:
class ContentGenerationAgent:

# Pydantic models: PascalCase with Input/Response/Config suffix
class BriefCreateInput(BaseModel):
class BriefResponse(BaseModel):
class BriefGenerationConfig(BaseModel):

# Functions/methods: snake_case, verb-first
async def generate_content_brief(input: BriefCreateInput) -> BriefResponse:
async def detect_affiliate_opportunities(content_id: UUID) -> list[AffiliateOpportunity]:
async def record_content_prediction(brief_id: UUID, expected: PredictionInput) -> Prediction:

# Constants: SCREAMING_SNAKE_CASE
MAX_CONTENT_GENERATION_RETRIES = 3
DEFAULT_QUALITY_THRESHOLD = 75.0
GEMINI_FLASH_MODEL = "gemini-1.5-flash-latest"

# Private methods: leading underscore
async def _validate_brief_input(input: BriefCreateInput) -> None:
async def _load_site_context(site_id: UUID) -> SiteContext:

# Database column references: use exact column names (snake_case)
# organization_id, content_asset_id, affiliate_program_id
# created_at, updated_at, published_at

# ❌ INCORRECT patterns
# Don't use: camelCase for Python
# Don't use: get_xxx_data (just get_xxx)
# Don't use: do_xxx (just xxx the action directly)
# Don't use: manager, handler as class names without domain specificity
```

### Database

```sql
-- ✅ CORRECT naming patterns

-- Tables: plural, snake_case
-- content_assets, affiliate_links, revenue_events, graph_nodes

-- Columns: snake_case, descriptive
-- organization_id (not org_id)
-- content_asset_id (not content_id when referring to content_assets)
-- affiliate_program_id (not program_id — too generic)
-- published_at (not publish_date)
-- created_at, updated_at (always timestamptz)

-- Indexes: {table}_{columns}_{type}_idx
CREATE INDEX content_assets_org_status_created_idx
  ON content_assets (organization_id, status, created_at DESC);
CREATE INDEX signals_embedding_ivfflat_idx
  ON signals USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX entities_name_trgm_idx
  ON entities USING gin (canonical_name gin_trgm_ops);

-- Policies: {table}_{description}_policy
CREATE POLICY "content_assets_org_isolation_policy" ON content_assets ...
CREATE POLICY "signals_insert_org_check_policy" ON signals ...

-- Triggers: {table}_{event}_{action}_trigger
CREATE TRIGGER content_assets_updated_at_trigger
  BEFORE UPDATE ON content_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views: descriptive, no v_ prefix
CREATE VIEW content_asset_roi AS ...
CREATE VIEW daily_ai_costs AS ...
CREATE VIEW agent_performance_metrics AS ...

-- Functions: snake_case, verb-noun
CREATE FUNCTION compute_entity_authority_score(entity_id UUID) RETURNS NUMERIC ...
CREATE FUNCTION get_content_revenue_attribution(content_asset_id UUID) RETURNS ...
```

## 6.3 Starter Templates & Boilerplate

### Template: New FastAPI Service Module

```python
# services/{domain}/{feature}_service.py
# Template: copy this for every new service module

from __future__ import annotations

import logging
from uuid import UUID
from typing import Sequence

from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from packages.database.models import {DomainModel}
from packages.ai_client import AIClient, with_retry
from packages.database.repositories import {Domain}Repository
from packages.observability import trace_operation

logger = logging.getLogger(__name__)


# ── Input/Output Models ──────────────────────────────────────────────────────

class {Feature}Input(BaseModel):
    organization_id: UUID
    # ... fields


class {Feature}Response(BaseModel):
    id: UUID
    # ... fields


# ── Service Class ────────────────────────────────────────────────────────────

class {Feature}Service:
    """
    Responsibility: {Single sentence describing what this service does}
    
    Constitutional alignment:
    - P-02 (Revenue Attribution): {how this service traces to revenue}
    - P-03 (Prediction Before Action): {if applicable}
    - P-10 (Observability): All operations logged with trace_id
    """
    
    def __init__(
        self,
        db: AsyncSession,
        ai_client: AIClient,
        repo: {Domain}Repository,
    ):
        self.db = db
        self.ai_client = ai_client
        self.repo = repo
    
    @trace_operation("{domain}.{feature}")
    async def execute(self, input: {Feature}Input) -> {Feature}Response:
        """
        Main entry point. Document preconditions, inputs, outputs here.
        
        Args:
            input: {Feature}Input with validated fields
        
        Returns:
            {Feature}Response
        
        Raises:
            {Feature}NotFoundError: if target entity not found
            {Feature}ValidationError: if input fails business rules
            AIProviderError: if AI call fails after retries (caller handles)
        """
        logger.info(
            "{feature}.execute.start",
            extra={
                "organization_id": str(input.organization_id),
                # ... other relevant fields
            }
        )
        
        # Step 1: Load dependencies
        # Step 2: Validate business rules  
        # Step 3: Execute core logic
        # Step 4: Persist results
        # Step 5: Record prediction (if applicable)
        # Step 6: Emit domain event
        # Step 7: Return response
        
        raise NotImplementedError("Implement {feature}")
    
    async def _validate(self, input: {Feature}Input) -> None:
        """Business rule validation. Raise {Feature}ValidationError on failure."""
        pass
    
    async def _emit_event(self, result: {Feature}Response) -> None:
        """Emit domain event via Supabase Realtime."""
        pass


# ── Error Classes ────────────────────────────────────────────────────────────

class {Feature}NotFoundError(Exception):
    def __init__(self, id: UUID):
        super().__init__(f"{Feature} not found: {id}")

class {Feature}ValidationError(Exception):
    def __init__(self, message: str):
        super().__init__(f"{Feature} validation failed: {message}")
```

### Template: New Next.js Server Action

```typescript
// apps/web/app/(dashboard)/{domain}/{feature}/actions.ts
// Template for Server Actions

"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { APIResponse } from "@simis/shared-types"

// ── Validation Schema ────────────────────────────────────────────────────────

const {Feature}Schema = z.object({
  // ... Zod validation matching input requirements
})

type {Feature}Input = z.infer<typeof {Feature}Schema>

// ── Server Action ────────────────────────────────────────────────────────────

export async function {featureAction}(
  input: {Feature}Input
): Promise<APIResponse<{Feature}Response>> {
  // 1. Validate input
  const validated = {Feature}Schema.safeParse(input)
  if (!validated.success) {
    return {
      data: null,
      error: validated.error.message,
    }
  }
  
  // 2. Get authenticated user + organization
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: "Unauthorized" }
  }
  
  // 3. Get organization_id (ALWAYS — never trust client-provided)
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single()
  
  if (!membership) {
    return { data: null, error: "No organization membership" }
  }
  
  // 4. Call FastAPI service (for complex operations) OR direct Supabase (for CRUD)
  try {
    const response = await fetch(`${process.env.API_URL}/v1/{domain}/{feature}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({
        ...validated.data,
        organization_id: membership.organization_id,  // Always server-injected
      }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      return { data: null, error: error.detail || "Operation failed" }
    }
    
    const result = await response.json()
    
    // 5. Revalidate relevant cached paths
    revalidatePath("/dashboard/{domain}")
    
    return { data: result, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
```

### Template: New LangGraph Agent

```python
# agents/{agent_name}/agent.py
# Template for new LangGraph agent

from __future__ import annotations

import logging
from typing import TypedDict, Annotated
from uuid import UUID

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from packages.ai_client import AIClient
from packages.database import get_db
from services.agents.governance import check_governance_policy
from services.agents.cost_guard import AgentCostGuard

logger = logging.getLogger(__name__)


# ── Agent State ──────────────────────────────────────────────────────────────

class {AgentName}State(TypedDict):
    # Task context (always present)
    organization_id: str
    agent_task_id: str
    
    # Input
    # ... task-specific input fields
    
    # Working state
    # ... intermediate computation state
    
    # Output
    result: dict | None
    error: str | None
    
    # Governance
    total_cost_usd: float
    iteration_count: int


# ── Agent Nodes ──────────────────────────────────────────────────────────────

async def validate_inputs(state: {AgentName}State) -> {AgentName}State:
    """Validate all preconditions before expensive operations."""
    # Check: does task payload have required fields?
    # Check: does organization have required resources?
    # Check: is agent within governance limits?
    return state

async def {primary_operation}(state: {AgentName}State) -> {AgentName}State:
    """Core operation. Must track cost."""
    cost_guard = AgentCostGuard(
        max_cost_usd=0.30,  # from governance policy
        task_id=state["agent_task_id"]
    )
    # ... implement
    return state

async def record_outcome(state: {AgentName}State) -> {AgentName}State:
    """Persist results and emit domain event."""
    # ... save to database
    # ... emit domain event
    return state

def should_continue(state: {AgentName}State) -> str:
    """Routing function: determines next node."""
    if state.get("error"):
        return "handle_error"
    if state["iteration_count"] >= 10:  # Safety limit
        return "record_outcome"
    # ... other conditions
    return "record_outcome"

async def handle_error(state: {AgentName}State) -> {AgentName}State:
    """Graceful error handling with logging."""
    logger.error(
        "{agent_name}.error",
        extra={
            "task_id": state["agent_task_id"],
            "error": state.get("error"),
        }
    )
    return state


# ── Graph Definition ─────────────────────────────────────────────────────────

def build_{agent_name}_graph() -> StateGraph:
    graph = StateGraph({AgentName}State)
    
    graph.add_node("validate_inputs", validate_inputs)
    graph.add_node("{primary_operation}", {primary_operation})
    graph.add_node("record_outcome", record_outcome)
    graph.add_node("handle_error", handle_error)
    
    graph.set_entry_point("validate_inputs")
    
    graph.add_conditional_edges(
        "validate_inputs",
        should_continue,
        {
            "{primary_operation}": "{primary_operation}",
            "handle_error": "handle_error",
        }
    )
    graph.add_edge("{primary_operation}", "record_outcome")
    graph.add_edge("record_outcome", END)
    graph.add_edge("handle_error", END)
    
    return graph


# ── Entry Point ──────────────────────────────────────────────────────────────

async def run_{agent_name}(
    organization_id: str,
    task_id: str,
    # ... other params
) -> dict:
    """Entry point for Trigger.dev job."""
    
    # Governance check
    await check_governance_policy("{agent_name}", organization_id)
    
    graph = build_{agent_name}_graph()
    
    # Compile with PostgreSQL checkpointer for persistence
    checkpointer = AsyncPostgresSaver(...)
    compiled = graph.compile(checkpointer=checkpointer)
    
    initial_state: {AgentName}State = {
        "organization_id": organization_id,
        "agent_task_id": task_id,
        "result": None,
        "error": None,
        "total_cost_usd": 0.0,
        "iteration_count": 0,
    }
    
    result = await compiled.ainvoke(
        initial_state,
        config={"configurable": {"thread_id": task_id}}
    )
    
    return result
```

### Template: New Database Migration

```sql
-- packages/database/migrations/{NNN}_{description}.sql
-- Template for every new migration

-- Migration: {NNN}_{description}
-- Date: YYYY-MM-DD
-- Author: {developer or AI agent ID}
-- Description: {One sentence summary}
-- Rollback: See bottom of this file

-- ── Forward Migration ──────────────────────────────────────────────────────

BEGIN;

-- 1. Create table
CREATE TABLE {table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- ... domain-specific columns
  
  -- Audit columns (ALWAYS include)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS (ALWAYS — no exceptions)
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- 3. Organization isolation policy
CREATE POLICY "{table_name}_org_isolation_policy" ON {table_name}
  USING (
    organization_id = (
      SELECT organization_id FROM org_members 
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

-- 4. Service role bypass (for backend API)
CREATE POLICY "{table_name}_service_role_bypass_policy" ON {table_name}
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Indexes
CREATE INDEX {table_name}_org_status_created_idx 
  ON {table_name} (organization_id, status, created_at DESC)
  WHERE status IS NOT NULL;

-- For foreign keys used in JOINs:
CREATE INDEX {table_name}_{fk_column}_idx 
  ON {table_name} ({fk_column});

-- 6. Updated_at trigger
CREATE TRIGGER {table_name}_updated_at_trigger
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Comments
COMMENT ON TABLE {table_name} IS '{Description of purpose}';
COMMENT ON COLUMN {table_name}.organization_id IS 'Multi-tenancy scope — required for RLS';

COMMIT;

-- ── Rollback ───────────────────────────────────────────────────────────────
-- To rollback this migration:
-- DROP TABLE IF EXISTS {table_name} CASCADE;
-- Note: CASCADE will remove all data and dependent objects.
-- Ensure dependent migrations are rolled back first if any.
```

## 6.4 Atomic Task Catalog

Each task below is independently executable by an AI IDE agent without ambiguity.

### TASK-DB-001: Add New Table with RLS
```
TASK: Add table `{table_name}` with standard SIMIS patterns

INPUTS: 
- Table name
- Column definitions
- Foreign key dependencies
- Index requirements

STEPS:
1. Create migration file: packages/database/migrations/{next_number}_{table_name}.sql
2. Add: id UUID PRIMARY KEY, organization_id UUID FK, created_at, updated_at
3. Add: specified domain columns
4. Add: ALTER TABLE ... ENABLE ROW LEVEL SECURITY
5. Add: org isolation policy (standard template)
6. Add: service_role bypass policy
7. Add: indexes per specification
8. Add: updated_at trigger
9. Add: Pydantic model in packages/database/models/{domain}.py
10. Add: TypeScript type in packages/shared-types/src/{domain}.ts
11. Run: pnpm supabase db push --local (verify locally)
12. Self-audit: all 10 checklist items in .agent/self-audit.md

DONE CRITERIA: Migration runs without error, RLS policy active, types generated
```

### TASK-API-001: Add New FastAPI Endpoint
```
TASK: Create endpoint POST /v1/{domain}/{action}

INPUTS:
- Domain and action name
- Request/response fields
- Business logic description
- AI dependencies (if any)

STEPS:
1. Create/update: apps/api/routers/{domain}.py — add route function
2. Create: apps/api/models/{domain}.py — Pydantic request/response models
3. Create/update: apps/api/services/{domain}/{action}_service.py — business logic
4. Add: JWT authentication check (copy from existing endpoint)
5. Add: organization_id extraction from JWT (NOT from request body)
6. Add: rate limit check (call rate_limiter.check_and_increment)
7. Add: cost tracking if AI operation
8. Write: test_services/{domain}/test_{action}_service.py
9. Write: test_routers/test_{domain}.py (happy path + 401 + 422)
10. Update: API docs string on route function

DONE CRITERIA: Tests pass, endpoint returns correct schema, unauthorized returns 401
```

### TASK-AGENT-001: Add Capability to Existing Agent
```
TASK: Add capability `{capability_name}` to {AgentName}

INPUTS:
- Capability description
- Input/output specification
- AI model to use
- Governance constraints

STEPS:
1. Open: agents/{agent_name}/agent.py
2. Add: new node function for capability
3. Add: node to StateGraph definition
4. Update: AgentState TypedDict with new fields
5. Update: governance.maxCostPerTask if capability is expensive
6. Add: capability to agent registry in db (update agents table)
7. Write: test for new node function
8. Update: AGENT_SPEC.md in agent directory

DONE CRITERIA: Agent runs new capability end-to-end, governance enforced
```

### TASK-UI-001: Add New Dashboard Page
```
TASK: Create page at /dashboard/{path}

INPUTS:
- Page name and purpose
- Data to display (specify API endpoints)
- Interactive elements needed
- Revenue signal to surface

STEPS:
1. Create: apps/web/app/(dashboard)/{path}/page.tsx (Server Component)
2. Create: apps/web/app/(dashboard)/{path}/loading.tsx (Skeleton)
3. Create: apps/web/app/(dashboard)/{path}/error.tsx (Error boundary)
4. Add: data fetching in page.tsx using server-side Supabase client
5. Create: components/{domain}/{PageName}.tsx for interactive elements
6. Add: revenue signal display (P-08: every page shows revenue opportunity)
7. Add: to navigation in apps/web/components/shared/Sidebar.tsx
8. Add: loading skeleton matching final layout

DONE CRITERIA: Page renders, shows data, handles loading/error states, < 1.5s LCP
```

### TASK-LEARN-001: Add Prediction Type for New Action
```
TASK: Add prediction recording for {action_type}

INPUTS:
- Action being predicted (e.g., "content will rank in top 10")
- Metric to predict (e.g., "ranking_position")
- Observation window (days)
- Observation source

STEPS:
1. Add to: services/learning/prediction_service.py — PREDICTION_DOMAINS dict
2. Add to: services/learning/observation_sources.py — OBSERVATION_SOURCES dict
3. Call: prediction_service.record_prediction() at the action trigger point
4. Add: observation_engine job to check this prediction type
5. Add: PredictionType enum value to shared types
6. Add: prediction display in Prediction Center UI (new prediction card type)
7. Write: test for prediction creation + observation resolution

DONE CRITERIA: Prediction created on action, resolved automatically after observation window
```

## 6.5 Self-Audit Checklist v2.1

```markdown
# SIMIS Pre-Submit Self-Audit Checklist v2.1

## LEVEL 1 — CRITICAL (Block submission if any fail)

### Security
- [ ] Zero hardcoded credentials in ANY file (grep: api_key, secret, password, token)
- [ ] All NEW tables have RLS enabled
- [ ] All NEW tables have org isolation policy
- [ ] All queries that return data include organization_id filter
- [ ] No SQL string concatenation — all parameterized
- [ ] Input validated with Pydantic (Python) or Zod (TypeScript) on ALL endpoints

### Multi-tenancy
- [ ] organization_id extracted from JWT/session, NOT from request body
- [ ] Agent payloads include organization_id
- [ ] No cross-organization data access possible in new code

### Economic Constitution
- [ ] Every new AI call has operation_type registered in TOKEN_BUDGETS
- [ ] Every new AI call calls cost tracking middleware
- [ ] New operations that exceed $0.15 have explicit approval flow

## LEVEL 2 — HIGH (Block submission if any fail)

### Error Handling
- [ ] All external I/O (HTTP, DB, AI) wrapped in try/except
- [ ] All retryable operations use with_retry() decorator
- [ ] External service calls use circuit breaker
- [ ] Trigger.dev jobs implement DLQ on final failure
- [ ] Queue-triggered functions use @idempotent() decorator
- [ ] No silent exception swallowing (every catch logs or re-raises)

### Learning Loop
- [ ] New "major actions" (content publish, brief create) record prediction
- [ ] New revenue event types have attribution hooks
- [ ] New agent tasks persist task trace

### Testing
- [ ] Unit test written for every new service function
- [ ] Happy path tested
- [ ] Error path tested (invalid inputs, provider failure)
- [ ] Coverage >= 80% on new code

## LEVEL 3 — MEDIUM (Flag but don't block)

### Architecture
- [ ] New code follows domain boundaries (no cross-context imports)
- [ ] Domain events emitted for state-changing operations
- [ ] No synchronous operations in async context
- [ ] No N+1 queries (verify with query logging)

### Performance
- [ ] New queries have appropriate indexes
- [ ] Expensive computations cached in Redis
- [ ] No blocking operations in hot paths

### UI Quality (if applicable)
- [ ] Loading state implemented
- [ ] Error state implemented
- [ ] Empty state implemented
- [ ] Revenue signal visible (P-08)
- [ ] Works on mobile breakpoint

## LEVEL 4 — LOW (Nice to have)

### Documentation
- [ ] New service functions have docstrings
- [ ] Complex business logic has inline comments
- [ ] New API endpoints have OpenAPI description
- [ ] ADR created for significant architecture decision
```

## 6.6 Prompt Library

### PROMPT-001: Content Brief Generation

```python
CONTENT_BRIEF_SYSTEM_PROMPT = """
You are a content strategy expert for a media intelligence platform called SIMIS.
Your task: Generate a comprehensive content brief for a specific target keyword.

CRITICAL OUTPUT REQUIREMENTS:
1. Return ONLY valid JSON matching the ContentBriefSchema exactly
2. No markdown, no preamble, no explanation — pure JSON only
3. All fields must be present — no null for required fields

QUALITY STANDARDS:
- Outline must be genuinely differentiated from competitors (not a copy of their structure)
- Affiliate opportunities must be specific products/programs, not generic categories
- Predicted metrics must be conservative (err on the side of under-prediction)
- Entity list must include entities that MUST be mentioned for topical authority

REVENUE MANDATE (P-02):
Every brief must include at least one affiliate opportunity if applicable to the niche.
If no direct affiliate match, include lead generation or ad monetization signal.
"""

CONTENT_BRIEF_USER_PROMPT = """
Generate a content brief for the following:

TARGET KEYWORD: {{target_keyword}}
CONTENT TYPE: {{content_type}}
NICHE: {{site_niche}}
SITE AUTHORITY: {{domain_authority_estimate}} (1-100 scale)
BRAND VOICE: {{brand_voice_description}}

SERP DATA (top 5 results):
{{serp_data_json}}

COMPETITOR CONTENT ANALYSIS:
{{competitor_analysis_json}}

EXISTING CONTENT ON SITE (for internal linking):
{{existing_content_list}}

AFFILIATE PROGRAMS AVAILABLE:
{{affiliate_programs_json}}

Generate the complete content brief JSON now.
"""
```

### PROMPT-002: Content Generation (Full Draft)

```python
CONTENT_GENERATION_SYSTEM_PROMPT = """
You are a professional content writer for {{site_name}}, a media website in the {{niche}} space.

BRAND VOICE: {{brand_voice}}
TARGET AUDIENCE: {{target_audience}}
CONTENT STANDARDS:
- Minimum fact density: 1 verifiable claim per 200 words
- Entity coverage: all required entities must appear in natural context
- Affiliate links: use [AFFILIATE:{{program_id}}:{{anchor_text}}] placeholder format
- Internal links: use [INTERNAL:{{content_slug}}:{{anchor_text}}] placeholder format
- Schema: use [FAQ:Q] and [FAQ:A] markers for FAQ schema content
- NEVER hallucinate statistics — mark uncertain claims with [VERIFY: claim]
- Readability target: 8th grade reading level for general topics

OUTPUT: Pure markdown content. No preamble. Start directly with the article content.
"""

CONTENT_GENERATION_USER_PROMPT = """
Generate a complete {{content_type}} article from this brief.

BRIEF:
{{brief_json}}

WRITING REQUIREMENTS:
- Target length: {{target_word_count}} words (±10%)
- Tone: {{tone}}
- Required affiliate insertion points: {{affiliate_opportunities}}
- Required entities to mention: {{required_entities}}
- Required claims to address: {{required_claims}}

COMPETITOR DIFFERENTIATION:
These topics are already covered by top competitors — your article must add unique value:
{{competitor_coverage_summary}}

Write the complete article now, starting with the H1 title.
"""
```

### PROMPT-003: Entity Extraction (Groq Fast)

```python
ENTITY_EXTRACTION_SYSTEM_PROMPT = """
Extract named entities from the provided text.
Return ONLY a JSON array. No preamble.

Entity types to extract:
- product: Specific products (software, hardware, physical goods)
- company: Organizations, brands, businesses
- person: Named individuals
- technology: Frameworks, programming languages, tools, platforms
- location: Countries, cities, regions
- concept: Important abstract concepts specific to the domain

For each entity include:
- name: canonical name (properly capitalized)
- type: one of the types above
- confidence: 0.0-1.0 (how confident you are this is a named entity, not a generic noun)
- aliases: other names this entity is known by (empty array if none)

Only include entities with confidence >= 0.65.
Return [] if no entities found.
"""

ENTITY_EXTRACTION_USER_PROMPT = """
Extract entities from this text:

{{text}}
"""
```

### PROMPT-004: Research Synthesis

```python
RESEARCH_SYNTHESIS_SYSTEM_PROMPT = """
You are a research analyst synthesizing multiple sources into a structured intelligence document.
The document will be used to generate content briefs and update a knowledge graph.

OUTPUT FORMAT: Structured markdown with the following sections:
1. Executive Summary (3-5 sentences)
2. Key Facts (bullet list, sourced)
3. Key Entities Identified (list with type and relevance)
4. Content Opportunities (gaps you identified)
5. Affiliate/Revenue Signals (products/services mentioned)
6. Confidence Assessment (how reliable is this research?)

QUALITY REQUIREMENTS:
- Every factual claim must cite its source (use [Source: URL] format)
- Mark conflicting information: [CONFLICT: source1 says X, source2 says Y]
- Mark outdated information: [OUTDATED: as of YYYY-MM]
- Do NOT include opinion as fact

SCOPE CONSTRAINT:
Focus on {{research_focus}}. Ignore irrelevant tangents.
"""
```

### PROMPT-005: Quality Scoring

```python
QUALITY_SCORING_SYSTEM_PROMPT = """
You are a content quality evaluator. Score the provided content on specific dimensions.
Return ONLY valid JSON matching QualityScoreSchema. No preamble.

SCORING RUBRICS:

SEO Score (0-100):
- 90-100: Keyword in title, H1, first 100 words, 2+ H2s; density 1-2%; schema present
- 70-89: Most SEO requirements met; minor gaps
- 50-69: Keyword present but optimization incomplete
- 0-49: Poor SEO fundamentals

Entity Coverage (0-100):
- 100: All required entities mentioned in natural, contextual way
- 80-99: Most required entities covered; minor gaps
- 50-79: Some required entities missing
- 0-49: Major entity coverage gaps

Readability (0-100):
- 90-100: Clear, concise, appropriate grade level; good paragraph breaks
- 70-89: Mostly readable; some dense sections
- 50-69: Some readability issues; long sentences or paragraphs
- 0-49: Difficult to read

Structural Integrity (0-100):
- 100: Complete intro, body sections with H2/H3, conclusion; logical flow
- 70-99: Good structure; minor gaps
- 0-69: Missing key structural elements

Fact Density (0-100):
- 100: 1+ verifiable claims per 200 words; statistics, examples, citations
- 70-99: Good fact density with some general claims
- 0-69: Too many unsupported general statements
"""
```

## 6.7 Context Files Index (Complete Set for `.agent/`)

```
.agent/
├── context.md              ← System overview (v2.1 version above)
├── planning.md             ← Feature planning guide
├── self-audit.md           ← Pre-submit checklist (v2.1 above)
├── collaboration.md        ← Multi-agent coordination (v2.0 retained)
├── skills/
│   ├── create-new-feature.md     ← Decision tree for new features
│   ├── debug-agent-failure.md    ← Agent debugging guide
│   ├── add-database-table.md     ← Database task template
│   ├── add-api-endpoint.md       ← API task template
│   └── optimize-ai-cost.md       ← Cost optimization guide
├── tasks/
│   ├── content-generation-task.md  (v2.0 retained)
│   ├── feed-ingestion-task.md
│   ├── serp-analysis-task.md
│   ├── affiliate-detection-task.md
│   └── prediction-recording-task.md
└── prompts/
    ├── content-brief.md
    ├── content-generation.md
    ├── entity-extraction.md
    ├── research-synthesis.md
    └── quality-scoring.md
```

---

# SECTION 7 — UPDATED TECHNICAL ARCHITECTURE & IMPLEMENTATION

## 7.1 Phase 1 Infrastructure Reality Check

Version 2.0 listed infrastructure correctly. Version 2.1 adds concrete configuration and known limitations.

### Critical Free Tier Limits (MUST monitor from Day 1)

| Service | Free Limit | SIMIS Daily Usage Estimate | Risk |
|---------|-----------|--------------------------|------|
| Supabase DB | 500MB | ~5MB/day growth | HIGH — plan archival |
| Supabase Storage | 1GB | ~50MB/month | LOW |
| Supabase Auth | 50k MAU | 1 user | LOW |
| Supabase Realtime | 200 concurrent | 1 operator | LOW |
| Vercel Hobby | 100GB bandwidth | ~1GB/month | LOW |
| Upstash Redis | 10k req/day | ~5k/day | MEDIUM |
| Trigger.dev | 50k runs/month | ~720/month (optimized) | LOW |
| Gemini API | 15 req/min free | ~2 req/min avg | LOW |
| Groq | 14400 req/day free | ~50 req/day | LOW |
| Brave Search | 2000 req/month | ~100/month | LOW |
| Serper | 2500 req/month | ~200/month | LOW |
| Crawl4AI | Self-hosted | Memory bound | MEDIUM |
| PostHog | 1M events/month | ~50k/month | LOW |
| Firecrawl | 500 pages/month | ~50/month | LOW |
| Sentry | 5k errors/month | ~10/month | LOW |

### Upstash Redis Budget (10k req/day)

```
Budget allocation for 10k daily requests:
- Rate limiting checks: ~1000/day (100 API calls × 10 checks each)
- Agent locks: ~200/day (agents run ~10 tasks/day × 2 Redis ops each)
- Session caching: ~2000/day
- SERP caching: ~300/day
- Idempotency checks: ~500/day
- Dashboard metrics cache: ~2000/day
- Working memory (agents): ~1000/day
─────────────────────────────────
Total: ~7000/day — within 10k limit with 30% buffer
```

## 7.2 Missing Schema Tables (Additions to v2.0)

```sql
-- Table: operation_costs (cost tracking — new in v2.1)
CREATE TABLE operation_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  agent_task_id UUID REFERENCES agent_tasks(id),
  content_asset_id UUID REFERENCES content_assets(id),
  operation_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  estimated_cost_usd NUMERIC(10, 6),
  actual_cost_usd NUMERIC(10, 6),
  budget_usd NUMERIC(10, 6),
  over_budget BOOLEAN GENERATED ALWAYS AS (actual_cost_usd > budget_usd * 1.5) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX operation_costs_org_created_idx 
  ON operation_costs (organization_id, created_at DESC);

-- Table: dead_letter_queue (new in v2.1)
CREATE TABLE dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  job_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  error TEXT,
  failed_at TIMESTAMPTZ DEFAULT now(),
  requires_human_review BOOLEAN DEFAULT true,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: system_alerts (new in v2.1)
CREATE TABLE system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  alert_type TEXT NOT NULL,  -- 'cost_guardrail', 'agent_failure', 'affiliate_link_broken', 'revenue_anomaly'
  level TEXT NOT NULL,  -- 'info', 'warning', 'critical'
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  action_required BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX system_alerts_org_resolved_created_idx 
  ON system_alerts (organization_id, resolved_at NULLS FIRST, created_at DESC);

-- Table: content_refresh_queue (new in v2.1)
CREATE TABLE content_refresh_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  content_asset_id UUID REFERENCES content_assets(id),
  trigger_type TEXT NOT NULL,  -- 'age', 'rank_drop', 'traffic_drop', 'competitor_update', 'dead_links'
  priority_score NUMERIC DEFAULT 0,
  refresh_brief JSONB,  -- diff brief for what needs updating
  status TEXT DEFAULT 'queued',  -- 'queued', 'in_progress', 'completed', 'skipped'
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: api_usage_log (new in v2.1 — rate limit tracking)
CREATE TABLE api_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  endpoint_family TEXT NOT NULL,
  user_id UUID,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 7.3 AI Provider Abstraction Layer (Concrete Implementation)

```python
# packages/ai_client/client.py
from __future__ import annotations

import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncGenerator

import google.generativeai as genai
from groq import AsyncGroq
from openai import AsyncOpenAI  # OpenRouter uses OpenAI-compatible API

logger = logging.getLogger(__name__)


@dataclass
class AIResponse:
    content: str
    input_tokens: int
    output_tokens: int
    model: str
    provider: str
    latency_ms: float


class BaseAIProvider(ABC):
    @abstractmethod
    async def generate(
        self, 
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 4000,
    ) -> AIResponse:
        ...
    
    @abstractmethod
    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        schema: dict,
        temperature: float = 0.2,
    ) -> dict:
        """Generate structured JSON output — guaranteed schema compliance."""
        ...


class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: str, model: str = "gemini-1.5-flash-latest"):
        genai.configure(api_key=api_key)
        self.model_name = model
        self.model = genai.GenerativeModel(model)
    
    async def generate(self, system_prompt: str, user_prompt: str, **kwargs) -> AIResponse:
        start = time.monotonic()
        
        response = await self.model.generate_content_async(
            contents=[
                {"role": "user", "parts": [system_prompt + "\n\n" + user_prompt]}
            ],
            generation_config=genai.GenerationConfig(
                temperature=kwargs.get("temperature", 0.7),
                max_output_tokens=kwargs.get("max_tokens", 4000),
            )
        )
        
        latency_ms = (time.monotonic() - start) * 1000
        
        return AIResponse(
            content=response.text,
            input_tokens=response.usage_metadata.prompt_token_count,
            output_tokens=response.usage_metadata.candidates_token_count,
            model=self.model_name,
            provider="gemini",
            latency_ms=latency_ms,
        )
    
    async def generate_json(self, system_prompt: str, user_prompt: str, schema: dict, **kwargs) -> dict:
        import json
        
        json_prompt = f"{system_prompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no preamble.\nJSON Schema: {json.dumps(schema)}"
        
        response = await self.generate(json_prompt, user_prompt, temperature=0.1)
        
        # Clean potential markdown wrapping
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        
        return json.loads(content)


class GroqProvider(BaseAIProvider):
    def __init__(self, api_key: str, model: str = "llama-3.1-8b-instant"):
        self.client = AsyncGroq(api_key=api_key)
        self.model_name = model
    
    async def generate(self, system_prompt: str, user_prompt: str, **kwargs) -> AIResponse:
        start = time.monotonic()
        
        response = await self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=kwargs.get("temperature", 0.7),
            max_tokens=kwargs.get("max_tokens", 2000),
        )
        
        latency_ms = (time.monotonic() - start) * 1000
        message = response.choices[0].message
        
        return AIResponse(
            content=message.content,
            input_tokens=response.usage.prompt_tokens,
            output_tokens=response.usage.completion_tokens,
            model=self.model_name,
            provider="groq",
            latency_ms=latency_ms,
        )
    
    async def generate_json(self, system_prompt: str, user_prompt: str, schema: dict, **kwargs) -> dict:
        import json
        
        response = await self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": system_prompt + "\n\nReturn ONLY valid JSON."},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},  # Groq supports JSON mode
            temperature=0.1,
        )
        
        return json.loads(response.choices[0].message.content)


class AIClientWithFallback:
    """
    Multi-provider AI client with automatic fallback chain.
    Implements P-06 (Zero Single Points of Failure).
    """
    
    def __init__(
        self,
        providers: list[BaseAIProvider],
        cost_tracker,  # AIClientWithCostTracking instance
    ):
        self.providers = providers
        self.cost_tracker = cost_tracker
    
    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        operation_type: str,
        organization_id: str,
        **kwargs,
    ) -> AIResponse:
        last_error = None
        
        for provider in self.providers:
            try:
                response = await with_retry(
                    provider.generate,
                    max_attempts=2,
                    base_delay=2.0,
                    retryable_exceptions=(Exception,),
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    **kwargs,
                )
                
                # Track cost
                await self.cost_tracker.track(
                    organization_id=organization_id,
                    operation_type=operation_type,
                    response=response,
                )
                
                return response
                
            except Exception as e:
                logger.warning(
                    f"Provider {provider.__class__.__name__} failed: {e}. Trying next."
                )
                last_error = e
                continue
        
        raise AIProviderError(f"All providers failed. Last error: {last_error}")
```

---

# SECTION 8 — TESTING, CI/CD, DEPLOYMENT & OBSERVABILITY CONSTITUTION

## 8.1 Testing Strategy (Complete)

### Test Architecture

```
TEST PYRAMID — SIMIS v2.1

E2E Tests (5%)
  └── Playwright — Critical user journeys only
      ├── Onboarding: create org → create site → add feed → see first signal
      ├── Content: create brief → generate → affiliate insert → publish
      └── Revenue: affiliate click → commission webhook → attribution

Integration Tests (25%)
  ├── API Tests (Python httpx / pytest)
  │   ├── Authentication: valid JWT, invalid JWT, expired JWT
  │   ├── Authorization: org isolation (user A cannot access org B's data)
  │   ├── Rate limiting: exceeds limit returns 429
  │   └── Data integrity: created → retrieved → updated → deleted
  └── Database Tests (pytest with Supabase local)
      ├── RLS policies: each table, each scenario
      ├── Migration tests: apply migration → verify schema
      └── Trigger tests: updated_at auto-updated

Unit Tests (70%)
  ├── Service Layer (Python pytest)
  │   ├── Happy path: valid inputs → expected output
  │   ├── Error path: invalid inputs → correct exception
  │   ├── Edge cases: empty inputs, boundary values, concurrent calls
  │   └── Mock: all external dependencies (AI, HTTP, DB)
  └── TypeScript (Vitest)
      ├── Utility functions
      ├── Data transformations
      └── Component logic (not rendering)
```

### Unit Test Examples

```python
# test_services/content/test_brief_service.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from services.content.brief_service import BriefService, BriefCreateInput


@pytest.fixture
def mock_ai_client():
    client = AsyncMock()
    client.generate_json.return_value = {
        "target_keyword": "best coffee makers 2024",
        "content_type": "listicle",
        "outline": ["Introduction", "Top 10 Coffee Makers", "FAQ"],
        "estimated_word_count": 2500,
        "affiliate_opportunities": [
            {"product": "Breville Barista Express", "program": "amazon", "anchor": "best espresso machine"}
        ],
        "predicted_monthly_traffic": 500,
        "predicted_monthly_revenue": 25.0,
    }
    return client

@pytest.fixture
def mock_serp_service():
    service = AsyncMock()
    service.get_serp_data.return_value = {
        "keyword": "best coffee makers 2024",
        "results": [{"url": "https://example.com/best-coffee", "position": 1}]
    }
    return service

@pytest.fixture
def brief_service(mock_ai_client, mock_serp_service):
    return BriefService(
        db=AsyncMock(),
        ai_client=mock_ai_client,
        serp_service=mock_serp_service,
        prediction_service=AsyncMock(),
    )


class TestBriefService:
    
    async def test_create_brief_happy_path(self, brief_service):
        """Should generate outline from SERP data and record prediction."""
        input = BriefCreateInput(
            organization_id=uuid4(),
            site_id=uuid4(),
            target_keyword="best coffee makers 2024",
            content_type="listicle",
        )
        
        result = await brief_service.create(input)
        
        assert result.target_keyword == "best coffee makers 2024"
        assert len(result.outline) > 0
        assert len(result.affiliate_opportunities) > 0
        # Verify prediction was recorded
        brief_service.prediction_service.record.assert_called_once()
    
    async def test_create_brief_records_prediction(self, brief_service):
        """Prediction MUST be recorded — P-03 constitutional requirement."""
        input = BriefCreateInput(
            organization_id=uuid4(),
            site_id=uuid4(),
            target_keyword="test keyword",
            content_type="article",
        )
        
        await brief_service.create(input)
        
        # Verify prediction recorded with correct fields
        call_args = brief_service.prediction_service.record.call_args
        assert call_args.kwargs["prediction_type"] == "content.traffic"
        assert call_args.kwargs["confidence"] > 0
    
    async def test_create_brief_handles_ai_failure(self, brief_service):
        """Should raise BriefGenerationError when AI fails after retries."""
        brief_service.ai_client.generate_json.side_effect = Exception("API Error")
        
        input = BriefCreateInput(
            organization_id=uuid4(),
            site_id=uuid4(),
            target_keyword="test",
            content_type="article",
        )
        
        with pytest.raises(Exception):  # AI error propagates
            await brief_service.create(input)
    
    async def test_create_brief_validates_keyword_length(self, brief_service):
        """Should raise ValidationError for empty keyword."""
        with pytest.raises(ValueError):
            BriefCreateInput(
                organization_id=uuid4(),
                site_id=uuid4(),
                target_keyword="",  # Empty keyword should fail Pydantic validation
                content_type="article",
            )
```

### Integration Test Example

```python
# tests/integration/test_content_api.py
import pytest
from httpx import AsyncClient
from uuid import uuid4

from apps.api.main import app


@pytest.fixture
async def authenticated_client(test_db, test_org):
    """Client with valid JWT for test organization."""
    token = generate_test_jwt(test_org.id, test_org.owner_user_id)
    async with AsyncClient(app=app, base_url="http://test") as client:
        client.headers["Authorization"] = f"Bearer {token}"
        yield client


@pytest.fixture
async def other_org_client(test_db):
    """Client for a different organization — for isolation tests."""
    other_org = await create_test_org(test_db)
    token = generate_test_jwt(other_org.id, other_org.owner_user_id)
    async with AsyncClient(app=app, base_url="http://test") as client:
        client.headers["Authorization"] = f"Bearer {token}"
        yield client


class TestContentBriefAPI:
    
    async def test_create_brief_authenticated(self, authenticated_client, test_site):
        response = await authenticated_client.post("/v1/content/briefs", json={
            "site_id": str(test_site.id),
            "target_keyword": "best coffee makers",
            "content_type": "listicle",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["target_keyword"] == "best coffee makers"
    
    async def test_create_brief_unauthenticated(self, client):
        """401 without token."""
        response = await client.post("/v1/content/briefs", json={
            "site_id": str(uuid4()),
            "target_keyword": "test",
            "content_type": "article",
        })
        assert response.status_code == 401
    
    async def test_cannot_access_other_org_briefs(
        self, authenticated_client, other_org_client, test_site
    ):
        """Org isolation: org A cannot see org B's briefs."""
        # Create brief in org A
        response = await authenticated_client.post("/v1/content/briefs", json={
            "site_id": str(test_site.id),
            "target_keyword": "test",
            "content_type": "article",
        })
        brief_id = response.json()["data"]["id"]
        
        # Org B cannot access it
        response = await other_org_client.get(f"/v1/content/briefs/{brief_id}")
        assert response.status_code == 404  # RLS makes it invisible, not forbidden
```

### E2E Test Example

```typescript
// tests/e2e/content-pipeline.spec.ts
import { test, expect } from "@playwright/test"

test.describe("Content Pipeline E2E", () => {
  test("operator can create brief and generate content", async ({ page }) => {
    // 1. Login
    await page.goto("/login")
    await page.fill('[name="email"]', process.env.E2E_TEST_EMAIL!)
    await page.fill('[name="password"]', process.env.E2E_TEST_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL("/dashboard")
    
    // 2. Navigate to Content Planner
    await page.click('[data-testid="nav-content-planner"]')
    await page.waitForURL("/dashboard/content/planner")
    
    // 3. Create new brief
    await page.click('[data-testid="create-brief-btn"]')
    await page.fill('[name="targetKeyword"]', "best espresso machines 2024")
    await page.selectOption('[name="contentType"]', "listicle")
    await page.click('[data-testid="generate-brief-btn"]')
    
    // 4. Wait for brief to generate (may take 30s)
    await expect(page.locator('[data-testid="brief-outline"]')).toBeVisible({
      timeout: 60000
    })
    
    // 5. Verify affiliate opportunities detected
    await expect(page.locator('[data-testid="affiliate-opportunities"]')).toContainText(
      /Amazon|espresso/i
    )
    
    // 6. Generate content
    await page.click('[data-testid="generate-content-btn"]')
    await expect(page.locator('[data-testid="quality-score"]')).toBeVisible({
      timeout: 120000
    })
    
    // 7. Verify quality score >= 70
    const scoreText = await page.locator('[data-testid="quality-score"]').textContent()
    const score = parseInt(scoreText?.replace(/\D/g, '') || "0")
    expect(score).toBeGreaterThanOrEqual(70)
  })
})
```

## 8.2 SLO Definitions

| Service | SLO | Measurement | Burn Rate Alert |
|---------|-----|-------------|----------------|
| Dashboard load | < 1.5s LCP (P95) | Synthetic monitoring every 5min | > 3s for 15min |
| Content generation | < 3 min P95 | Trigger.dev job duration | > 10 min |
| Feed ingestion | < 2 hours behind real-time | Signal `fetched_at` vs `published_at` | > 6 hours |
| SERP API response | < 5 seconds P95 | API latency tracking | > 15s |
| Affiliate click tracking | < 500ms P99 | PostHog event latency | > 2s |
| Revenue attribution | < 24 hours after event | Attribution created within 24h | > 48h |
| Agent task queue | < 30 min queue wait | Task scheduled vs started | > 2 hours |

## 8.3 Database Migration Strategy

### Migration Principles

```
MIGRATION RULES (Constitutional):
1. Every migration must have a documented rollback
2. Never rename columns — ADD new + migrate data + DROP old (3 migrations)
3. Never DROP column without a deprecation migration first (add is_deprecated flag)
4. Zero-downtime: additive migrations are safe; destructive require maintenance window
5. Migrations numbered sequentially: 001_, 002_, etc.
6. Never write migration that locks table for > 1 second (use CONCURRENTLY)
7. Test every migration on local Supabase before pushing to staging
8. Never run migration directly on production — always through CI/CD pipeline
```

### Zero-Downtime Column Rename

```sql
-- SAFE: Rename column without downtime (3-step process)

-- Migration 047: Add new column (deploy, code uses both columns)
ALTER TABLE content_assets ADD COLUMN target_phrase TEXT;
UPDATE content_assets SET target_phrase = target_keyword;

-- Deploy code that reads new column, writes to both

-- Migration 048: Drop old column (after all code uses new column)
ALTER TABLE content_assets DROP COLUMN target_keyword;

-- Never: ALTER TABLE content_assets RENAME COLUMN target_keyword TO target_phrase;
-- (This locks the table and breaks existing code instantly)
```

### Adding Non-Nullable Column Safely

```sql
-- UNSAFE (locks table, breaks existing inserts):
-- ALTER TABLE content_assets ADD COLUMN word_count_target INTEGER NOT NULL;

-- SAFE (3 steps):

-- Step 1: Add as nullable with default
ALTER TABLE content_assets 
  ADD COLUMN word_count_target INTEGER DEFAULT 2000;

-- Step 2: Backfill existing rows (in batches to avoid lock)
DO $$
DECLARE
  batch_size INT := 1000;
  last_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  LOOP
    UPDATE content_assets
    SET word_count_target = 2000
    WHERE id > last_id
      AND word_count_target IS NULL
    ORDER BY id
    LIMIT batch_size
    RETURNING id INTO last_id;
    
    EXIT WHEN NOT FOUND;
    PERFORM pg_sleep(0.1);  -- Brief pause between batches
  END LOOP;
END $$;

-- Step 3: Add NOT NULL constraint (safe after backfill)
ALTER TABLE content_assets 
  ALTER COLUMN word_count_target SET NOT NULL;
```

### Index Creation (Zero-Downtime)

```sql
-- ALWAYS use CONCURRENTLY for new indexes on existing tables
-- (Regular CREATE INDEX locks the table for reads AND writes during build)

CREATE INDEX CONCURRENTLY content_assets_target_keyword_idx 
  ON content_assets (target_keyword)
  WHERE status = 'published';

-- Note: CONCURRENTLY cannot run inside a transaction block
-- Run outside BEGIN...COMMIT
```

## 8.4 Alerting & Self-Healing

### Alert Taxonomy

```python
# All alerts stored in system_alerts table AND sent to operator notification channel
ALERT_RULES = {
    # Cost alerts
    "daily_ai_cost_warning": {
        "check": "SELECT SUM(actual_cost_usd) FROM operation_costs WHERE DATE(created_at) = CURRENT_DATE AND organization_id = $1",
        "threshold": 3.0,  # USD
        "level": "warning",
        "message": "Daily AI cost at ${value:.2f} — approaching $5 limit",
        "action": None,  # No auto-action, just alert
    },
    "daily_ai_cost_critical": {
        "check": "same",
        "threshold": 5.0,
        "level": "critical",
        "message": "Daily AI cost ${value:.2f} exceeded. Non-essential agents paused.",
        "action": "pause_non_essential_agents",
    },
    
    # Performance alerts
    "feed_ingestion_stale": {
        "check": "SELECT COUNT(*) FROM signals WHERE fetched_at > NOW() - INTERVAL '2 hours' AND organization_id = $1",
        "threshold": 0,  # No new signals in 2 hours
        "level": "warning",
        "message": "No new signals in 2+ hours — feed ingestion may be failing",
        "action": "retry_feed_ingestion",
    },
    
    # Revenue alerts
    "revenue_anomaly_day": {
        "check": "revenue drop vs yesterday",
        "threshold": -40,  # -40% drop
        "level": "critical",
        "message": "Revenue dropped {change}% vs yesterday. Investigating...",
        "action": "run_revenue_anomaly_analysis",
    },
    
    # System health
    "dead_letter_queue_items": {
        "check": "SELECT COUNT(*) FROM dead_letter_queue WHERE requires_human_review = true AND reviewed_at IS NULL AND organization_id = $1",
        "threshold": 5,  # 5+ unreviewed DLQ items
        "level": "warning",
        "message": "{count} failed jobs require human review",
        "action": None,
    },
    
    # Agent alerts
    "agent_failure_rate": {
        "check": "SELECT COUNT(*) FROM agent_tasks WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 hour' AND organization_id = $1",
        "threshold": 3,
        "level": "warning",
        "message": "Agent failure rate elevated: {count} failures in last hour",
        "action": None,
    },
}
```

### Self-Healing Mechanisms

```python
# Self-healing actions (triggered by alerts)
async def pause_non_essential_agents(organization_id: str, reason: str) -> None:
    """Pause all agents except LearningAgent when cost critical."""
    essential_agents = ["learning-agent-v1"]
    
    await supabase.table("agents")\
        .update({
            "status": "paused",
            "paused_reason": reason,
            "paused_at": datetime.utcnow().isoformat()
        })\
        .eq("organization_id", organization_id)\
        .not_.in_("agent_id", essential_agents)\
        .execute()
    
    await emit_system_alert(
        organization_id=organization_id,
        alert_type="agents_paused",
        level="critical",
        message=f"Agents paused: {reason}",
        action_required=True,
    )

async def retry_feed_ingestion(organization_id: str) -> None:
    """Trigger immediate feed ingestion job."""
    from trigger.jobs import feedIngestionJob
    await feedIngestionJob.trigger(payload={"organization_id": organization_id, "force": True})

async def run_revenue_anomaly_analysis(organization_id: str) -> None:
    """Trigger revenue anomaly analysis."""
    # Queue LearningAgent task for immediate anomaly investigation
    await queue_agent_task(
        agent_id="learning-agent-v1",
        task_type="revenue_anomaly_investigation",
        organization_id=organization_id,
        priority="high",
    )
```

## 8.5 CI/CD Pipeline (Complete)

```yaml
# .github/workflows/ci.yml
name: SIMIS CI/CD Pipeline

on:
  push:
    branches: [main, develop, "feature/*", "hotfix/*"]
  pull_request:
    branches: [main, develop]

env:
  PNPM_VERSION: 9
  PYTHON_VERSION: "3.12"
  NODE_VERSION: "20"

jobs:
  # ── Stage 1: Fast Checks (< 2 min) ─────────────────────────────────────────
  
  typecheck-ts:
    name: TypeScript Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: "${{ env.PNPM_VERSION }}" }
      - uses: actions/setup-node@v4
        with: { node-version: "${{ env.NODE_VERSION }}", cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
  
  lint:
    name: Lint (ESLint + Ruff)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: "${{ env.PNPM_VERSION }}" }
      - uses: actions/setup-node@v4
        with: { node-version: "${{ env.NODE_VERSION }}", cache: pnpm }
      - uses: actions/setup-python@v5
        with: { python-version: "${{ env.PYTHON_VERSION }}" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pip install ruff && ruff check apps/api/

  # ── Stage 2: Tests (< 10 min) ───────────────────────────────────────────────
  
  unit-tests-ts:
    name: TypeScript Unit Tests
    needs: [typecheck-ts, lint]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: "${{ env.PNPM_VERSION }}" }
      - uses: actions/setup-node@v4
        with: { node-version: "${{ env.NODE_VERSION }}", cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit
      - uses: codecov/codecov-action@v4
  
  unit-tests-python:
    name: Python Unit Tests
    needs: [typecheck-ts, lint]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "${{ env.PYTHON_VERSION }}" }
      - run: pip install -r apps/api/requirements-test.txt
      - run: pytest apps/api/tests/unit/ -v --cov=apps/api --cov-report=xml
        env:
          TESTING: "true"
  
  integration-tests:
    name: Integration Tests
    needs: [unit-tests-ts, unit-tests-python]
    runs-on: ubuntu-latest
    services:
      supabase:
        image: supabase/postgres:15.1.0.117
        env:
          POSTGRES_PASSWORD: test
        ports: ["5432:5432"]
    steps:
      - uses: actions/checkout@v4
      - run: pnpm supabase db push --local
      - run: pytest apps/api/tests/integration/ -v
        env:
          DATABASE_URL: "postgresql://postgres:test@localhost:5432/test"
          TESTING: "true"

  # ── Stage 3: Build ───────────────────────────────────────────────────────────
  
  build:
    name: Build
    needs: [integration-tests]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: "${{ env.PNPM_VERSION }}" }
      - uses: actions/setup-node@v4
        with: { node-version: "${{ env.NODE_VERSION }}", cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: docker build -t simis-api apps/api/
  
  # ── Stage 4: Deploy ──────────────────────────────────────────────────────────
  
  deploy-staging:
    name: Deploy to Staging
    needs: [build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel Preview
        run: vercel deploy --token ${{ secrets.VERCEL_TOKEN }} --env staging
      - name: Run DB Migration (staging)
        run: pnpm supabase db push --db-url ${{ secrets.STAGING_DB_URL }}
      - name: Smoke Test
        run: curl -f ${{ vars.STAGING_URL }}/api/health
  
  deploy-production:
    name: Deploy to Production
    needs: [build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Run DB Migration (production)
        # CRITICAL: Migration before code deploy (additive migrations only)
        run: pnpm supabase db push --db-url ${{ secrets.PROD_DB_URL }}
      - name: Deploy to Vercel
        run: vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}
      - name: Deploy API to Fly.io
        run: flyctl deploy --app simis-api --remote-only
      - name: Smoke Test
        run: |
          curl -f ${{ vars.PROD_URL }}/api/health
          curl -f ${{ vars.PROD_URL }}/dashboard
      - name: Notify on failure
        if: failure()
        run: |
          # Post to operator notification channel
          curl -X POST ${{ secrets.ALERT_WEBHOOK_URL }} \
            -d '{"text": "🚨 Production deploy FAILED — manual rollback may be needed"}'
  
  # ── Stage 5: E2E (Main branch only, weekly) ─────────────────────────────────
  
  e2e-tests:
    name: E2E Tests
    needs: [deploy-production]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'schedule'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: "${{ env.PNPM_VERSION }}" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install chromium
      - run: pnpm test:e2e
        env:
          E2E_BASE_URL: ${{ vars.PROD_URL }}
          E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
          E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
```

### Rollback Procedure

```bash
# Emergency rollback procedure

# Step 1: Identify last stable version
git log --oneline -10

# Step 2: Rollback frontend (Vercel)
vercel rollback --token $VERCEL_TOKEN

# Step 3: Rollback API (Fly.io)
flyctl releases list --app simis-api
flyctl deploy --image <previous_image> --app simis-api

# Step 4: Rollback database (if migration was destructive)
# NEVER drop data in production without explicit founder approval
# If migration was additive: no rollback needed (additive is always safe)
# If migration was destructive: restore from Supabase backup

# Step 5: Verify
curl https://yourdomain.com/api/health
# Check Sentry for new errors

# Step 6: Post-mortem
# Create ADR documenting what happened and why
```

### Feature Flags

```typescript
// packages/shared-types/src/feature-flags.ts
export type FeatureFlag = 
  | "agents.content_pipeline"      // Content pipeline agent (auto-publish)
  | "agents.research"              // Research agent (scheduled)
  | "learning.calibration"         // Prediction calibration engine
  | "revenue.auto_link_insertion"  // Auto affiliate link insertion
  | "ui.knowledge_graph_viz"       // D3 graph visualization

// Implementation using PostHog feature flags
// Allows rollout per organization without code deploy
import posthog from 'posthog-js'

export function isFeatureEnabled(
  flag: FeatureFlag,
  organizationId: string
): boolean {
  return posthog.isFeatureEnabled(flag, {
    distinctId: organizationId,
  }) ?? false
}
```

---

# SECTION 9 — FINAL RECOMMENDATIONS

## 9.1 For the Founder

**Immediate (Week 0 — before writing any code):**

1. **Commit to 90 days.** Don't evaluate the system at Day 30 or Day 60. SEO has a sandbox period. The learning loop needs data. The system reveals its value between Day 75 and Day 120.

2. **Pick one niche, not three.** Resist the temptation to diversify early. The knowledge graph compounds — a shallow graph in three niches is worse than a deep graph in one.

3. **Set up cost monitoring on Day 1.** The `operation_costs` table and daily cost alert must be live before any AI operations run. This is non-negotiable.

4. **Hire a junior developer OR use AI coding agents aggressively.** The 90-day plan is achievable in 90 days only if development velocity is high. If you're solo with no coding background, timeline is 120–150 days.

5. **The first 20 pieces of content are your most important.** They will teach the system what quality means for your niche. Review each one personally before approving publication.

**Risk Priority for Founder:**
- RISK-B-001 (zero traffic) is your #1 risk. Mitigate by targeting low-competition buyer-intent keywords.
- RISK-T-006 (Trigger.dev limits) is a Day-1 technical trap. Fix before writing job code.

## 9.2 For the Developer

**Architecture Integrity:**
1. Never violate multi-tenancy. If you're ever wondering "do I need organization_id here?" — the answer is yes.
2. The error handling patterns in Section 3.5 are not optional. Every external call must use them.
3. Read the domain event definitions before implementing. Emit events first, consumers second.

**Development Order (Phase 1 only):**
```
Foundation → Discovery → Intelligence → Content → Revenue → Learning → Agents
```
Do not jump to agents before content is working. Agents amplify what's already there.

**Cost Discipline:**
- Budget Gemini Flash (not Pro) for all operations except final article generation.
- Pre-compute and cache everything cacheable.
- The token budgets in Section 4.1 are your operating constraints, not suggestions.

**Technical Debt Management:**
- Use ADRs from Day 1. When you make a shortcut, document it.
- FalkorDB, DSPy, LlamaIndex are Phase 2. Resist adding them early.
- Every TODO in code must be a GitHub issue, not just a comment.

## 9.3 For AI IDE Agents (Cursor, Claude Code, Gemini Code Assist)

**Before Every Coding Session:**
1. Read `.agent/context.md` — internalize the multi-tenancy and economic constitution
2. Check `.agent/self-audit.md` — run the checklist before every commit
3. If creating a new feature, follow `.agent/skills/create-new-feature.md`

**Non-Negotiables (NEVER violate):**
```
✗ No RLS → BLOCKED
✗ No organization_id filter → BLOCKED
✗ No cost tracking on AI calls → BLOCKED
✗ No error handling on external calls → BLOCKED
✗ Hardcoded API keys → BLOCKED
```

**Recommended Workflow for Complex Tasks:**
```
1. Read relevant constitutional section (1–2 min)
2. Check existing patterns in codebase (don't reinvent)
3. Write migration first (if DB change)
4. Write service function with tests
5. Write API endpoint
6. Write UI (last)
7. Run self-audit checklist
8. Submit
```

**Token Efficiency for AI Agents:**
- Ask for small, atomic tasks (use TASK-* specifications from Section 7.5)
- Provide context file paths, not full file content
- Reference existing patterns by file path, not by restating them

---

# APPENDIX A — CONSTITUTIONAL AMENDMENT LOG

| Amendment | Section | Date | Rationale |
|-----------|---------|------|-----------|
| CA-001 | 1.1 | v2.1 | Extend revenue attribution to AI operation level |
| CA-002 | 1.2 | v2.1 | Add Phase 1 economic guardrails with hard caps |
| P-11 | 1.1 | v2.1 | New principle: Cost Attribution Mandatory |
| P-12 | 1.1 | v2.1 | New principle: Idempotency as Default |
| P-13 | 1.1 | v2.1 | New principle: Graceful Degradation |

All amendments are additive. No existing principles modified.

---

# APPENDIX B — VERSION 2.1 CHANGE SUMMARY

| Component | v2.0 Status | v2.1 Status |
|-----------|------------|------------|
| Vision/Mission/Principles | Complete | Unchanged + 3 new principles |
| Risk Register | Missing | 12 risks with full mitigation |
| Cost Guardrails | Mentioned | Full implementation with SQL + Python |
| 90-Day Plan | Sprint list | Week-by-week with KPIs + kill criteria |
| Error Handling | Implicit | Explicit: retry, circuit breaker, DLQ, idempotency |
| Database Migrations | "Sequential files" | Full zero-downtime strategy |
| SLOs | Missing | 7 defined SLOs with burn rates |
| Alerting | Missing | Full alert taxonomy + self-healing |
| CI/CD | Job names only | Complete pipeline YAML |
| Testing Strategy | 80% target only | Full pyramid with examples |
| AI Agent Context | Basic | Enriched with templates, tasks, prompts |
| Naming Conventions | Partial | Granular for TS, Python, SQL |
| Boilerplate Templates | None | 4 complete templates |
| Atomic Task Catalog | None | 5 complete task specs |
| Prompt Library | None | 5 production prompts |
| Maintenance Runbooks | None | 5 operational runbooks |
| New Schema Tables | None | 5 new tables (costs, DLQ, alerts, etc.) |

---

*End of SIMIS Technical Constitution Package v2.1*
*This document is constitutional law for all engineering decisions.*
*Amendments require ADR documentation.*
*Next review: When Phase 1 achieves $500/month revenue milestone.*
