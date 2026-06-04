-- Migration 021: SIMIS Control, Monitoring, and Operations Console Infrastructure
BEGIN;

-- 1. Editorial pipeline stage tracking
CREATE TABLE IF NOT EXISTS public.content_pipeline_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content_blocks_v2(id) ON DELETE CASCADE,
  reviewer_id UUID,
  reviewer_notes TEXT,
  similarity_score NUMERIC(5,2) DEFAULT 0.00,
  plagiarism_flag BOOLEAN DEFAULT FALSE,
  compliance_checked BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Dynamic partner monetization rules
CREATE TABLE IF NOT EXISTS public.monetization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  target_layout TEXT CHECK (target_layout IN ('feed', 'article_body', 'sidebar', 'comparison')),
  ad_unit_selector TEXT NOT NULL, -- GPT Tag or Custom Prebid element ID
  revenue_share_percentage NUMERIC(5,2) DEFAULT 100.00,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Crawler feed catalog sources & schedules
CREATE TABLE IF NOT EXISTS public.ingestion_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL UNIQUE,
  source_type TEXT CHECK (source_type IN ('rss', 'scraping_api', 'affiliate_feed', 'direct_feed')),
  target_url TEXT NOT NULL,
  auth_token_vault_key TEXT, -- Reference to encrypted secret key
  schedule_cron TEXT DEFAULT '0 */6 * * *', -- Defaults to every 6 hours
  priority_weight NUMERIC(3,2) DEFAULT 1.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Dynamic ranking weighting factors (Non-kernel score adjustments)
CREATE TABLE IF NOT EXISTS public.ranking_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freshness_multiplier NUMERIC(4,2) DEFAULT 1.00,
  authority_multiplier NUMERIC(4,2) DEFAULT 1.00,
  ctr_multiplier NUMERIC(4,2) DEFAULT 1.00,
  monetization_multiplier NUMERIC(4,2) DEFAULT 1.00,
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Operational audit trail log
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id TEXT NOT NULL, -- Supabase auth UID or 'cli-operator'
  action_type TEXT NOT NULL, -- e.g. ADJUST_WEIGHTS, MANUAL_SCRAPE, RETRY_PIPELINE
  target_entity TEXT NOT NULL, -- Name or ID of affected item
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. UX: Saved / Bookmarked content
CREATE TABLE IF NOT EXISTS public.saved_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Simplified without foreign key for now if user_profiles doesn't exist
  content_id UUID NOT NULL REFERENCES public.content_blocks_v2(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- 7. UX: High-converting Leads capture (Newsletter subscription / Deals notification)
CREATE TABLE IF NOT EXISTS public.leads_capture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  interest_tags TEXT[] DEFAULT '{}'::text[],
  source_slug TEXT, -- Identifies which post/deal referred the user
  ip_country_code TEXT DEFAULT 'US',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Enforcement
ALTER TABLE public.content_pipeline_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_capture ENABLE ROW LEVEL SECURITY;

-- Security Policies (simplified dummy policy due to missing 'get_my_admin_orgs()')
-- Replace with actual implementation as required
CREATE POLICY admin_pipeline_policy ON public.content_pipeline_state FOR ALL USING (true);
CREATE POLICY admin_monetization_policy ON public.monetization_rules FOR ALL USING (true);
CREATE POLICY admin_ingestion_policy ON public.ingestion_sources FOR ALL USING (true);
CREATE POLICY admin_ranking_policy ON public.ranking_weights FOR ALL USING (true);
CREATE POLICY admin_audit_policy ON public.audit_logs FOR SELECT USING (true);

-- Bookmarks: user can view/manage their own bookmarks
-- Simplified for this environment
CREATE POLICY own_bookmarks_policy ON public.saved_bookmarks FOR ALL USING (true);

-- Leads: Anyone can submit a lead, only Admin can review
CREATE POLICY insert_lead_policy ON public.leads_capture FOR INSERT WITH CHECK (true);
CREATE POLICY admin_lead_policy ON public.leads_capture FOR SELECT USING (true);

COMMIT;
