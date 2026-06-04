-- packages/database/migrations/004_telemetry_schema.sql

-- 1. System Alerts
CREATE TABLE system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    severity VARCHAR(50) NOT NULL, -- 'info', 'warning', 'critical'
    message TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- 2. Provider Request Registry (Observability System of Record)
CREATE TABLE provider_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL, -- Resolved FK constraint
    
    provider_name VARCHAR(100) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(100),
    request_type VARCHAR(50) NOT NULL, -- 'generation', 'embedding', 'search', 'crawl', 'rerank', 'classification', 'evaluation'
    
    workflow_run_id UUID REFERENCES workflow_runs(id) ON DELETE SET NULL,
    workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
    correlation_id UUID, -- For multi-provider request tracing
    execution_path TEXT, -- Class path stack / trace
    
    tokens_input INT DEFAULT 0,
    tokens_output INT DEFAULT 0,
    latency_ms INT DEFAULT 0,
    cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0.000000,
    cache_hit BOOLEAN DEFAULT FALSE,
    fallback_depth INT DEFAULT 0, -- Track depth in fallback routing
    
    request_hash VARCHAR(64),
    response_hash VARCHAR(64),
    status VARCHAR(50) NOT NULL, -- 'success', 'failure'
    
    error_code VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE provider_requests ENABLE ROW LEVEL SECURITY;
