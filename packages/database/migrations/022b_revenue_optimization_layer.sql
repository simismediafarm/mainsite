-- Migration: 022_revenue_optimization_layer.sql
-- Description: Adds tables for monetization metrics, affiliate networks, and placement rules.

-- Table: affiliate_networks
CREATE TABLE IF NOT EXISTS public.affiliate_networks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('amazon', 'cj', 'shareasale', 'impact', 'custom')),
    api_key TEXT,
    tracking_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: ad_placements
CREATE TABLE IF NOT EXISTS public.ad_placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slot_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL CHECK (provider IN ('adsense', 'mediavine', 'ezoic', 'custom')),
    html_code TEXT,
    rpm_estimate NUMERIC(10, 4) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: revenue_metrics
CREATE TABLE IF NOT EXISTS public.revenue_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('affiliate', 'ad')),
    source_id UUID NOT NULL, -- references affiliate_networks or ad_placements but kept loose for flexibility
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue_cents BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, source_type, source_id)
);

-- Table: monetization_rules
CREATE TABLE IF NOT EXISTS public.monetization_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_tag TEXT NOT NULL, -- The tag that triggers this rule (e.g., 'tech', 'review')
    priority INTEGER DEFAULT 0,
    action TEXT NOT NULL CHECK (action IN ('insert_ad', 'insert_affiliate_link')),
    placement_id UUID REFERENCES public.ad_placements(id) ON DELETE SET NULL,
    affiliate_id UUID REFERENCES public.affiliate_networks(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_metrics_date ON public.revenue_metrics(date);
CREATE INDEX IF NOT EXISTS idx_monetization_rules_tag ON public.monetization_rules(content_tag);
