-- packages/database/migrations/009_agent_swarm_economy.sql

-- ========================================================
-- PHASE 6: AGENT SWARM ECONOMY & COMPETITIVE BIDDING SCHEMA
-- ========================================================

-- 1. Agent Swarm Profiles Registry
CREATE TABLE agents (
    id VARCHAR(100) PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    capability_vector JSONB NOT NULL DEFAULT '{}'::jsonb,
    cost_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    success_rate NUMERIC(3, 2) DEFAULT 1.00,
    
    -- Specialization Embedding for task mapping (768 dimensions)
    specialization_embedding vector(768),
    
    reward_score NUMERIC(10, 4) DEFAULT 1.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY agents_select ON agents FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY agents_all ON agents FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 2. Agent Tasks Broadcast Registry
CREATE TABLE agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_type VARCHAR(100) NOT NULL, -- 'research', 'crawling', 'synthesis', 'verification'
    description TEXT,
    
    reward_value NUMERIC(10, 4) DEFAULT 1.0000,
    status VARCHAR(50) NOT NULL DEFAULT 'broadcast', -- 'broadcast', 'assigned', 'success', 'failed'
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tasks_select ON agent_tasks FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY tasks_all ON agent_tasks FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 3. Agent Proposals (Bidding Pool)
CREATE TABLE agent_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id VARCHAR(100) NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
    
    cost_estimate NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
    confidence_score NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
    proposal_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_winner BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE agent_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY proposals_select ON agent_proposals FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY proposals_all ON agent_proposals FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- Indexing for fast economic routing and agent retrieval
CREATE INDEX IF NOT EXISTS agents_specialization_idx ON agents USING ivfflat (specialization_embedding vector_cosine_ops) WITH (lists = 10);
CREATE INDEX IF NOT EXISTS agent_proposals_task_winner_idx ON agent_proposals(task_id, is_winner);
CREATE INDEX IF NOT EXISTS agent_tasks_status_idx ON agent_tasks(status);
