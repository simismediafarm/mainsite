-- Migration 017: Execution Causal DAG tables
-- --------------------------------------------------------------
-- Table to store execution trace metadata (already exists in earlier phases, but ensure presence)
CREATE TABLE IF NOT EXISTS public.kernel_execution_trace (
  exec_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID NOT NULL REFERENCES public.kernel_intent_registry(intent_id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  execution_hash TEXT,
  closure_proof TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table to store directed edges of the causal DAG (production layer – syscall level only)
CREATE TABLE IF NOT EXISTS public.kernel_execution_edges (
  edge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id UUID NOT NULL REFERENCES public.kernel_execution_trace(exec_id) ON DELETE CASCADE,
  from_step INT NOT NULL,
  to_step INT NOT NULL,
  dep_type TEXT NOT NULL CHECK (dep_type IN ('data','control','scheduler','io')),
  CONSTRAINT uniq_edge UNIQUE (exec_id, from_step, to_step, dep_type)
);

-- Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_execution_edges_exec ON public.kernel_execution_edges(exec_id);
CREATE INDEX IF NOT EXISTS idx_execution_edges_from ON public.kernel_execution_edges(exec_id, from_step);
