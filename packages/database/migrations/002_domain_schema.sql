-- packages/database/migrations/002_domain_schema.sql

-- 1. Site Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(site_id, slug)
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 2. Content Assets (Articles, Directories, Tools, Reviews, etc.)
CREATE TABLE content_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    type VARCHAR(50) NOT NULL, -- 'homepage', 'category', 'topic_hub', 'entity_profile', 'review', 'comparison', 'glossary', 'directory', 'tool', 'news'
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    body_markdown TEXT,
    structured_metadata JSONB DEFAULT '{}'::jsonb, -- Schema.json context data
    
    publish_status VARCHAR(50) NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    quality_score NUMERIC(5,2) DEFAULT 0.00,
    decay_score NUMERIC(5,2) DEFAULT 0.00,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(site_id, slug)
);
ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;

-- 3. Asset Monetization Links (Map content to specific monetization configs)
CREATE TABLE asset_monetization (
    content_asset_id UUID REFERENCES content_assets(id) ON DELETE CASCADE,
    monetization_config_id UUID REFERENCES monetization_configs(id) ON DELETE CASCADE,
    custom_cta_label VARCHAR(255),
    tracking_link TEXT NOT NULL,
    PRIMARY KEY(content_asset_id, monetization_config_id)
);

-- 4. Subscribers (Audience Layer)
CREATE TABLE subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'unsubscribed', 'bounced'
    meta_attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(brand_id, email)
);
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
