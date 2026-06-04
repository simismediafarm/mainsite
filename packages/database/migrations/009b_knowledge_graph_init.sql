-- ============================
-- KERNEL KNOWLEDGE GRAPH v9.1
-- ============================

-- Enable pgvector
create extension if not exists vector;

-- ============================
-- ENTITY TABLE (WORLD MODEL NODES)
-- ============================
create table if not exists kg_entities (
    id uuid primary key default gen_random_uuid(),
    canonical_name text not null,
    entity_type text not null,

    -- STRICT 768 DIM VECTOR (HARD LOCK)
    embedding vector(768) not null,

    metadata jsonb default '{}'::jsonb,

    created_at timestamp default now(),
    updated_at timestamp default now()
);

-- ============================
-- RELATIONSHIPS (DETERMINISTIC EDGES)
-- ============================
create table if not exists kg_relationships (
    id uuid primary key default gen_random_uuid(),

    from_entity uuid references kg_entities(id) on delete cascade,
    to_entity uuid references kg_entities(id) on delete cascade,

    relation_type text not null,

    confidence float default 1.0,

    metadata jsonb default '{}'::jsonb,

    created_at timestamp default now()
);

-- ============================
-- SOURCE TRACE (IO BUFFER LINK)
-- ============================
create table if not exists kg_sources (
    id uuid primary key default gen_random_uuid(),

    source_hash text unique not null, -- IOBuffer linkage
    raw_content text not null,

    crawl_job_id text not null,

    created_at timestamp default now()
);

-- ============================
-- ENTITY → SOURCE TRACEABILITY
-- ============================
create table if not exists kg_entity_sources (
    entity_id uuid references kg_entities(id) on delete cascade,
    source_id uuid references kg_sources(id) on delete cascade,

    primary key (entity_id, source_id)
);

-- ============================
-- VECTOR INDEX (COSINE SIMILARITY)
-- ============================
create index if not exists kg_entities_embedding_idx
on kg_entities
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
