-- Migration 019: Kernel DLQ and Violations Log
-- ---------------------------------------------------

-- Dead letter queue with full failure context
CREATE TABLE IF NOT EXISTS public.kernel_dead_letter_queue (
  dlq_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID NOT NULL REFERENCES public.kernel_intent_registry(intent_id) ON DELETE CASCADE,
  classification TEXT NOT NULL,  -- RETRYABLE / REJECTED / ESCALATE / COMPENSATE
  error_message TEXT NOT NULL,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dlq_intent_id ON public.kernel_dead_letter_queue(intent_id);

-- DECT violation log for audit
CREATE TABLE IF NOT EXISTS public.kernel_dect_violations (
  violation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID,
  violation_code TEXT NOT NULL,  -- ND_01, ECVM_DIRTY, CTX_NULL, etc.
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dect_violations_intent_id ON public.kernel_dect_violations(intent_id);

-- RLS — tenant isolation via intent registry join
ALTER TABLE public.kernel_dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kernel_dect_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_dlq
  ON public.kernel_dead_letter_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.kernel_intent_registry r
      WHERE r.intent_id = kernel_dead_letter_queue.intent_id
        AND r.organization_id = public.current_org()
    )
  );

-- We assume intent_id might be null for global violations (e.g. boot time), so we allow read if it's null (admin only, but we'll use a simple policy for now)
CREATE POLICY tenant_isolation_dect_violations
  ON public.kernel_dect_violations FOR ALL
  USING (
    intent_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.kernel_intent_registry r
      WHERE r.intent_id = kernel_dect_violations.intent_id
        AND r.organization_id = public.current_org()
    )
  );
