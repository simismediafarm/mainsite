-- Migration 015: IO Buffer, GDG Config, and optional persistence
-- --------------------------------------------------------------
-- Table: kernel_io_buffer (optional persistence for deterministic IO buffering)
CREATE TABLE IF NOT EXISTS public.kernel_io_buffer (
  buffer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID NOT NULL REFERENCES public.kernel_intent_registry(intent_id) ON DELETE CASCADE,
  op_type TEXT NOT NULL CHECK (op_type IN ('read','write')),
  payload JSONB NOT NULL,
  seq INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: kernel_gdg_config (global determinism guard configuration)
CREATE TABLE IF NOT EXISTS public.kernel_gdg_config (
  config_id SERIAL PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  batch_size INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default GDG config row if none exists
INSERT INTO public.kernel_gdg_config (enabled, batch_size)
SELECT true, 100
WHERE NOT EXISTS (SELECT 1 FROM public.kernel_gdg_config);

-- Ensure deterministic ordering on IO buffer
CREATE INDEX IF NOT EXISTS idx_io_buffer_intent_seq ON public.kernel_io_buffer(intent_id, seq);
