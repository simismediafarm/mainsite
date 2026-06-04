-- 1. EXTENSIONS & UTILITIES
CREATE OR REPLACE FUNCTION public.now_utc()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
  SELECT timezone('utc', now());
$$ LANGUAGE sql;

-- 2. CORE KERNEL INTENT REGISTRY
CREATE TABLE IF NOT EXISTS public.kernel_intent_registry (
  intent_id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  syscall_name TEXT NOT NULL,
  payload JSONB NOT NULL,
  idempotency_key TEXT NOT NULL,
  priority INT DEFAULT 2,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now_utc(),
  CONSTRAINT unique_idempotency_org UNIQUE (organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_intent_org ON public.kernel_intent_registry(organization_id);
CREATE INDEX IF NOT EXISTS idx_intent_status ON public.kernel_intent_registry(status);
CREATE INDEX IF NOT EXISTS idx_intent_idempotency ON public.kernel_intent_registry(idempotency_key);

-- 3. KERNEL EXECUTION LEDGER
CREATE TABLE IF NOT EXISTS public.kernel_execution_ledger (
  execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID NOT NULL REFERENCES public.kernel_intent_registry(intent_id) ON DELETE CASCADE,
  syscall_type TEXT NOT NULL,
  status TEXT CHECK (status IN ('started', 'finished', 'failed')),
  retry_count INT DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now_utc(),
  finished_at TIMESTAMP WITH TIME ZONE,
  execution_hash TEXT,
  execution_fingerprint TEXT
);

CREATE INDEX IF NOT EXISTS idx_ledger_intent ON public.kernel_execution_ledger(intent_id);
CREATE INDEX IF NOT EXISTS idx_ledger_status ON public.kernel_execution_ledger(status);

-- 4. KEBL DURABLE QUEUE
CREATE TABLE IF NOT EXISTS public.kernel_kebl_queue (
  queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID NOT NULL REFERENCES public.kernel_intent_registry(intent_id) ON DELETE CASCADE,
  priority INT DEFAULT 2,
  status TEXT CHECK (status IN ('queued', 'processing', 'dead')) DEFAULT 'queued',
  retry_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now_utc()
);

CREATE INDEX IF NOT EXISTS idx_kebl_status_priority ON public.kernel_kebl_queue(status, priority);

-- 5. WORKFLOW RUNS & DEAD LETTER EVENTS
CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID REFERENCES public.kernel_intent_registry(intent_id) ON DELETE CASCADE,
  syscall_name TEXT NOT NULL,
  payload JSONB,
  error TEXT,
  status TEXT CHECK (status IN ('queued', 'running', 'done', 'error')) DEFAULT 'queued',
  retry_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now_utc()
);

-- 6. CONTENT INTELLIGENCE TABLES
CREATE TABLE IF NOT EXISTS public.content_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  niche_id UUID REFERENCES public.niches(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  target_keywords JSONB DEFAULT '[]'::jsonb,
  competitor_serp JSONB DEFAULT '[]'::jsonb,
  required_entities UUID[] DEFAULT '{}'::uuid[],
  structure_outline JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'drafting' CHECK (status IN ('drafting', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now_utc()
);

CREATE TABLE IF NOT EXISTS public.content_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES public.content_briefs(id) ON DELETE CASCADE,
  raw_content TEXT,
  html_rendered TEXT,
  readability_score NUMERIC(5,2),
  keyword_density JSONB DEFAULT '{}'::jsonb,
  entity_match_ratio NUMERIC(5,2),
  quality_grade TEXT CHECK (quality_grade IN ('PASS', 'FAIL')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now_utc()
);

-- 7. PUBLISHING & REVENUE TABLES
CREATE TABLE IF NOT EXISTS public.published_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  body_html TEXT,
  structured_schema JSONB DEFAULT '{}'::jsonb,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now_utc(),
  sitemap_priority NUMERIC(3,2) DEFAULT 0.50,
  CONSTRAINT unique_site_slug UNIQUE (site_id, slug)
);

CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  commission_rate NUMERIC(10,4) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.click_logs (
  click_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.published_assets(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now_utc()
);

CREATE TABLE IF NOT EXISTS public.conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id UUID NOT NULL REFERENCES public.click_logs(click_id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL UNIQUE,
  payout_usd NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT now_utc(),
  CONSTRAINT no_negative_payout CHECK (payout_usd >= 0.00)
);

-- 8. ANALYTICS, PREDICTIONS & CALIBRATION
CREATE TABLE IF NOT EXISTS public.analytics_pageviews_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.published_assets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INT DEFAULT 0,
  sessions INT DEFAULT 0,
  avg_duration_seconds NUMERIC(8,2) DEFAULT 0.00,
  bounce_rate NUMERIC(5,2) DEFAULT 0.00,
  CONSTRAINT unique_asset_date UNIQUE (asset_id, date)
);

CREATE TABLE IF NOT EXISTS public.prediction_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  target_asset_id UUID NOT NULL REFERENCES public.published_assets(id) ON DELETE CASCADE,
  predicted_metric TEXT NOT NULL CHECK (predicted_metric IN ('views_90d', 'conversions_90d', 'payout_usd_90d')),
  expected_value NUMERIC(12,2) NOT NULL,
  confidence_level NUMERIC(3,2) NOT NULL CHECK (confidence_level >= 0.00 AND confidence_level <= 1.00),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now_utc()
);

CREATE TABLE IF NOT EXISTS public.calibration_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  average_prediction_error NUMERIC(5,2) NOT NULL,
  adjusted_confidence_factor NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now_utc()
);

-- 9. AGENT RUNTIME & SAAS
CREATE TABLE IF NOT EXISTS public.agent_budgets (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  daily_limit_usd NUMERIC(10,2) NOT NULL,
  daily_used_usd NUMERIC(10,2) DEFAULT 0.00,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.governance_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID NOT NULL REFERENCES public.kernel_intent_registry(intent_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gateway_customer_id TEXT,
  gateway_subscription_id TEXT,
  plan_tier TEXT CHECK (plan_tier IN ('hobby', 'growth', 'enterprise')),
  status TEXT NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 10. NOTIFICATION HOOKS
CREATE OR REPLACE FUNCTION notify_kernel_intent()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('kernel_intent_channel', json_build_object(
    'intent_id', NEW.intent_id,
    'syscall_name', NEW.syscall_name,
    'status', NEW.status
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_kernel_intent_notify
AFTER INSERT ON public.kernel_intent_registry
FOR EACH ROW
EXECUTE FUNCTION notify_kernel_intent();

-- 11. SECURITY UTILITIES & RLS (STRICT ORG CONTEXT)
CREATE OR REPLACE FUNCTION public.set_session_context(org_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_org_id', org_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_org()
RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_org_id', true), '')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable RLS across all tables
ALTER TABLE public.kernel_intent_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kernel_execution_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kernel_kebl_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_pageviews_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Strict Org Policies (No fallback default UUIDs allowed)
CREATE POLICY tenant_isolation_intent ON public.kernel_intent_registry FOR ALL
  USING (organization_id = public.current_org());

CREATE POLICY tenant_isolation_ledger ON public.kernel_execution_ledger FOR ALL
  USING (EXISTS (SELECT 1 FROM public.kernel_intent_registry r WHERE r.intent_id = kernel_execution_ledger.intent_id AND r.organization_id = public.current_org()));

CREATE POLICY tenant_isolation_kebl ON public.kernel_kebl_queue FOR ALL
  USING (EXISTS (SELECT 1 FROM public.kernel_intent_registry r WHERE r.intent_id = kernel_kebl_queue.intent_id AND r.organization_id = public.current_org()));

CREATE POLICY tenant_isolation_briefs ON public.content_briefs FOR ALL
  USING (organization_id = public.current_org());

CREATE POLICY tenant_isolation_drafts ON public.content_drafts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.content_briefs b WHERE b.id = content_drafts.brief_id AND b.organization_id = public.current_org()));

CREATE POLICY tenant_isolation_assets ON public.published_assets FOR ALL
  USING (organization_id = public.current_org());

CREATE POLICY tenant_isolation_offers ON public.offers FOR ALL
  USING (organization_id = public.current_org());

CREATE POLICY tenant_isolation_clicks ON public.click_logs FOR ALL
  USING (organization_id = public.current_org());

CREATE POLICY tenant_isolation_conversions ON public.conversion_events FOR ALL
  USING (EXISTS (SELECT 1 FROM public.click_logs c WHERE c.click_id = conversion_events.click_id AND c.organization_id = public.current_org()));

CREATE POLICY tenant_isolation_analytics ON public.analytics_pageviews_summary FOR ALL
  USING (EXISTS (SELECT 1 FROM public.published_assets a WHERE a.id = analytics_pageviews_summary.asset_id AND a.organization_id = public.current_org()));

CREATE POLICY tenant_isolation_predictions ON public.prediction_registry FOR ALL
  USING (organization_id = public.current_org());

CREATE POLICY tenant_isolation_budgets ON public.agent_budgets FOR ALL
  USING (organization_id = public.current_org());

CREATE POLICY tenant_isolation_approvals ON public.governance_approvals FOR ALL
  USING (EXISTS (SELECT 1 FROM public.kernel_intent_registry r WHERE r.intent_id = governance_approvals.intent_id AND r.organization_id = public.current_org()));

CREATE POLICY tenant_isolation_subscriptions ON public.subscriptions FOR ALL
  USING (organization_id = public.current_org());
