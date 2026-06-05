-- Phase A: registry_definitions (Core metadata)
CREATE TABLE registry_definitions (
  uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id TEXT NOT NULL,
  type TEXT NOT NULL,
  current_version_uid UUID, -- Foreign key to registry_versions (created after)
  status TEXT NOT NULL,
  tenant_id TEXT,
  environment TEXT NOT NULL,
  workspace TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Phase B: registry_versions (Immutable snapshots)
CREATE TABLE registry_versions (
  uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_uid UUID NOT NULL REFERENCES registry_definitions(uid) ON DELETE RESTRICT,
  version_number INT NOT NULL,
  status TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  definition JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key back to registry_definitions
ALTER TABLE registry_definitions ADD CONSTRAINT fk_registry_definitions_current_version_uid 
  FOREIGN KEY (current_version_uid) REFERENCES registry_versions(uid) ON DELETE RESTRICT;

-- Ensure (type, id, environment, tenant_id, workspace) uniqueness 
-- If tenant_id or workspace are null, standard unique constraints won't apply to them unless we use a coalesce function in an index or similar.
CREATE UNIQUE INDEX idx_registry_definitions_unique_id ON registry_definitions 
  (type, id, environment, COALESCE(tenant_id, ''), COALESCE(workspace, ''));

-- Function to enforce current_version_uid belongs to the same definition_uid and is published
CREATE OR REPLACE FUNCTION check_current_version_uid_match() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_version_uid IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM registry_versions 
      WHERE uid = NEW.current_version_uid 
        AND definition_uid = NEW.uid
        AND status = 'published'
    ) THEN
      RAISE EXCEPTION 'current_version_uid % must belong to definition_uid % and have status published', NEW.current_version_uid, NEW.uid;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_current_version_uid
BEFORE INSERT OR UPDATE ON registry_definitions
FOR EACH ROW EXECUTE FUNCTION check_current_version_uid_match();

-- Phase C: registry_dependencies
CREATE TABLE registry_dependencies (
  uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_uid UUID NOT NULL REFERENCES registry_definitions(uid) ON DELETE CASCADE,
  depends_on_uid UUID NOT NULL REFERENCES registry_definitions(uid) ON DELETE RESTRICT,
  depends_on_version_uid UUID REFERENCES registry_versions(uid) ON DELETE RESTRICT,
  dependency_mode TEXT NOT NULL,
  dependency_type TEXT NOT NULL
);

-- Phase D: registry_audit_logs
CREATE TABLE registry_audit_logs (
  uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_uid UUID NOT NULL REFERENCES registry_definitions(uid) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changes JSONB
);

-- Phase E: registry_locks
CREATE TABLE registry_locks (
  uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lock_type TEXT NOT NULL,
  strategy TEXT NOT NULL DEFAULT 'EXCLUSIVE',
  resource_uid UUID NOT NULL, -- Logical reference
  acquired_by TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_registry_locks_active ON registry_locks (resource_uid, lock_type) WHERE expires_at > NOW();
