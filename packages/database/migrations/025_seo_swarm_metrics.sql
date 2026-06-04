-- Migration 025: SEO Prediction Metrics & Keyword Cluster State
-- -------------------------------------------------------------------

-- 1. SEO Prediction Metrics
CREATE TABLE IF NOT EXISTS public.seo_prediction_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content_blocks_v2(id) ON DELETE CASCADE,
  discover_score NUMERIC(5,4) DEFAULT 0.0000,
  serp_score NUMERIC(5,4) DEFAULT 0.0000,
  crawl_score NUMERIC(5,4) DEFAULT 0.0000,
  eeat_score NUMERIC(5,4) DEFAULT 0.0000,
  freshness_score NUMERIC(5,4) DEFAULT 0.0000,
  internal_link_score NUMERIC(5,4) DEFAULT 0.0000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index to map one SEO prediction set per content block
CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_metrics_content_id ON public.seo_prediction_metrics(content_id);

-- 2. Keyword Cluster State (For SEO Swarm tracking)
CREATE TABLE IF NOT EXISTS public.keyword_cluster_state (
  keyword TEXT PRIMARY KEY,
  intent TEXT CHECK (intent IN ('informational', 'transactional', 'navigational')),
  geo TEXT,
  difficulty NUMERIC(5,4) DEFAULT 0.0000,
  volume INT DEFAULT 0,
  status TEXT DEFAULT 'discovered' CHECK (status IN ('discovered', 'generating', 'staged', 'published')),
  assigned_agent TEXT,
  last_processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for status queries in the swarm cron
CREATE INDEX IF NOT EXISTS idx_keyword_cluster_status ON public.keyword_cluster_state(status);

-- Row Level Security (RLS) Configuration
ALTER TABLE public.seo_prediction_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_cluster_state ENABLE ROW LEVEL SECURITY;

-- 3. Access Policies (Service role & Admin roles only)
CREATE POLICY "Service Role Full Access on seo_prediction_metrics"
ON public.seo_prediction_metrics
FOR ALL
USING (
  (auth.jwt() ->> 'role') = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (auth.jwt() ->> 'role') IN ('admin', 'system'))
);

CREATE POLICY "Service Role Full Access on keyword_cluster_state"
ON public.keyword_cluster_state
FOR ALL
USING (
  (auth.jwt() ->> 'role') = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (auth.jwt() ->> 'role') IN ('admin', 'system'))
);
