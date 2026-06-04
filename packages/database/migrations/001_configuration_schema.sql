-- packages/database/migrations/001_configuration_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (Multi-tenant root)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 2. Extended Users (Auth integration)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Organization Memberships (Authorizations registry)
CREATE TABLE org_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', 'agent'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Index for RLS User Joins and fast multi-tenant mapping
CREATE INDEX IF NOT EXISTS org_members_user_idx ON org_members(user_id);
CREATE INDEX IF NOT EXISTS org_members_user_role_idx ON org_members(user_id, role, organization_id);

-- ========================================================
-- HELPER FUNCTIONS FOR SECURITY ROLE POLICY CHECKS (RLS COLLAPSE PREVENTER)
-- ========================================================

CREATE OR REPLACE FUNCTION get_my_orgs()
RETURNS UUID[] STABLE SECURITY DEFINER AS $$
BEGIN
    RETURN ARRAY(
        SELECT organization_id FROM org_members 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_my_admin_orgs()
RETURNS UUID[] STABLE SECURITY DEFINER AS $$
BEGIN
    RETURN ARRAY(
        SELECT organization_id FROM org_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_my_agent_orgs()
RETURNS UUID[] STABLE SECURITY DEFINER AS $$
BEGIN
    RETURN ARRAY(
        SELECT organization_id FROM org_members 
        WHERE user_id = auth.uid() AND role = 'agent'
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
BEGIN
    RETURN org_id = ANY(get_my_orgs());
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
BEGIN
    RETURN org_id = ANY(get_my_admin_orgs());
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_agent_runtime(org_id UUID)
RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
BEGIN
    RETURN org_id = ANY(get_my_agent_orgs());
END;
$$ LANGUAGE plpgsql;

-- 4. Niches (Kernel configuration domain)
CREATE TABLE niches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);
ALTER TABLE niches ENABLE ROW LEVEL SECURITY;

-- 5. Brands (Audience-centric projection layers)
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    niche_id UUID NOT NULL REFERENCES niches(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    tagline TEXT,
    logo_url TEXT,
    voice_description TEXT,
    editorial_principles TEXT[],
    trust_standards TEXT,
    sponsor_policy TEXT,
    partner_policy TEXT,
    audience_promise TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- 6. Sites (Projection mapping layers)
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL UNIQUE,
    language_code VARCHAR(10) NOT NULL DEFAULT 'en',
    region_code VARCHAR(10) NOT NULL DEFAULT 'US',
    layout_template_id VARCHAR(50) NOT NULL DEFAULT 'default',
    seo_title_template VARCHAR(255) DEFAULT '{{title}} | {{brand_name}}',
    seo_meta_description_template VARCHAR(255) DEFAULT '{{description}}',
    posthog_project_id VARCHAR(100),
    posthog_host VARCHAR(255) DEFAULT 'https://us.i.posthog.com',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- 7. Providers (Abstractions configuration persistent layer)
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'search', 'llm', 'embedding', 'crawler', 'analytics', 'email', 'storage', 'translation'
    name VARCHAR(100) NOT NULL,
    capabilities JSONB NOT NULL DEFAULT '{}'::jsonb, -- ProviderCapabilities mapping (vision, streaming, etc)
    priority INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    quota_daily_limit_usd NUMERIC(10, 4) DEFAULT 10.0000,
    quota_daily_used_usd NUMERIC(10, 4) DEFAULT 0.0000,
    
    -- Circuit Breaker State Persistence Columns
    state TEXT DEFAULT 'CLOSED', -- 'CLOSED', 'OPEN', 'HALF_OPEN'
    failure_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    last_failure_at TIMESTAMP,
    last_success_at TIMESTAMP,
    cooldown_expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, category, name)
);
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Helper functions for provider circuit breaker state management
CREATE OR REPLACE FUNCTION record_provider_failure(p_provider_id UUID)
RETURNS VOID AS $$
DECLARE
    v_failure_count INT;
BEGIN
    UPDATE providers
    SET failure_count = failure_count + 1,
        last_failure_at = NOW()::timestamp,
        success_count = 0
    WHERE id = p_provider_id
    RETURNING failure_count INTO v_failure_count;
    
    -- If failure threshold (e.g. 3 failures) exceeded, open circuit
    IF v_failure_count >= 3 THEN
        UPDATE providers
        SET state = 'OPEN',
            cooldown_expires_at = NOW() + INTERVAL '15 minutes'
        WHERE id = p_provider_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_provider_success(p_provider_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE providers
    SET success_count = success_count + 1,
        failure_count = 0,
        last_success_at = NOW()::timestamp,
        state = 'CLOSED',
        cooldown_expires_at = NULL
    WHERE id = p_provider_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Monetization Configurations (Multi-monetization definitions)
CREATE TABLE monetization_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    revenue_type VARCHAR(50) NOT NULL, -- 'affiliate', 'sponsorship', 'lead_generation', 'digital_product', 'membership'
    partner_name VARCHAR(100) NOT NULL,
    program_id VARCHAR(100),
    affiliate_id VARCHAR(100),
    tracking_parameters JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE monetization_configs ENABLE ROW LEVEL SECURITY;

-- 9. Scoped Secrets (Hierarchical Secret Pools with organization_id mapping)
CREATE TABLE organization_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    secret_key VARCHAR(255) NOT NULL,
    encrypted_value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, secret_key)
);
ALTER TABLE organization_secrets ENABLE ROW LEVEL SECURITY;

CREATE TABLE provider_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    secret_key VARCHAR(255) NOT NULL,
    encrypted_value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider_id, secret_key)
);
ALTER TABLE provider_secrets ENABLE ROW LEVEL SECURITY;

CREATE TABLE site_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    secret_key VARCHAR(255) NOT NULL,
    encrypted_value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(site_id, secret_key)
);
ALTER TABLE site_secrets ENABLE ROW LEVEL SECURITY;

CREATE TABLE campaign_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES monetization_configs(id) ON DELETE CASCADE,
    secret_key VARCHAR(255) NOT NULL,
    encrypted_value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(campaign_id, secret_key)
);
ALTER TABLE campaign_secrets ENABLE ROW LEVEL SECURITY;
