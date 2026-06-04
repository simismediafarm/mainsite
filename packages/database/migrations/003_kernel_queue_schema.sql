-- packages/database/migrations/003_kernel_queue_schema.sql

-- 1. Workflow Runs
CREATE TABLE workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workflow_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
    
    idempotency_key VARCHAR(255) UNIQUE,
    cancellation_state BOOLEAN DEFAULT FALSE,
    priority INT DEFAULT 1,
    
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;

-- 2. Workflow Steps (Direct organization_id scoping for RLS flattening)
CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    step_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'pending_approval'
    
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    lease_expires_at TIMESTAMP NULL,
    worker_id VARCHAR(100),
    heartbeat TIMESTAMPTZ,
    lock_version INT DEFAULT 0, -- Optimistic locking logic
    
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    output_payload JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

-- Atomic worker task acquisition function
CREATE OR REPLACE FUNCTION acquire_workflow_step(
    p_worker_id TEXT,
    p_lease_duration INTERVAL
)
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    workflow_run_id UUID,
    step_name VARCHAR(255),
    status VARCHAR(50),
    retry_count INT,
    max_retries INT,
    lease_expires_at TIMESTAMP,
    worker_id VARCHAR(100),
    heartbeat TIMESTAMPTZ,
    lock_version INT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    output_payload JSONB
) AS $$
DECLARE
    v_step_id UUID;
BEGIN
    -- Select a step that is pending or has an expired lease, and lock it using SKIP LOCKED
    SELECT ws.id INTO v_step_id
    FROM workflow_steps ws
    JOIN workflow_runs wr ON ws.workflow_run_id = wr.id
    WHERE (ws.status = 'pending' OR (ws.status = 'running' AND ws.lease_expires_at < NOW()::timestamp))
      AND wr.status = 'running'
      AND wr.cancellation_state = FALSE
    ORDER BY wr.priority DESC, ws.started_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_step_id IS NOT NULL THEN
        UPDATE workflow_steps
        SET status = 'running',
            worker_id = p_worker_id,
            lease_expires_at = (NOW() + p_lease_duration)::timestamp,
            heartbeat = NOW(),
            started_at = NOW(),
            lock_version = lock_version + 1,
            retry_count = CASE WHEN status = 'running' THEN retry_count + 1 ELSE retry_count END
        WHERE workflow_steps.id = v_step_id;
        
        RETURN QUERY
        SELECT 
            ws.id,
            ws.organization_id,
            ws.workflow_run_id,
            ws.step_name,
            ws.status,
            ws.retry_count,
            ws.max_retries,
            ws.lease_expires_at,
            ws.worker_id,
            ws.heartbeat,
            ws.lock_version,
            ws.started_at,
            ws.completed_at,
            ws.output_payload
        FROM workflow_steps ws 
        WHERE ws.id = v_step_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Agent Task Executions (Direct organization_id scoping for RLS flattening)
CREATE TABLE agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
    agent_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
    
    queue_name VARCHAR(100) DEFAULT 'default',
    execution_channel VARCHAR(100) DEFAULT 'worker',
    
    cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0.000000,
    tokens_used INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;

-- 4. Dead-Letter Queue Events
CREATE TABLE dead_letter_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_id UUID,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT NOT NULL,
    failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN NOT NULL DEFAULT FALSE
);
ALTER TABLE dead_letter_events ENABLE ROW LEVEL SECURITY;
