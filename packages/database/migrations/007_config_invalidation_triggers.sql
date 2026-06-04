-- packages/database/migrations/007_config_invalidation_triggers.sql

-- 1. Trigger Function to Notify Config Invalidation via pg_notify
CREATE OR REPLACE FUNCTION notify_config_invalidation()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
    v_niche_id UUID;
    v_brand_id UUID;
    v_site_id UUID;
    v_campaign_id UUID;
    v_payload JSONB;
BEGIN
    -- Resolve context identifiers based on target table name
    IF TG_TABLE_NAME = 'organizations' THEN
        v_org_id := COALESCE(NEW.id, OLD.id);
    ELSIF TG_TABLE_NAME = 'niches' THEN
        v_org_id := COALESCE(NEW.organization_id, OLD.organization_id);
        v_niche_id := COALESCE(NEW.id, OLD.id);
    ELSIF TG_TABLE_NAME = 'brands' THEN
        v_org_id := COALESCE(NEW.organization_id, OLD.organization_id);
        v_niche_id := COALESCE(NEW.niche_id, OLD.niche_id);
        v_brand_id := COALESCE(NEW.id, OLD.id);
    ELSIF TG_TABLE_NAME = 'sites' THEN
        v_org_id := COALESCE(NEW.organization_id, OLD.organization_id);
        v_brand_id := COALESCE(NEW.brand_id, OLD.brand_id);
        v_site_id := COALESCE(NEW.id, OLD.id);
    ELSIF TG_TABLE_NAME = 'monetization_configs' THEN
        v_org_id := COALESCE(NEW.organization_id, OLD.organization_id);
        v_brand_id := COALESCE(NEW.brand_id, OLD.brand_id);
        v_campaign_id := COALESCE(NEW.id, OLD.id);
    END IF;

    -- Build payload to identify what slice of configuration changed
    v_payload := jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'organization_id', v_org_id,
        'domain_id', v_niche_id,
        'brand_id', v_brand_id,
        'site_id', v_site_id,
        'campaign_id', v_campaign_id
    );

    -- Broadcast configuration change
    PERFORM pg_notify('config_invalidation', v_payload::text);
    
    -- Return result (needed for triggers)
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Hook up Triggers to all hierarchical configuration tables
DROP TRIGGER IF EXISTS org_invalidation_trigger ON organizations;
CREATE TRIGGER org_invalidation_trigger
AFTER INSERT OR UPDATE OR DELETE ON organizations
FOR EACH ROW EXECUTE FUNCTION notify_config_invalidation();

DROP TRIGGER IF EXISTS niche_invalidation_trigger ON niches;
CREATE TRIGGER niche_invalidation_trigger
AFTER INSERT OR UPDATE OR DELETE ON niches
FOR EACH ROW EXECUTE FUNCTION notify_config_invalidation();

DROP TRIGGER IF EXISTS brand_invalidation_trigger ON brands;
CREATE TRIGGER brand_invalidation_trigger
AFTER INSERT OR UPDATE OR DELETE ON brands
FOR EACH ROW EXECUTE FUNCTION notify_config_invalidation();

DROP TRIGGER IF EXISTS site_invalidation_trigger ON sites;
CREATE TRIGGER site_invalidation_trigger
AFTER INSERT OR UPDATE OR DELETE ON sites
FOR EACH ROW EXECUTE FUNCTION notify_config_invalidation();

DROP TRIGGER IF EXISTS monetization_invalidation_trigger ON monetization_configs;
CREATE TRIGGER monetization_invalidation_trigger
AFTER INSERT OR UPDATE OR DELETE ON monetization_configs
FOR EACH ROW EXECUTE FUNCTION notify_config_invalidation();
