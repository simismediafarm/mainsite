-- packages/database/migrations/005_knowledge_graph_schema.sql

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Canonical Entity Registry (The central System of Record)
CREATE TABLE graph_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    niche_id UUID NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
    
    entity_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL, -- 'product', 'brand', 'service', 'person', 'technology', 'organization', 'keyword_entity', 'opportunity_entity', 'gap_entity'
    
    -- Embedding vector mapping configured for Phase 1: 768 dimensions
    embedding vector(768),
    
    properties JSONB DEFAULT '{}'::jsonb,
    lifecycle_state VARCHAR(50) DEFAULT 'discovered', -- 'discovered', 'candidate', 'verified', 'canonical', 'deprecated'
    external_refs JSONB DEFAULT '{}'::jsonb, -- {'wikidata_id': 'Q42', 'wikipedia_url': '...'}
    
    authority_weight NUMERIC(5,2) DEFAULT 1.00,
    revenue_score NUMERIC(10,4) DEFAULT 0.0000,
    confidence_score NUMERIC(3,2) DEFAULT 0.50,
    
    -- Decay Persistence Parameters
    last_reinforced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decay_version INT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;

-- 2. Entity Aliases (Direct organization_id scoping for RLS flattening)
CREATE TABLE entity_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    alias_string VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(entity_id, alias_string)
);
ALTER TABLE entity_aliases ENABLE ROW LEVEL SECURITY;

-- 3. Entity Mentions (Direct organization_id scoping + Decoupled polymorphic referencing)
CREATE TABLE entity_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL, -- 'signal', 'crawled_page', 'content_asset'
    
    -- Explicit foreign keys to enforce trace lineage
    content_asset_id UUID REFERENCES content_assets(id) ON DELETE CASCADE,
    crawled_page_id UUID, -- For future integration hook
    signal_id UUID,       -- For future integration hook
    
    context_snippet TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_mention_source CHECK (
        (source_type = 'content_asset' AND content_asset_id IS NOT NULL AND crawled_page_id IS NULL AND signal_id IS NULL) OR
        (source_type = 'crawled_page' AND crawled_page_id IS NOT NULL AND content_asset_id IS NULL AND signal_id IS NULL) OR
        (source_type = 'signal' AND signal_id IS NOT NULL AND content_asset_id IS NULL AND crawled_page_id IS NULL)
    )
);
ALTER TABLE entity_mentions ENABLE ROW LEVEL SECURITY;

-- 4. Knowledge Graph Edges (Directed relationships)
CREATE TABLE graph_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    niche_id UUID NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
    
    source_node_id UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL, -- 'competitor_of', 'alternative_to', 'features_include', 'subsidiary_of'
    
    confidence_score NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    decay_weight NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    computed_weight NUMERIC(3,2) NOT NULL DEFAULT 1.00, -- Decay calculated persistence value
    
    -- Decay Persistence Parameters
    last_reinforced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decay_version INT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(niche_id, source_node_id, target_node_id, relationship_type)
);
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;

-- Indexing for fast vector calculations and joins
CREATE INDEX graph_nodes_embedding_cosine_idx ON graph_nodes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX graph_nodes_niche_idx ON graph_nodes(niche_id);
CREATE INDEX graph_edges_source_target_idx ON graph_edges(source_node_id, target_node_id);

-- Batch decay helper function
CREATE OR REPLACE FUNCTION decay_knowledge_graph()
RETURNS VOID AS $$
BEGIN
    -- Decay authority_weight on nodes by 5% for each month (30 days = 2592000 seconds) since last_reinforced_at
    UPDATE graph_nodes
    SET authority_weight = GREATEST(0.00, authority_weight * POWER(0.95, EXTRACT(EPOCH FROM (NOW() - last_reinforced_at)) / 2592000)),
        last_reinforced_at = NOW(),
        decay_version = decay_version + 1
    WHERE last_reinforced_at < NOW() - INTERVAL '1 day';

    -- Decay computed_weight on edges by 5% for each month (30 days = 2592000 seconds) since last_reinforced_at
    UPDATE graph_edges
    SET computed_weight = GREATEST(0.00, decay_weight * POWER(0.95, EXTRACT(EPOCH FROM (NOW() - last_reinforced_at)) / 2592000)),
        last_reinforced_at = NOW(),
        decay_version = decay_version + 1
    WHERE last_reinforced_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
