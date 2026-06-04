CREATE OR REPLACE FUNCTION public.kernel_write_guard()
RETURNS trigger AS $$
BEGIN
  IF current_setting('simis.kernel_bypass', true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'KERNEL VIOLATION: direct mutation blocked';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS guard_%I ON public.%I;
       CREATE TRIGGER guard_%I BEFORE INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.kernel_write_guard();',
      r.tablename, r.tablename, r.tablename, r.tablename
    );
  END LOOP;
END $$;

ALTER TABLE public.kernel_idempotency_store DROP CONSTRAINT IF EXISTS unique_idempotency;
ALTER TABLE public.kernel_idempotency_store ADD CONSTRAINT unique_idempotency UNIQUE (idempotency_key);

ALTER TABLE public.kernel_execution_log DROP CONSTRAINT IF EXISTS fk_intent;
ALTER TABLE public.kernel_execution_log ADD CONSTRAINT fk_intent FOREIGN KEY (intent_id) REFERENCES public.kernel_intent_registry(intent_id);

CREATE OR REPLACE VIEW public.kernel_observability_view AS
SELECT
  i.intent_id,
  i.syscall_name,
  i.priority,
  i.status,
  COUNT(e.execution_id) AS execution_events,
  MAX(e.created_at) AS last_event,
  i.trace_hash AS recorded_trace,
  (
    SELECT COUNT(*)
    FROM public.kernel_idempotency_store k
    WHERE k.intent_id = i.intent_id
  ) AS idempotency_verified
FROM public.kernel_intent_registry i
LEFT JOIN public.kernel_execution_log e ON i.intent_id = e.intent_id
GROUP BY i.intent_id, i.syscall_name, i.priority, i.status, i.trace_hash;
