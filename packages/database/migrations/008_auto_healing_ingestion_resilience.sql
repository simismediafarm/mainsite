-- packages/database/migrations/008_auto_healing_ingestion_resilience.sql

-- ========================================================
-- PHASE 3 SCHEMA: SOURCE INGESTION & SEMANTIC SIGNAL ENGINE
-- ========================================================

-- 1. Ingestion Sources (Websites, RSS, APIs, etc.)
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'rss', 'web', 'api', 'social', 'sitemap'
    url TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'paused', 'failed'
    
    last_crawled_at TIMESTAMPTZ,
    failure_count INT DEFAULT 0,
    trust_score NUMERIC(3, 2) DEFAULT 1.00,
    last_error TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, url)
);
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY sources_select ON sources FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY sources_all ON sources FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 2. Crawl Jobs Queue Table
CREATE TABLE crawl_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'queued', -- 'queued', 'running', 'success', 'failed', 'retrying'
    
    attempt_count INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    lease_expires_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    node_id VARCHAR(100),
    error TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY crawl_jobs_select ON crawl_jobs FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY crawl_jobs_all ON crawl_jobs FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 3. Ingestion Failures Log Table
CREATE TABLE ingestion_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    crawl_job_id UUID REFERENCES crawl_jobs(id) ON DELETE SET NULL,
    failure_type VARCHAR(50) NOT NULL, -- 'timeout', 'network', 'rate_limit', 'parse_error', 'schema_mismatch', 'dead_letter'
    error_message TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE ingestion_failures ENABLE ROW LEVEL SECURITY;
CREATE POLICY failures_select ON ingestion_failures FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY failures_all ON ingestion_failures FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 4. Adaptive Crawl Interval Tracker (State Store)
CREATE TABLE crawl_schedule_state (
    source_id UUID PRIMARY KEY REFERENCES sources(id) ON DELETE CASCADE,
    success_streak INT DEFAULT 0,
    failure_streak INT DEFAULT 0,
    health_score NUMERIC(3, 2) DEFAULT 1.00,
    adaptive_interval_seconds INT DEFAULT 1800, -- Default: 30 minutes
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ
);
-- Scoped automatically by source_id RLS cascade (sources table rules)
ALTER TABLE crawl_schedule_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY schedule_select ON crawl_schedule_state FOR SELECT 
    USING (source_id IN (SELECT id FROM sources WHERE organization_id = ANY(get_my_orgs())));
CREATE POLICY schedule_all ON crawl_schedule_state FOR ALL 
    USING (source_id IN (SELECT id FROM sources WHERE organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs())));

-- 5. Signals Table (Semantic web findings registry)
CREATE TABLE signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    importance_score NUMERIC(3, 2) DEFAULT 0.50,
    freshness_score NUMERIC(3, 2) DEFAULT 0.50,
    novelty_score NUMERIC(3, 2) DEFAULT 0.50,
    type VARCHAR(50) NOT NULL, -- 'TREND_SIGNAL', 'ENTITY_SIGNAL', 'CONTENT_GAP_SIGNAL', 'RISK_SIGNAL', 'OPPORTUNITY_SIGNAL'
    payload JSONB DEFAULT '{}'::jsonb,
    
    query TEXT,
    answer TEXT,
    trace_id UUID,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY signals_select ON signals FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY signals_all ON signals FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- ========================================================
-- AUTO-HEALING SQL PROCEDURES, TRIGGERS & LIFECYCLES
-- ========================================================

-- 1. Error Classifier Function
CREATE OR REPLACE FUNCTION classify_ingestion_failure(p_error TEXT)
RETURNS TEXT AS $$
BEGIN
    IF p_error ILIKE '%timeout%' THEN
        RETURN 'timeout';
    ELSIF p_error ILIKE '%connection%' THEN
        RETURN 'network';
    ELSIF p_error ILIKE '%rate limit%' THEN
        RETURN 'rate_limit';
    ELSIF p_error ILIKE '%parse%' THEN
        RETURN 'parse_error';
    ELSIF p_error ILIKE '%schema%' THEN
        RETURN 'schema_mismatch';
    ELSE
        RETURN 'unknown';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Circuit Breaker Trigger Function
CREATE OR REPLACE FUNCTION update_source_health()
RETURNS TRIGGER AS $$
DECLARE
    v_failure_type TEXT;
BEGIN
    v_failure_type := classify_ingestion_failure(NEW.error_message);

    UPDATE sources
    SET failure_count = failure_count + 1,
        last_error = NEW.error_message,
        status = CASE
            WHEN failure_count + 1 > 10 THEN 'failed'
            WHEN v_failure_type = 'rate_limit' THEN 'paused'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = NEW.source_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_source_health_update
AFTER INSERT OR UPDATE ON ingestion_failures
FOR EACH ROW
EXECUTE FUNCTION update_source_health();

-- 3. Ingestion Job Auto-Retry with Exponential Backoff
CREATE OR REPLACE FUNCTION auto_retry_crawl_job()
RETURNS TRIGGER AS $$
DECLARE
    v_backoff INT;
BEGIN
    IF NEW.status = 'failed' AND NEW.attempt_count < NEW.max_attempts THEN
        -- Exponential backoff: 30s, 60s, 120s, 240s...
        v_backoff := POWER(2, NEW.attempt_count) * 30;

        UPDATE crawl_jobs
        SET status = 'retrying',
            attempt_count = attempt_count + 1,
            lease_expires_at = NOW() + (v_backoff || ' seconds')::INTERVAL,
            next_retry_at = NOW() + (v_backoff || ' seconds')::INTERVAL
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_retry_crawl_jobs
AFTER UPDATE ON crawl_jobs
FOR EACH ROW
WHEN (NEW.status = 'failed')
EXECUTE FUNCTION auto_retry_crawl_job();

-- 4. Ingestion Dead-Letter Queue Routing
CREATE OR REPLACE FUNCTION move_to_dead_letter()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.attempt_count >= NEW.max_attempts THEN
        INSERT INTO ingestion_failures (
            organization_id,
            source_id,
            crawl_job_id,
            failure_type,
            error_message,
            resolved
        )
        VALUES (
            NEW.organization_id,
            NEW.source_id,
            NEW.id,
            'dead_letter',
            COALESCE(NEW.error, 'max retries exceeded'),
            FALSE
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dead_letter_router
AFTER UPDATE ON crawl_jobs
FOR EACH ROW
WHEN (NEW.attempt_count >= NEW.max_attempts)
EXECUTE FUNCTION move_to_dead_letter();

-- 5. Adaptive Scheduler Configuration Trigger
CREATE OR REPLACE FUNCTION update_crawl_schedule()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure schedule state row exists
    INSERT INTO crawl_schedule_state (source_id, success_streak, failure_streak, health_score, adaptive_interval_seconds)
    VALUES (NEW.source_id, 0, 0, 1.00, 1800)
    ON CONFLICT (source_id) DO NOTHING;

    IF NEW.status = 'success' THEN
        UPDATE crawl_schedule_state
        SET success_streak = success_streak + 1,
            failure_streak = 0,
            health_score = LEAST(1.00, health_score + 0.05),
            adaptive_interval_seconds = GREATEST(300, adaptive_interval_seconds * 0.9),
            last_success_at = NOW()
        WHERE source_id = NEW.source_id;
    ELSE
        UPDATE crawl_schedule_state
        SET failure_streak = failure_streak + 1,
            success_streak = 0,
            health_score = GREATEST(0.10, health_score - 0.10),
            adaptive_interval_seconds = LEAST(7200, adaptive_interval_seconds * 1.5),
            last_failure_at = NOW()
        WHERE source_id = NEW.source_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_crawl_schedule
AFTER UPDATE ON crawl_jobs
FOR EACH ROW
WHEN (NEW.status IN ('success', 'failed'))
EXECUTE FUNCTION update_crawl_schedule();

-- 6. Reclaim Stuck Jobs
CREATE OR REPLACE FUNCTION requeue_stuck_crawl_jobs()
RETURNS VOID AS $$
BEGIN
    UPDATE crawl_jobs
    SET status = 'queued',
        lease_expires_at = NULL,
        node_id = NULL
    WHERE status = 'running'
      AND lease_expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. periodic Self-Heal Cron Handler
CREATE OR REPLACE FUNCTION run_ingestion_self_heal()
RETURNS VOID AS $$
BEGIN
    -- Reclaim hung worker locks
    PERFORM requeue_stuck_crawl_jobs();

    -- Degrade persistently broken sources
    UPDATE sources
    SET status = 'paused'
    WHERE failure_count > 15
      AND status = 'active';

    -- Re-activate sources showing recovery
    UPDATE sources
    SET status = 'active'
    WHERE failure_count < 3
      AND status = 'paused'
      AND trust_score > 0.60;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Signal-Level Score Clamp Validation
CREATE OR REPLACE FUNCTION normalize_signal_quality()
RETURNS TRIGGER AS $$
BEGIN
    NEW.importance_score := LEAST(GREATEST(NEW.importance_score, 0.00), 1.00);
    NEW.freshness_score := LEAST(GREATEST(NEW.freshness_score, 0.00), 1.00);
    NEW.novelty_score := LEAST(GREATEST(NEW.novelty_score, 0.00), 1.00);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_signal_normalization
BEFORE INSERT OR UPDATE ON signals
FOR EACH ROW
EXECUTE FUNCTION normalize_signal_quality();

-- Composite indexing for Phase 3 ingestion paths
CREATE INDEX IF NOT EXISTS sources_org_status_idx ON sources(organization_id, status);
CREATE INDEX IF NOT EXISTS crawl_jobs_status_retry_idx ON crawl_jobs(status, next_retry_at);
CREATE INDEX IF NOT EXISTS signals_org_type_score_idx ON signals(organization_id, type, importance_score DESC);
