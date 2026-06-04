-- Migration 016: KEBL advisory lock upgrade
-- --------------------------------------------------------------
-- Function to acquire lease with advisory lock ensuring exactly‑once execution
CREATE OR REPLACE FUNCTION public.acquire_lease(p_intent_id UUID, p_worker_id TEXT, p_ttl_seconds INT)
RETURNS UUID AS $$
DECLARE
  v_ok BOOLEAN;
BEGIN
  -- Acquire a session‑level advisory lock based on intent_id hash
  PERFORM pg_advisory_xact_lock(hashtext(p_intent_id::text));

  -- Update lease row only if currently expired or not present
  UPDATE public.kernel_kebl_leases
  SET worker_id = p_worker_id,
      lease_expires_at = now() + (p_ttl_seconds || ' seconds')::INTERVAL,
      status = 'leased'
  WHERE intent_id = p_intent_id AND (status = 'expired' OR status IS NULL);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lease acquisition failed for intent %', p_intent_id USING ERRCODE = 'P0001';
  END IF;

  RETURN p_intent_id;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Helper to release advisory lock (optional, called on successful commit)
CREATE OR REPLACE FUNCTION public.release_lease(p_intent_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM pg_advisory_xact_unlock(hashtext(p_intent_id::text));
END;
$$ LANGUAGE plpgsql;
