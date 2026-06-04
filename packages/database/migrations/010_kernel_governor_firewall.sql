-- packages/database/migrations/010_kernel_governor_firewall.sql

-- ========================================================
-- PHASE 5: KERNEL FIREWALL & SINGLE WRITE AUTHORITY LAYER
-- ========================================================

-- 1. Kernel Intents Registry
CREATE TABLE kernel_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL, -- 'crawler', 'swarm', 'reasoning', 'deploy', 'system'
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'UPSERT'
    target TEXT NOT NULL, -- table name
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    query_string TEXT NOT NULL, -- The prepared SQL query to be executed
    
    risk_score FLOAT DEFAULT 0.0,
    cost_score FLOAT DEFAULT 0.0,
    status TEXT CHECK (status IN ('PENDING', 'APPROVED', 'DENIED', 'EXECUTED')) DEFAULT 'PENDING',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE kernel_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY intents_select ON kernel_intents FOR SELECT USING (TRUE); -- Readable by all subsystems
CREATE POLICY intents_all ON kernel_intents FOR ALL USING (TRUE); -- Configured for all governor writes

-- 2. Hard Write Lock Trigger Function
CREATE OR REPLACE FUNCTION block_direct_writes()
RETURNS TRIGGER AS $$
BEGIN
    -- Check local session variable to see if the write is approved by the Kernel Governor
    IF current_setting('simis.kernel_bypass_writes', true) = 'on' THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    ELSE
        RAISE EXCEPTION 'DIRECT WRITES DISABLED — MUST USE KERNEL GOVERNOR (Table: %)', TG_TABLE_NAME;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Kernel Executor (The ONLY allowed writer)
CREATE OR REPLACE FUNCTION kernel_execute(p_intent_id UUID)
RETURNS VOID AS $$
DECLARE
    v_intent RECORD;
BEGIN
    SELECT * INTO v_intent FROM kernel_intents WHERE id = p_intent_id;
    
    IF v_intent IS NULL THEN
        RAISE EXCEPTION 'Intent % not found', p_intent_id;
    END IF;

    IF v_intent.status != 'APPROVED' THEN
        RAISE EXCEPTION 'Intent % is not approved for execution', p_intent_id;
    END IF;

    -- Set local session parameter to bypass direct write blocks
    PERFORM set_config('simis.kernel_bypass_writes', 'on', true);

    -- Execute the prepared SQL statement
    EXECUTE v_intent.query_string;

    -- Update status
    UPDATE kernel_intents
    SET status = 'EXECUTED',
        updated_at = NOW()
    WHERE id = p_intent_id;

    -- Reset local session parameter
    PERFORM set_config('simis.kernel_bypass_writes', 'off', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Dynamic Trigger Assignment (Bypasses lockouts for migration schemas)
DO $$
DECLARE
    v_table TEXT;
BEGIN
    FOR v_table IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' 
          AND tablename NOT IN ('kernel_intents', 'schema_migrations', 'pg_stat_statements')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I_block_write ON %I;', v_table, v_table);
        EXECUTE format('CREATE TRIGGER %I_block_write
            BEFORE INSERT OR UPDATE OR DELETE ON %I
            FOR EACH ROW EXECUTE FUNCTION block_direct_writes();', v_table, v_table);
    END LOOP;
END $$;
