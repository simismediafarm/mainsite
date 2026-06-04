-- Migration 023: Production Hardening (Zero Trust RLS, Slots Precompilation, Snapshot Locking)
BEGIN;

-- 1. Patch RLS Policies (Remove USING (true) from admin tables)
-- Drop existing catastrophic policies
DROP POLICY IF EXISTS admin_monetization_policy ON public.monetization_rules;
DROP POLICY IF EXISTS admin_ingestion_policy ON public.ingestion_sources;
DROP POLICY IF EXISTS admin_ranking_policy ON public.ranking_weights;
DROP POLICY IF EXISTS admin_audit_policy ON public.audit_logs;

-- Re-create policies with JWT Role constraints (Assuming role is stored in auth.jwt()->>'role')
-- Adjust exact JWT claims according to Supabase authentication setup
CREATE POLICY admin_monetization_policy ON public.monetization_rules
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_ingestion_policy ON public.ingestion_sources
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_ranking_policy ON public.ranking_weights
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_audit_policy ON public.audit_logs
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');


-- 2. ContentBlockV2: Add Monetization Pre-compilation slot
-- This moves monetization out of runtime into DB state
ALTER TABLE public.content_blocks_v2 
ADD COLUMN IF NOT EXISTS resolved_slots JSONB DEFAULT '[]'::jsonb;


-- 3. Deterministic Feed Snapshot Locking Table
-- Ensures multi-node deterministic pagination and stability
CREATE TABLE IF NOT EXISTS public.feed_snapshots (
  session_id TEXT PRIMARY KEY,
  feed_hash TEXT NOT NULL,
  ordered_ids UUID[] NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_feed_snapshots_expires_at ON public.feed_snapshots(expires_at);

-- Set up RLS for feed_snapshots
ALTER TABLE public.feed_snapshots ENABLE ROW LEVEL SECURITY;
-- App server uses service_role key to bypass RLS, but if public access is needed:
CREATE POLICY public_read_snapshots ON public.feed_snapshots
  FOR SELECT USING (true);
CREATE POLICY public_insert_snapshots ON public.feed_snapshots
  FOR INSERT WITH CHECK (true);
CREATE POLICY public_update_snapshots ON public.feed_snapshots
  FOR UPDATE USING (true);


COMMIT;
