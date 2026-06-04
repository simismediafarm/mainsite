-- Migration 020: Consolidated Programmatic Media Platform Tables
-- -------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Content Blocks v2 (Modular client-native block schema representation)
CREATE TABLE IF NOT EXISTS public.content_blocks_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('article', 'affiliate', 'scraped', 'ai_generated', 'comparison')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb, -- modular page units
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- tags, language, category
  ranking JSONB NOT NULL DEFAULT '{}'::jsonb, -- local copies of dynamic scores
  monetization JSONB NOT NULL DEFAULT '{}'::jsonb, -- affiliate tracking and sponsorship slots
  trace JSONB NOT NULL DEFAULT '{}'::jsonb, -- poe audit hash mapping
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'staged', 'ranked', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for fast slug lookups and type filters
CREATE INDEX IF NOT EXISTS idx_content_v2_slug ON public.content_blocks_v2(slug);
CREATE INDEX IF NOT EXISTS idx_content_v2_status_type ON public.content_blocks_v2(status, type);

-- 2. Content Embeddings (Semantic vector mappings, 768 dimensions for Gemini API compatibility)
CREATE TABLE IF NOT EXISTS public.content_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content_blocks_v2(id) ON DELETE CASCADE,
  embedding vector(768) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vector index for high speed cosine similarity searches
CREATE INDEX IF NOT EXISTS idx_content_embeddings_vector ON public.content_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 3. Affiliate Products (Content-Egg price trackers and comparison listings)
CREATE TABLE IF NOT EXISTS public.affiliate_products (
  product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  discount NUMERIC(5,2),
  image_url TEXT,
  availability BOOLEAN DEFAULT TRUE,
  rating NUMERIC(3,2),
  provider TEXT NOT NULL, -- Amazon, Shopee, Tokopedia, Custom
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_products_provider ON public.affiliate_products(provider);

-- 4. Feed Rankings (Aggregated ranking scores)
CREATE TABLE IF NOT EXISTS public.feed_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content_blocks_v2(id) ON DELETE CASCADE,
  score NUMERIC(10,4) NOT NULL,
  freshness NUMERIC(10,4) NOT NULL,
  authority NUMERIC(10,4) NOT NULL,
  engagement_prediction NUMERIC(10,4) NOT NULL,
  seo_score NUMERIC(10,4) NOT NULL,
  monetization_weight NUMERIC(10,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_rankings_score ON public.feed_rankings(score DESC);

-- 5. User Profiles (Tag affinity & vector weights for personalization)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_tags TEXT[] DEFAULT '{}'::text[],
  affinity_vector vector(768),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Content Signals (Dwell time, CTR, bounce tracking metrics)
CREATE TABLE IF NOT EXISTS public.content_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content_blocks_v2(id) ON DELETE CASCADE,
  user_id UUID,
  dwell_time_ms INT DEFAULT 0,
  click BOOLEAN DEFAULT FALSE,
  scroll_depth NUMERIC(5,2) DEFAULT 0.00,
  share BOOLEAN DEFAULT FALSE,
  bounce BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_signals_content ON public.content_signals(content_id);

-- 7. Audit PoE Chain (Integrity hash log mapped to content lifecycle modifications)
CREATE TABLE IF NOT EXISTS public.audit_poe_chain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content_blocks_v2(id) ON DELETE CASCADE,
  poe_hash TEXT NOT NULL,
  action_type TEXT NOT NULL, -- PUBLISH, UPDATE, ARCHIVE, REWRITE
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_poe_chain_hash ON public.audit_poe_chain(poe_hash);

-- -------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------

ALTER TABLE public.content_blocks_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_poe_chain ENABLE ROW LEVEL SECURITY;

-- 1. Content Blocks v2 Policies
CREATE POLICY select_public_content ON public.content_blocks_v2 
  FOR SELECT USING (status = 'published');

CREATE POLICY all_admin_agent_content ON public.content_blocks_v2 
  FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 2. Embeddings Policies
CREATE POLICY select_public_embeddings ON public.content_embeddings 
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.content_blocks_v2 c WHERE c.id = content_embeddings.content_id AND c.status = 'published'));

CREATE POLICY all_admin_agent_embeddings ON public.content_embeddings 
  FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 3. Affiliate Products Policies
CREATE POLICY select_public_affiliate ON public.affiliate_products 
  FOR SELECT USING (true);

CREATE POLICY all_admin_agent_affiliate ON public.affiliate_products 
  FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 4. Feed Rankings Policies
CREATE POLICY select_public_rankings ON public.feed_rankings 
  FOR SELECT USING (true);

CREATE POLICY all_admin_agent_rankings ON public.feed_rankings 
  FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 5. User Profiles Policies
CREATE POLICY select_own_profile ON public.user_profiles 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY write_own_profile ON public.user_profiles 
  FOR ALL USING (user_id = auth.uid());

-- 6. Content Signals Policies
CREATE POLICY insert_any_signal ON public.content_signals 
  FOR INSERT WITH CHECK (true);

CREATE POLICY select_admin_agent_signals ON public.content_signals 
  FOR SELECT USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 7. Audit PoE Chain Policies
CREATE POLICY select_public_poe_chain ON public.audit_poe_chain 
  FOR SELECT USING (true);

CREATE POLICY all_admin_agent_poe_chain ON public.audit_poe_chain 
  FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 8. Cosine Similarity Vector Matching Function
CREATE OR REPLACE FUNCTION public.match_content_embeddings(
  query_embedding vector(768),
  match_threshold double precision,
  match_count integer
)
RETURNS TABLE (
  content_id UUID,
  similarity double precision
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.content_id,
    (1.0 - (ce.embedding <=> query_embedding))::double precision AS similarity
  FROM public.content_embeddings ce
  WHERE (1.0 - (ce.embedding <=> query_embedding)) > match_threshold
  ORDER BY ce.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

