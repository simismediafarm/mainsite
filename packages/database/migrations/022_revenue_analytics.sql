-- 022_revenue_analytics.sql
-- Create analytics telemetry table for SIMIS Revenue Optimization

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    content_id UUID NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'scroll', 'click', 'exit')),
    details JSONB DEFAULT '{}'::jsonb,
    geo TEXT DEFAULT 'US',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying analytics over time or by content
CREATE INDEX IF NOT EXISTS idx_analytics_events_content ON public.analytics_events (content_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events (session_id);

-- RLS Policies
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (from public API)
CREATE POLICY "Allow public insert to analytics_events"
    ON public.analytics_events
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow admins to read all
CREATE POLICY "Allow admin full access to analytics_events"
    ON public.analytics_events
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
