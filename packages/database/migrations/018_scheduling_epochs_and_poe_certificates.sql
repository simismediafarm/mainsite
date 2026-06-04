-- Migration 018: Scheduling Epochs + PoE Certificates
-- ---------------------------------------------------
-- Part A: kernel_scheduling_epochs
-- Stores immutable epoch weight snapshots for the deterministic scheduler.
-- Weights are loaded once at boot and fixed for the lifetime of the epoch.
CREATE TABLE IF NOT EXISTS public.kernel_scheduling_epochs (
  epoch_id        TEXT        PRIMARY KEY,               -- e.g. "epoch-0", "epoch-1"
  w1              NUMERIC(6,4) NOT NULL DEFAULT 1.0,     -- priority weight
  w2              NUMERIC(6,4) NOT NULL DEFAULT 1.0,     -- urgency weight
  w3              NUMERIC(6,4) NOT NULL DEFAULT 1.0,     -- efficiency weight
  w4              NUMERIC(6,4) NOT NULL DEFAULT 1.0,     -- cost weight
  active_from     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT check_positive_weights CHECK (w1 > 0 AND w2 > 0 AND w3 > 0 AND w4 > 0)
);

-- Default epoch-0: neutral symmetric weights (1.0, 1.0, 1.0, 1.0)
INSERT INTO public.kernel_scheduling_epochs (epoch_id, w1, w2, w3, w4)
VALUES ('epoch-0', 1.0, 1.0, 1.0, 1.0)
ON CONFLICT (epoch_id) DO NOTHING;

-- Part B: kernel_execution_certificates (PoE persistence)
-- Every execution produces one PoE row that links the runtime hash to the
-- Lean closure proof, enabling auditability and replay verification.
CREATE TABLE IF NOT EXISTS public.kernel_execution_certificates (
  certificate_id  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id       UUID         NOT NULL REFERENCES public.kernel_intent_registry(intent_id) ON DELETE CASCADE,
  execution_hash  TEXT         NOT NULL,
  state_hash      TEXT         NOT NULL,
  scheduler_hash  TEXT         NOT NULL,
  io_hash         TEXT         NOT NULL,
  ecvm_seed       TEXT         NOT NULL,
  closure_proof   TEXT         NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Index for fast intent lookups
CREATE INDEX IF NOT EXISTS idx_cert_intent_id
  ON public.kernel_execution_certificates(intent_id);

-- Unique constraint: one certificate per intent (idempotent PoE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cert_intent_unique
  ON public.kernel_execution_certificates(intent_id);

-- RLS — tenant isolation via intent registry join
ALTER TABLE public.kernel_execution_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_certificates
  ON public.kernel_execution_certificates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.kernel_intent_registry r
      WHERE r.intent_id = kernel_execution_certificates.intent_id
        AND r.organization_id = public.current_org()
    )
  );
