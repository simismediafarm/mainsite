-- Migration 014: KEBL Leases
-- ---------------------------------------------------

CREATE TABLE IF NOT EXISTS public.kernel_kebl_leases (
  intent_id UUID PRIMARY KEY REFERENCES public.kernel_intent_registry(intent_id) ON DELETE CASCADE,
  worker_id TEXT,
  lease_expires_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('leased','expired','released')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS — tenant isolation via intent registry join
ALTER TABLE public.kernel_kebl_leases ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_kebl_leases
  ON public.kernel_kebl_leases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.kernel_intent_registry r
      WHERE r.intent_id = kernel_kebl_leases.intent_id
        AND r.organization_id = public.current_org()
    )
  );
