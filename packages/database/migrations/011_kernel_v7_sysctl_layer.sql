-- 011_kernel_v7_sysctl_layer.sql
-- KERNEL v7.1 SYSCTL LAYER (DETERMINISTIC RUNTIME BACKBONE)

-- 1. kernel_intent_registry
CREATE TABLE IF NOT EXISTS public.kernel_intent_registry (
  intent_id UUID PRIMARY KEY,
  syscall_name TEXT NOT NULL,
  payload JSONB NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  priority INT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  scheduled_at TIMESTAMP,
  executed_at TIMESTAMP,
  trace_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_kernel_intent_status ON public.kernel_intent_registry(status);
CREATE INDEX IF NOT EXISTS idx_kernel_intent_priority ON public.kernel_intent_registry(priority);

-- 2. kernel_execution_log
CREATE TABLE IF NOT EXISTS public.kernel_execution_log (
  execution_id UUID PRIMARY KEY,
  intent_id UUID REFERENCES public.kernel_intent_registry(intent_id),
  node TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_payload JSONB,
  created_at TIMESTAMP DEFAULT now(),
  execution_hash TEXT,
  parent_execution_id UUID NULL
);

CREATE INDEX IF NOT EXISTS idx_kernel_exec_intent ON public.kernel_execution_log(intent_id);

-- 3. kernel_idempotency_store
CREATE TABLE IF NOT EXISTS public.kernel_idempotency_store (
  idempotency_key TEXT PRIMARY KEY,
  intent_id UUID NOT NULL,
  result_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- 4. POSTGRES HARD RULE ENFORCEMENT
CREATE OR REPLACE FUNCTION public.block_direct_writes()
RETURNS trigger AS $$
BEGIN
  -- We allow internal migrations and admin operations if kernel_bypass is explicitly true
  IF current_setting('simis.kernel_bypass', true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'DIRECT WRITE BLOCKED: Kernel Governor required';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all existing public tables dynamically
DO $$ 
DECLARE
  t_record RECORD;
BEGIN
  FOR t_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_block_direct_writes ON public.%I;
      CREATE TRIGGER trg_block_direct_writes
      BEFORE INSERT OR UPDATE OR DELETE ON public.%I
      FOR EACH STATEMENT
      EXECUTE FUNCTION public.block_direct_writes();
    ', t_record.table_name, t_record.table_name);
  END LOOP;
END;
$$;
